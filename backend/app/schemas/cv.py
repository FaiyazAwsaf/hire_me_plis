import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# CV upload & processing
# ---------------------------------------------------------------------------

class CVUploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cv_id: uuid.UUID
    status: str


class CVStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cv_id: uuid.UUID
    status: str
    error_message: str | None = None


class CVMetaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cv_id: uuid.UUID
    filename: str
    uploaded_at: datetime
    status: str


# ---------------------------------------------------------------------------
# CV profile nested shapes (mirrors the JSONB profile column)
# ---------------------------------------------------------------------------

class PersonalInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    email: str
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
    github: str | None = None
    summary: str | None = None


class PersonalInfoPatch(BaseModel):
    """All fields optional — used inside CVProfilePatch for partial personal updates."""
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
    github: str | None = None
    summary: str | None = None


class ExperienceEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: str
    company: str
    start_date: str  # YYYY-MM
    end_date: str | None = None  # YYYY-MM
    current: bool
    description: str


class EducationEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    degree: str
    institution: str
    start_date: str  # YYYY-MM
    end_date: str | None = None  # YYYY-MM
    grade: str | None = None


class ProjectEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str
    url: str | None = None
    tech_stack: list[str] = []


class CertEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    issuer: str
    date: str | None = None  # YYYY-MM
    url: str | None = None


# ---------------------------------------------------------------------------
# CV profile — full read/write and partial patch
# ---------------------------------------------------------------------------

class CVProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    personal: PersonalInfo
    experience: list[ExperienceEntry] = []
    education: list[EducationEntry] = []
    skills: list[str] = []
    projects: list[ProjectEntry] = []
    certifications: list[CertEntry] = []
    updated_at: datetime


class CVProfilePatch(BaseModel):
    """Every field optional — only included fields are merged into the stored profile."""
    personal: PersonalInfoPatch | None = None
    experience: list[ExperienceEntry] | None = None
    education: list[EducationEntry] | None = None
    skills: list[str] | None = None
    projects: list[ProjectEntry] | None = None
    certifications: list[CertEntry] | None = None


class CVProfileWrite(BaseModel):
    """Full profile payload for PUT /cv/profile. updated_at is server-set."""
    personal: PersonalInfo
    experience: list[ExperienceEntry] = []
    education: list[EducationEntry] = []
    skills: list[str] = []
    projects: list[ProjectEntry] = []
    certifications: list[CertEntry] = []


# ---------------------------------------------------------------------------
# CV export
# ---------------------------------------------------------------------------

class CVExportResponse(BaseModel):
    download_url: str
    expires_at: datetime
