import boto3
from app.config import settings

# boto3 is synchronous — always call via asyncio.get_running_loop().run_in_executor
r2 = boto3.client(
    "s3",
    endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
    aws_access_key_id=settings.r2_access_key_id,
    aws_secret_access_key=settings.r2_secret_access_key,
)
