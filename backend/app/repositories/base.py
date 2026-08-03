from collections.abc import Sequence
from typing import Generic, TypeVar
from uuid import UUID

from app.db.base import BaseModel
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

ModelT = TypeVar("ModelT", bound=BaseModel)


class BaseRepository(Generic[ModelT]):
    def __init__(self, db: Session, model: type[ModelT]) -> None:
        self.db = db
        self.model = model

    def get_by_id(self, entity_id: UUID) -> ModelT | None:
        return self.db.get(self.model, entity_id)

    def list(self, *, offset: int = 0, limit: int = 100) -> Sequence[ModelT]:
        statement = self.base_query().offset(offset).limit(limit)
        return self.db.scalars(statement).all()

    def add(self, entity: ModelT) -> ModelT:
        self.db.add(entity)
        return entity

    def delete(self, entity: ModelT) -> None:
        entity.mark_deleted()

    def base_query(self) -> Select[tuple[ModelT]]:
        return select(self.model).where(self.model.deleted_at.is_(None))
