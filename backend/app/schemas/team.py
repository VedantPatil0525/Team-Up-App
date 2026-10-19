from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.team import TeamRole
from app.schemas.user import UserSummary


class TeamMemberAdd(BaseModel):
    user_id: str
    team_role: TeamRole = TeamRole.MEMBER


class TeamMemberRead(BaseModel):
    id: str
    user_id: str
    team_id: str
    team_role: TeamRole
    user: Optional[UserSummary] = None

    model_config = ConfigDict(from_attributes=True)


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Display name of the team, e.g. Data Platform")
    slug: Optional[str] = Field(None, description="URL-friendly identifier; generated automatically if omitted")
    description: Optional[str] = Field(None, max_length=500)


class TeamRead(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    created_at: datetime
    members: List[TeamMemberRead] = []

    model_config = ConfigDict(from_attributes=True)


class TeamSummary(BaseModel):
    id: str
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)
