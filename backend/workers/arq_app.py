from arq.connections import RedisSettings

from app.config import settings
from workers.tasks.cv_pipeline_task import process_cv


class WorkerSettings:
    # redis_settings must be a RedisSettings object — ARQ does not accept a raw URL string
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    functions = [process_cv]
