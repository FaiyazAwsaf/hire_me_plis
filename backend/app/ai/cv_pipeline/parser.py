import asyncio
import io

from app.config import settings
from app.core.r2_client import r2


async def parse_file(r2_key: str, file_type: str) -> list[str]:
    """Download a CV file from R2 and extract text blocks.

    Returns a list of non-empty text strings (one per paragraph / page element).
    Uses pypdf for PDFs and python-docx for DOCX — both are pure-Python and require
    no ML models, keeping the Docker image small enough to deploy on free-tier hosts.
    """

    def _download_and_parse() -> list[str]:
        # boto3 is synchronous — run in a thread so we don't block the event loop
        obj = r2.get_object(Bucket=settings.r2_bucket_name, Key=r2_key)
        file_bytes = obj["Body"].read()
        file_obj = io.BytesIO(file_bytes)

        if file_type == "pdf":
            return _parse_pdf(file_obj)
        else:
            return _parse_docx(file_obj)

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _download_and_parse)


def _parse_pdf(file_obj: io.BytesIO) -> list[str]:
    # Deferred import: pypdf loads lazily to keep startup fast
    from pypdf import PdfReader

    reader = PdfReader(file_obj)
    blocks: list[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        # Split on double-newlines to approximate paragraph boundaries
        for chunk in text.split("\n\n"):
            chunk = chunk.strip()
            if chunk:
                blocks.append(chunk)
    return blocks


def _parse_docx(file_obj: io.BytesIO) -> list[str]:
    # Deferred import: python-docx loads lazily to keep startup fast
    from docx import Document

    doc = Document(file_obj)
    return [p.text.strip() for p in doc.paragraphs if p.text.strip()]
