import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_arq_pool, get_current_user, get_db
from app.models.user import User
from app.schemas.cv import CVMetaResponse, CVStatusResponse, CVUploadResponse
from app.services import cv_service

router = APIRouter(prefix="/cv", tags=["cv"])

# Reusable dependency aliases
_DB = Annotated[AsyncSession, Depends(get_db)]
_User = Annotated[User, Depends(get_current_user)]
_ArqPool = Annotated[object, Depends(get_arq_pool)]

_NI = {"status": "not_implemented"}


@router.post("/upload", response_model=CVUploadResponse, status_code=202)
async def upload_cv(file: UploadFile, current_user: _User, db: _DB, arq_pool: _ArqPool):
    return await cv_service.upload_cv(current_user.id, file, db, arq_pool)


@router.get("/status", response_model=CVStatusResponse)
async def cv_status(current_user: _User, db: _DB):
    return await cv_service.get_cv_status(current_user.id, db)


@router.get("", response_model=CVMetaResponse)
async def get_cv(current_user: _User, db: _DB):
    return await cv_service.get_cv_meta(current_user.id, db)


@router.delete("/{cv_id}", status_code=204)
async def delete_cv(cv_id: uuid.UUID, current_user: _User, db: _DB):
    await cv_service.delete_cv(cv_id, current_user.id, db)


# --- Day 3+ stubs (CV builder) ---

@router.get("/profile")
async def get_cv_profile():
    return _NI


@router.put("/profile")
async def put_cv_profile():
    return _NI


@router.patch("/profile")
async def patch_cv_profile():
    return _NI


@router.post("/export")
async def export_cv():
    return _NI
