# PostgreSQL Database Schema

This document defines the planned PostgreSQL schema for the Sandesh Developer Workspace portfolio.
It is a design contract only. Do not create migrations from this document until the related implementation task.

## Global Conventions

All primary application tables use:

- `id UUID PRIMARY KEY`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`
- `deleted_at TIMESTAMPTZ NULL`
- `created_by_id UUID NULL REFERENCES users(id)`
- `updated_by_id UUID NULL REFERENCES users(id)`

Soft delete rule:

- Application deletes set `deleted_at`.
- Read queries exclude rows where `deleted_at IS NOT NULL` unless an admin explicitly requests archived/deleted data.

Naming:

- Table names: snake_case plural
- Column names: snake_case
- API schemas expose camelCase separately

## Text ER Diagram

```txt
users
  1 -- * refresh_tokens
  1 -- * audit_logs

project_categories
  1 -- * projects

projects
  * -- * technologies          via project_technologies
  1 -- * project_images
  1 -- * project_videos
  * -- 1 media_assets          via cover_image_id

project_images
  * -- 1 media_assets

blog_categories
  1 -- * blog_posts

blog_posts
  * -- * blog_tags             via blog_post_tags
  * -- 1 media_assets          via cover_image_id

skills
  * -- 1 technologies          optional technology_id

experiences
  * -- * technologies          via experience_technologies

education

certifications
  * -- 1 media_assets          optional credential_media_id

messages

settings

media_assets
  1 -- * project_images
  1 -- * project_videos

