from typing import Annotated

from app.dependencies import DatabaseSession
from app.features.blog.repository import BlogRepository
from app.features.blog.service import BlogService
from fastapi import Depends


def get_blog_repository(db: DatabaseSession) -> BlogRepository:
    return BlogRepository(db)


def get_blog_service(
    repository: Annotated[BlogRepository, Depends(get_blog_repository)],
) -> BlogService:
    return BlogService(repository)
