from datetime import datetime
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select, update, func, or_, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, SystemRole
from app.models.team import Team, TeamMember, TeamRole
from app.models.work_item import (
    WorkItem,
    Comment,
    WorkItemCategory,
    WorkItemPriority,
    WorkItemStatus,
)
from app.models.audit import AuditActionType
from app.schemas.work_item import (
    WorkItemCreate,
    WorkItemUpdate,
    WorkItemTransitionRequest,
    WorkItemApprovalRequest,
    WorkItemListItem,
    WorkItemRead,
    PaginatedWorkItemsResponse,
    ConflictDetail,
)
from app.services.authz_service import AuthorizationService
from app.services.audit_service import AuditService
from app.services.async_queue_service import AsyncQueueService


# Directed state machine graph of permissible workflow transitions
PERMISSIBLE_TRANSITIONS = {
    WorkItemStatus.NEW: [
        WorkItemStatus.TRIAGED,
        WorkItemStatus.IN_PROGRESS,
        WorkItemStatus.PENDING_APPROVAL,
        WorkItemStatus.CANCELLED,
    ],
    WorkItemStatus.TRIAGED: [
        WorkItemStatus.IN_PROGRESS,
        WorkItemStatus.PENDING_APPROVAL,
        WorkItemStatus.CANCELLED,
    ],
    WorkItemStatus.IN_PROGRESS: [
        WorkItemStatus.PENDING_APPROVAL,
        WorkItemStatus.RESOLVED,
        WorkItemStatus.CANCELLED,
    ],
    WorkItemStatus.PENDING_APPROVAL: [
        WorkItemStatus.IN_PROGRESS,  # If rejected or additional info needed
        WorkItemStatus.RESOLVED,     # If approved
        WorkItemStatus.CANCELLED,
    ],
    WorkItemStatus.RESOLVED: [
        WorkItemStatus.IN_PROGRESS,  # Re-opening if issue recurs
    ],
    WorkItemStatus.CANCELLED: [
        WorkItemStatus.NEW,          # Re-activating
    ]
}


