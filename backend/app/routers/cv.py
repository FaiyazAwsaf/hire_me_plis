import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_arq_pool, get_current_user, get_db
from app.models.user import User
from app.schemas.cv import (
    CVExportResponse,
    CVMetaResponse,
    CVProfile,
    CVProfilePatch,
    CVProfileWrite,
    CVStatusResponse,
    CVUploadResponse,
)
from app.services import cv_service

router = APIRouter(prefix="/cv", tags=["cv"])

# Reusable dependency aliases
_DB = Annotated[AsyncSession, Depends(get_db)]
_User = Annotated[User, Depends(get_current_user)]
_ArqPool = Annotated[object, Depends(get_arq_pool)]


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


@router.get("/profile", response_model=CVProfile)
async def get_cv_profile(current_user: _User, db: _DB):
    return await cv_service.get_profile(current_user.id, db)


@router.put("/profile", response_model=CVProfile)
async def put_cv_profile(payload: CVProfileWrite, current_user: _User, db: _DB, arq_pool: _ArqPool):
    return await cv_service.put_profile(current_user.id, payload, db, arq_pool)


@router.patch("/profile", response_model=CVProfile)
async def patch_cv_profile(patch: CVProfilePatch, current_user: _User, db: _DB, arq_pool: _ArqPool):
    return await cv_service.patch_profile(current_user.id, patch, db, arq_pool)


@router.post("/export", response_model=CVExportResponse)
async def export_cv(current_user: _User, db: _DB):
    return await cv_service.export_cv(current_user.id, db)
