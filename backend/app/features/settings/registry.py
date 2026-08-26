from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class SettingDefinition:
    default: Any
    description: str
    is_public: bool = True
    scope: str = "public"


SETTING_DEFINITIONS: dict[str, SettingDefinition] = {
    "site_title": SettingDefinition(
        "Sandesh Developer Workspace", "Browser title and public workspace name."
    ),
    "site_description": SettingDefinition(
        "Personal engineering portfolio.", "Short public site description."
    ),
    "tagline": SettingDefinition(
        "React developer, Flutter developer, and data science student.",
        "Primary public profile tagline.",
    ),
    "profile_name": SettingDefinition("Sandesh Panthee", "Public profile name."),
    "profile_role": SettingDefinition("Software Developer", "Primary professional role."),
    "contact_email": SettingDefinition(None, "Public contact email address."),
    "github_username": SettingDefinition(None, "GitHub account username."),
    "github_url": SettingDefinition(None, "Public GitHub profile URL."),
    "github_profile_visible": SettingDefinition(True, "Show the GitHub profile header."),
    "github_stats_visible": SettingDefinition(True, "Show GitHub aggregate statistics."),
    "github_repositories_visible": SettingDefinition(True, "Show the repository explorer."),
    "github_inspector_visible": SettingDefinition(True, "Show repository details."),
    "github_activity_visible": SettingDefinition(True, "Show recent public GitHub activity."),
    "linkedin_url": SettingDefinition(None, "Public LinkedIn profile URL."),
    "availability_status": SettingDefinition(
        "Available for collaboration", "Public availability message."
    ),
    "timezone": SettingDefinition("Asia/Kathmandu", "Display timezone."),
    "locale": SettingDefinition("en", "Primary content locale."),
    "resume_enabled": SettingDefinition(True, "Whether the public resume is visible."),
    "analytics_enabled": SettingDefinition(False, "Whether analytics collection is enabled."),
    "seo_description": SettingDefinition(
        "Sandesh's software development portfolio and engineering notes.",
        "Search engine description.",
    ),
    "search_engine_indexing": SettingDefinition(True, "Whether search engine indexing is allowed."),
}
