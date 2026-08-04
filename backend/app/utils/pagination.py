from app.schemas.base import PaginationMeta
from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    def build_meta(self, total_items: int) -> PaginationMeta:
        total_pages = (total_items + self.page_size - 1) // self.page_size
        return PaginationMeta(
            page=self.page,
            page_size=self.page_size,
            total_items=total_items,
            total_pages=total_pages,
            has_next_page=self.page < total_pages,
            has_previous_page=self.page > 1,
        )
