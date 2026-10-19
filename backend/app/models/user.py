import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base


class SystemRole(str, Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    system_role = Column(SQLEnum(SystemRole), default=SystemRole.MEMBER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")
    assigned_work_items = relationship("WorkItem", foreign_keys="WorkItem.assignee_id", back_populates="assignee")
    reported_work_items = relationship("WorkItem", foreign_keys="WorkItem.reporter_id", back_populates="reporter")
    audit_events = relationship("AuditEvent", back_populates="actor")
