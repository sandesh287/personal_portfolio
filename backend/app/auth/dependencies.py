from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError

from app.auth.enums import UserRole
from app.auth.security import decode_token
from app.core.exceptions import ApiError
from app.models.user import User
from app.repositories.dependencies import get_user_repository
from app.repositories.user_repository import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    email: str
    role: UserRole
    is_active: bool


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> CurrentUser:
    if credentials is None:
        raise ApiError(status_code=401, message="Authentication required.", code="auth_required")

    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise ValueError("Unexpected token type.")
        user_id = UUID(str(payload["sub"]))
    except (InvalidTokenError, KeyError, ValueError) as exc:
        raise ApiError(
            status_code=401,
            message="Invalid authentication token.",
            code="invalid_token",
        ) from exc

    user = user_repository.get_by_id(user_id)

    if user is None or user.deleted_at is not None:
        raise ApiError(
            status_code=401,
            message="Invalid authentication token.",
            code="invalid_token",
        )

    if not user.is_active:
        raise ApiError(status_code=403, message="User account is inactive.", code="inactive_user")

    return build_current_user(user)


async def require_admin(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    if current_user.role != UserRole.ADMIN:
        raise ApiError(status_code=403, message="Admin role required.", code="admin_required")

    return current_user


def build_current_user(user: User) -> CurrentUser:
    return CurrentUser(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
    )
