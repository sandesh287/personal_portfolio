from collections.abc import Sequence
from uuid import UUID

from app.features.blog.schemas import BlogFilters, BlogSortField, SortDirection
from app.models.blog import BlogCategory, BlogPost, BlogTag
from app.repositories.base import BaseRepository
from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, selectinload


class BlogRepository(BaseRepository[BlogPost]):
    def __init__(self, db: Session) -> None:
        super().__init__(db=db, model=BlogPost)

    def get_post_by_id(self, post_id: UUID) -> BlogPost | None:
        statement = self._with_relationships(self.base_query()).where(BlogPost.id == post_id)
        return self.db.scalars(statement).first()

    def get_post_by_slug(self, slug: str) -> BlogPost | None:
        statement = self._with_relationships(self.base_query()).where(BlogPost.slug == slug)
        return self.db.scalars(statement).first()

    def list_filtered(self, filters: BlogFilters) -> tuple[Sequence[BlogPost], int]:
        statement = self._apply_filters(self.base_query(), filters)
        total = (
            self.db.scalar(select(func.count()).select_from(statement.order_by(None).subquery()))
            or 0
        )
        statement = (
            self._with_relationships(self._apply_sort(statement, filters))
            .offset((filters.page - 1) * filters.page_size)
            .limit(filters.page_size)
        )
        return self.db.scalars(statement).unique().all(), total

    def list_featured(self, limit: int) -> Sequence[BlogPost]:
        statement = (
            self._with_relationships(self.base_query())
            .where(BlogPost.status == "published", BlogPost.featured.is_(True))
            .order_by(BlogPost.published_at.desc().nullslast(), BlogPost.created_at.desc())
            .limit(limit)
        )
        return self.db.scalars(statement).unique().all()

    def post_slug_exists(self, slug: str, *, exclude_id: UUID | None = None) -> bool:
        statement = select(BlogPost.id).where(BlogPost.slug == slug)
        if exclude_id:
            statement = statement.where(BlogPost.id != exclude_id)
        return self.db.scalar(statement) is not None

    def list_categories(self) -> Sequence[BlogCategory]:
        statement = (
            select(BlogCategory)
            .where(BlogCategory.deleted_at.is_(None))
            .order_by(BlogCategory.sort_order.asc(), BlogCategory.name.asc())
        )
        return self.db.scalars(statement).all()

    def get_category(self, category_id: UUID) -> BlogCategory | None:
        statement = select(BlogCategory).where(
            BlogCategory.id == category_id, BlogCategory.deleted_at.is_(None)
        )
        return self.db.scalars(statement).first()

    def category_slug_exists(self, slug: str, *, exclude_id: UUID | None = None) -> bool:
        statement = select(BlogCategory.id).where(BlogCategory.slug == slug)
        if exclude_id:
            statement = statement.where(BlogCategory.id != exclude_id)
        return self.db.scalar(statement) is not None

    def count_posts_for_category(self, category_id: UUID) -> int:
        statement = (
            select(func.count())
            .select_from(BlogPost)
            .where(BlogPost.category_id == category_id, BlogPost.deleted_at.is_(None))
        )
        return self.db.scalar(statement) or 0

    def list_tags(self) -> Sequence[BlogTag]:
        statement = select(BlogTag).where(BlogTag.deleted_at.is_(None)).order_by(BlogTag.name.asc())
        return self.db.scalars(statement).all()

    def get_tag(self, tag_id: UUID) -> BlogTag | None:
        statement = select(BlogTag).where(BlogTag.id == tag_id, BlogTag.deleted_at.is_(None))
        return self.db.scalars(statement).first()

    def list_tags_by_ids(self, tag_ids: list[UUID]) -> Sequence[BlogTag]:
        if not tag_ids:
            return []
        statement = select(BlogTag).where(BlogTag.id.in_(tag_ids), BlogTag.deleted_at.is_(None))
        return self.db.scalars(statement).all()

    def tag_slug_exists(self, slug: str, *, exclude_id: UUID | None = None) -> bool:
        statement = select(BlogTag.id).where(BlogTag.slug == slug)
        if exclude_id:
            statement = statement.where(BlogTag.id != exclude_id)
        return self.db.scalar(statement) is not None

    def count_posts_for_tag(self, tag_id: UUID) -> int:
        statement = (
            select(func.count())
            .select_from(BlogPost)
            .join(BlogPost.tags)
            .where(BlogPost.deleted_at.is_(None), BlogTag.id == tag_id)
        )
        return self.db.scalar(statement) or 0

    def _apply_filters(
        self, statement: Select[tuple[BlogPost]], filters: BlogFilters
    ) -> Select[tuple[BlogPost]]:
        if filters.search:
            search = f"%{filters.search.strip()}%"
            statement = statement.where(
                or_(
                    BlogPost.title.ilike(search),
                    BlogPost.excerpt.ilike(search),
                    BlogPost.content.ilike(search),
                )
            )
        if filters.category:
            statement = statement.join(BlogPost.category).where(
                BlogCategory.slug == filters.category,
                BlogCategory.deleted_at.is_(None),
            )
        if filters.tag:
            statement = statement.join(BlogPost.tags).where(
                BlogTag.slug == filters.tag,
                BlogTag.deleted_at.is_(None),
            )
        if filters.status:
            statement = statement.where(BlogPost.status == filters.status)
        if filters.featured is not None:
            statement = statement.where(BlogPost.featured.is_(filters.featured))
        return statement

    def _apply_sort(
        self, statement: Select[tuple[BlogPost]], filters: BlogFilters
    ) -> Select[tuple[BlogPost]]:
        columns = {
            BlogSortField.TITLE: BlogPost.title,
            BlogSortField.CREATED_AT: BlogPost.created_at,
            BlogSortField.UPDATED_AT: BlogPost.updated_at,
            BlogSortField.PUBLISHED_AT: BlogPost.published_at,
        }
        column = columns[filters.sort]
        ordered = column.desc() if filters.order == SortDirection.DESC else column.asc()
        return statement.order_by(ordered, BlogPost.created_at.desc())

    def _with_relationships(self, statement: Select[tuple[BlogPost]]) -> Select[tuple[BlogPost]]:
        return statement.options(
            selectinload(BlogPost.category),
            selectinload(BlogPost.tags),
            selectinload(BlogPost.cover_image),
        )
