from dataclasses import dataclass
from typing import Any

import httpx
from app.core.settings import settings


@dataclass(frozen=True)
class GitHubProfile:
    username: str
    payload: dict[str, Any]


class GitHubClient:
    def __init__(self) -> None:
        headers = {"Accept": "application/vnd.github+json"}

        if settings.github_token:
            headers["Authorization"] = f"Bearer {settings.github_token}"

        self.client = httpx.AsyncClient(base_url="https://api.github.com", headers=headers)

    async def get_profile(self, username: str) -> GitHubProfile:
        response = await self.client.get(f"/users/{username}")
        response.raise_for_status()
        return GitHubProfile(username=username, payload=response.json())

    async def close(self) -> None:
        await self.client.aclose()


class GitHubService:
    def __init__(self, client: GitHubClient | None = None) -> None:
        self.client = client or GitHubClient()

    async def get_configured_profile(self) -> GitHubProfile | None:
        if not settings.github_username:
            return None

        return await self.client.get_profile(settings.github_username)
