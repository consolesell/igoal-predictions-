import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "iGoal Predictions Production Backend"
    VERSION: str = "2.0.0"
    MODE: str = "production"
    API_PREFIX: str = "/v1"
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://igoal_user:igoal_secure_pwd@postgres:5432/igoal_db"
    DB_ECHO: bool = False
    
    # Redis for distributed rate-limiting & background worker queues
    REDIS_URL: str = "redis://redis:6379/0"
    
    # Football Data Provider API Key (optional external sync)
    FOOTBALL_DATA_API_KEY: str = ""
    FOOTBALL_DATA_SOURCE: str = "football-data-v4"
    ENGINE_SOURCE: str = "igoal-engine-v1"
    SETTLER_SOURCE: str = "settler-v1"
    
    # Security & Admin Auth
    ADMIN_TOKEN: str = "igoal_admin_secret_2026"
    CRON_SECRET: str = "igoal_cron_worker_secret_2026"
    
    # Firebase Storage & Auth
    FIREBASE_PROJECT_ID: str = "igoal-predictions-prod"
    FIREBASE_STORAGE_BUCKET: str = "igoal-predictions-prod.appspot.com"
    FIREBASE_STORAGE_BASE_URL: str = "https://storage.googleapis.com/igoal-predictions-prod.appspot.com"
    FCM_SERVER_KEY: str = ""
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    # Model configuration
    DEFAULT_MODEL_VERSION: str = "poisson-emp-1.0"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
