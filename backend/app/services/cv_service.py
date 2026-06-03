import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.vector_store.delete import delete_by_user
from app.config import settings
from app.core.r2_client import r2
from app.models.cv import CVProfile as CVProfileORM, CVStatus, CVVersion
from app.schemas.cv import (
    CVExportResponse,
    CVMetaResponse,
    CVProfile,
    CVProfilePatch,
    CVProfileWrite,
    CVStatusResponse,
    CVUploadResponse,
)

_ALLOWED_EXTENSIONS = {"pdf", "docx"}
_MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


async def upload_cv(
    user_id: uuid.UUID,
    file: UploadFile,
    db: AsyncSession,
    arq_pool,
) -> CVUploadResponse:
    # Validate file extension
    ext = Path(file.filename or "").suffix.lstrip(".").lower()
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted")

    # Read into memory so we can check size and upload to R2
    content = await file.read()
    if len(content) > _MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit")

    # Generate UUID in Python so we have it before the DB commit
    cv_id = uuid.uuid4()
    r2_key = f"cvs/{user_id}/{cv_id}.{ext}"

    # Upload to R2 — boto3 is synchronous so run in a thread
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(
        None,
        lambda: r2.put_object(
            Bucket=settings.r2_bucket_name,
            Key=r2_key,
            Body=content,
        ),
    )

    cv = CVVersion(
        id=cv_id,
        user_id=user_id,
        filename=file.filename or f"upload.{ext}",
        r2_key=r2_key,
        status=CVStatus.pending,
    )
    db.add(cv)
    await db.commit()

    # Enqueue the background pipeline — args must match process_cv signature
    await arq_pool.enqueue_job("process_cv", str(cv_id), str(user_id), r2_key, ext)

    # .value converts the enum to a plain string — Pydantic schema expects str, not CVStatus
    return CVUploadResponse(cv_id=cv_id, status=CVStatus.pending.value)


async def get_cv_status(user_id: uuid.UUID, db: AsyncSession) -> CVStatusResponse:
    """Return the processing state of the user's most recent CV upload."""
    cv = await _get_latest_cv(user_id, db)
    return CVStatusResponse(
        cv_id=cv.id,
        status=cv.status.value,
        error_message=cv.error_msg,  # schema uses error_message; ORM uses error_msg
    )


async def get_cv_meta(user_id: uuid.UUID, db: AsyncSession) -> CVMetaResponse:
    """Return filename and upload time for the user's most recent CV."""
    cv = await _get_latest_cv(user_id, db)
    return CVMetaResponse(
        cv_id=cv.id,
        filename=cv.filename,
        uploaded_at=cv.created_at,  # schema uses uploaded_at; ORM uses created_at
        status=cv.status.value,
    )


async def delete_cv(
    cv_version_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    cv = await db.get(CVVersion, cv_version_id)
    if cv is None:
        raise HTTPException(status_code=404, detail="CV not found")
    if cv.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Delete Qdrant chunks first — deletes all chunks for the user (one active CV at a time)
    await delete_by_user(str(user_id))

    await db.delete(cv)
    await db.commit()


async def _get_latest_cv(user_id: uuid.UUID, db: AsyncSession) -> CVVersion:
    """Fetch the most recently uploaded CVVersion row for a user, or raise 404."""
    result = await db.execute(
        select(CVVersion)
        .where(CVVersion.user_id == user_id)
        .order_by(CVVersion.created_at.desc())
        .limit(1)
    )
    cv = result.scalar_one_or_none()
    if cv is None:
        raise HTTPException(status_code=404, detail="No CV found for this user")
    return cv


async def _get_profile_row(user_id: uuid.UUID, db: AsyncSession) -> CVProfileORM:
    result = await db.execute(
        select(CVProfileORM).where(CVProfileORM.user_id == user_id)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="No CV profile found")
    return row


async def get_profile(user_id: uuid.UUID, db: AsyncSession) -> CVProfile:
    row = await _get_profile_row(user_id, db)
    return CVProfile(**row.profile, updated_at=row.updated_at)


async def put_profile(
    user_id: uuid.UUID,
    payload: CVProfileWrite,
    db: AsyncSession,
    arq_pool,
) -> CVProfile:
    """Full replace — creates the profile row if it doesn't exist yet (upsert)."""
    result = await db.execute(
        select(CVProfileORM).where(CVProfileORM.user_id == user_id)
    )
    row = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    # mode="json" serialises UUIDs to strings — correct for JSONB storage
    profile_data = payload.model_dump(mode="json")

    if row is None:
        row = CVProfileORM(user_id=user_id, profile=profile_data, updated_at=now)
        db.add(row)
    else:
        # Reassign (not mutate in-place) so SQLAlchemy detects the JSONB change
        row.profile = profile_data
        row.updated_at = now

    await db.commit()
    await arq_pool.enqueue_job("re_embed_profile", str(user_id))
    return CVProfile(**profile_data, updated_at=now)


async def patch_profile(
    user_id: uuid.UUID,
    patch: CVProfilePatch,
    db: AsyncSession,
    arq_pool,
) -> CVProfile:
    """Partial update — personal fields merge individually; lists replace wholesale."""
    row = await _get_profile_row(user_id, db)
    stored: dict = dict(row.profile)

    if patch.personal is not None:
        existing_personal = dict(stored.get("personal", {}))
        # Only overwrite fields that were explicitly sent (exclude_none skips omitted fields)
        existing_personal.update(patch.personal.model_dump(exclude_none=True))
        stored["personal"] = existing_personal

    for field in ("experience", "education", "projects", "certifications"):
        val = getattr(patch, field)
        if val is not None:
            stored[field] = [item.model_dump(mode="json") for item in val]

    if patch.skills is not None:
        stored["skills"] = patch.skills

    now = datetime.now(timezone.utc)
    row.profile = stored  # reassign triggers SQLAlchemy JSONB dirty-check
    row.updated_at = now
    await db.commit()
    await arq_pool.enqueue_job("re_embed_profile", str(user_id))
    return CVProfile(**stored, updated_at=now)


async def export_cv(user_id: uuid.UUID, db: AsyncSession) -> CVExportResponse:
    """Generate a 1-hour presigned GET URL for the user's latest CV file in R2."""
    cv = await _get_latest_cv(user_id, db)
    loop = asyncio.get_running_loop()
    # boto3 is synchronous — must run in executor to avoid blocking the event loop
    url: str = await loop.run_in_executor(
        None,
        lambda: r2.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.r2_bucket_name, "Key": cv.r2_key},
            ExpiresIn=3600,
        ),
    )
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    return CVExportResponse(download_url=url, expires_at=expires_at)
