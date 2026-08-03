from uuid import UUID

from pydantic import EmailStr

from app.auth.enums import UserRole
from app.schemas.base import ApiSchema


class CurrentUserPayload(ApiSchema):
    id: UUID
    email: EmailStr | None = None
    role: UserRole


class TokenPayload(ApiSchema):
    sub: str
    role: UserRole
    type: str
