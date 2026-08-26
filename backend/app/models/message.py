from sqlalchemy import Boolean, CheckConstraint, Index, String, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import BaseModel


class Message(BaseModel):
    __tablename__ = "messages"
    __table_args__ = (
        CheckConstraint(
            "source IN ('contact_form', 'communication_terminal', 'admin_test')",
            name="source_valid",
        ),
        Index("ix_messages_created_at", "created_at"),
    )

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(80), nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    starred: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(
        String(45).with_variant(postgresql.INET(), "postgresql"), nullable=True
    )
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
