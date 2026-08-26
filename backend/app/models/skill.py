from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.project import Technology


class Skill(BaseModel):
    __tablename__ = "skills"
    __table_args__ = (CheckConstraint("level BETWEEN 1 AND 5", name="level_valid"),)

    technology_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("technologies.id"), index=True, nullable=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    level: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(120), nullable=True)
    color: Mapped[str | None] = mapped_column(String(32), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, index=True, nullable=False)

    technology: Mapped[Technology | None] = relationship()
