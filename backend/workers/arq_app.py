from arq import cron
from arq.connections import RedisSettings

from app.config import settings
from workers.tasks.cv_pipeline_task import process_cv, re_embed_profile
from workers.tasks.nudge_task import generate_nudges


class WorkerSettings:
    # redis_settings must be a RedisSettings object — ARQ does not accept a raw URL string
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    functions = [process_cv, re_embed_profile]
    # Cron tasks are scheduled by the worker clock — not enqueue-able via arq_pool
    cron_jobs = [cron(generate_nudges, hour=9, minute=0)]