github_cache
```

## Tables

### users

Stores the single admin user now, but supports future role-based access cleanly.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `role` | VARCHAR(50) | NOT NULL, default `admin` |
| `is_active` | BOOLEAN | NOT NULL, default `true` |
| `last_login_at` | TIMESTAMPTZ | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |
| `deleted_at` | TIMESTAMPTZ | NULL |

Indexes:

- `uq_users_email`
- `ix_users_role`
- `ix_users_deleted_at`

### refresh_tokens

Stores hashed refresh tokens for rotation and revocation.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `user_id` | UUID | NOT NULL, FK `users(id)` |
| `token_hash` | VARCHAR(255) | NOT NULL, UNIQUE |
| `expires_at` | TIMESTAMPTZ | NOT NULL |
| `revoked_at` | TIMESTAMPTZ | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |
| `deleted_at` | TIMESTAMPTZ | NULL |

Indexes:

- `ix_refresh_tokens_user_id`
- `uq_refresh_tokens_token_hash`
- `ix_refresh_tokens_expires_at`

### project_categories

Normalizes project grouping for React, Flutter, Data Science, AI Lab, and future categories.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `name` | VARCHAR(120) | NOT NULL |
| `slug` | VARCHAR(140) | NOT NULL, UNIQUE |
| `description` | TEXT | NULL |
| `sort_order` | INTEGER | NOT NULL, default `0` |
| audit columns | mixed | global convention |

Indexes:

- `uq_project_categories_slug`
- `ix_project_categories_sort_order`
- `ix_project_categories_deleted_at`

### technologies

Stores reusable technology labels used by projects, skills, and experience.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `name` | VARCHAR(120) | NOT NULL |
| `slug` | VARCHAR(140) | NOT NULL, UNIQUE |
| `category` | VARCHAR(80) | NOT NULL |
| `icon` | VARCHAR(120) | NULL |
| `color` | VARCHAR(32) | NULL |
| `sort_order` | INTEGER | NOT NULL, default `0` |
| audit columns | mixed | global convention |

Indexes:

- `uq_technologies_slug`
- `ix_technologies_category`
- `ix_technologies_sort_order`

### projects

Main portfolio project entity.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `category_id` | UUID | NULL, FK `project_categories(id)` |
| `cover_image_id` | UUID | NULL, FK `media_assets(id)` |
| `title` | VARCHAR(180) | NOT NULL |
| `slug` | VARCHAR(200) | NOT NULL, UNIQUE |
| `summary` | VARCHAR(500) | NOT NULL |
| `description` | TEXT | NULL |
| `repository_url` | TEXT | NULL |
| `live_url` | TEXT | NULL |
| `case_study_url` | TEXT | NULL |
| `status` | VARCHAR(40) | NOT NULL, default `draft` |
| `featured` | BOOLEAN | NOT NULL, default `false` |
| `sort_order` | INTEGER | NOT NULL, default `0` |
| `published_at` | TIMESTAMPTZ | NULL |
| audit columns | mixed | global convention |

Indexes:

- `uq_projects_slug`
- `ix_projects_category_id`
- `ix_projects_cover_image_id`
- `ix_projects_status`
- `ix_projects_featured`
- `ix_projects_published_at`
- `ix_projects_sort_order`
- GIN index on `title`, `summary`, `description` later for full-text search

### project_technologies

Many-to-many link between projects and technologies.

| Column | Type | Constraints |
| --- | --- | --- |
| `project_id` | UUID | PK, FK `projects(id)` |
| `technology_id` | UUID | PK, FK `technologies(id)` |

Indexes:

- `pk_project_technologies`
- `ix_project_technologies_technology_id`

### project_images

Stores ordered project image galleries.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `project_id` | UUID | NOT NULL, FK `projects(id)` |
| `media_asset_id` | UUID | NOT NULL, FK `media_assets(id)` |
| `caption` | VARCHAR(255) | NULL |
| `sort_order` | INTEGER | NOT NULL, default `0` |
| audit columns | mixed | global convention |

Indexes:

- `ix_project_images_project_id`
- `ix_project_images_media_asset_id`
- `uq_project_images_project_media` on `(project_id, media_asset_id)`
- `ix_project_images_sort_order`

### project_videos

Stores demo videos or external embeds for project detail views.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `project_id` | UUID | NOT NULL, FK `projects(id)` |
| `media_asset_id` | UUID | NULL, FK `media_assets(id)` |
| `provider` | VARCHAR(50) | NOT NULL, default `local` |
| `external_url` | TEXT | NULL |
| `title` | VARCHAR(180) | NULL |
| `caption` | VARCHAR(255) | NULL |
| `sort_order` | INTEGER | NOT NULL, default `0` |
| audit columns | mixed | global convention |

Indexes:

- `ix_project_videos_project_id`
- `ix_project_videos_media_asset_id`
- `ix_project_videos_provider`

### blog_categories

Normalizes top-level Engineering Notes sections.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `name` | VARCHAR(120) | NOT NULL |
| `slug` | VARCHAR(140) | NOT NULL, UNIQUE |
| `description` | TEXT | NULL |
| `sort_order` | INTEGER | NOT NULL, default `0` |
| audit columns | mixed | global convention |

Indexes:

- `uq_blog_categories_slug`
- `ix_blog_categories_sort_order`

### blog_tags

Reusable labels for blog discovery and filtering.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `name` | VARCHAR(80) | NOT NULL |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE |
| `color` | VARCHAR(32) | NULL |
| audit columns | mixed | global convention |

Indexes:

- `uq_blog_tags_slug`

### blog_posts

Technical blog / Engineering Notes content.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `category_id` | UUID | NULL, FK `blog_categories(id)` |
| `cover_image_id` | UUID | NULL, FK `media_assets(id)` |
| `title` | VARCHAR(220) | NOT NULL |
| `slug` | VARCHAR(240) | NOT NULL, UNIQUE |
| `excerpt` | VARCHAR(500) | NOT NULL |
| `content` | TEXT | NOT NULL |
| `status` | VARCHAR(40) | NOT NULL, default `draft` |
| `featured` | BOOLEAN | NOT NULL, default `false` |
| `reading_time_minutes` | INTEGER | NOT NULL, default `1` |
| `seo_title` | VARCHAR(255) | NULL |
| `seo_description` | VARCHAR(500) | NULL |
| `published_at` | TIMESTAMPTZ | NULL |
| audit columns | mixed | global convention |

Indexes:

- `uq_blog_posts_slug`
- `ix_blog_posts_category_id`
- `ix_blog_posts_cover_image_id`
- `ix_blog_posts_status`
- `ix_blog_posts_featured`
- `ix_blog_posts_published_at`
- GIN index on `title`, `excerpt`, `content` later for full-text search

### blog_post_tags

Many-to-many link between posts and tags.

| Column | Type | Constraints |
| --- | --- | --- |
| `blog_post_id` | UUID | PK, FK `blog_posts(id)` |
| `blog_tag_id` | UUID | PK, FK `blog_tags(id)` |

Indexes:

- `pk_blog_post_tags`
- `ix_blog_post_tags_blog_tag_id`

### skills

Stores skill graph nodes independent of projects.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `technology_id` | UUID | NULL, FK `technologies(id)` |
| `name` | VARCHAR(120) | NOT NULL |
| `slug` | VARCHAR(140) | NOT NULL, UNIQUE |
| `category` | VARCHAR(80) | NOT NULL |
| `level` | INTEGER | NOT NULL, check `level BETWEEN 1 AND 5` |
| `icon` | VARCHAR(120) | NULL |
| `color` | VARCHAR(32) | NULL |
| `description` | TEXT | NULL |
| `sort_order` | INTEGER | NOT NULL, default `0` |
| audit columns | mixed | global convention |

Indexes:

- `uq_skills_slug`
- `ix_skills_category`
- `ix_skills_level`
- `ix_skills_technology_id`

### experiences

Professional/work experience entries.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `company` | VARCHAR(180) | NOT NULL |
| `role` | VARCHAR(180) | NOT NULL |
| `location` | VARCHAR(180) | NULL |
| `employment_type` | VARCHAR(80) | NULL |
| `start_date` | DATE | NOT NULL |
| `end_date` | DATE | NULL |
| `current` | BOOLEAN | NOT NULL, default `false` |
| `summary` | TEXT | NULL |
| `highlights` | JSONB | NOT NULL, default `[]` |
| `sort_order` | INTEGER | NOT NULL, default `0` |
| audit columns | mixed | global convention |

Indexes:

- `ix_experiences_current`
- `ix_experiences_start_date`
- `ix_experiences_sort_order`

### experience_technologies

Many-to-many link between experience entries and technologies.

| Column | Type | Constraints |
| --- | --- | --- |
| `experience_id` | UUID | PK, FK `experiences(id)` |
| `technology_id` | UUID | PK, FK `technologies(id)` |

Indexes:

- `pk_experience_technologies`
- `ix_experience_technologies_technology_id`

### education

Education history, including the Data Science student context.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `institution` | VARCHAR(180) | NOT NULL |
| `degree` | VARCHAR(180) | NOT NULL |
| `field_of_study` | VARCHAR(180) | NULL |
| `location` | VARCHAR(180) | NULL |
| `start_date` | DATE | NULL |
| `end_date` | DATE | NULL |
| `current` | BOOLEAN | NOT NULL, default `false` |
| `summary` | TEXT | NULL |
| `sort_order` | INTEGER | NOT NULL, default `0` |
| audit columns | mixed | global convention |

Indexes:

- `ix_education_current`
- `ix_education_sort_order`

### certifications

Certifications, course completions, or credentials.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `credential_media_id` | UUID | NULL, FK `media_assets(id)` |
| `name` | VARCHAR(180) | NOT NULL |
| `issuer` | VARCHAR(180) | NOT NULL |
| `credential_id` | VARCHAR(180) | NULL |
| `credential_url` | TEXT | NULL |
| `issued_at` | DATE | NULL |
| `expires_at` | DATE | NULL |
| `sort_order` | INTEGER | NOT NULL, default `0` |
| audit columns | mixed | global convention |

Indexes:

- `ix_certifications_issuer`
- `ix_certifications_issued_at`
- `ix_certifications_credential_media_id`

### messages

Contact form and Communication Terminal submissions.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `name` | VARCHAR(160) | NOT NULL |
| `email` | VARCHAR(255) | NOT NULL |
| `subject` | VARCHAR(255) | NOT NULL |
| `message` | TEXT | NOT NULL |
| `source` | VARCHAR(80) | NOT NULL |
| `read` | BOOLEAN | NOT NULL, default `false` |
| `starred` | BOOLEAN | NOT NULL, default `false` |
| `archived` | BOOLEAN | NOT NULL, default `false` |
| `visitor_id` | VARCHAR(64) | NULL; random first-party identifier |
| audit columns | mixed | global convention |

Indexes:

- `ix_messages_email`
- `ix_messages_read`
- `ix_messages_archived`
- `ix_messages_starred`
- `ix_messages_created_at`

### media_assets

Central media library for uploads, project assets, blog covers, resume files, and certificates.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `filename` | VARCHAR(255) | NOT NULL |
| `original_filename` | VARCHAR(255) | NOT NULL |
| `storage_path` | TEXT | NOT NULL |
| `public_url` | TEXT | NULL |
| `content_type` | VARCHAR(120) | NOT NULL |
| `size_bytes` | INTEGER | NOT NULL |
| `alt_text` | VARCHAR(255) | NULL |
| `folder` | VARCHAR(120) | NULL |
| audit columns | mixed | global convention |

Indexes:

- `ix_media_assets_content_type`
- `ix_media_assets_folder`
- `ix_media_assets_created_at`

### resume_versions

Resume management needs version history rather than replacing a single media row.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `media_asset_id` | UUID | NOT NULL, FK `media_assets(id)` |
| `title` | VARCHAR(160) | NOT NULL |
| `version` | VARCHAR(40) | NOT NULL |
| `is_active` | BOOLEAN | NOT NULL, default `false` |
| `download_count` | INTEGER | NOT NULL, default `0` |
| `notes` | TEXT | NULL |
| audit columns | mixed | global convention |

Indexes:

- `ix_resume_versions_media_asset_id`
- `ix_resume_versions_is_active`
- Partial unique index: only one active resume where `is_active = true AND deleted_at IS NULL`

### settings

Typed key-value settings for public site and admin preferences.

Application code maintains an allowlisted, typed registry and merges defaults for keys that have
not yet been persisted. This keeps fresh installations usable without a seed migration.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `key` | VARCHAR(120) | NOT NULL, UNIQUE |
| `value` | JSONB | NOT NULL |
| `scope` | VARCHAR(50) | NOT NULL, default `public` |
| `description` | TEXT | NULL |
| `is_public` | BOOLEAN | NOT NULL, default `false` |
| audit columns | mixed | global convention |

Indexes:

- `uq_settings_key`
- `ix_settings_scope`
- `ix_settings_is_public`

### audit_logs

Immutable admin action history.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `actor_id` | UUID | NULL, FK `users(id)` |
| `action` | VARCHAR(100) | NOT NULL |
| `entity_type` | VARCHAR(100) | NOT NULL |
| `entity_id` | UUID | NULL |
| `metadata_json` | JSONB | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Indexes:

- `ix_audit_logs_actor_id`
- `ix_audit_logs_entity_type_entity_id`
- `ix_audit_logs_created_at`

Note: audit logs should not use soft delete.

### github_cache

Optional cache for GitHub Explorer responses and rate-limit protection.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `cache_key` | VARCHAR(255) | NOT NULL, UNIQUE |
| `payload` | JSONB | NOT NULL |
| `etag` | VARCHAR(255) | NULL |
| `expires_at` | TIMESTAMPTZ | NULL |
| `fetched_at` | TIMESTAMPTZ | NOT NULL |
| audit columns | mixed | global convention |

Indexes:

- `uq_github_cache_cache_key`
- `ix_github_cache_expires_at`
- `ix_github_cache_fetched_at`

### analytics_events

Included because the API contract includes Analytics and the admin dashboard references visitor, GitHub, resume, and blog metrics.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | PK |
| `event_name` | VARCHAR(120) | NOT NULL |
| `path` | TEXT | NULL |
| `metadata_json` | JSONB | NOT NULL, default `{}` |
| `ip_address` | INET | NULL |
| `user_agent` | TEXT | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Indexes:

- `ix_analytics_events_event_name`
- `ix_analytics_events_created_at`
- `ix_analytics_events_path`

Note: analytics events should not be soft deleted.

## Relationship Rationale

- `users -> refresh_tokens`: one admin can have multiple active sessions across devices.
- `users -> audit_logs`: admin actions need traceability.
- `project_categories -> projects`: categories power Project Explorer filtering without duplicating category strings.
- `projects -> technologies`: projects use many technologies, and technologies appear across many projects.
- `projects -> project_images`: galleries need ordering, captions, and independent media metadata.
- `projects -> project_videos`: video demos can be local uploads or external embeds, so they are separate from images.
- `media_assets -> project_images/project_videos/blog_posts/resume_versions/certifications`: one media library supports all upload use cases.
- `blog_categories -> blog_posts`: Engineering Notes need high-level grouping.
- `blog_posts -> blog_tags`: tags are many-to-many for flexible filtering and search.
- `skills -> technologies`: a skill can map to a canonical technology while still allowing custom skill-only entries.
- `experiences -> technologies`: each role may involve multiple technologies, and those technologies are reusable.
- `resume_versions -> media_assets`: resume files need version metadata, active state, and download counts.
- `settings`: key-value settings avoid schema churn for configurable site preferences.
- `github_cache`: cached JSON allows GitHub Explorer to remain fast and avoid API rate-limit pressure.
- `analytics_events`: append-only events support dashboard charts without coupling analytics to every feature table.

## Recommended PostgreSQL Constraints

- Check `status IN ('draft', 'published', 'archived')` for projects and blog posts.
- Check `skills.level BETWEEN 1 AND 5`.
- Check `settings.scope IN ('public', 'admin', 'system')`.
- Check `project_videos.provider IN ('local', 'youtube', 'vimeo', 'loom', 'external')`.
- Check `messages.source IN ('contact_form', 'communication_terminal', 'admin_test')`.
- Partial unique index for active resume:

```sql
CREATE UNIQUE INDEX uq_resume_versions_one_active
ON resume_versions (is_active)
WHERE is_active = true AND deleted_at IS NULL;
```

## Search Strategy

Phase 1:

- Use `ILIKE` on indexed filters and sorted columns.

Phase 2:

- Add PostgreSQL full-text `tsvector` indexes for:
  - `projects(title, summary, description)`
  - `blog_posts(title, excerpt, content)`
  - `messages(name, email, subject, message)`

## Deletion Strategy

- Soft delete admin-managed content.
- Hard delete join table rows when relationships are removed.
- Audit logs and analytics events are append-only.
- Media deletion should remove the database row and enqueue physical storage cleanup after dependency checks.
