from collections.abc import Generator

import app.models  # noqa: F401
import pytest
from app.auth.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.middleware.rate_limit import RateLimitMiddleware
from app.models.user import User
from app.storage.dependencies import get_storage_provider
from app.storage.local import LocalStorageProvider
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session, tmp_path) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_storage_provider] = lambda: LocalStorageProvider(str(tmp_path))

    with TestClient(app) as test_client:
        middleware = app.middleware_stack
        while middleware is not None:
            if isinstance(middleware, RateLimitMiddleware):
                middleware.history.clear()
                break
            middleware = getattr(middleware, "app", None)
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture()
def admin_user(db_session: Session) -> User:
    user = User(
        email="admin@sandesh.dev",
        password_hash=hash_password("secure-password"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user
