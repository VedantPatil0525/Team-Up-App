import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class AuditActionType(str, Enum):
    CREATED = "CREATED"
    CLAIMED = "CLAIMED"
    REASSIGNED = "REASSIGNED"
    PRIORITY_CHANGED = "PRIORITY_CHANGED"
    STATUS_CHANGED = "STATUS_CHANGED"
    APPROVAL_REQUESTED = "APPROVAL_REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EDITED = "EDITED"
    COMMENT_ADDED = "COMMENT_ADDED"


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    work_item_id = Column(String(36), ForeignKey("work_items.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    action_type = Column(SQLEnum(AuditActionType), nullable=False, index=True)

    # Immutable diff tracking
    old_values = Column(JSON, nullable=True)  # Snapshot of changed fields before mutation
    new_values = Column(JSON, nullable=True)  # Snapshot of changed fields after mutation

    # Optional rationale or handoff notes provided by the actor
    context_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    work_item = relationship("WorkItem", back_populates="audit_events")
    actor = relationship("User", back_populates="audit_events")
