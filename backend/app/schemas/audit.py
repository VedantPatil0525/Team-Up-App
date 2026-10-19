from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from app.models.audit import AuditActionType
from app.schemas.user import UserSummary


class AuditEventRead(BaseModel):
    id: str
    work_item_id: str
    actor_id: str
    action_type: AuditActionType
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    context_note: Optional[str] = None
    created_at: datetime
    actor: Optional[UserSummary] = None

    model_config = ConfigDict(from_attributes=True)


class CommentCreate(BaseModel):
    content: str


class CommentRead(BaseModel):
    id: str
    work_item_id: str
    author_id: str
    content: str
    created_at: datetime
    author: Optional[UserSummary] = None

    model_config = ConfigDict(from_attributes=True)
