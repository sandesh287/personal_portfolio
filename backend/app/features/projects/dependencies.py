from typing import Annotated

from app.dependencies import DatabaseSession
from app.features.projects.repository import ProjectRepository
from app.features.projects.service import ProjectService
from fastapi import Depends


def get_project_repository(db: DatabaseSession) -> ProjectRepository:
    return ProjectRepository(db)


def get_project_service(
    project_repository: Annotated[ProjectRepository, Depends(get_project_repository)],
) -> ProjectService:
    return ProjectService(project_repository)
