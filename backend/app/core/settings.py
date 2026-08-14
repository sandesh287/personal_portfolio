from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Sandesh Portfolio API"
    app_description: str = "Backend API for Sandesh developer workspace portfolio."
    app_version: str = "0.1.0"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    docs_url: str = "/docs"
    redoc_url: str = "/redoc"
    openapi_url: str = "/openapi.json"
    backend_cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/sandesh_portfolio"
    jwt_secret_key: str = "dev-only-change-this-jwt-secret-key-32-plus-characters"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    upload_root: str = "uploads"
    public_base_url: str = "http://127.0.0.1:8000"
    max_upload_size_mb: int = 10
    rate_limit_requests: int = 120
    rate_limit_window_seconds: int = 60
    github_username: str | None = None
    github_token: str | None = None
    admin_email: str | None = None
    admin_password: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
