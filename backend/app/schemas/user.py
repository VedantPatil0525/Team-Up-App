from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.user import SystemRole
from app.models.team import TeamRole


class TeamMembershipSchema(BaseModel):
    team_id: str
    team_name: str
    team_slug: str
    team_role: TeamRole

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the employee")
    email: str = Field(..., description="Corporate email address")
    avatar_url: Optional[str] = Field(None, description="Optional profile image URL")
    system_role: SystemRole = SystemRole.MEMBER


class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = Field(None, description="Cryptographically signed Google OAuth 2.0 ID token")
    email: Optional[str] = Field(None, description="Google corporate email (fallback or decoded)")
    name: Optional[str] = Field(None, description="Full name from Google profile")
    avatar_url: Optional[str] = Field(None, description="Google profile picture URL")
    team_id: Optional[str] = Field(None, description="Target team for new signups")


class UserRead(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    system_role: SystemRole
    teams: List[TeamMembershipSchema] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserSummary(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
