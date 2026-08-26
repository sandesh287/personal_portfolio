from collections.abc import Sequence
from uuid import UUID

from app.models.experience import Certification, Education, Experience
from app.repositories.base import BaseRepository
from sqlalchemy import or_
from sqlalchemy.orm import Session


class ExperienceRepository(BaseRepository[Experience]):
    def __init__(self, db: Session) -> None:
        super().__init__(db=db, model=Experience)

    def get_active(self, experience_id: UUID) -> Experience | None:
        return self.db.scalars(self.base_query().where(Experience.id == experience_id)).first()

    def list_entries(
        self, *, published_only: bool, search: str | None = None
    ) -> Sequence[Experience]:
        statement = self.base_query()
        if published_only:
            statement = statement.where(Experience.published.is_(True))
        if search:
            pattern = f"%{search.strip()}%"
            statement = statement.where(
                or_(
                    Experience.company.ilike(pattern),
                    Experience.role.ilike(pattern),
                    Experience.summary.ilike(pattern),
                )
            )
        statement = statement.order_by(
            Experience.sort_order.asc(),
            Experience.current.desc(),
            Experience.start_date.desc(),
        )
        return self.db.scalars(statement).all()


class EducationRepository(BaseRepository[Education]):
    def __init__(self, db: Session) -> None:
        super().__init__(db=db, model=Education)

    def get_active(self, education_id: UUID) -> Education | None:
        return self.db.scalars(self.base_query().where(Education.id == education_id)).first()

    def list_entries(
        self, *, published_only: bool, search: str | None = None
    ) -> Sequence[Education]:
        statement = self.base_query()
        if published_only:
            statement = statement.where(Education.published.is_(True))
        if search:
            pattern = f"%{search.strip()}%"
            statement = statement.where(
                or_(
                    Education.institution.ilike(pattern),
                    Education.degree.ilike(pattern),
                    Education.field_of_study.ilike(pattern),
                )
            )
        statement = statement.order_by(
            Education.sort_order.asc(),
            Education.current.desc(),
            Education.start_date.desc(),
        )
        return self.db.scalars(statement).all()


class CertificationRepository(BaseRepository[Certification]):
    def __init__(self, db: Session) -> None:
        super().__init__(db=db, model=Certification)

    def get_active(self, certification_id: UUID) -> Certification | None:
        return self.db.scalars(
            self.base_query().where(Certification.id == certification_id)
        ).first()

    def list_entries(
        self, *, published_only: bool, search: str | None = None
    ) -> Sequence[Certification]:
        statement = self.base_query()
        if published_only:
            statement = statement.where(Certification.published.is_(True))
        if search:
            pattern = f"%{search.strip()}%"
            statement = statement.where(
                or_(Certification.name.ilike(pattern), Certification.issuer.ilike(pattern))
            )
        return self.db.scalars(
            statement.order_by(
                Certification.sort_order.asc(),
                Certification.issued_at.desc().nullslast(),
                Certification.name.asc(),
            )
        ).all()