class WorkItemService:
    @classmethod
    async def get_by_id(
        cls,
        db: AsyncSession,
        work_item_id: str,
        for_update: bool = False
    ) -> Optional[WorkItem]:
        """
        Fetches a work item with all related entities (team, assignee, reporter, audit events, comments).
        """
        stmt = (
            select(WorkItem)
            .where(WorkItem.id == work_item_id)
            .options(
                selectinload(WorkItem.team),
                selectinload(WorkItem.assignee),
                selectinload(WorkItem.reporter),
                selectinload(WorkItem.approver),
                selectinload(WorkItem.comments).selectinload(Comment.author),
                selectinload(WorkItem.audit_events),
            )
        )
        if for_update:
            stmt = stmt.with_for_update()

        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @classmethod
    async def create_work_item(
        cls,
        db: AsyncSession,
        data: WorkItemCreate,
        reporter: User
    ) -> WorkItem:
        """
        Creates a new operational work item and records the initial audit log.
        """
        # Verify team exists
        team = await db.get(Team, data.team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Designated team not found.")

        work_item = WorkItem(
            title=data.title,
            description=data.description,
            category=data.category,
            priority=data.priority,
            status=WorkItemStatus.NEW,
            team_id=data.team_id,
            reporter_id=reporter.id,
            approval_required=data.approval_required,
            version=1
        )
        db.add(work_item)
        await db.flush()

        # Audit event: Creation
        await AuditService.record_event(
            db=db,
            work_item_id=work_item.id,
            actor_id=reporter.id,
            action_type=AuditActionType.CREATED,
            new_values={
                "title": work_item.title,
                "category": work_item.category.value,
                "priority": work_item.priority.value,
                "status": work_item.status.value,
                "team_id": work_item.team_id
            },
            context_note="Work item submitted to triage."
        )

        # Enqueue background notification task
        await AsyncQueueService.enqueue_job(
            db=db,
            job_type="NOTIFICATION",
            payload={"work_item_id": work_item.id, "event": "CREATED"},
            idempotency_key=f"notify_create_{work_item.id}"
        )

        await db.commit()
        return await cls.get_by_id(db, work_item.id)

    @classmethod
    async def claim_work_item(
        cls,
        db: AsyncSession,
        work_item_id: str,
        user: User,
        note: Optional[str] = None
    ) -> WorkItem:
        """
        CRITICAL BEHAVIOUR 1: ATOMIC CLAIMING (Race condition protection).
        When two users attempt to take ownership simultaneously, only the first
        succeeds via atomic conditional UPDATE WHERE assignee_id IS NULL.
        """
        work_item = await cls.get_by_id(db, work_item_id)
        if not work_item:
            raise HTTPException(status_code=404, detail="Work item not found.")

        # Check authorization: user must belong to the item's team and not be OBSERVER
        await AuthorizationService.check_can_claim(db, user, work_item)

        # Atomic conditional update: only succeeds if item currently has no assignee
        now = datetime.utcnow()
        stmt = (
            update(WorkItem)
            .where(
                WorkItem.id == work_item_id,
                WorkItem.assignee_id.is_(None)
            )
            .values(
                assignee_id=user.id,
                status=WorkItemStatus.IN_PROGRESS if work_item.status in [WorkItemStatus.NEW, WorkItemStatus.TRIAGED] else work_item.status,
                version=WorkItem.version + 1,
                updated_at=now
            )
        )
        result = await db.execute(stmt)

        if result.rowcount == 0:
            # Overwrite race collision detected!
            await db.rollback()
            current = await cls.get_by_id(db, work_item_id)
            assignee_name = current.assignee.name if current.assignee else "another team member"
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Claim collision: This work item was claimed by {assignee_name} a moment ago."
            )

        # Record audit log
        await AuditService.record_event(
            db=db,
            work_item_id=work_item.id,
            actor_id=user.id,
            action_type=AuditActionType.CLAIMED,
            old_values={"assignee_id": None, "status": work_item.status.value},
            new_values={"assignee_id": user.id, "status": WorkItemStatus.IN_PROGRESS.value},
            context_note=note or "Claimed ownership of operational work item."
        )

        await db.commit()
        return await cls.get_by_id(db, work_item.id)

    @classmethod
    async def update_work_item(
        cls,
        db: AsyncSession,
        work_item_id: str,
        data: WorkItemUpdate,
        actor: User
    ) -> WorkItem:
        """
        CRITICAL BEHAVIOUR 2: OPTIMISTIC CONCURRENCY CONTROL (OCC).
        Prevents mid-air collision overwrites. If the incoming version does
        not match the database version, returns HTTP 409 with a conflict diff.
        """
        current = await cls.get_by_id(db, work_item_id)
        if not current:
            raise HTTPException(status_code=404, detail="Work item not found.")

        # Server-enforced authorization
        await AuthorizationService.check_can_edit(db, actor, current)

        # Version check: OCC detection
        if current.version != data.version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Mid-air collision detected: This work item was modified by another employee while you were viewing it.",
                    "client_version": data.version,
                    "server_version": current.version,
                    "server_title": current.title,
                    "server_priority": current.priority.value,
                    "server_description": current.description,
                }
            )

        # Prepare field changes and diffs
        old_diff = {}
        new_diff = {}
        values_to_update = {}

        if data.title is not None and data.title != current.title:
            old_diff["title"] = current.title
            new_diff["title"] = data.title
            values_to_update["title"] = data.title

        if data.description is not None and data.description != current.description:
            old_diff["description"] = current.description
            new_diff["description"] = data.description
            values_to_update["description"] = data.description

        if data.priority is not None and data.priority != current.priority:
            old_diff["priority"] = current.priority.value
            new_diff["priority"] = data.priority.value
            values_to_update["priority"] = data.priority

        if data.approval_required is not None and data.approval_required != current.approval_required:
            old_diff["approval_required"] = current.approval_required
            new_diff["approval_required"] = data.approval_required
            values_to_update["approval_required"] = data.approval_required

        if data.team_id is not None and data.team_id != current.team_id:
            old_diff["team_id"] = current.team_id
            new_diff["team_id"] = data.team_id
            values_to_update["team_id"] = data.team_id

        # If nothing changed, return current
        if not values_to_update:
            return current

        # Atomic OCC update: must match expected version
        values_to_update["version"] = current.version + 1
        values_to_update["updated_at"] = datetime.utcnow()

        stmt = (
            update(WorkItem)
            .where(
                WorkItem.id == work_item_id,
                WorkItem.version == data.version
            )
            .values(**values_to_update)
        )
        result = await db.execute(stmt)

        if result.rowcount == 0:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Concurrent update conflict: Changes were not applied because a newer version exists."
            )

        # Record immutable audit event
        action = AuditActionType.PRIORITY_CHANGED if "priority" in new_diff else AuditActionType.EDITED
        await AuditService.record_event(
            db=db,
            work_item_id=current.id,
            actor_id=actor.id,
            action_type=action,
            old_values=old_diff,
            new_values=new_diff,
            context_note=data.edit_reason or "Updated work item details."
        )

        await db.commit()
        return await cls.get_by_id(db, work_item_id)

    @classmethod
    async def transition_status(
        cls,
        db: AsyncSession,
        work_item_id: str,
        data: WorkItemTransitionRequest,
        actor: User
    ) -> WorkItem:
        """
        CRITICAL BEHAVIOUR 3: WORKFLOW STATE MACHINE INVARIANTS & GATING.
        Enforces valid state machine paths and prevents illegal leaps.
        """
        work_item = await cls.get_by_id(db, work_item_id)
        if not work_item:
            raise HTTPException(status_code=404, detail="Work item not found.")

        # OCC Version check
        if work_item.version != data.version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="State transition conflict: The item was modified by another user. Please refresh."
            )

        # Enforce state machine transitions
        allowed_targets = PERMISSIBLE_TRANSITIONS.get(work_item.status, [])
        if data.target_status not in allowed_targets:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Illegal transition: Cannot move work item from '{work_item.status.value}' directly to '{data.target_status.value}'."
            )

        # Authorization check (e.g. Lead check for approvals or gated resolution)
        await AuthorizationService.check_can_transition(db, actor, work_item, data.target_status)

        old_status = work_item.status
        work_item.status = data.target_status
        work_item.version += 1
        work_item.updated_at = datetime.utcnow()

        if data.resolution_notes:
            work_item.resolution_notes = data.resolution_notes

        await AuditService.record_event(
            db=db,
            work_item_id=work_item.id,
            actor_id=actor.id,
            action_type=AuditActionType.STATUS_CHANGED,
            old_values={"status": old_status.value},
            new_values={"status": data.target_status.value},
            context_note=data.reason or f"Transitioned status to {data.target_status.value}."
        )

        await db.commit()
        return await cls.get_by_id(db, work_item_id)

    @classmethod
    async def decide_approval(
        cls,
        db: AsyncSession,
        work_item_id: str,
        data: WorkItemApprovalRequest,
        actor: User
    ) -> WorkItem:
        """
        CRITICAL BEHAVIOUR 4: RESOURCE-LEVEL GATED APPROVALS.
        Only a TEAM_LEAD of the owning team (or an ADMIN) can approve or reject.
        """
        work_item = await cls.get_by_id(db, work_item_id)
        if not work_item:
            raise HTTPException(status_code=404, detail="Work item not found.")

        # Must be in PENDING_APPROVAL
        if work_item.status != WorkItemStatus.PENDING_APPROVAL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item is not pending approval (current status: {work_item.status.value})."
            )

        # OCC Version check
        if work_item.version != data.version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Approval conflict: The item version has changed. Please refresh."
            )

        # Server-enforced role check (Must be LEAD of item's team or ADMIN)
        await AuthorizationService.check_can_approve(db, actor, work_item)

        now = datetime.utcnow()
        if data.approved:
            work_item.approved_by_id = actor.id
            work_item.approved_at = now
            work_item.status = WorkItemStatus.IN_PROGRESS  # Unblocked to proceed
            work_item.rejection_reason = None
            action = AuditActionType.APPROVED
            note = data.reason or "Sign-off granted by Team Lead."
        else:
            work_item.rejection_reason = data.reason or "Approval rejected."
            work_item.status = WorkItemStatus.IN_PROGRESS  # Returned to investigation
            action = AuditActionType.REJECTED
            note = f"Approval rejected: {work_item.rejection_reason}"

        work_item.version += 1
        work_item.updated_at = now

        await AuditService.record_event(
            db=db,
            work_item_id=work_item.id,
            actor_id=actor.id,
            action_type=action,
            old_values={"status": WorkItemStatus.PENDING_APPROVAL.value},
            new_values={"status": work_item.status.value, "approved": data.approved},
            context_note=note
        )

        await db.commit()
        return await cls.get_by_id(db, work_item_id)

    @classmethod
    async def add_comment(
        cls,
        db: AsyncSession,
        work_item_id: str,
        content: str,
        author: User
    ) -> Comment:
        """
        Adds an in-context collaboration comment and logs an audit record.
        """
        work_item = await cls.get_by_id(db, work_item_id)
        if not work_item:
            raise HTTPException(status_code=404, detail="Work item not found.")

        comment = Comment(
            work_item_id=work_item_id,
            author_id=author.id,
            content=content
        )
        db.add(comment)
        await db.flush()

        await AuditService.record_event(
            db=db,
            work_item_id=work_item_id,
            actor_id=author.id,
            action_type=AuditActionType.COMMENT_ADDED,
            context_note=f"Added comment: {content[:80]}..."
        )

        await db.commit()
        return comment

    @classmethod
    async def list_work_items(
        cls,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 25,
        team_id: Optional[str] = None,
        status_filter: Optional[WorkItemStatus] = None,
        priority_filter: Optional[WorkItemPriority] = None,
        category_filter: Optional[WorkItemCategory] = None,
        assignee_id: Optional[str] = None,
        unassigned_only: bool = False,
        pending_approval_only: bool = False,
        search_query: Optional[str] = None
    ) -> PaginatedWorkItemsResponse:
        """
        Scalable server-side paginated query leveraging indexes on (team_id, status),
        (assignee_id, status), and priority. Never downloads full tables to browser.
        """
        conditions = []

        if team_id:
            conditions.append(WorkItem.team_id == team_id)
        if status_filter:
            conditions.append(WorkItem.status == status_filter)
        if priority_filter:
            conditions.append(WorkItem.priority == priority_filter)
        if category_filter:
            conditions.append(WorkItem.category == category_filter)
        if unassigned_only:
            conditions.append(WorkItem.assignee_id.is_(None))
        elif assignee_id:
            conditions.append(WorkItem.assignee_id == assignee_id)
        if pending_approval_only:
            conditions.append(WorkItem.status == WorkItemStatus.PENDING_APPROVAL)

        if search_query:
            term = f"%{search_query.strip()}%"
            conditions.append(
                or_(
                    WorkItem.title.ilike(term),
                    WorkItem.description.ilike(term)
                )
            )

        # Count total matching rows
        count_stmt = select(func.count(WorkItem.id)).where(and_(*conditions) if conditions else True)
        total_result = await db.execute(count_stmt)
        total = total_result.scalar_one()

        # Query paginated rows with team and user names joined
        offset = (page - 1) * page_size
        items_stmt = (
            select(
                WorkItem.id,
                WorkItem.title,
                WorkItem.category,
                WorkItem.priority,
                WorkItem.status,
                WorkItem.version,
                WorkItem.team_id,
                Team.name.label("team_name"),
                WorkItem.assignee_id,
                User.name.label("assignee_name"),
                WorkItem.reporter_id,
                WorkItem.approval_required,
                WorkItem.created_at,
                WorkItem.updated_at
            )
            .join(Team, WorkItem.team_id == Team.id)
            .outerjoin(User, WorkItem.assignee_id == User.id)
            .where(and_(*conditions) if conditions else True)
            .order_by(WorkItem.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )

        result = await db.execute(items_stmt)
        rows = result.all()

        items = [
            WorkItemListItem(
                id=r.id,
                title=r.title,
                category=r.category,
                priority=r.priority,
                status=r.status,
                version=r.version,
                team_id=r.team_id,
                team_name=r.team_name,
                assignee_id=r.assignee_id,
                assignee_name=r.assignee_name,
                reporter_id=r.reporter_id,
                approval_required=r.approval_required,
                created_at=r.created_at,
                updated_at=r.updated_at
            )
            for r in rows
        ]

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        return PaginatedWorkItemsResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
