from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.work_item import (
    WorkItemCategory,
    WorkItemPriority,
    WorkItemStatus,
)
from app.schemas.work_item import (
    WorkItemCreate,
    WorkItemUpdate,
    WorkItemTransitionRequest,
    WorkItemApprovalRequest,
    WorkItemRead,
    PaginatedWorkItemsResponse,
)
from app.schemas.audit import CommentCreate, CommentRead
from app.services.work_item_service import WorkItemService
from app.services.ai_service import AIService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/work-items", tags=["Work Items"])


class AITriageRequest(BaseModel):
    title: str
    description: str


class ClaimRequest(BaseModel):
    note: Optional[str] = None


@router.get("", response_model=PaginatedWorkItemsResponse)
async def list_work_items(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    team_id: Optional[str] = Query(None, description="Filter by team"),
    status: Optional[WorkItemStatus] = Query(None, description="Filter by status"),
    priority: Optional[WorkItemPriority] = Query(None, description="Filter by priority"),
    category: Optional[WorkItemCategory] = Query(None, description="Filter by category"),
    assignee_id: Optional[str] = Query(None, description="Filter by assigned user"),
    unassigned_only: bool = Query(False, description="Filter only unassigned triage items"),
    pending_approval_only: bool = Query(False, description="Filter only items awaiting approval"),
    search: Optional[str] = Query(None, description="Search keyword in title and description"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns server-paginated and filtered work items. Employs database indexes
    so memory is conserved even as volume scales to tens of thousands of items.
    """
    return await WorkItemService.list_work_items(
        db=db,
        page=page,
        page_size=page_size,
        team_id=team_id,
        status_filter=status,
        priority_filter=priority,
        category_filter=category,
        assignee_id=assignee_id,
        unassigned_only=unassigned_only,
        pending_approval_only=pending_approval_only,
        search_query=search
    )


@router.post("", response_model=WorkItemRead, status_code=status.HTTP_201_CREATED)
async def create_work_item(
    data: WorkItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates an operational work item, assigns it to a team, and initializes the audit log.
    """
    return await WorkItemService.create_work_item(db=db, data=data, reporter=current_user)


@router.post("/ai-triage")
async def ai_auto_triage(
    request: AITriageRequest,
    current_user: User = Depends(get_current_user)
):
    """
    AI-powered smart triage: recommends category, priority, and risk assessment using Gemini.
    """
    return await AIService.auto_triage(title=request.title, description=request.description)


@router.get("/{work_item_id}", response_model=WorkItemRead)
async def get_work_item(
    work_item_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves full details of a work item, including its OCC version, audit timeline, and comments.
    """
    item = await WorkItemService.get_by_id(db, work_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Work item not found.")
    return item


@router.post("/{work_item_id}/claim", response_model=WorkItemRead)
async def claim_work_item(
    work_item_id: str,
    payload: Optional[ClaimRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    CRITICAL BEHAVIOUR 1: ATOMIC CLAIMING.
    Protects against simultaneous claim races. Returns HTTP 409 if another user claims it first.
    """
    note = payload.note if payload else None
    return await WorkItemService.claim_work_item(
        db=db,
        work_item_id=work_item_id,
        user=current_user,
        note=note
    )


@router.patch("/{work_item_id}", response_model=WorkItemRead)
async def update_work_item(
    work_item_id: str,
    data: WorkItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    CRITICAL BEHAVIOUR 2: OPTIMISTIC CONCURRENCY CONTROL (OCC).
    Rejects stale updates with HTTP 409 Conflict if the version viewed has been modified by someone else.
    """
    return await WorkItemService.update_work_item(
        db=db,
        work_item_id=work_item_id,
        data=data,
        actor=current_user
    )


@router.post("/{work_item_id}/transition", response_model=WorkItemRead)
async def transition_work_item_status(
    work_item_id: str,
    data: WorkItemTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    CRITICAL BEHAVIOUR 3: STATE MACHINE ENFORCEMENT.
    Validates lifecycle transitions and enforces role permissions on status updates.
    """
    return await WorkItemService.transition_status(
        db=db,
        work_item_id=work_item_id,
        data=data,
        actor=current_user
    )


@router.post("/{work_item_id}/approve", response_model=WorkItemRead)
async def decide_approval(
    work_item_id: str,
    data: WorkItemApprovalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    CRITICAL BEHAVIOUR 4: RESOURCE-LEVEL GATED APPROVALS.
    Enforces that only a TEAM_LEAD of the owning team can grant sign-offs.
    """
    return await WorkItemService.decide_approval(
        db=db,
        work_item_id=work_item_id,
        data=data,
        actor=current_user
    )


@router.post("/{work_item_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
async def add_comment(
    work_item_id: str,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Adds a collaborative comment and records an immutable audit entry.
    """
    return await WorkItemService.add_comment(
        db=db,
        work_item_id=work_item_id,
        content=data.content,
        author=current_user
    )
