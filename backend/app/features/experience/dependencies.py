from typing import Annotated

from app.dependencies import DatabaseSession
from app.features.experience.repository import EducationRepository, ExperienceRepository
from app.features.experience.service import ExperienceService
from fastapi import Depends


def get_experience_repository(db: DatabaseSession) -> ExperienceRepository:
    return ExperienceRepository(db)


def get_education_repository(db: DatabaseSession) -> EducationRepository:
    return EducationRepository(db)


def get_experience_service(
    experiences: Annotated[ExperienceRepository, Depends(get_experience_repository)],
    education: Annotated[EducationRepository, Depends(get_education_repository)],
) -> ExperienceService:
    return ExperienceService(experiences, education)
