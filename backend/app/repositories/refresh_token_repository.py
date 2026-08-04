from datetime import UTC, datetime

from app.models.refresh_token import RefreshToken
from app.repositories.base import BaseRepository
from sqlalchemy.orm import Session


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, db: Session) -> None:
        super().__init__(db=db, model=RefreshToken)

    def get_active_by_hash(self, token_hash: str) -> RefreshToken | None:
        statement = self.base_query().where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(UTC),
        )
        return self.db.scalars(statement).first()

    def revoke(self, refresh_token: RefreshToken) -> None:
        refresh_token.revoked_at = datetime.now(UTC)
