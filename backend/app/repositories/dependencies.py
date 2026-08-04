from app.dependencies import DatabaseSession
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository


def get_user_repository(db: DatabaseSession) -> UserRepository:
    return UserRepository(db)


def get_refresh_token_repository(db: DatabaseSession) -> RefreshTokenRepository:
    return RefreshTokenRepository(db)
