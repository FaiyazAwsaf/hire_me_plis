import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    body: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Register a new user and return an access token."""
    existing = (
        await db.execute(select(User).where(User.email == body.email))
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=body.email, hashed_pw=auth_service.hash_password(body.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = auth_service.create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(
    db: Annotated[AsyncSession, Depends(get_db)],
    username: Annotated[str, Form()],
    password: Annotated[str, Form()],
) -> TokenResponse:
    """Authenticate a user and return an access token. Accepts OAuth2 form data (username as email)."""
    result = await db.execute(select(User).where(User.email == username))
    user = result.scalar_one_or_none()
    if user is None or not auth_service.verify_password(password, user.hashed_pw):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth_service.create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Return the authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Issue a fresh token given a valid existing token."""
    payload = auth_service.decode_access_token(body.token)
    user_id = uuid.UUID(payload["sub"])

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    token = auth_service.create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))
