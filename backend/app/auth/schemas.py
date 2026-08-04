from uuid import UUID

from pydantic import AliasChoices, EmailStr, Field

from app.auth.enums import UserRole
from app.schemas.base import ApiSchema


class CurrentUserPayload(ApiSchema):
    id: UUID
    email: EmailStr | None = None
    role: UserRole
    is_active: bool = True


class TokenPayload(ApiSchema):
    sub: str
    role: UserRole
    type: str


class LoginRequest(ApiSchema):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RefreshTokenRequest(ApiSchema):
    refresh_token: str = Field(
        min_length=1,
        validation_alias=AliasChoices("refreshToken", "refresh_token"),
    )


class LogoutRequest(ApiSchema):
    refresh_token: str = Field(
        min_length=1,
        validation_alias=AliasChoices("refreshToken", "refresh_token"),
    )


class AuthTokens(ApiSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: CurrentUserPayload
