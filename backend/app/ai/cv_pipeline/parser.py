import asyncio
import io

from app.config import settings
from app.core.r2_client import r2


async def parse_file(r2_key: str, file_type: str) -> list[str]:
    """Download a CV file from R2 and extract text blocks via Unstructured.io.

    Returns a list of non-empty text strings, one per extracted element.
    """

    def _download_and_parse() -> list[str]:
        # boto3 and unstructured are both synchronous — run together in one thread
        # to avoid two separate executor round trips
        obj = r2.get_object(Bucket=settings.r2_bucket_name, Key=r2_key)
        file_bytes = obj["Body"].read()
        file_obj = io.BytesIO(file_bytes)

        if file_type == "pdf":
            from unstructured.partition.pdf import partition_pdf
            elements = partition_pdf(file=file_obj)
        else:
            from unstructured.partition.docx import partition_docx
            elements = partition_docx(file=file_obj)

        return [str(el) for el in elements if str(el).strip()]

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _download_and_parse)
