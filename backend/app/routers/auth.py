from typing import List, Optional
import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User, SystemRole
from app.models.team import Team, TeamMember, TeamRole
from app.schemas.user import UserRead, UserCreate, GoogleAuthRequest, TeamMembershipSchema

router = APIRouter(prefix="/api/v1/auth", tags=["Identity & Personas"])


async def get_current_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    FastAPI dependency resolving the authenticated employee from the X-User-Id header.
    If no header is passed, defaults to the first registered user for seamless testing.
    """
    if x_user_id:
        user = await db.get(User, x_user_id)
        if user:
            return user

    # Fallback to the first available user in the system
    result = await db.execute(select(User).limit(1))
    fallback = result.scalar_one_or_none()
    if fallback:
        return fallback

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No employee accounts found. Please register a user or run the seeder."
    )


@router.get("/users", response_model=List[UserRead])
async def list_available_personas(db: AsyncSession = Depends(get_db)):
    """
    Returns all registered company employees with their team memberships and roles.
    Used by the frontend Persona Switcher to allow easy live demonstrations of RBAC.
    """
    stmt = (
        select(User)
        .options(selectinload(User.team_memberships).selectinload(TeamMember.team))
        .order_by(User.name.asc())
    )
    result = await db.execute(stmt)
    users = result.scalars().all()

    response = []
    for u in users:
        teams_data = [
            TeamMembershipSchema(
                team_id=m.team_id,
                team_name=m.team.name,
                team_slug=m.team.slug,
                team_role=m.team_role
            )
            for m in u.team_memberships
        ]
        response.append(
            UserRead(
                id=u.id,
                email=u.email,
                name=u.name,
                avatar_url=u.avatar_url,
                system_role=u.system_role,
                teams=teams_data,
                created_at=u.created_at
            )
        )
    return response


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Dynamically registers a new company employee.
    """
    email_clean = data.email.strip().lower()

    # Check if email is already taken
    stmt = select(User).where(User.email == email_clean)
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An employee with email '{email_clean}' is already registered."
        )

    avatar = data.avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={data.name}"

    user = User(
        name=data.name.strip(),
        email=email_clean,
        avatar_url=avatar,
        system_role=data.system_role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserRead(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        system_role=user.system_role,
        teams=[],
        created_at=user.created_at
    )


@router.post("/google", response_model=UserRead)
async def google_auth(
    data: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Handles Google OAuth 2.0 Authentication for both Sign-In and Sign-Up:
    - If data.id_token is provided, cryptographically verifies the token via Google's OAuth2 tokeninfo service.
    - If valid, extracts verified email, name, and profile avatar.
    - If employee exists, logs them in immediately.
    - If new employee, automatically provisions their user profile and assigns them to a team.
    """
    email_clean: str = ""
    user_name: str = ""
    avatar: Optional[str] = None

    if data.id_token:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"id_token": data.id_token}
                )
                if res.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid, expired, or untrusted Google OAuth token."
                    )
                token_info = res.json()

            # Verify audience if GOOGLE_CLIENT_ID is configured
            if settings.GOOGLE_CLIENT_ID and token_info.get("aud") != settings.GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google OAuth client ID mismatch."
                )

            # Ensure email is verified by Google
            if str(token_info.get("email_verified", "")).lower() != "true":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google account email is not verified."
                )

            email_clean = token_info.get("email", "").strip().lower()
            user_name = token_info.get("name") or email_clean.split("@")[0]
            avatar = token_info.get("picture")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to verify Google OAuth token: {str(e)}"
            )
    elif data.email:
        # Fallback for dev/sandbox simulation
        email_clean = data.email.strip().lower()
        user_name = data.name.strip() if data.name else email_clean.split("@")[0]
        avatar = data.avatar_url
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google OAuth ID token or verified email is required."
        )

    if not email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid email address could not be extracted from Google authentication."
        )

    # Check if user already exists
    stmt = (
        select(User)
        .where(User.email == email_clean)
        .options(selectinload(User.team_memberships).selectinload(TeamMember.team))
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        # Auto-provision new Google employee
        user = User(
            name=user_name,
            email=email_clean,
            avatar_url=avatar or f"https://api.dicebear.com/7.x/initials/svg?seed={user_name}",
            system_role=SystemRole.MEMBER
        )
        db.add(user)
        await db.flush()

        # Assign to selected team or first default team
        target_team_id = data.team_id
        if not target_team_id:
            team_res = await db.execute(select(Team.id).limit(1))
            target_team_id = team_res.scalar_one_or_none()

        if target_team_id:
            membership = TeamMember(
                team_id=target_team_id,
                user_id=user.id,
                team_role=TeamRole.MEMBER
            )
            db.add(membership)

        await db.commit()

        # Re-fetch populated user
        stmt = (
            select(User)
            .where(User.id == user.id)
            .options(selectinload(User.team_memberships).selectinload(TeamMember.team))
        )
        res = await db.execute(stmt)
        user = res.scalar_one()

    teams_data = [
        TeamMembershipSchema(
            team_id=m.team_id,
            team_name=m.team.name,
            team_slug=m.team.slug,
            team_role=m.team_role
        )
        for m in user.team_memberships
    ]

    return UserRead(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        system_role=user.system_role,
        teams=teams_data,
        created_at=user.created_at
    )


@router.get("/me", response_model=UserRead)
async def get_current_persona(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the currently active user profile and their team permissions.
    """
    stmt = (
        select(User)
        .where(User.id == current_user.id)
        .options(selectinload(User.team_memberships).selectinload(TeamMember.team))
    )
    result = await db.execute(stmt)
    user = result.scalar_one()

    teams_data = [
        TeamMembershipSchema(
            team_id=m.team_id,
            team_name=m.team.name,
            team_slug=m.team.slug,
            team_role=m.team_role
        )
        for m in user.team_memberships
    ]

    return UserRead(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        system_role=user.system_role,
        teams=teams_data,
        created_at=user.created_at
    )
