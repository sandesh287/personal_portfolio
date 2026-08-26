from datetime import date
from uuid import UUID

from app.core.exceptions import ApiError
from app.features.experience.repository import EducationRepository, ExperienceRepository
from app.features.experience.schemas import (
    EducationCreateRequest,
    EducationPayload,
    EducationUpdateRequest,
    ExperienceCreateRequest,
    ExperiencePayload,
    ExperienceUpdateRequest,
)
from app.models.experience import Education, Experience
from app.services.base import BaseService


class ExperienceService(BaseService):
    def __init__(
        self,
        experience_repository: ExperienceRepository,
        education_repository: EducationRepository,
    ) -> None:
        self.experiences = experience_repository
        self.education = education_repository

    def list_experiences(
        self, *, admin: bool, search: str | None = None
    ) -> list[ExperiencePayload]:
        entries = self.experiences.list_entries(published_only=not admin, search=search)
        return [ExperiencePayload.model_validate(entry) for entry in entries]

    def create_experience(self, payload: ExperienceCreateRequest) -> ExperiencePayload:
        entry = Experience(**payload.model_dump())
        self.experiences.add(entry)
        self.experiences.db.commit()
        self.experiences.db.refresh(entry)
        return ExperiencePayload.model_validate(entry)

    def update_experience(
        self, experience_id: UUID, payload: ExperienceUpdateRequest
    ) -> ExperiencePayload:
        entry = self._get_experience(experience_id)
        values = payload.model_dump(exclude_unset=True)
        self._validate_dates(entry.start_date, entry.end_date, entry.current, values)
        for field, value in values.items():
            setattr(entry, field, value)
        self.experiences.db.commit()
        self.experiences.db.refresh(entry)
        return ExperiencePayload.model_validate(entry)

    def delete_experience(self, experience_id: UUID) -> dict[str, bool]:
        self._get_experience(experience_id).mark_deleted()
        self.experiences.db.commit()
        return {"deleted": True}

    def list_education(self, *, admin: bool, search: str | None = None) -> list[EducationPayload]:
        entries = self.education.list_entries(published_only=not admin, search=search)
        return [EducationPayload.model_validate(entry) for entry in entries]

    def create_education(self, payload: EducationCreateRequest) -> EducationPayload:
        entry = Education(**payload.model_dump())
        self.education.add(entry)
        self.education.db.commit()
        self.education.db.refresh(entry)
        return EducationPayload.model_validate(entry)

    def update_education(
        self, education_id: UUID, payload: EducationUpdateRequest
    ) -> EducationPayload:
        entry = self._get_education(education_id)
        values = payload.model_dump(exclude_unset=True)
        self._validate_dates(entry.start_date, entry.end_date, entry.current, values)
        for field, value in values.items():
            setattr(entry, field, value)
        self.education.db.commit()
        self.education.db.refresh(entry)
        return EducationPayload.model_validate(entry)

    def delete_education(self, education_id: UUID) -> dict[str, bool]:
        self._get_education(education_id).mark_deleted()
        self.education.db.commit()
        return {"deleted": True}

    def _get_experience(self, entry_id: UUID) -> Experience:
        entry = self.experiences.get_active(entry_id)
        if entry is None:
            raise ApiError(404, "Experience entry not found.", "experience_not_found")
        return entry

    def _get_education(self, entry_id: UUID) -> Education:
        entry = self.education.get_active(entry_id)
        if entry is None:
            raise ApiError(404, "Education entry not found.", "education_not_found")
        return entry

    @staticmethod
    def _validate_dates(
        start_date: date,
        end_date: date | None,
        current: bool,
        values: dict[str, object],
    ) -> None:
        next_start = values.get("start_date", start_date)
        next_end = values.get("end_date", end_date)
        next_current = values.get("current", current)
        if next_current and next_end is not None:
            raise ApiError(
                422, "Current timeline entries cannot have an end date.", "invalid_dates"
            )
        if isinstance(next_start, date) and isinstance(next_end, date) and next_end < next_start:
            raise ApiError(422, "End date cannot be earlier than start date.", "invalid_dates")
