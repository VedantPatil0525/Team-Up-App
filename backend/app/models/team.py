import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base


class TeamRole(str, Enum):
    LEAD = "LEAD"          # Can approve gated requests, reassign items, close compliance tickets
    MEMBER = "MEMBER"      # Can claim, edit, transition, and resolve standard team items
    OBSERVER = "OBSERVER"  # Read-only visibility into team work


class Team(Base):
    __tablename__ = "teams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    memberships = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    work_items = relationship("WorkItem", back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    team_role = Column(SQLEnum(TeamRole), default=TeamRole.MEMBER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Ensure a user is only added once per team
    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_user"),
    )

    # Relationships
    team = relationship("Team", back_populates="memberships")
    user = relationship("User", back_populates="team_memberships")
