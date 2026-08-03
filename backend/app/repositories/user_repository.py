from app.models.user import User
from app.repositories.base import BaseRepository
from sqlalchemy.orm import Session


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session) -> None:
        super().__init__(db=db, model=User)

    def get_by_email(self, email: str) -> User | None:
        statement = self.base_query().where(User.email == email)
        return self.db.scalars(statement).first()
