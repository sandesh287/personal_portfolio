from app.dependencies import DatabaseSession
from app.repositories.user_repository import UserRepository


def get_user_repository(db: DatabaseSession) -> UserRepository:
    return UserRepository(db)
