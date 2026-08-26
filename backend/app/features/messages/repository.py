from collections.abc import Sequence
from datetime import datetime
from uuid import UUID

from app.features.messages.schemas import MessageListFilters
from app.models.message import Message
from app.repositories.base import BaseRepository
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session


class MessageRepository(BaseRepository[Message]):
    SORT_COLUMNS = {
        "createdAt": Message.created_at,
        "name": Message.name,
        "email": Message.email,
        "subject": Message.subject,
    }

    def __init__(self, db: Session) -> None:
        super().__init__(db, Message)

    def get_active(self, message_id: UUID) -> Message | None:
        return self.db.scalar(self.base_query().where(Message.id == message_id))

    def list_filtered(self, filters: MessageListFilters) -> tuple[Sequence[Message], int]:
        statement = self.base_query()
        if filters.search:
            pattern = f"%{filters.search.strip()}%"
            statement = statement.where(
                or_(
                    Message.name.ilike(pattern),
                    Message.email.ilike(pattern),
                    Message.subject.ilike(pattern),
                    Message.message.ilike(pattern),
                )
            )
        for field in ("read", "archived", "starred"):
            value = getattr(filters, field)
            if value is not None:
                statement = statement.where(getattr(Message, field).is_(value))

        total = self.db.scalar(select(func.count()).select_from(statement.subquery())) or 0
        sort_column = self.SORT_COLUMNS[filters.sort.value]
        ordering = sort_column.asc() if filters.order.value == "asc" else sort_column.desc()
        items = self.db.scalars(
            statement.order_by(ordering, Message.id.asc())
            .offset((filters.page - 1) * filters.page_size)
            .limit(filters.page_size)
        ).all()
        return items, total

    def count_from_ip_since(self, ip_address: str, since: datetime) -> int:
        return (
            self.db.scalar(
                select(func.count(Message.id)).where(
                    Message.ip_address == ip_address,
                    Message.created_at >= since,
                    Message.deleted_at.is_(None),
                )
            )
            or 0
        )

    def duplicate_exists(self, *, email: str, subject: str, message: str, since: datetime) -> bool:
        return (
            self.db.scalar(
                select(Message.id)
                .where(
                    func.lower(Message.email) == email.lower(),
                    Message.subject == subject,
                    Message.message == message,
                    Message.created_at >= since,
                    Message.deleted_at.is_(None),
                )
                .limit(1)
            )
            is not None
        )
