from datetime import datetime
from enum import StrEnum

from app.schemas.base import ApiSchema
from pydantic import Field


class GitHubProfilePayload(ApiSchema):
    username: str
    name: str | None
    avatar_url: str
    profile_url: str
    bio: str | None
    location: str | None
    company: str | None
    blog_url: str | None
    followers: int
    following: int
    public_repositories: int


class GitHubRepositoryPayload(ApiSchema):
    id: int
    name: str
    full_name: str
    description: str | None
    url: str
    homepage_url: str | None
    language: str | None
    stars: int
    forks: int
    open_issues: int
    topics: list[str]
    archived: bool
    fork: bool
    default_branch: str
    pushed_at: datetime | None
    updated_at: datetime


class GitHubActivityPayload(ApiSchema):
    id: str
    type: str
    repository_name: str
    repository_url: str
    action: str
    summary: str
    created_at: datetime


class GitHubStatsPayload(ApiSchema):
    total_stars: int
    total_forks: int
    recent_events: int
    recent_commits: int


class GitHubSummaryPayload(ApiSchema):
    profile: GitHubProfilePayload
    featured_repositories: list[GitHubRepositoryPayload]
    recent_activity: list[GitHubActivityPayload]
    stats: GitHubStatsPayload
    fetched_at: datetime
    stale: bool = False


class GitHubRepositorySort(StrEnum):
    UPDATED_AT = "updatedAt"
    PUSHED_AT = "pushedAt"
    STARS = "stars"
    FORKS = "forks"
    NAME = "name"


class GitHubListFilters(ApiSchema):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    search: str | None = Field(default=None, max_length=255)
    language: str | None = Field(default=None, max_length=80)
    sort: GitHubRepositorySort = GitHubRepositorySort.UPDATED_AT
    order: str = Field(default="desc", pattern="^(asc|desc)$")


class GitHubActivityFilters(ApiSchema):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    type: str | None = Field(default=None, max_length=80)


class GitHubSyncPayload(ApiSchema):
    synced: bool
    fetched_at: datetime
