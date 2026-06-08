import uuid as _uuid
from datetime import UTC, datetime

from sqlalchemy import select

from app.ai.cv_pipeline.chunker import chunk_sections
from app.ai.cv_pipeline.classifier import ClassifiedBlock
from app.ai.cv_pipeline.embedder import embed_and_upsert
from app.ai.cv_pipeline.meta_extractor import CVMeta
from app.ai.cv_pipeline.pipeline import run_cv_pipeline
from app.ai.vector_store.delete import delete_by_user
from app.database import AsyncSessionLocal
from app.models.cv import CVProfile as CVProfileORM, CVStatus, CVVersion


def _profile_to_classified(profile: dict) -> list[ClassifiedBlock]:
    """Convert structured profile JSON to ClassifiedBlocks — no LLM needed."""
    blocks: list[ClassifiedBlock] = []

    personal = profile.get("personal", {})
    if personal:
        parts = [personal.get("name", ""), personal.get("email", "")]
        if personal.get("summary"):
            parts.append(personal["summary"])
        text = " | ".join(p for p in parts if p)
        if text:
            blocks.append(ClassifiedBlock(section="personal", text=text))

    for exp in profile.get("experience", []):
        end = exp.get("end_date") or "present"
        text = (
            f"{exp['role']} at {exp['company']} "
            f"({exp['start_date']} – {end})\n{exp.get('description', '')}"
        )
        blocks.append(ClassifiedBlock(section="experience", text=text))

    for edu in profile.get("education", []):
        end = edu.get("end_date") or "present"
        text = f"{edu['degree']} at {edu['institution']} ({edu['start_date']} – {end})"
        if edu.get("grade"):
            text += f"\nGrade: {edu['grade']}"
        blocks.append(ClassifiedBlock(section="education", text=text))

    skills = profile.get("skills", [])
    if skills:
        blocks.append(ClassifiedBlock(section="skills", text=", ".join(skills)))

    for proj in profile.get("projects", []):
        text = f"{proj['name']}: {proj['description']}"
        if proj.get("tech_stack"):
            text += f"\nTech: {', '.join(proj['tech_stack'])}"
        blocks.append(ClassifiedBlock(section="projects", text=text))

    for cert in profile.get("certifications", []):
        text = f"{cert['name']} by {cert['issuer']} ({cert['date']})"
        blocks.append(ClassifiedBlock(section="certifications", text=text))

    return blocks


def _meta_from_profile(profile: dict) -> CVMeta:
    """Derive role_title + experience_years from the profile without an LLM call."""
    experience = profile.get("experience", [])
    role_title = experience[0]["role"] if experience else ""

    now = datetime.now()
    total_months = 0
    for exp in experience:
        try:
            start = datetime.strptime(exp["start_date"], "%Y-%m")
            end_str = exp.get("end_date")
            end = (
                datetime.strptime(end_str, "%Y-%m")
                if end_str and not exp.get("current")
                else now
            )
            total_months += max(0, (end.year - start.year) * 12 + (end.month - start.month))
        except (ValueError, KeyError):
            continue

    return CVMeta(role_title=role_title, experience_years=total_months // 12)


async def re_embed_profile(ctx: dict, user_id: str) -> None:
    """ARQ task: re-embed the CV profile after the user edits it via the builder.

    Builds chunks directly from the JSONB profile — skips the LLM classifier
    because the data is already structured and section labels are known.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(CVProfileORM).where(CVProfileORM.user_id == _uuid.UUID(user_id))
        )
        cv_profile = result.scalar_one_or_none()
        if cv_profile is None:
            return

        # Stamp the latest cv_version_id onto Qdrant points (consistent with the upload pipeline)
        cv_result = await db.execute(
            select(CVVersion)
            .where(CVVersion.user_id == _uuid.UUID(user_id))
            .order_by(CVVersion.created_at.desc())
            .limit(1)
        )
        cv_version = cv_result.scalar_one_or_none()
        cv_version_id = str(cv_version.id) if cv_version else user_id

        profile = cv_profile.profile
        classified = _profile_to_classified(profile)
        if not classified:
            return

        chunks = chunk_sections(classified)
        cv_meta = _meta_from_profile(profile)

        # Delete before re-embedding — same contract as the upload pipeline
        await delete_by_user(user_id)
        await embed_and_upsert(chunks, user_id, cv_version_id, cv_meta)


async def process_cv(
    ctx: dict,  # ARQ injects this — contains the Redis connection
    cv_version_id: str,
    user_id: str,
    r2_key: str,
    file_type: str,
) -> None:
    """ARQ task: runs the full CV ingestion pipeline for a single upload."""
    async with AsyncSessionLocal() as db:

        async def update_status(
            cv_id: str, status: str, error_msg: str | None = None
        ) -> None:
            # Closure captures db — avoids threading the session through the pipeline
            cv = await db.get(CVVersion, cv_id)
            if cv is None:
                return
            cv.status = CVStatus(status)
            cv.error_msg = error_msg
            await db.commit()

        uuid_user_id = _uuid.UUID(user_id)

        async def save_profile(profile_dict: dict) -> None:
            """Upsert the extracted profile into cv_profiles."""
            now = datetime.now(UTC)
            result = await db.execute(
                select(CVProfileORM).where(CVProfileORM.user_id == uuid_user_id)
            )
            row = result.scalar_one_or_none()
            if row is None:
                db.add(CVProfileORM(user_id=uuid_user_id, profile=profile_dict, updated_at=now))
            else:
                row.profile = profile_dict
                row.updated_at = now
            await db.commit()

        await run_cv_pipeline(
            user_id=user_id,
            cv_version_id=cv_version_id,
            r2_key=r2_key,
            file_type=file_type,
            update_status_fn=update_status,
            save_profile_fn=save_profile,
        )
