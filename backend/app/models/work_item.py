import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, ForeignKey,
    Index, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.database import Base


class WorkItemCategory(str, Enum):
    INCIDENT = "INCIDENT"                   # Production / engineering outages & bugs
    PAYMENT_REVIEW = "PAYMENT_REVIEW"       # High-risk transaction & fraud investigations
    COMPLIANCE = "COMPLIANCE"               # Regulatory sign-offs & policy reviews
    CUSTOMER_ISSUE = "CUSTOMER_ISSUE"       # Escalated customer inquiries
    OPERATIONAL_TASK = "OPERATIONAL_TASK"   # Standard internal operational requests


class WorkItemPriority(str, Enum):
    P0_CRITICAL = "P0_CRITICAL"  # Immediate attention required / SLA breach imminent
    P1_HIGH = "P1_HIGH"          # High urgency
    P2_MEDIUM = "P2_MEDIUM"      # Normal operational priority
    P3_LOW = "P3_LOW"            # Non-urgent / backlog


class WorkItemStatus(str, Enum):
    NEW = "NEW"                           # Newly submitted / needs triage
    TRIAGED = "TRIAGED"                   # Categorized and ready for assignment
    IN_PROGRESS = "IN_PROGRESS"           # Active investigation or work underway
    PENDING_APPROVAL = "PENDING_APPROVAL" # Blocked waiting for Team Lead authorization
    RESOLVED = "RESOLVED"                 # Successfully completed & verified
    CANCELLED = "CANCELLED"               # Duplicate or discarded


class WorkItem(Base):
    __tablename__ = "work_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    category = Column(SQLEnum(WorkItemCategory), default=WorkItemCategory.OPERATIONAL_TASK, nullable=False, index=True)
    priority = Column(SQLEnum(WorkItemPriority), default=WorkItemPriority.P2_MEDIUM, nullable=False, index=True)
    status = Column(SQLEnum(WorkItemStatus), default=WorkItemStatus.NEW, nullable=False, index=True)

    # Concurrency control version counter (critical for OCC)
    version = Column(Integer, default=1, nullable=False)

    # Routing & Ownership
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="RESTRICT"), nullable=False, index=True)
    assignee_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reporter_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)

    # Approval Gating
    approval_required = Column(Boolean, default=False, nullable=False)
    approved_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Completion context
    resolution_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, index=True)

    # Performance compound indexes for high-frequency queries at scale
    __table_args__ = (
        Index("idx_work_items_team_status", "team_id", "status"),
        Index("idx_work_items_assignee_status", "assignee_id", "status"),
        Index("idx_work_items_priority_status", "priority", "status"),
    )

    # Relationships
    team = relationship("Team", back_populates="work_items")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_work_items")
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reported_work_items")
    approver = relationship("User", foreign_keys=[approved_by_id])
    audit_events = relationship("AuditEvent", back_populates="work_item", cascade="all, delete-orphan", order_by="desc(AuditEvent.created_at)")
    comments = relationship("Comment", back_populates="work_item", cascade="all, delete-orphan", order_by="asc(Comment.created_at)")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    work_item_id = Column(String(36), ForeignKey("work_items.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    work_item = relationship("WorkItem", back_populates="comments")
    author = relationship("User")
