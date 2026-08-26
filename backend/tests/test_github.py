from datetime import UTC, datetime, timedelta

import httpx
from app.auth.security import create_access_token
from app.features.github.dependencies import get_github_client
from app.integrations.github import GitHubApiError, GitHubClient, GitHubSnapshot
from app.main import app
from app.models.github_cache import GitHubCache
from app.models.setting import Setting
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session


class FakeGitHubClient:
    def __init__(self) -> None:
        self.calls = 0
        self.error: GitHubApiError | None = None

    async def get_snapshot(self, username: str) -> GitHubSnapshot:
        self.calls += 1
        if self.error:
            raise self.error
        return build_snapshot(username)


def build_snapshot(username: str) -> GitHubSnapshot:
    return GitHubSnapshot(
        profile={
            "login": username,
            "name": "Sandesh",
            "avatar_url": "https://avatars.example/sandesh.png",
            "html_url": f"https://github.com/{username}",
            "bio": "Developer",
            "followers": 12,
            "following": 4,
            "public_repos": 2,
        },
        repositories=[
            {
                "id": 1,
                "name": "react-workspace",
                "full_name": f"{username}/react-workspace",
                "description": "React portfolio workspace",
                "html_url": f"https://github.com/{username}/react-workspace",
                "language": "TypeScript",
                "stargazers_count": 8,
                "forks_count": 2,
                "open_issues_count": 1,
                "topics": ["react"],
                "default_branch": "main",
                "pushed_at": "2026-08-25T12:00:00Z",
                "updated_at": "2026-08-25T12:00:00Z",
                "private": False,
            },
            {
                "id": 2,
                "name": "flutter-lab",
                "full_name": f"{username}/flutter-lab",
                "description": "Flutter application lab",
                "html_url": f"https://github.com/{username}/flutter-lab",
                "language": "Dart",
                "stargazers_count": 3,
                "forks_count": 1,
                "open_issues_count": 0,
                "topics": ["flutter"],
                "default_branch": "main",
                "pushed_at": "2026-08-24T12:00:00Z",
                "updated_at": "2026-08-24T12:00:00Z",
                "private": False,
            },
        ],
        events=[
            {
                "id": "event-1",
                "type": "PushEvent",
                "repo": {"name": f"{username}/react-workspace"},
                "payload": {"commits": [{"sha": "abc"}, {"sha": "def"}]},
                "created_at": "2026-08-25T12:30:00Z",
            }
        ],
    )


def auth_headers(user: User) -> dict[str, str]:
    token = create_access_token(str(user.id), {"role": user.role})
    return {"Authorization": f"Bearer {token}"}


def configure_github(db: Session, username: str = "sandesh") -> None:
    db.add(
        Setting(
            key="github_username",
            value=username,
            scope="public",
            is_public=True,
        )
    )
    db.commit()


def install_fake_client(fake: FakeGitHubClient) -> None:
    app.dependency_overrides[get_github_client] = lambda: fake


def test_summary_fetches_and_reuses_cached_github_data(
    client: TestClient, db_session: Session
) -> None:
    configure_github(db_session)
    fake = FakeGitHubClient()
    install_fake_client(fake)

    first = client.get("/api/v1/github/summary")
    second = client.get("/api/v1/github/summary")

    assert first.status_code == 200
    assert first.json()["data"]["stats"]["recentCommits"] == 2
    assert first.json()["data"]["featuredRepositories"][0]["name"] == "react-workspace"
    assert second.status_code == 200
    assert fake.calls == 1
    assert db_session.scalar(select(GitHubCache.id)) is not None


def test_repository_and_activity_endpoints_filter_and_paginate(
    client: TestClient, db_session: Session
) -> None:
    configure_github(db_session)
    install_fake_client(FakeGitHubClient())

    repositories = client.get(
        "/api/v1/github/repositories",
        params={"language": "Dart", "sort": "stars", "pageSize": 1},
    )
    activity = client.get("/api/v1/github/activity", params={"type": "PushEvent", "pageSize": 10})

    assert repositories.status_code == 200
    assert repositories.json()["data"]["items"][0]["name"] == "flutter-lab"
    assert repositories.json()["data"]["meta"]["totalItems"] == 1
    assert activity.json()["data"]["items"][0]["summary"] == "Pushed 2 commits."


def test_expired_cache_is_returned_as_stale_when_github_fails(
    client: TestClient, db_session: Session
) -> None:
    configure_github(db_session)
    fake = FakeGitHubClient()
    install_fake_client(fake)
    assert client.get("/api/v1/github/summary").status_code == 200
    cache = db_session.scalar(select(GitHubCache))
    cache.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    db_session.commit()
    fake.error = GitHubApiError(502, "offline")

    response = client.get("/api/v1/github/summary")

    assert response.status_code == 200
    assert response.json()["data"]["stale"] is True


def test_admin_sync_forces_refresh_and_requires_authentication(
    client: TestClient, db_session: Session, admin_user: User
) -> None:
    configure_github(db_session)
    fake = FakeGitHubClient()
    install_fake_client(fake)

    denied = client.post("/api/v1/github/sync")
    synced = client.post("/api/v1/github/sync", headers=auth_headers(admin_user))
    synced_again = client.post("/api/v1/github/sync", headers=auth_headers(admin_user))

    assert denied.status_code == 401
    assert synced.status_code == 200
    assert synced.json()["data"]["synced"] is True
    assert synced_again.status_code == 200
    assert fake.calls == 2


def test_admin_sync_reports_failure_when_only_stale_cache_is_available(
    client: TestClient, db_session: Session, admin_user: User
) -> None:
    configure_github(db_session)
    fake = FakeGitHubClient()
    install_fake_client(fake)
    assert client.get("/api/v1/github/summary").status_code == 200
    cache = db_session.scalar(select(GitHubCache))
    cache.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    db_session.commit()
    fake.error = GitHubApiError(502, "offline")

    response = client.post("/api/v1/github/sync", headers=auth_headers(admin_user))

    assert response.status_code == 502
    assert response.json()["errors"][0]["code"] == "github_sync_failed"


def test_github_requires_configured_username(client: TestClient) -> None:
    install_fake_client(FakeGitHubClient())
    response = client.get("/api/v1/github/summary")
    assert response.status_code == 404
    assert response.json()["errors"][0]["code"] == "github_not_configured"


async def test_github_client_maps_rate_limit_response() -> None:
    transport = httpx.MockTransport(
        lambda _: httpx.Response(
            403,
            json={"message": "API rate limit exceeded"},
            headers={"x-ratelimit-remaining": "0"},
        )
    )
    http_client = httpx.AsyncClient(base_url="https://api.github.com", transport=transport)
    client = GitHubClient(client=http_client)

    try:
        await client.get_snapshot("sandesh")
    except GitHubApiError as exc:
        assert exc.rate_limited is True
    else:
        raise AssertionError("Expected GitHubApiError")
    finally:
        await http_client.aclose()
