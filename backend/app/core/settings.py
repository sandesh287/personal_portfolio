from functools import lru_cache
from typing import Literal, Self

from pydantic import Field, model_validator
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
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 90
    refresh_cookie_name: str = "portfolio_refresh_token"
    refresh_cookie_secure: bool = False
    refresh_cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    upload_root: str = "uploads"
    public_base_url: str = "http://127.0.0.1:8000"
    storage_provider: Literal["local", "cloudinary"] = "local"
    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: str | None = None
    cloudinary_folder: str = "sandesh-portfolio"
    max_image_upload_size_mb: int = 10
    max_video_upload_size_mb: int = 100
    max_document_upload_size_mb: int = 20
    rate_limit_requests: int = 120
    rate_limit_window_seconds: int = 60
    contact_rate_limit_submissions: int = 5
    contact_rate_limit_window_minutes: int = 60
    contact_duplicate_window_minutes: int = 30
    contact_max_links: int = 3
    github_username: str | None = None
    github_token: str | None = None
    github_cache_ttl_minutes: int = 60
    admin_email: str | None = None
    admin_password: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @model_validator(mode="after")
    def validate_storage_configuration(self) -> Self:
        if self.refresh_cookie_samesite == "none" and not self.refresh_cookie_secure:
            raise ValueError("SameSite=None refresh cookies must also be Secure.")
        if self.storage_provider != "cloudinary":
            return self

        required_values = (
            self.cloudinary_cloud_name,
            self.cloudinary_api_key,
            self.cloudinary_api_secret,
        )
        if not all(required_values):
            raise ValueError(
                "Cloudinary storage requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, "
                "and CLOUDINARY_API_SECRET."
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
