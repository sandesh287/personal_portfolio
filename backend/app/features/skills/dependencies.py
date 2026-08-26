from typing import Annotated

from app.dependencies import DatabaseSession
from app.features.skills.repository import SkillRepository
from app.features.skills.service import SkillService
from fastapi import Depends


def get_skill_repository(db: DatabaseSession) -> SkillRepository:
    return SkillRepository(db)


def get_skill_service(
    repository: Annotated[SkillRepository, Depends(get_skill_repository)],
) -> SkillService:
    return SkillService(repository)
