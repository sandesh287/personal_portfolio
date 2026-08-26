from datetime import UTC, datetime, timedelta
from typing import Any

from app.core.exceptions import ApiError
from app.core.settings import Settings
from app.features.github.repository import GitHubCacheRepository
from app.features.github.schemas import (
    GitHubActivityFilters,
    GitHubActivityPayload,
    GitHubListFilters,
    GitHubProfilePayload,
    GitHubRepositoryPayload,
    GitHubStatsPayload,
    GitHubSummaryPayload,
    GitHubSyncPayload,
)
from app.features.settings.repository import SettingRepository
from app.integrations.github import GitHubApiError, GitHubClient, GitHubSnapshot
from app.models.github_cache import GitHubCache
from app.schemas.base import PaginatedPayload
from app.utils.pagination import PaginationParams


class GitHubExplorerService:
    def __init__(
        self,
        cache_repository: GitHubCacheRepository,
        setting_repository: SettingRepository,
        client: GitHubClient,
        config: Settings,
    ) -> None:
        self.cache_repository = cache_repository
        self.setting_repository = setting_repository
        self.client = client
        self.config = config

    async def get_summary(self, *, force_refresh: bool = False) -> GitHubSummaryPayload:
        username = self._get_username()
        cache = self.cache_repository.get_by_key(self._cache_key(username))
        if cache and not force_refresh and not self._is_expired(cache):
            return self._summary_from_cache(cache, stale=False)
        try:
            snapshot = await self.client.get_snapshot(username)
        except GitHubApiError as exc:
            if cache:
                return self._summary_from_cache(cache, stale=True)
            if exc.status_code == 404:
                raise ApiError(
                    404, "Configured GitHub profile was not found.", "github_not_found"
                ) from exc
            if exc.rate_limited:
                raise ApiError(429, "GitHub rate limit exceeded.", "github_rate_limited") from exc
            raise ApiError(502, "GitHub data could not be loaded.", "github_unavailable") from exc
        return self._store_snapshot(username, snapshot)

    async def list_repositories(
        self, filters: GitHubListFilters
    ) -> PaginatedPayload[GitHubRepositoryPayload]:
        summary = await self.get_summary()
        cache = self._get_populated_cache(summary.profile.username)
        repositories = [
            GitHubRepositoryPayload.model_validate(item) for item in cache.payload["repositories"]
        ]
        if filters.search:
            term = filters.search.lower().strip()
            repositories = [
                item
                for item in repositories
                if term in item.name.lower() or term in (item.description or "").lower()
            ]
        if filters.language:
            repositories = [
                item
                for item in repositories
                if (item.language or "").lower() == filters.language.lower()
            ]
        sort_fields = {
            "updatedAt": lambda item: item.updated_at,
            "pushedAt": lambda item: item.pushed_at or datetime.min.replace(tzinfo=UTC),
            "stars": lambda item: item.stars,
            "forks": lambda item: item.forks,
            "name": lambda item: item.name.lower(),
        }
        repositories.sort(key=sort_fields[filters.sort.value], reverse=filters.order == "desc")
        return self._paginate(repositories, filters.page, filters.page_size)

    async def list_activity(
        self, filters: GitHubActivityFilters
    ) -> PaginatedPayload[GitHubActivityPayload]:
        summary = await self.get_summary()
        cache = self._get_populated_cache(summary.profile.username)
        activity = [
            GitHubActivityPayload.model_validate(item) for item in cache.payload["activity"]
        ]
        if filters.type:
            activity = [item for item in activity if item.type == filters.type]
        return self._paginate(activity, filters.page, filters.page_size)

    async def sync(self) -> GitHubSyncPayload:
        summary = await self.get_summary(force_refresh=True)
        if summary.stale:
            raise ApiError(
                502,
                "GitHub could not be refreshed; the existing cache remains available.",
                "github_sync_failed",
            )
        return GitHubSyncPayload(synced=True, fetched_at=summary.fetched_at)

    def _get_username(self) -> str:
        setting = self.setting_repository.get_by_key("github_username")
        username = setting.value if setting and isinstance(setting.value, str) else None
        username = username or self.config.github_username
        if not username:
            raise ApiError(404, "GitHub username is not configured.", "github_not_configured")
        return username.strip()

    def _store_snapshot(self, username: str, snapshot: GitHubSnapshot) -> GitHubSummaryPayload:
        now = datetime.now(UTC)
        repositories = [
            self._map_repository(item) for item in snapshot.repositories if not item.get("private")
        ]
        activity = [self._map_activity(item) for item in snapshot.events]
        activity = [item for item in activity if item is not None]
        featured = sorted(
            repositories, key=lambda item: (item["stars"], item["updated_at"]), reverse=True
        )[:6]
        payload = {
            "profile": self._map_profile(snapshot.profile, username),
            "repositories": repositories,
            "featured_repositories": featured,
            "activity": activity,
            "stats": {
                "total_stars": sum(item["stars"] for item in repositories),
                "total_forks": sum(item["forks"] for item in repositories),
                "recent_events": len(activity),
                "recent_commits": sum(self._event_commit_count(item) for item in snapshot.events),
            },
        }
        cache_key = self._cache_key(username)
        cache = self.cache_repository.get_by_key(cache_key)
        if cache is None:
            cache = GitHubCache(cache_key=cache_key, payload=payload)
            self.cache_repository.add(cache)
        else:
            cache.payload = payload
        cache.fetched_at = now
        cache.expires_at = now + timedelta(minutes=self.config.github_cache_ttl_minutes)
        self.cache_repository.db.commit()
        self.cache_repository.db.refresh(cache)
        return self._summary_from_cache(cache, stale=False)

    def _get_populated_cache(self, username: str) -> GitHubCache:
        cache = self.cache_repository.get_by_key(self._cache_key(username))
        if cache is None:
            raise ApiError(502, "GitHub cache is unavailable.", "github_cache_unavailable")
        return cache

    @staticmethod
    def _summary_from_cache(cache: GitHubCache, *, stale: bool) -> GitHubSummaryPayload:
        return GitHubSummaryPayload(
            profile=GitHubProfilePayload.model_validate(cache.payload["profile"]),
            featured_repositories=[
                GitHubRepositoryPayload.model_validate(item)
                for item in cache.payload["featured_repositories"]
            ],
            recent_activity=[
                GitHubActivityPayload.model_validate(item)
                for item in cache.payload["activity"][:10]
            ],
            stats=GitHubStatsPayload.model_validate(cache.payload["stats"]),
            fetched_at=cache.fetched_at,
            stale=stale,
        )

    @staticmethod
    def _map_profile(item: dict[str, Any], username: str) -> dict[str, Any]:
        return {
            "username": str(item.get("login") or username),
            "name": item.get("name"),
            "avatar_url": str(item.get("avatar_url") or ""),
            "profile_url": str(item.get("html_url") or f"https://github.com/{username}"),
            "bio": item.get("bio"),
            "location": item.get("location"),
            "company": item.get("company"),
            "blog_url": item.get("blog") or None,
            "followers": int(item.get("followers") or 0),
            "following": int(item.get("following") or 0),
            "public_repositories": int(item.get("public_repos") or 0),
        }

    @staticmethod
    def _map_repository(item: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": int(item.get("id") or 0),
            "name": str(item.get("name") or "repository"),
            "full_name": str(item.get("full_name") or item.get("name") or "repository"),
            "description": item.get("description"),
            "url": str(item.get("html_url") or ""),
            "homepage_url": item.get("homepage") or None,
            "language": item.get("language"),
            "stars": int(item.get("stargazers_count") or 0),
            "forks": int(item.get("forks_count") or 0),
            "open_issues": int(item.get("open_issues_count") or 0),
            "topics": item.get("topics") if isinstance(item.get("topics"), list) else [],
            "archived": bool(item.get("archived")),
            "fork": bool(item.get("fork")),
            "default_branch": str(item.get("default_branch") or "main"),
            "pushed_at": item.get("pushed_at"),
            "updated_at": item.get("updated_at"),
        }

    @staticmethod
    def _map_activity(item: dict[str, Any]) -> dict[str, Any] | None:
        event_id = item.get("id")
        event_type = item.get("type")
        repo = item.get("repo")
        created_at = item.get("created_at")
        if not event_id or not event_type or not isinstance(repo, dict) or not created_at:
            return None
        repo_name = str(repo.get("name") or "repository")
        payload = item.get("payload") if isinstance(item.get("payload"), dict) else {}
        return {
            "id": str(event_id),
            "type": str(event_type),
            "repository_name": repo_name,
            "repository_url": f"https://github.com/{repo_name}",
            "action": str(payload.get("action") or str(event_type).removesuffix("Event")),
            "summary": GitHubExplorerService._event_summary(event_type, payload),
            "created_at": created_at,
        }

    @staticmethod
    def _event_summary(event_type: object, payload: dict[str, Any]) -> str:
        if event_type == "PushEvent":
            count = GitHubExplorerService._payload_commit_count(payload)
            return f"Pushed {count} commit{'s' if count != 1 else ''}."
        if event_type == "PullRequestEvent":
            return f"{str(payload.get('action') or 'updated').title()} a pull request."
        if event_type == "IssuesEvent":
            return f"{str(payload.get('action') or 'updated').title()} an issue."
        if event_type == "CreateEvent":
            return f"Created {payload.get('ref_type') or 'repository content'}."
        return str(event_type).removesuffix("Event").replace("_", " ")

    @staticmethod
    def _event_commit_count(item: dict[str, Any]) -> int:
        if item.get("type") != "PushEvent":
            return 0
        payload = item.get("payload") if isinstance(item.get("payload"), dict) else {}
        return GitHubExplorerService._payload_commit_count(payload)

    @staticmethod
    def _payload_commit_count(payload: dict[str, Any]) -> int:
        commits = payload.get("commits")
        return len(commits) if isinstance(commits, list) else int(payload.get("size") or 0)

    @staticmethod
    def _paginate(items: list[Any], page: int, page_size: int) -> PaginatedPayload[Any]:
        start = (page - 1) * page_size
        pagination = PaginationParams(page=page, page_size=page_size)
        return PaginatedPayload(
            items=items[start : start + page_size], meta=pagination.build_meta(len(items))
        )

    @staticmethod
    def _cache_key(username: str) -> str:
        return f"github:{username.lower()}:summary"

    @staticmethod
    def _is_expired(cache: GitHubCache) -> bool:
        if cache.expires_at is None:
            return True
        expires_at = cache.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        return expires_at <= datetime.now(UTC)
