from typing import Any

from sqlalchemy import JSON, Boolean, CheckConstraint, String, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import BaseModel


class Setting(BaseModel):
    __tablename__ = "settings"
    __table_args__ = (
        CheckConstraint("scope IN ('public', 'admin', 'system')", name="scope_valid"),
    )

    key: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    value: Mapped[Any] = mapped_column(
        JSON().with_variant(postgresql.JSONB(), "postgresql"), nullable=False
    )
    scope: Mapped[str] = mapped_column(String(50), default="public", index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
