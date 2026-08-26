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
    "profile_image_url": SettingDefinition(
        None, "Public profile image selected from Media Library."
    ),
    "profile_image_media_id": SettingDefinition(
        None,
        "Media Library identifier for the public profile image.",
        is_public=False,
        scope="admin",
    ),
    "profile_biography": SettingDefinition(
        "I build thoughtful web and mobile products with React, Flutter, and Python.",
        "Long-form public profile introduction.",
    ),
    "profile_philosophy": SettingDefinition(
        "Build reliable systems, keep interfaces clear, and leave the code easier to understand.",
        "Public development philosophy.",
    ),
    "profile_current_focus": SettingDefinition(
        "Production-ready web and mobile experiences.", "Current professional focus."
    ),
    "profile_location": SettingDefinition("Nepal", "Public profile location."),
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
    "home_profile_visible": SettingDefinition(True, "Show the homepage profile workspace."),
    "home_quick_links_visible": SettingDefinition(True, "Show homepage workspace shortcuts."),
    "home_projects_visible": SettingDefinition(True, "Show featured projects on the homepage."),
    "home_notes_visible": SettingDefinition(True, "Show engineering notes on the homepage."),
    "home_skills_visible": SettingDefinition(True, "Show the skills summary on the homepage."),
    "home_experience_visible": SettingDefinition(True, "Show current experience on the homepage."),
    "home_github_visible": SettingDefinition(True, "Show GitHub activity on the homepage."),
    "profile_certifications_visible": SettingDefinition(
        True, "Show published certifications on the public profile."
    ),
    "seo_description": SettingDefinition(
        "Sandesh's software development portfolio and engineering notes.",
        "Search engine description.",
    ),
    "search_engine_indexing": SettingDefinition(True, "Whether search engine indexing is allowed."),
}
