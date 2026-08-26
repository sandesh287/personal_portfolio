from app.models.github_cache import GitHubCache
from app.repositories.base import BaseRepository
from sqlalchemy.orm import Session


class GitHubCacheRepository(BaseRepository[GitHubCache]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, GitHubCache)

    def get_by_key(self, cache_key: str) -> GitHubCache | None:
        return self.db.scalar(self.base_query().where(GitHubCache.cache_key == cache_key))
