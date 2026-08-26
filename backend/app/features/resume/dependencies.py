from typing import Annotated

from app.dependencies import DatabaseSession
from app.features.media.dependencies import get_media_service
from app.features.media.service import MediaService
from app.features.resume.repository import ResumeRepository
from app.features.resume.service import ResumeService
from fastapi import Depends


def get_resume_repository(db: DatabaseSession) -> ResumeRepository:
    return ResumeRepository(db)


def get_resume_service(
    repository: Annotated[ResumeRepository, Depends(get_resume_repository)],
    media_service: Annotated[MediaService, Depends(get_media_service)],
) -> ResumeService:
    return ResumeService(repository, media_service)
