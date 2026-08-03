from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.dependencies import CurrentUser, require_admin

router = APIRouter()


@router.get("/me")
async def read_current_user(
    current_user: Annotated[CurrentUser, Depends(require_admin)],
) -> CurrentUser:
    return current_user
