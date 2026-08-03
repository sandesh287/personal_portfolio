from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.dependencies import CurrentUser, require_admin
from app.auth.schemas import CurrentUserPayload
from app.schemas.base import ApiResponse

router = APIRouter()


@router.get("/me", response_model=ApiResponse[CurrentUserPayload])
async def read_current_user(
    current_user: Annotated[CurrentUser, Depends(require_admin)],
) -> ApiResponse[CurrentUserPayload]:
    return ApiResponse(
        data=CurrentUserPayload(id=current_user.id, role=current_user.role),
        message="Authenticated user resolved.",
    )
