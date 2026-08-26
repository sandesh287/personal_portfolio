from typing import Annotated

from app.core.settings import Settings, get_settings
from app.dependencies import DatabaseSession
from app.features.messages.repository import MessageRepository
from app.features.messages.service import MessageService
from fastapi import Depends


def get_message_repository(db: DatabaseSession) -> MessageRepository:
    return MessageRepository(db)


def get_message_service(
    repository: Annotated[MessageRepository, Depends(get_message_repository)],
    config: Annotated[Settings, Depends(get_settings)],
) -> MessageService:
    return MessageService(repository, config)
