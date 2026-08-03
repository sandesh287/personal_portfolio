from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError

from app.auth.enums import UserRole
from app.auth.security import decode_token
from app.core.exceptions import ApiError

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    role: UserRole


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> CurrentUser:
    if credentials is None:
        raise ApiError(status_code=401, message="Authentication required.", code="auth_required")

    try:
        payload = decode_token(credentials.credentials)
        user_id = UUID(str(payload["sub"]))
        role = UserRole(str(payload["role"]))
    except (InvalidTokenError, KeyError, ValueError) as exc:
        raise ApiError(
            status_code=401,
            message="Invalid authentication token.",
            code="invalid_token",
        ) from exc

    return CurrentUser(id=user_id, role=role)


async def require_admin(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    if current_user.role != UserRole.ADMIN:
        raise ApiError(status_code=403, message="Admin role required.", code="admin_required")

    return current_user
