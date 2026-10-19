from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, SystemRole
from app.models.team import TeamMember, TeamRole
from app.models.work_item import WorkItem, WorkItemStatus


class AuthorizationService:
    @staticmethod
    async def get_user_team_role(db: AsyncSession, user_id: str, team_id: str) -> Optional[TeamRole]:
        """
        Retrieves the user's specific role within a given team.
        """
        stmt = select(TeamMember.team_role).where(
            TeamMember.user_id == user_id,
            TeamMember.team_id == team_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @classmethod
    async def check_can_view(cls, user: User, work_item: WorkItem) -> None:
        """
        All registered company employees have visibility into operational work
        to maintain organizational transparency and situational awareness.
        """
        pass

    @classmethod
    async def check_can_claim(cls, db: AsyncSession, user: User, work_item: WorkItem) -> None:
        """
        Only team members or leads can claim an item for active work.
        Observers cannot claim operational responsibility.
        """
        if user.system_role == SystemRole.ADMIN:
            return

        team_role = await cls.get_user_team_role(db, user.id, work_item.team_id)
        if not team_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User {user.name} does not belong to the assigned team for this work item."
            )
        if team_role == TeamRole.OBSERVER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Users with 'OBSERVER' role have read-only access and cannot take ownership."
            )

    @classmethod
    async def check_can_edit(cls, db: AsyncSession, user: User, work_item: WorkItem) -> None:
        """
        Validates whether the user is permitted to edit details/priority.
        """
        if user.system_role == SystemRole.ADMIN:
            return

        team_role = await cls.get_user_team_role(db, user.id, work_item.team_id)
        if not team_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: You must belong to the item's team to modify its details."
            )
        if team_role == TeamRole.OBSERVER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Observers have read-only access."
            )

    @classmethod
    async def check_can_approve(cls, db: AsyncSession, user: User, work_item: WorkItem) -> None:
        """
        Enforces approval gating: only a TEAM_LEAD of the owning team
        (or an ADMIN) can approve or reject gated requests.
        """
        if user.system_role == SystemRole.ADMIN:
            return

        team_role = await cls.get_user_team_role(db, user.id, work_item.team_id)
        if team_role != TeamRole.LEAD:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action Forbidden: Approving or rejecting this item requires TEAM_LEAD privileges in the designated team."
            )

    @classmethod
    async def check_can_transition(
        cls,
        db: AsyncSession,
        user: User,
        work_item: WorkItem,
        target_status: WorkItemStatus
    ) -> None:
        """
        Checks role constraints on specific workflow transitions.
        """
        if user.system_role == SystemRole.ADMIN:
            return

        team_role = await cls.get_user_team_role(db, user.id, work_item.team_id)
        if not team_role or team_role == TeamRole.OBSERVER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not have permission to transition the workflow state of this item."
            )

        # Transitioning to RESOLVED when approval is required requires Team Lead or prior approval
        if target_status == WorkItemStatus.RESOLVED and work_item.approval_required:
            if not work_item.approved_by_id and team_role != TeamRole.LEAD:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: This item requires sign-off from a Team Lead before it can be marked as Resolved."
                )
