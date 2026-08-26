from typing import Annotated
from uuid import UUID

from app.auth.dependencies import CurrentUser, require_admin
from app.features.experience.dependencies import get_experience_service
from app.features.experience.schemas import (
    CertificationCreateRequest,
    CertificationPayload,
    CertificationUpdateRequest,
    EducationCreateRequest,
    EducationPayload,
    EducationUpdateRequest,
    ExperienceCreateRequest,
    ExperiencePayload,
    ExperienceUpdateRequest,
)
from app.features.experience.service import ExperienceService
from app.schemas.base import ApiResponse
from fastapi import APIRouter, Depends

router = APIRouter()


@router.get("", response_model=ApiResponse[list[ExperiencePayload]])
async def list_experiences(
    service: Annotated[ExperienceService, Depends(get_experience_service)],
    search: str | None = None,
) -> ApiResponse[list[ExperiencePayload]]:
    return ApiResponse(data=service.list_experiences(admin=False, search=search))


@router.get("/education", response_model=ApiResponse[list[EducationPayload]])
async def list_education(
    service: Annotated[ExperienceService, Depends(get_experience_service)],
    search: str | None = None,
) -> ApiResponse[list[EducationPayload]]:
    return ApiResponse(data=service.list_education(admin=False, search=search))


@router.get("/certifications", response_model=ApiResponse[list[CertificationPayload]])
async def list_certifications(
    service: Annotated[ExperienceService, Depends(get_experience_service)],
    search: str | None = None,
) -> ApiResponse[list[CertificationPayload]]:
    return ApiResponse(data=service.list_certifications(admin=False, search=search))


@router.get("/admin", response_model=ApiResponse[list[ExperiencePayload]])
async def list_admin_experiences(
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ExperienceService, Depends(get_experience_service)],
    search: str | None = None,
) -> ApiResponse[list[ExperiencePayload]]:
    return ApiResponse(data=service.list_experiences(admin=True, search=search))


@router.post("/admin", response_model=ApiResponse[ExperiencePayload], status_code=201)
async def create_experience(
    payload: ExperienceCreateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ExperienceService, Depends(get_experience_service)],
) -> ApiResponse[ExperiencePayload]:
    return ApiResponse(data=service.create_experience(payload), message="Experience created.")


@router.patch("/admin/{experience_id}", response_model=ApiResponse[ExperiencePayload])
async def update_experience(
    experience_id: UUID,
    payload: ExperienceUpdateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ExperienceService, Depends(get_experience_service)],
) -> ApiResponse[ExperiencePayload]:
    return ApiResponse(
        data=service.update_experience(experience_id, payload), message="Experience updated."
    )


@router.delete("/admin/{experience_id}", response_model=ApiResponse[dict[str, bool]])
async def delete_experience(
    experience_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ExperienceService, Depends(get_experience_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(data=service.delete_experience(experience_id), message="Experience deleted.")


@router.get("/admin/education", response_model=ApiResponse[list[EducationPayload]])
async def list_admin_education(
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ExperienceService, Depends(get_experience_service)],
    search: str | None = None,
) -> ApiResponse[list[EducationPayload]]:
    return ApiResponse(data=service.list_education(admin=True, search=search))


@router.post("/admin/education", response_model=ApiResponse[EducationPayload], status_code=201)
async def create_education(
    payload: EducationCreateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ExperienceService, Depends(get_experience_service)],
) -> ApiResponse[EducationPayload]:
    return ApiResponse(data=service.create_education(payload), message="Education created.")


@router.patch("/admin/education/{education_id}", response_model=ApiResponse[EducationPayload])
async def update_education(
    education_id: UUID,
    payload: EducationUpdateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ExperienceService, Depends(get_experience_service)],
) -> ApiResponse[EducationPayload]:
    return ApiResponse(
        data=service.update_education(education_id, payload), message="Education updated."
    )


@router.delete("/admin/education/{education_id}", response_model=ApiResponse[dict[str, bool]])
async def delete_education(
    education_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ExperienceService, Depends(get_experience_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(data=service.delete_education(education_id), message="Education deleted.")


@router.get("/admin/certifications", response_model=ApiResponse[list[CertificationPayload]])
async def list_admin_certifications(
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ExperienceService, Depends(get_experience_service)],
    search: str | None = None,
) -> ApiResponse[list[CertificationPayload]]:
    return ApiResponse(data=service.list_certifications(admin=True, search=search))


@router.post(
    "/admin/certifications", response_model=ApiResponse[CertificationPayload], status_code=201
)
async def create_certification(
    payload: CertificationCreateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ExperienceService, Depends(get_experience_service)],
) -> ApiResponse[CertificationPayload]:
    return ApiResponse(data=service.create_certification(payload), message="Certification created.")


@router.patch(
    "/admin/certifications/{certification_id}",
    response_model=ApiResponse[CertificationPayload],
)
async def update_certification(
    certification_id: UUID,
    payload: CertificationUpdateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ExperienceService, Depends(get_experience_service)],
) -> ApiResponse[CertificationPayload]:
    return ApiResponse(
        data=service.update_certification(certification_id, payload),
        message="Certification updated.",
    )


@router.delete(
    "/admin/certifications/{certification_id}", response_model=ApiResponse[dict[str, bool]]
)
async def delete_certification(
    certification_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ExperienceService, Depends(get_experience_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(
        data=service.delete_certification(certification_id), message="Certification deleted."
    )
