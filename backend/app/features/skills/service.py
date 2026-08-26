from collections import defaultdict
from uuid import UUID

from app.core.exceptions import ApiError
from app.features.skills.repository import SkillRepository
from app.features.skills.schemas import (
    SkillCreateRequest,
    SkillFilters,
    SkillPayload,
    SkillUpdateRequest,
)
from app.models.project import Technology
from app.models.skill import Skill
from app.schemas.base import PaginatedPayload
from app.services.base import BaseService
from app.utils.pagination import PaginationParams


class SkillService(BaseService):
    def __init__(self, repository: SkillRepository) -> None:
        self.repository = repository

    def list_skills(self, filters: SkillFilters) -> PaginatedPayload[SkillPayload]:
        skills, total = self.repository.list_filtered(filters)
        pagination = PaginationParams(page=filters.page, page_size=filters.page_size)
        return PaginatedPayload(
            items=[SkillPayload.model_validate(skill) for skill in skills],
            meta=pagination.build_meta(total),
        )

    def grouped_skills(self) -> dict[str, list[SkillPayload]]:
        groups: defaultdict[str, list[SkillPayload]] = defaultdict(list)
        for skill in self.repository.list_all_grouped():
            groups[skill.category].append(SkillPayload.model_validate(skill))
        return dict(groups)

    def create_skill(self, payload: SkillCreateRequest) -> SkillPayload:
        self._validate_slug(payload.slug)
        self._validate_technology(payload.technology_id)
        skill = Skill(**payload.model_dump())
        self.repository.add(skill)
        self.repository.db.commit()
        self.repository.db.refresh(skill)
        return SkillPayload.model_validate(skill)

    def update_skill(self, skill_id: UUID, payload: SkillUpdateRequest) -> SkillPayload:
        skill = self._get_skill(skill_id)
        values = payload.model_dump(exclude_unset=True)
        if payload.slug:
            self._validate_slug(payload.slug, exclude_id=skill_id)
        if "technology_id" in values:
            self._validate_technology(payload.technology_id)
        for field, value in values.items():
            setattr(skill, field, value)
        self.repository.db.commit()
        self.repository.db.refresh(skill)
        return SkillPayload.model_validate(skill)

    def delete_skill(self, skill_id: UUID) -> dict[str, bool]:
        self._get_skill(skill_id).mark_deleted()
        self.repository.db.commit()
        return {"deleted": True}

    def _get_skill(self, skill_id: UUID) -> Skill:
        skill = self.repository.get_active(skill_id)
        if skill is None:
            raise ApiError(404, "Skill not found.", "skill_not_found")
        return skill

    def _validate_slug(self, slug: str, *, exclude_id: UUID | None = None) -> None:
        if self.repository.slug_exists(slug, exclude_id=exclude_id):
            raise ApiError(409, "Skill slug already exists.", "duplicate_skill_slug")

    def _validate_technology(self, technology_id: UUID | None) -> None:
        if technology_id is None:
            return
        technology = self.repository.db.get(Technology, technology_id)
        if technology is None or technology.deleted_at is not None:
            raise ApiError(422, "Technology does not exist.", "invalid_skill_technology")
