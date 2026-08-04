from collections.abc import Sequence
from uuid import UUID

from app.features.projects.schemas import ProjectFilters, ProjectSortField, SortDirection
from app.models.project import Project, ProjectCategory, Technology
from app.repositories.base import BaseRepository
from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, selectinload


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, db: Session) -> None:
        super().__init__(db=db, model=Project)

    def get_by_slug(self, slug: str) -> Project | None:
        statement = self._with_relationships(self.base_query()).where(Project.slug == slug)
        return self.db.scalars(statement).first()

    def get_by_slug_any_status(self, slug: str) -> Project | None:
        statement = self._with_relationships(self.base_query()).where(Project.slug == slug)
        return self.db.scalars(statement).first()

    def get_project_by_id(self, project_id: UUID) -> Project | None:
        statement = self._with_relationships(self.base_query()).where(Project.id == project_id)
        return self.db.scalars(statement).first()

    def get_featured(self, limit: int = 6) -> Sequence[Project]:
        statement = (
            self._with_relationships(self.base_query())
            .where(Project.status == "published", Project.featured.is_(True))
            .order_by(Project.sort_order.asc(), Project.published_at.desc().nullslast())
            .limit(limit)
        )
        return self.db.scalars(statement).unique().all()

    def list_categories(self) -> Sequence[ProjectCategory]:
        statement = (
            select(ProjectCategory)
            .where(ProjectCategory.deleted_at.is_(None))
            .order_by(ProjectCategory.sort_order.asc(), ProjectCategory.name.asc())
        )
        return self.db.scalars(statement).all()

    def list_technologies(self, category: str | None = None) -> Sequence[Technology]:
        statement = select(Technology).where(Technology.deleted_at.is_(None))

        if category:
            statement = statement.where(Technology.category == category)

        statement = statement.order_by(Technology.sort_order.asc(), Technology.name.asc())
        return self.db.scalars(statement).all()

    def list_filtered(self, filters: ProjectFilters) -> tuple[Sequence[Project], int]:
        statement = self._apply_filters(self.base_query(), filters)
        total_items = self._count(statement)
        statement = (
            self._with_relationships(self._apply_sort(statement, filters))
            .offset((filters.page - 1) * filters.page_size)
            .limit(filters.page_size)
        )
        return self.db.scalars(statement).unique().all(), total_items

    def slug_exists(self, slug: str, *, exclude_project_id: UUID | None = None) -> bool:
        statement = select(Project.id).where(Project.slug == slug, Project.deleted_at.is_(None))

        if exclude_project_id:
            statement = statement.where(Project.id != exclude_project_id)

        return self.db.scalar(statement) is not None

    def get_category(self, category_id: UUID) -> ProjectCategory | None:
        statement = select(ProjectCategory).where(
            ProjectCategory.id == category_id,
            ProjectCategory.deleted_at.is_(None),
        )
        return self.db.scalars(statement).first()

    def list_technologies_by_ids(self, technology_ids: list[UUID]) -> Sequence[Technology]:
        if not technology_ids:
            return []

        statement = select(Technology).where(
            Technology.id.in_(technology_ids),
            Technology.deleted_at.is_(None),
        )
        return self.db.scalars(statement).all()

    def _apply_filters(
        self,
        statement: Select[tuple[Project]],
        filters: ProjectFilters,
    ) -> Select[tuple[Project]]:
        if filters.search:
            search = f"%{filters.search.strip()}%"
            statement = statement.where(
                or_(
                    Project.title.ilike(search),
                    Project.summary.ilike(search),
                    Project.description.ilike(search),
                )
            )

        if filters.category_id:
            statement = statement.where(Project.category_id == filters.category_id)

        if filters.technology_id:
            statement = statement.join(Project.technologies).where(
                Technology.id == filters.technology_id
            )

        if filters.status:
            statement = statement.where(Project.status == filters.status)

        if filters.featured is not None:
            statement = statement.where(Project.featured.is_(filters.featured))

        return statement

    def _apply_sort(
        self,
        statement: Select[tuple[Project]],
        filters: ProjectFilters,
    ) -> Select[tuple[Project]]:
        sort_columns = {
            ProjectSortField.TITLE: Project.title,
            ProjectSortField.CREATED_AT: Project.created_at,
            ProjectSortField.UPDATED_AT: Project.updated_at,
            ProjectSortField.PUBLISHED_AT: Project.published_at,
            ProjectSortField.SORT_ORDER: Project.sort_order,
        }
        column = sort_columns[filters.sort]
        ordered_column = column.desc() if filters.order == SortDirection.DESC else column.asc()
        return statement.order_by(ordered_column)

    def _count(self, statement: Select[tuple[Project]]) -> int:
        count_statement = select(func.count()).select_from(statement.order_by(None).subquery())
        return self.db.scalar(count_statement) or 0

    def _with_relationships(self, statement: Select[tuple[Project]]) -> Select[tuple[Project]]:
        return statement.options(
            selectinload(Project.category),
            selectinload(Project.technologies),
            selectinload(Project.images),
            selectinload(Project.videos),
        )
