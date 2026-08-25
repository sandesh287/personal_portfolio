from collections.abc import Sequence
from uuid import UUID

from app.core.exceptions import ApiError
from app.features.projects.repository import ProjectRepository
from app.features.projects.schemas import (
    ProjectCategoryCreateRequest,
    ProjectCategoryPayload,
    ProjectCategoryUpdateRequest,
    ProjectCoverImageRequest,
    ProjectCreateRequest,
    ProjectExternalVideoCreateRequest,
    ProjectFilters,
    ProjectImageAttachRequest,
    ProjectImagePayload,
    ProjectImageUpdateRequest,
    ProjectPayload,
    ProjectUpdateRequest,
    ProjectVideoAttachRequest,
    ProjectVideoPayload,
    ProjectVideoUpdateRequest,
    ReorderRequest,
    TechnologyCreateRequest,
    TechnologyPayload,
    TechnologyUpdateRequest,
)
from app.models.media_asset import MediaAsset
from app.models.project import Project, ProjectCategory, ProjectImage, ProjectVideo, Technology
from app.schemas.base import PaginatedPayload
from app.services.base import BaseService
from app.storage.service import MediaStorageService
from app.utils.pagination import PaginationParams


class ProjectService(BaseService):
    def __init__(self, project_repository: ProjectRepository) -> None:
        self.project_repository = project_repository

    def list_projects(self, filters: ProjectFilters) -> PaginatedPayload[ProjectPayload]:
        projects, total_items = self.project_repository.list_filtered(filters)
        pagination = PaginationParams(page=filters.page, page_size=filters.page_size)
        return PaginatedPayload(
            items=[ProjectPayload.model_validate(project) for project in projects],
            meta=pagination.build_meta(total_items),
        )

    def list_featured_projects(self, limit: int) -> list[ProjectPayload]:
        projects = self.project_repository.get_featured(limit)
        return [ProjectPayload.model_validate(project) for project in projects]

    def list_project_categories(self) -> list[ProjectCategoryPayload]:
        categories = self.project_repository.list_categories()
        return [ProjectCategoryPayload.model_validate(category) for category in categories]

    def create_project_category(
        self,
        payload: ProjectCategoryCreateRequest,
    ) -> ProjectCategoryPayload:
        if self.project_repository.category_slug_exists(payload.slug):
            raise ApiError(
                status_code=409,
                message="Project category slug already exists.",
                code="duplicate_category_slug",
            )

        category = ProjectCategory(**payload.model_dump())
        self.project_repository.db.add(category)
        self.project_repository.db.commit()
        self.project_repository.db.refresh(category)
        return ProjectCategoryPayload.model_validate(category)

    def update_project_category(
        self,
        category_id: UUID,
        payload: ProjectCategoryUpdateRequest,
    ) -> ProjectCategoryPayload:
        category = self.project_repository.get_category_by_id(category_id)

        if category is None:
            raise ApiError(
                status_code=404,
                message="Project category not found.",
                code="project_category_not_found",
            )

        if payload.slug and self.project_repository.category_slug_exists(
            payload.slug,
            exclude_category_id=category_id,
        ):
            raise ApiError(
                status_code=409,
                message="Project category slug already exists.",
                code="duplicate_category_slug",
            )

        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(category, key, value)

        self.project_repository.db.commit()
        self.project_repository.db.refresh(category)
        return ProjectCategoryPayload.model_validate(category)

    def delete_project_category(self, category_id: UUID) -> dict[str, bool]:
        category = self.project_repository.get_category_by_id(category_id)

        if category is None:
            raise ApiError(
                status_code=404,
                message="Project category not found.",
                code="project_category_not_found",
            )

        if self.project_repository.count_projects_for_category(category_id) > 0:
            raise ApiError(
                status_code=409,
                message="Project category is assigned to one or more projects.",
                code="project_category_in_use",
            )

        category.mark_deleted()
        self.project_repository.db.commit()
        return {"deleted": True}

    def list_technologies(self, category: str | None = None) -> list[TechnologyPayload]:
        technologies = self.project_repository.list_technologies(category)
        return [TechnologyPayload.model_validate(technology) for technology in technologies]

    def create_technology(self, payload: TechnologyCreateRequest) -> TechnologyPayload:
        if self.project_repository.technology_slug_exists(payload.slug):
            raise ApiError(
                status_code=409,
                message="Technology slug already exists.",
                code="duplicate_technology_slug",
            )

        technology = Technology(**payload.model_dump())
        self.project_repository.db.add(technology)
        self.project_repository.db.commit()
        self.project_repository.db.refresh(technology)
        return TechnologyPayload.model_validate(technology)

    def update_technology(
        self,
        technology_id: UUID,
        payload: TechnologyUpdateRequest,
    ) -> TechnologyPayload:
        technology = self.project_repository.get_technology_by_id(technology_id)

        if technology is None:
            raise ApiError(
                status_code=404,
                message="Technology not found.",
                code="technology_not_found",
            )

        if payload.slug and self.project_repository.technology_slug_exists(
            payload.slug,
            exclude_technology_id=technology_id,
        ):
            raise ApiError(
                status_code=409,
                message="Technology slug already exists.",
                code="duplicate_technology_slug",
            )

        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(technology, key, value)

        self.project_repository.db.commit()
        self.project_repository.db.refresh(technology)
        return TechnologyPayload.model_validate(technology)

    def delete_technology(self, technology_id: UUID) -> dict[str, bool]:
        technology = self.project_repository.get_technology_by_id(technology_id)

        if technology is None:
            raise ApiError(
                status_code=404,
                message="Technology not found.",
                code="technology_not_found",
            )

        if self.project_repository.count_projects_for_technology(technology_id) > 0:
            raise ApiError(
                status_code=409,
                message="Technology is assigned to one or more projects.",
                code="technology_in_use",
            )

        technology.mark_deleted()
        self.project_repository.db.commit()
        return {"deleted": True}

    def get_project_details(self, slug: str) -> ProjectPayload:
        project = self.project_repository.get_by_slug(slug)

        if project is None or project.status != "published":
            raise ApiError(status_code=404, message="Project not found.", code="project_not_found")

        return ProjectPayload.model_validate(project)

    def create_project(self, payload: ProjectCreateRequest) -> ProjectPayload:
        if self.project_repository.slug_exists(payload.slug):
            raise ApiError(
                status_code=409,
                message="Project slug already exists.",
                code="duplicate_slug",
            )

        technologies = self._resolve_technologies(payload.technology_ids)
        self._validate_category(payload.category_id)
        project = Project(
            title=payload.title,
            slug=payload.slug,
            summary=payload.summary,
            description=payload.description,
            category_id=payload.category_id,
            cover_image_id=payload.cover_image_id,
            repository_url=str(payload.repository_url) if payload.repository_url else None,
            live_url=str(payload.live_url) if payload.live_url else None,
            case_study_url=str(payload.case_study_url) if payload.case_study_url else None,
            status=payload.status,
            featured=payload.featured,
            sort_order=payload.sort_order,
        )
        project.technologies = list(technologies)
        self.project_repository.add(project)
        self.project_repository.db.commit()
        self.project_repository.db.refresh(project)
        return ProjectPayload.model_validate(self.project_repository.get_project_by_id(project.id))

    def update_project(self, project_id: UUID, payload: ProjectUpdateRequest) -> ProjectPayload:
        project = self.project_repository.get_project_by_id(project_id)

        if project is None:
            raise ApiError(status_code=404, message="Project not found.", code="project_not_found")

        update_data = payload.model_dump(exclude_unset=True)

        if payload.slug and self.project_repository.slug_exists(
            payload.slug,
            exclude_project_id=project_id,
        ):
            raise ApiError(
                status_code=409,
                message="Project slug already exists.",
                code="duplicate_slug",
            )

        if "category_id" in update_data:
            self._validate_category(payload.category_id)

        if payload.technology_ids is not None:
            project.technologies = list(self._resolve_technologies(payload.technology_ids))
            update_data.pop("technology_ids", None)

        for key, value in update_data.items():
            if key.endswith("_url") and value is not None:
                value = str(value)
            setattr(project, key, value)

        self.project_repository.db.commit()
        self.project_repository.db.refresh(project)
        return ProjectPayload.model_validate(self.project_repository.get_project_by_id(project.id))

    def delete_project(self, project_id: UUID) -> dict[str, bool]:
        project = self.project_repository.get_project_by_id(project_id)

        if project is None:
            raise ApiError(status_code=404, message="Project not found.", code="project_not_found")

        self.project_repository.delete(project)
        self.project_repository.db.commit()
        return {"deleted": True}

    def list_project_images(self, project_id: UUID) -> list[ProjectImagePayload]:
        project = self.project_repository.get_project_by_id(project_id)

        if project is None:
            raise ApiError(status_code=404, message="Project not found.", code="project_not_found")

        images = self.project_repository.list_project_images(project_id)
        return [ProjectImagePayload.model_validate(image) for image in images]

    def attach_project_image(
        self,
        project_id: UUID,
        payload: ProjectImageAttachRequest,
    ) -> ProjectImagePayload:
        project = self.project_repository.get_project_by_id(project_id)
        if project is None:
            raise ApiError(status_code=404, message="Project not found.", code="project_not_found")

        media_asset = self.project_repository.db.get(MediaAsset, payload.media_asset_id)
        if media_asset is None or media_asset.deleted_at is not None:
            raise ApiError(
                status_code=404,
                message="Media asset not found.",
                code="media_not_found",
            )
        if not media_asset.content_type.startswith("image/"):
            raise ApiError(
                status_code=422,
                message="Only image assets can be attached to a project gallery.",
                code="invalid_project_image",
            )
        if self.project_repository.get_project_image_by_media_asset(
            project_id,
            payload.media_asset_id,
        ):
            raise ApiError(
                status_code=409,
                message="Media asset is already attached to this project.",
                code="project_image_exists",
            )

        project_image = ProjectImage(
            project_id=project.id,
            media_asset=media_asset,
            caption=payload.caption,
            sort_order=payload.sort_order,
        )
        self.project_repository.db.add(project_image)
        self.project_repository.db.commit()
        self.project_repository.db.refresh(project_image)
        return ProjectImagePayload.model_validate(project_image)

    def set_project_cover_image(
        self,
        project_id: UUID,
        payload: ProjectCoverImageRequest,
    ) -> ProjectPayload:
        project = self.project_repository.get_project_by_id(project_id)

        if project is None:
            raise ApiError(status_code=404, message="Project not found.", code="project_not_found")

        if payload.image_id is None:
            project.cover_image_id = None
            self.project_repository.db.commit()
            self.project_repository.db.refresh(project)
            return ProjectPayload.model_validate(
                self.project_repository.get_project_by_id(project.id)
            )

        project_image = self.project_repository.get_project_image(project_id, payload.image_id)

        if project_image is None:
            raise ApiError(
                status_code=404,
                message="Project image not found.",
                code="project_image_not_found",
            )

        project.cover_image_id = project_image.media_asset_id
        self.project_repository.db.commit()
        self.project_repository.db.refresh(project)
        return ProjectPayload.model_validate(self.project_repository.get_project_by_id(project.id))

    def delete_project_image(self, project_id: UUID, image_id: UUID) -> dict[str, bool]:
        project = self.project_repository.get_project_by_id(project_id)

        if project is None:
            raise ApiError(status_code=404, message="Project not found.", code="project_not_found")

        project_image = self.project_repository.get_project_image(project_id, image_id)

        if project_image is None:
            raise ApiError(
                status_code=404,
                message="Project image not found.",
                code="project_image_not_found",
            )

        if project.cover_image_id == project_image.media_asset_id:
            project.cover_image_id = None

        project_image.mark_deleted()
        self.project_repository.db.commit()
        return {"deleted": True}

    def list_project_videos(self, project_id: UUID) -> list[ProjectVideoPayload]:
        self._get_project(project_id)
        videos = self.project_repository.list_project_videos(project_id)
        return [ProjectVideoPayload.model_validate(video) for video in videos]

    def attach_project_video(
        self,
        project_id: UUID,
        payload: ProjectVideoAttachRequest,
    ) -> ProjectVideoPayload:
        project = self._get_project(project_id)
        media_asset = self.project_repository.db.get(MediaAsset, payload.media_asset_id)
        if media_asset is None or media_asset.deleted_at is not None:
            raise ApiError(
                status_code=404, message="Media asset not found.", code="media_not_found"
            )
        if not media_asset.content_type.startswith("video/"):
            raise ApiError(
                status_code=422,
                message="Only video assets can be attached as project videos.",
                code="invalid_project_video",
            )
        if self.project_repository.get_project_video_by_media_asset(
            project_id,
            payload.media_asset_id,
        ):
            raise ApiError(
                status_code=409,
                message="Media asset is already attached to this project.",
                code="project_video_exists",
            )

        video = ProjectVideo(
            project_id=project.id,
            media_asset=media_asset,
            provider="local",
            title=payload.title,
            caption=payload.caption,
            sort_order=payload.sort_order,
        )
        self.project_repository.db.add(video)
        self.project_repository.db.commit()
        self.project_repository.db.refresh(video)
        return ProjectVideoPayload.model_validate(video)

    def create_external_project_video(
        self,
        project_id: UUID,
        payload: ProjectExternalVideoCreateRequest,
    ) -> ProjectVideoPayload:
        project = self._get_project(project_id)
        external_url = str(payload.external_url)
        if self.project_repository.get_project_video_by_external_url(project_id, external_url):
            raise ApiError(
                status_code=409,
                message="External video is already attached to this project.",
                code="project_video_exists",
            )

        host = (payload.external_url.host or "").lower()
        provider = "vimeo" if host == "vimeo.com" or host.endswith(".vimeo.com") else "youtube"
        video = ProjectVideo(
            project_id=project.id,
            provider=provider,
            external_url=external_url,
            title=payload.title,
            caption=payload.caption,
            sort_order=payload.sort_order,
        )
        self.project_repository.db.add(video)
        self.project_repository.db.commit()
        self.project_repository.db.refresh(video)
        return ProjectVideoPayload.model_validate(video)

    def delete_project_video(self, project_id: UUID, video_id: UUID) -> dict[str, bool]:
        self._get_project(project_id)
        video = self.project_repository.get_project_video(project_id, video_id)
        if video is None:
            raise ApiError(
                status_code=404,
                message="Project video not found.",
                code="project_video_not_found",
            )
        video.mark_deleted()
        self.project_repository.db.commit()
        return {"deleted": True}

    def update_project_video(
        self,
        project_id: UUID,
        video_id: UUID,
        payload: ProjectVideoUpdateRequest,
    ) -> ProjectVideoPayload:
        self._get_project(project_id)
        video = self.project_repository.get_project_video(project_id, video_id)
        if video is None:
            raise ApiError(
                status_code=404,
                message="Project video not found.",
                code="project_video_not_found",
            )
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(video, field, value)
        self.project_repository.db.commit()
        self.project_repository.db.refresh(video)
        return ProjectVideoPayload.model_validate(video)

    def update_project_image(
        self,
        project_id: UUID,
        image_id: UUID,
        payload: ProjectImageUpdateRequest,
    ) -> ProjectImagePayload:
        self._get_project(project_id)
        image = self.project_repository.get_project_image(project_id, image_id)
        if image is None:
            raise ApiError(
                status_code=404,
                message="Project image not found.",
                code="project_image_not_found",
            )
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(image, field, value)
        self.project_repository.db.commit()
        self.project_repository.db.refresh(image)
        return ProjectImagePayload.model_validate(image)

    def reorder_project_images(
        self,
        project_id: UUID,
        payload: ReorderRequest,
    ) -> list[ProjectImagePayload]:
        self._get_project(project_id)
        images = self.project_repository.list_project_images(project_id)
        ordered_images = self._apply_media_reorder(images, payload, "images")
        response = [ProjectImagePayload.model_validate(image) for image in ordered_images]
        self.project_repository.db.commit()
        return response

    def reorder_project_videos(
        self,
        project_id: UUID,
        payload: ReorderRequest,
    ) -> list[ProjectVideoPayload]:
        self._get_project(project_id)
        videos = self.project_repository.list_project_videos(project_id)
        ordered_videos = self._apply_media_reorder(videos, payload, "videos")
        response = [ProjectVideoPayload.model_validate(video) for video in ordered_videos]
        self.project_repository.db.commit()
        return response

    def _apply_media_reorder(
        self,
        entities: Sequence[ProjectImage | ProjectVideo],
        payload: ReorderRequest,
        resource_name: str,
    ) -> list[ProjectImage | ProjectVideo]:
        existing_ids = {entity.id for entity in entities}
        submitted_ids = {item.id for item in payload.items}
        if existing_ids != submitted_ids:
            raise ApiError(
                status_code=422,
                message=f"Reorder request must contain every active project {resource_name} item.",
                code="invalid_reorder_ids",
            )

        order_map = {item.id: item.sort_order for item in payload.items}
        for entity in entities:
            entity.sort_order = order_map[entity.id]
        self.project_repository.db.flush()
        return sorted(entities, key=lambda entity: entity.sort_order)

    def _get_project(self, project_id: UUID) -> Project:
        project = self.project_repository.get_project_by_id(project_id)
        if project is None:
            raise ApiError(status_code=404, message="Project not found.", code="project_not_found")
        return project

    async def upload_project_image(
        self,
        project_id: UUID,
        filename: str,
        content_type: str,
        content: bytes,
        media_storage_service: MediaStorageService,
        caption: str | None = None,
        sort_order: int = 0,
    ) -> ProjectImagePayload:
        project = self.project_repository.get_project_by_id(project_id)

        if project is None:
            raise ApiError(status_code=404, message="Project not found.", code="project_not_found")

        stored_file = (
            await media_storage_service.save_upload(filename, content_type, content)
        ).payload
        media_asset = MediaAsset(
            filename=stored_file.filename,
            original_filename=filename,
            storage_path=stored_file.path,
            public_url=stored_file.public_url,
            content_type=stored_file.content_type,
            size_bytes=stored_file.size,
        )
        project_image = ProjectImage(
            project_id=project.id,
            media_asset=media_asset,
            caption=caption,
            sort_order=sort_order,
        )
        self.project_repository.db.add(project_image)
        self.project_repository.db.commit()
        self.project_repository.db.refresh(project_image)
        return ProjectImagePayload(
            id=project_image.id,
            media_asset_id=media_asset.id,
            url=media_asset.public_url,
            caption=project_image.caption,
            sort_order=project_image.sort_order,
        )

    def _validate_category(self, category_id: UUID | None) -> None:
        if category_id is None:
            return

        if self.project_repository.get_category(category_id) is None:
            raise ApiError(
                status_code=422,
                message="Project category does not exist.",
                code="invalid_category",
            )

    def _resolve_technologies(self, technology_ids: list[UUID]):
        technologies = self.project_repository.list_technologies_by_ids(technology_ids)

        if len(technologies) != len(technology_ids):
            raise ApiError(
                status_code=422,
                message="One or more technologies do not exist.",
                code="invalid_technologies",
            )

        return technologies
