from uuid import UUID

from app.core.exceptions import ApiError
from app.features.media.service import MediaService
from app.features.resume.repository import ResumeRepository
from app.features.resume.schemas import ResumeVersionPayload, ResumeVersionUpdateRequest
from app.models.resume import ResumeVersion
from fastapi import UploadFile


class ResumeService:
    def __init__(self, repository: ResumeRepository, media_service: MediaService) -> None:
        self.repository = repository
        self.media_service = media_service

    def get_active(self) -> ResumeVersionPayload:
        return self._serialize(self._get_active())

    def register_download(self) -> str:
        resume = self._get_active()
        resume.download_count += 1
        self.repository.db.commit()
        if not resume.media_asset.public_url:
            raise ApiError(503, "Resume file is unavailable.", "resume_file_unavailable")
        return resume.media_asset.public_url

    def list_versions(self) -> list[ResumeVersionPayload]:
        return [self._serialize(item) for item in self.repository.list_versions()]

    async def upload_version(
        self,
        file: UploadFile,
        *,
        title: str,
        version: str,
        notes: str | None,
        is_active: bool,
        actor_id: UUID,
    ) -> ResumeVersionPayload:
        if file.content_type != "application/pdf":
            raise ApiError(422, "Resume files must be PDFs.", "invalid_resume_file_type")
        media = await self.media_service.upload(file, alt_text=title, folder="resume")
        resume = ResumeVersion(
            media_asset_id=media.id,
            title=title,
            version=version,
            notes=notes,
            is_active=False,
            created_by_id=actor_id,
            updated_by_id=actor_id,
        )
        self.repository.add(resume)
        self.repository.db.flush()
        if is_active or self.repository.get_active() is None:
            self.repository.deactivate_all(exclude_id=resume.id)
            resume.is_active = True
        self.repository.db.commit()
        self.repository.db.refresh(resume)
        return self._serialize(resume)

    def update_version(
        self, version_id: UUID, payload: ResumeVersionUpdateRequest, actor_id: UUID
    ) -> ResumeVersionPayload:
        resume = self._get_version(version_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(resume, field, value)
        resume.updated_by_id = actor_id
        self.repository.db.commit()
        self.repository.db.refresh(resume)
        return self._serialize(resume)

    def activate(self, version_id: UUID, actor_id: UUID) -> ResumeVersionPayload:
        resume = self._get_version(version_id)
        self.repository.deactivate_all(exclude_id=resume.id)
        resume.is_active = True
        resume.updated_by_id = actor_id
        self.repository.db.commit()
        self.repository.db.refresh(resume)
        return self._serialize(resume)

    def delete_version(self, version_id: UUID) -> dict[str, bool]:
        resume = self._get_version(version_id)
        if resume.is_active:
            raise ApiError(409, "The active resume cannot be deleted.", "active_resume_delete")
        resume.mark_deleted()
        self.repository.db.commit()
        return {"deleted": True}

    def _get_active(self) -> ResumeVersion:
        resume = self.repository.get_active()
        if resume is None:
            raise ApiError(404, "No active resume is available.", "resume_not_found")
        return resume

    def _get_version(self, version_id: UUID) -> ResumeVersion:
        resume = self.repository.get_version(version_id)
        if resume is None:
            raise ApiError(404, "Resume version not found.", "resume_version_not_found")
        return resume

    @staticmethod
    def _serialize(resume: ResumeVersion) -> ResumeVersionPayload:
        media = resume.media_asset
        if not media.public_url:
            raise ApiError(503, "Resume file is unavailable.", "resume_file_unavailable")
        return ResumeVersionPayload(
            id=resume.id,
            media_asset_id=resume.media_asset_id,
            title=resume.title,
            version=resume.version,
            is_active=resume.is_active,
            download_count=resume.download_count,
            notes=resume.notes,
            filename=media.original_filename,
            public_url=media.public_url,
            size_bytes=media.size_bytes,
            created_at=resume.created_at,
            updated_at=resume.updated_at,
        )
