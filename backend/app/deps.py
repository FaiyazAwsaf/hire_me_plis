import uuid
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.user import User
from app.services import auth_service

_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session; always closes it after the request completes."""
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()


async def get_current_user(
    token: Annotated[str, Depends(_oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Return the authenticated User ORM object, or raise HTTP 401."""
    payload = auth_service.decode_access_token(token)
    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_arq_pool(request: Request):
    """Return the ARQ Redis pool stored on app state during lifespan startup."""
    return request.app.state.arq_pool
