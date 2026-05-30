from dataclasses import dataclass


@dataclass
class CVChunkPoint:
    id: str            # UUID string, unique per chunk — generated at embed time
    vector: list[float]
    user_id: str
    cv_id: str         # references cv_versions.id
    section: str       # experience | education | skills | projects | certifications | personal | summary
    chunk_index: int   # 0-based position within the section
    text: str
    token_count: int   # exact token count via tiktoken cl100k_base
    role_title: str    # most recent job title — stored on all chunks for Qdrant attribute filtering
    experience_years: int  # total years of experience — enables range queries (gte=3) at search time
