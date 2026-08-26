from uuid import UUID

from app.schemas.base import ApiSchema
from pydantic import ConfigDict, EmailStr, Field, HttpUrl


class SettingsPayload(ApiSchema):
    site_title: str
    site_description: str
    tagline: str
    profile_name: str
    profile_role: str
    profile_image_url: HttpUrl | None
    profile_image_media_id: UUID | None = None
    profile_biography: str
    profile_philosophy: str
    profile_current_focus: str
    profile_location: str
    contact_email: EmailStr | None
    github_username: str | None
    github_url: HttpUrl | None
    github_profile_visible: bool
    github_stats_visible: bool
    github_repositories_visible: bool
    github_inspector_visible: bool
    github_activity_visible: bool
    linkedin_url: HttpUrl | None
    availability_status: str
    timezone: str
    locale: str
    resume_enabled: bool
    navigation_profile_visible: bool
    navigation_projects_visible: bool
    navigation_ai_lab_visible: bool
    navigation_flutter_lab_visible: bool
    navigation_blog_visible: bool
    navigation_github_visible: bool
    navigation_skills_visible: bool
    navigation_experience_visible: bool
    navigation_contact_visible: bool
    analytics_enabled: bool
    home_profile_visible: bool
    home_quick_links_visible: bool
    home_projects_visible: bool
    home_notes_visible: bool
    home_skills_visible: bool
    home_experience_visible: bool
    home_github_visible: bool
    profile_certifications_visible: bool
    seo_description: str
    search_engine_indexing: bool


class SettingsUpdateRequest(ApiSchema):
    model_config = ConfigDict(
        alias_generator=ApiSchema.model_config["alias_generator"],
        populate_by_name=True,
        extra="forbid",
    )

    site_title: str | None = Field(default=None, min_length=2, max_length=160)
    site_description: str | None = Field(default=None, min_length=2, max_length=500)
    tagline: str | None = Field(default=None, min_length=2, max_length=500)
    profile_name: str | None = Field(default=None, min_length=2, max_length=160)
    profile_role: str | None = Field(default=None, min_length=2, max_length=160)
    profile_image_url: HttpUrl | None = None
    profile_image_media_id: UUID | None = None
    profile_biography: str | None = Field(default=None, min_length=20, max_length=4000)
    profile_philosophy: str | None = Field(default=None, min_length=10, max_length=2000)
    profile_current_focus: str | None = Field(default=None, min_length=2, max_length=500)
    profile_location: str | None = Field(default=None, min_length=2, max_length=180)
    contact_email: EmailStr | None = None
    github_username: str | None = Field(default=None, min_length=1, max_length=80)
    github_url: HttpUrl | None = None
    github_profile_visible: bool | None = None
    github_stats_visible: bool | None = None
    github_repositories_visible: bool | None = None
    github_inspector_visible: bool | None = None
    github_activity_visible: bool | None = None
    linkedin_url: HttpUrl | None = None
    availability_status: str | None = Field(default=None, min_length=2, max_length=160)
    timezone: str | None = Field(default=None, min_length=2, max_length=80)
    locale: str | None = Field(default=None, min_length=2, max_length=20)
    resume_enabled: bool | None = None
    navigation_profile_visible: bool | None = None
    navigation_projects_visible: bool | None = None
    navigation_ai_lab_visible: bool | None = None
    navigation_flutter_lab_visible: bool | None = None
    navigation_blog_visible: bool | None = None
    navigation_github_visible: bool | None = None
    navigation_skills_visible: bool | None = None
    navigation_experience_visible: bool | None = None
    navigation_contact_visible: bool | None = None
    analytics_enabled: bool | None = None
    home_profile_visible: bool | None = None
    home_quick_links_visible: bool | None = None
    home_projects_visible: bool | None = None
    home_notes_visible: bool | None = None
    home_skills_visible: bool | None = None
    home_experience_visible: bool | None = None
    home_github_visible: bool | None = None
    profile_certifications_visible: bool | None = None
    seo_description: str | None = Field(default=None, min_length=20, max_length=320)
    search_engine_indexing: bool | None = None
