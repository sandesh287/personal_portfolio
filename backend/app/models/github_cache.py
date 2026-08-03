from typing import Any

from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import BaseModel


class GitHubCache(BaseModel):
    __tablename__ = "github_cache"

    cache_key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
