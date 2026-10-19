from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.work_item import (
    WorkItemCategory,
    WorkItemPriority,
    WorkItemStatus,
)
from app.schemas.user import UserSummary
from app.schemas.team import TeamSummary
from app.schemas.audit import AuditEventRead, CommentRead


class WorkItemCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    category: WorkItemCategory = WorkItemCategory.OPERATIONAL_TASK
    priority: WorkItemPriority = WorkItemPriority.P2_MEDIUM
    team_id: str
    approval_required: bool = False


class WorkItemUpdate(BaseModel):
    """
    Requires passing the current 'version' to enforce Optimistic Concurrency Control (OCC).
    """
    version: int = Field(..., description="The version number currently viewed by the client")
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=5)
    priority: Optional[WorkItemPriority] = None
    team_id: Optional[str] = None
    approval_required: Optional[bool] = None
    edit_reason: Optional[str] = Field(None, description="Explanation for this edit for the audit trail")


class WorkItemTransitionRequest(BaseModel):
    """
    Requires passing 'version' to prevent transitioning an item based on obsolete state.
    """
    version: int = Field(..., description="The version number currently viewed by the client")
    target_status: WorkItemStatus
    resolution_notes: Optional[str] = None
    reason: Optional[str] = Field(None, description="Handoff or transition explanation")


class WorkItemApprovalRequest(BaseModel):
    """
    Requires passing 'version' and an approval decision.
    """
    version: int = Field(..., description="The version number currently viewed by the client")
    approved: bool
    reason: Optional[str] = Field(None, description="Approval or rejection justification")


class WorkItemListItem(BaseModel):
    """
    Lightweight schema optimized for fast paginated listing queries.
    """
    id: str
    title: str
    category: WorkItemCategory
    priority: WorkItemPriority
    status: WorkItemStatus
    version: int
    team_id: str
    team_name: Optional[str] = None
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    reporter_id: str
    reporter_name: Optional[str] = None
    approval_required: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkItemRead(BaseModel):
    """
    Comprehensive schema with full relationships, timeline, and comments.
    """
    id: str
    title: str
    description: str
    category: WorkItemCategory
    priority: WorkItemPriority
    status: WorkItemStatus
    version: int
    team_id: str
    assignee_id: Optional[str] = None
    reporter_id: str
    approval_required: bool
    approved_by_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    team: Optional[TeamSummary] = None
    assignee: Optional[UserSummary] = None
    reporter: Optional[UserSummary] = None
    approver: Optional[UserSummary] = None
    audit_events: List[AuditEventRead] = []
    comments: List[CommentRead] = []

    model_config = ConfigDict(from_attributes=True)


class PaginatedWorkItemsResponse(BaseModel):
    items: List[WorkItemListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class ConflictDetail(BaseModel):
    """
    Returned with HTTP 409 when an OCC mid-air collision is detected.
    """
    message: str
    client_version: int
    server_version: int
    server_state: WorkItemRead
    conflicting_fields: List[str]
