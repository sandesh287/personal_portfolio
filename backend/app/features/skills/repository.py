from collections.abc import Sequence
from uuid import UUID

from app.features.skills.schemas import SkillFilters, SkillSortField, SortDirection
from app.models.skill import Skill
from app.repositories.base import BaseRepository
from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, selectinload


class SkillRepository(BaseRepository[Skill]):
    def __init__(self, db: Session) -> None:
        super().__init__(db=db, model=Skill)

    def get_active(self, skill_id: UUID) -> Skill | None:
        statement = (
            self.base_query().where(Skill.id == skill_id).options(selectinload(Skill.technology))
        )
        return self.db.scalars(statement).first()

    def list_filtered(self, filters: SkillFilters) -> tuple[Sequence[Skill], int]:
        statement = self._apply_filters(self.base_query(), filters)
        total = (
            self.db.scalar(select(func.count()).select_from(statement.order_by(None).subquery()))
            or 0
        )
        statement = (
            self._apply_sort(statement, filters)
            .options(selectinload(Skill.technology))
            .offset((filters.page - 1) * filters.page_size)
            .limit(filters.page_size)
        )
        return self.db.scalars(statement).all(), total

    def list_all_grouped(self) -> Sequence[Skill]:
        statement = self.base_query().order_by(
            Skill.category.asc(), Skill.sort_order.asc(), Skill.name.asc()
        )
        return self.db.scalars(statement).all()

    def slug_exists(self, slug: str, *, exclude_id: UUID | None = None) -> bool:
        statement = select(Skill.id).where(Skill.slug == slug)
        if exclude_id:
            statement = statement.where(Skill.id != exclude_id)
        return self.db.scalar(statement) is not None

    @staticmethod
    def _apply_filters(
        statement: Select[tuple[Skill]], filters: SkillFilters
    ) -> Select[tuple[Skill]]:
        if filters.search:
            pattern = f"%{filters.search.strip()}%"
            statement = statement.where(
                or_(Skill.name.ilike(pattern), Skill.description.ilike(pattern))
            )
        if filters.category:
            statement = statement.where(Skill.category == filters.category)
        if filters.level:
            statement = statement.where(Skill.level == filters.level)
        return statement

    @staticmethod
    def _apply_sort(statement: Select[tuple[Skill]], filters: SkillFilters) -> Select[tuple[Skill]]:
        columns = {
            SkillSortField.NAME: Skill.name,
            SkillSortField.CATEGORY: Skill.category,
            SkillSortField.LEVEL: Skill.level,
            SkillSortField.SORT_ORDER: Skill.sort_order,
        }
        column = columns[filters.sort]
        ordering = column.desc() if filters.order == SortDirection.DESC else column.asc()
        return statement.order_by(ordering, Skill.name.asc())
