from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy.orm import Session

from app.auth.schemas import AuthTokens, CurrentUserPayload
from app.auth.security import (
    access_token_expires_in_seconds,
    create_access_token,
    create_refresh_token,
    hash_token,
    verify_password,
)
from app.core.exceptions import ApiError
from app.core.settings import settings
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.services.base import BaseService


class AuthService(BaseService):
    def __init__(
        self,
        db: Session,
        user_repository: UserRepository,
        refresh_token_repository: RefreshTokenRepository,
    ) -> None:
        self.db = db
        self.user_repository = user_repository
        self.refresh_token_repository = refresh_token_repository

    def login(self, email: str, password: str) -> AuthTokens:
        user = self.user_repository.get_by_email(email)

        if user is None or not verify_password(password, user.password_hash):
            raise ApiError(
                status_code=401,
                message="Invalid email or password.",
                code="invalid_credentials",
            )

        if not user.is_active:
            raise ApiError(
                status_code=403,
                message="User account is inactive.",
                code="inactive_user",
            )

        user.last_login_at = datetime.now(UTC)
        tokens = self._create_token_pair(user)
        self.db.commit()
        return tokens

    def refresh(self, refresh_token: str) -> AuthTokens:
        token_record = self.refresh_token_repository.get_active_by_hash(hash_token(refresh_token))

        if token_record is None:
            raise ApiError(
                status_code=401,
                message="Invalid refresh token.",
                code="invalid_refresh_token",
            )

        user = self.user_repository.get_by_id(token_record.user_id)

        if user is None or not user.is_active or user.deleted_at is not None:
            raise ApiError(
                status_code=401,
                message="Invalid refresh token.",
                code="invalid_refresh_token",
            )

        self.refresh_token_repository.revoke(token_record)
        tokens = self._create_token_pair(user)
        self.db.commit()
        return tokens

    def logout(self, refresh_token: str) -> dict[str, bool]:
        token_record = self.refresh_token_repository.get_active_by_hash(hash_token(refresh_token))

        if token_record is not None:
            self.refresh_token_repository.revoke(token_record)
            self.db.commit()

        return {"loggedOut": True}

    def build_current_user_payload(self, user: User) -> CurrentUserPayload:
        return CurrentUserPayload(
            id=user.id,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
        )

    def _create_token_pair(self, user: User) -> AuthTokens:
        claims = {"role": user.role}
        access_token = create_access_token(str(user.id), claims)
        refresh_token = create_refresh_token(str(user.id), claims)
        expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)

        self.refresh_token_repository.add(
            RefreshToken(
                user_id=user.id,
                token_hash=hash_token(refresh_token),
                expires_at=expires_at,
            )
        )

        return AuthTokens(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=access_token_expires_in_seconds(),
            user=self.build_current_user_payload(user),
        )


def ensure_user_id(value: str) -> UUID:
    try:
        return UUID(value)
    except ValueError as exc:
        raise ApiError(
            status_code=401,
            message="Invalid authentication token.",
            code="invalid_token",
        ) from exc
