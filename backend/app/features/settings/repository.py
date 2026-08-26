from collections.abc import Sequence

from app.models.setting import Setting
from app.repositories.base import BaseRepository
from sqlalchemy.orm import Session


class SettingRepository(BaseRepository[Setting]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Setting)

    def list_settings(self, *, public_only: bool) -> Sequence[Setting]:
        statement = self.base_query()
        if public_only:
            statement = statement.where(Setting.is_public.is_(True))
        return self.db.scalars(statement.order_by(Setting.key.asc())).all()

    def get_by_key(self, key: str) -> Setting | None:
        return self.db.scalar(self.base_query().where(Setting.key == key))
