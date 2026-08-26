from dataclasses import dataclass
from typing import Any

import httpx
from app.core.settings import Settings, settings


class GitHubApiError(RuntimeError):
    def __init__(self, status_code: int, message: str, *, rate_limited: bool = False) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.rate_limited = rate_limited


@dataclass(frozen=True)
class GitHubSnapshot:
    profile: dict[str, Any]
    repositories: list[dict[str, Any]]
    events: list[dict[str, Any]]


class GitHubClient:
    def __init__(
        self,
        config: Settings = settings,
        *,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "sandesh-portfolio",
        }
        if config.github_token:
            headers["Authorization"] = f"Bearer {config.github_token}"
        self.client = client or httpx.AsyncClient(
            base_url="https://api.github.com", headers=headers, timeout=15
        )
        self._owns_client = client is None

    async def get_snapshot(self, username: str) -> GitHubSnapshot:
        profile = await self._request_object(f"/users/{username}")
        repositories = await self._request_list(
            f"/users/{username}/repos",
            params={"per_page": 100, "sort": "updated", "direction": "desc", "type": "owner"},
        )
        events = await self._request_list(
            f"/users/{username}/events/public", params={"per_page": 100}
        )
        return GitHubSnapshot(profile=profile, repositories=repositories, events=events)

    async def _request_object(self, path: str) -> dict[str, Any]:
        payload = await self._request(path)
        if not isinstance(payload, dict):
            raise GitHubApiError(502, "GitHub returned an unexpected response.")
        return payload

    async def _request_list(self, path: str, *, params: dict[str, object]) -> list[dict[str, Any]]:
        payload = await self._request(path, params=params)
        if not isinstance(payload, list):
            raise GitHubApiError(502, "GitHub returned an unexpected response.")
        return [item for item in payload if isinstance(item, dict)]

    async def _request(self, path: str, *, params: dict[str, object] | None = None) -> object:
        try:
            response = await self.client.get(path, params=params)
        except httpx.HTTPError as exc:
            raise GitHubApiError(502, "GitHub is currently unavailable.") from exc
        if response.is_success:
            return response.json()
        message = "GitHub request failed."
        try:
            detail = response.json()
            if isinstance(detail, dict) and isinstance(detail.get("message"), str):
                message = detail["message"]
        except ValueError:
            pass
        rate_limited = (
            response.status_code in {403, 429}
            and response.headers.get("x-ratelimit-remaining") == "0"
        )
        raise GitHubApiError(response.status_code, message, rate_limited=rate_limited)

    async def close(self) -> None:
        if self._owns_client:
            await self.client.aclose()
