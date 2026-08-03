from typing import Generic, TypeVar
from uuid import UUID

from app.db.base import BaseModel
from sqlalchemy.orm import Session

ModelT = TypeVar("ModelT", bound=BaseModel)


class BaseRepository(Generic[ModelT]):
    def __init__(self, db: Session, model: type[ModelT]) -> None:
        self.db = db
        self.model = model

    def get_by_id(self, entity_id: UUID) -> ModelT | None:
        return self.db.get(self.model, entity_id)
