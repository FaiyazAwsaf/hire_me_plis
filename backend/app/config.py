from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "cv_chunks"

    # Auth
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_days: int = 7

    # ChatLLM (OpenAI-compatible proxy for Claude + Gemini)
    chatllm_api_key: str = ""
    chatllm_base_url: str = ""  # e.g. https://api.chatllm.com/v1

    # LLM
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    google_api_key: str = ""

    # R2
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""

    # Job APIs
    jsearch_rapidapi_key: str = ""


settings = Settings()
