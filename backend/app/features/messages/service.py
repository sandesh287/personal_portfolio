import re
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from app.core.exceptions import ApiError
from app.core.settings import Settings
from app.features.messages.repository import MessageRepository
from app.features.messages.schemas import (
    MessageCreateRequest,
    MessageListFilters,
    MessagePayload,
    MessageReceipt,
    MessageUpdateRequest,
)
from app.models.message import Message
from app.schemas.base import PaginatedPayload
from app.utils.pagination import PaginationParams

URL_PATTERN = re.compile(r"(?:https?://|www\.)", re.IGNORECASE)


class MessageService:
    def __init__(self, repository: MessageRepository, config: Settings) -> None:
        self.repository = repository
        self.config = config

    def create_message(
        self, payload: MessageCreateRequest, *, ip_address: str | None, user_agent: str | None
    ) -> MessageReceipt:
        if payload.website.strip():
            return MessageReceipt(id=uuid4())

        normalized_message = payload.message.strip()
        if len(URL_PATTERN.findall(normalized_message)) > self.config.contact_max_links:
            raise ApiError(422, "Message contains too many links.", "message_link_limit")

        now = datetime.now(UTC)
        window_start = now - timedelta(minutes=self.config.contact_rate_limit_window_minutes)
        if ip_address and (
            self.repository.count_from_ip_since(ip_address, window_start)
            >= self.config.contact_rate_limit_submissions
        ):
            raise ApiError(429, "Too many contact submissions.", "contact_rate_limited")

        duplicate_since = now - timedelta(minutes=self.config.contact_duplicate_window_minutes)
        if self.repository.duplicate_exists(
            email=str(payload.email),
            subject=payload.subject.strip(),
            message=normalized_message,
            since=duplicate_since,
        ):
            raise ApiError(429, "This message was already received.", "duplicate_message")

        message = Message(
            name=payload.name.strip(),
            email=str(payload.email).lower(),
            subject=payload.subject.strip(),
            message=normalized_message,
            source=payload.source.value,
            ip_address=ip_address,
            user_agent=user_agent[:1000] if user_agent else None,
        )
        self.repository.add(message)
        self.repository.db.commit()
        self.repository.db.refresh(message)
        return MessageReceipt(id=message.id)

    def list_messages(self, filters: MessageListFilters) -> PaginatedPayload[MessagePayload]:
        messages, total = self.repository.list_filtered(filters)
        pagination = PaginationParams(page=filters.page, page_size=filters.page_size)
        return PaginatedPayload(
            items=[MessagePayload.model_validate(item) for item in messages],
            meta=pagination.build_meta(total),
        )

    def get_message(self, message_id: UUID) -> MessagePayload:
        return MessagePayload.model_validate(self._get_message(message_id))

    def update_message(
        self, message_id: UUID, payload: MessageUpdateRequest, actor_id: UUID
    ) -> MessagePayload:
        message = self._get_message(message_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(message, field, value)
        message.updated_by_id = actor_id
        self.repository.db.commit()
        self.repository.db.refresh(message)
        return MessagePayload.model_validate(message)

    def delete_message(self, message_id: UUID, actor_id: UUID) -> dict[str, bool]:
        message = self._get_message(message_id)
        message.updated_by_id = actor_id
        message.mark_deleted()
        self.repository.db.commit()
        return {"deleted": True}

    def _get_message(self, message_id: UUID) -> Message:
        message = self.repository.get_active(message_id)
        if message is None:
            raise ApiError(404, "Message not found.", "message_not_found")
        return message
