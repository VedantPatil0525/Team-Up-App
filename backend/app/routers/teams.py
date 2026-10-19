import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.team import Team, TeamMember, TeamRole
from app.models.user import User
from app.schemas.team import TeamRead, TeamMemberRead, TeamCreate, TeamMemberAdd
from app.schemas.user import UserSummary

router = APIRouter(prefix="/api/v1/teams", tags=["Teams"])


def slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", slug).strip("-")


@router.get("", response_model=List[TeamRead])
async def list_teams(db: AsyncSession = Depends(get_db)):
    """
    Returns all organizational teams with their member rosters and scoped roles.
    """
    stmt = (
        select(Team)
        .options(
            selectinload(Team.memberships).selectinload(TeamMember.user)
        )
        .order_by(Team.name.asc())
    )
    result = await db.execute(stmt)
    teams = result.scalars().all()

    response = []
    for t in teams:
        members_data = [
            TeamMemberRead(
                id=m.id,
                user_id=m.user_id,
                team_id=m.team_id,
                team_role=m.team_role,
                user=UserSummary(
                    id=m.user.id,
                    name=m.user.name,
                    email=m.user.email,
                    avatar_url=m.user.avatar_url
                ) if m.user else None
            )
            for m in t.memberships
        ]
        response.append(
            TeamRead(
                id=t.id,
                name=t.name,
                slug=t.slug,
                description=t.description,
                created_at=t.created_at,
                members=members_data
            )
        )
    return response


@router.post("", response_model=TeamRead, status_code=status.HTTP_201_CREATED)
async def create_team(
    data: TeamCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Dynamically creates a new operational team or department.
    """
    slug = data.slug.strip() if data.slug else slugify(data.name)

    # Check for existing name or slug
    stmt = select(Team).where((Team.name == data.name) | (Team.slug == slug))
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A team with the name '{data.name}' or slug '{slug}' already exists."
        )

    team = Team(
        name=data.name.strip(),
        slug=slug,
        description=data.description.strip() if data.description else None
    )
    db.add(team)
    await db.commit()
    await db.refresh(team)

    return TeamRead(
        id=team.id,
        name=team.name,
        slug=team.slug,
        description=team.description,
        created_at=team.created_at,
        members=[]
    )


@router.post("/{team_id}/members", response_model=TeamRead)
async def add_team_member(
    team_id: str,
    data: TeamMemberAdd,
    db: AsyncSession = Depends(get_db)
):
    """
    Dynamically assigns an employee to a team with a specific scoped role (LEAD, MEMBER, OBSERVER).
    """
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    user = await db.get(User, data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Employee user not found.")

    # Check if membership already exists; if so, update role
    stmt = select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == data.user_id)
    result = await db.execute(stmt)
    membership = result.scalar_one_or_none()

    if membership:
        membership.team_role = data.team_role
    else:
        membership = TeamMember(
            team_id=team_id,
            user_id=data.user_id,
            team_role=data.team_role
        )
        db.add(membership)

    await db.commit()

    # Re-fetch full team with members
    stmt = (
        select(Team)
        .where(Team.id == team_id)
        .options(selectinload(Team.memberships).selectinload(TeamMember.user))
    )
    res = await db.execute(stmt)
    updated_team = res.scalar_one()

    members_data = [
        TeamMemberRead(
            id=m.id,
            user_id=m.user_id,
            team_id=m.team_id,
            team_role=m.team_role,
            user=UserSummary(
                id=m.user.id,
                name=m.user.name,
                email=m.user.email,
                avatar_url=m.user.avatar_url
            ) if m.user else None
        )
        for m in updated_team.memberships
    ]

    return TeamRead(
        id=updated_team.id,
        name=updated_team.name,
        slug=updated_team.slug,
        description=updated_team.description,
        created_at=updated_team.created_at,
        members=members_data
    )
