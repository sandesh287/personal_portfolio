# API Contract

This document defines the REST API contract for the Sandesh Developer Workspace portfolio.
It is implementation guidance only. Do not add feature behavior until the related feature task begins.

## Base Contract

- Base URL: `/api/v1`
- Format: JSON
- Auth scheme: `Authorization: Bearer <access_token>`
- Timestamps: ISO 8601 UTC strings
- IDs: UUID strings
- Slugs: lowercase URL-safe strings

## Standard Response Shape

Success:

```json
{
  "success": true,
  "data": {},
  "message": null,
  "errors": []
}
```

Error:

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed.",
  "errors": [
    {
      "code": "validation_error",
      "message": "Title is required.",
      "field": "title"
    }
  ]
}
```

Paginated data:

```json
{
  "items": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## Common Query Parameters

- `page`: number, default `1`
- `pageSize`: number, default `20`, max `100`
- `search`: string
- `sort`: string field name
- `order`: `asc | desc`
- `status`: resource-specific status
- `featured`: boolean
- `categoryId`: UUID
- `technologyId`: UUID

## Common Status Codes

- `200 OK`: read/update/delete success
- `201 Created`: create success
- `204 No Content`: reserved; avoid for API consistency unless explicitly needed
- `400 Bad Request`: invalid request semantics
- `401 Unauthorized`: missing/invalid token
- `403 Forbidden`: valid token without required role
- `404 Not Found`: resource not found
- `409 Conflict`: duplicate slug/email/key
- `413 Payload Too Large`: upload exceeds its type-specific configured limit. Defaults are
  10 MiB for images, 100 MiB for videos, and 20 MiB for PDF documents; deployments can
  override these with `MAX_IMAGE_UPLOAD_SIZE_MB`, `MAX_VIDEO_UPLOAD_SIZE_MB`, and
  `MAX_DOCUMENT_UPLOAD_SIZE_MB`.
- `422 Unprocessable Entity`: validation error
- `429 Too Many Requests`: rate limited
- `500 Internal Server Error`: unexpected server error

## Shared Schemas

### User

```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "role": "admin",
  "isActive": true
}
```

### MediaAsset

```json
{
  "id": "uuid",
  "filename": "cover.png",
  "originalFilename": "cover.png",
  "publicUrl": "/uploads/cover.png",
  "contentType": "image/png",
  "sizeBytes": 123456,
  "imageWidth": 1600,
  "imageHeight": 900,
  "placeholderUrl": "https://res.cloudinary.com/example/image/upload/c_limit,w_32/e_blur:1000/f_auto/q_auto:low/cover.png",
  "altText": "Project cover",
  "createdAt": "2026-08-04T00:00:00Z",
  "updatedAt": "2026-08-04T00:00:00Z"
}
```

### Project

```json
{
  "id": "uuid",
  "title": "Project title",
  "slug": "project-title",
  "summary": "Short summary",
  "description": "Long content",
  "category": {},
  "technologies": [],
  "coverImage": null,
  "gallery": [],
  "repositoryUrl": null,
  "liveUrl": null,
  "caseStudyUrl": null,
  "status": "published",
  "featured": false,
  "sortOrder": 0,
  "publishedAt": null,
  "createdAt": "2026-08-04T00:00:00Z",
  "updatedAt": "2026-08-04T00:00:00Z"
}
```

## Authentication

### Login

- Method: `POST`
- URL: `/api/v1/auth/login`
- Authorization: public
- Request body:

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

- Response `200`:

```json
{
  "accessToken": "jwt",
  "tokenType": "bearer",
  "expiresIn": 3600,
  "user": {}
}
```

- Errors: `401`, `422`, `429`
- Side effect: sets a 90-day `HttpOnly` refresh cookie scoped to `/api/v1/auth`. The refresh token is never returned in JSON.

### Refresh Token

- Method: `POST`
- URL: `/api/v1/auth/refresh`
- Authorization: public, requires the refresh cookie
- Refresh tokens remain valid for 90 days, rotate on every successful refresh, and can be revoked by logout. Access tokens remain valid for 60 minutes.
- Request body: none

- Response `200`: same token schema as login
- Side effect: rotates the `HttpOnly` refresh cookie
- Errors: `401`, `403`, `429`

### Logout

- Method: `POST`
- URL: `/api/v1/auth/logout`
- Authorization: refresh cookie when present; an access token is not required
- Request body: none

- Response `200`: `{ "loggedOut": true }`
- Side effect: revokes the server-side refresh token and clears the cookie
- Errors: `403`, `429`

### Current User

- Method: `GET`
- URL: `/api/v1/auth/me`
- Authorization: admin
- Response `200`: `User`
- Errors: `401`, `403`

## Projects

### List Projects

- Method: `GET`
- URL: `/api/v1/projects`
- Authorization: public
- Query: `page`, `pageSize`, `search`, `categoryId`, `technologyId`, `featured`, `status=published`, `sort`, `order`
- Response `200`: paginated `Project[]`
- Errors: `422`, `429`

### Featured Projects

- Method: `GET`
- URL: `/api/v1/projects/featured`
- Authorization: public
- Query: `limit`, default `6`
- Response `200`: `Project[]`
- Errors: `422`, `429`

### Project Details

- Method: `GET`
- URL: `/api/v1/projects/{slug}`
- Authorization: public
- Path: `slug`
- Response `200`: `Project`
- Errors: `404`, `429`

### Admin List Projects

- Method: `GET`
- URL: `/api/v1/projects/admin`
- Authorization: admin
- Query: `page`, `pageSize`, `search`, `categoryId`, `technologyId`, `featured`, `status`, `sort`, `order`
- Response `200`: paginated `Project[]`
- Errors: `401`, `403`, `422`, `429`

### Create Project

- Method: `POST`
- URL: `/api/v1/projects`
- Authorization: admin
- Request body:

```json
{
  "title": "Project title",
  "slug": "project-title",
  "summary": "Short summary",
  "description": "Long content",
  "categoryId": "uuid",
  "technologyIds": ["uuid"],
  "coverImageId": "uuid",
  "galleryImageIds": ["uuid"],
  "repositoryUrl": null,
  "liveUrl": null,
  "caseStudyUrl": null,
  "status": "draft",
  "featured": false,
  "sortOrder": 0
}
```

- Response `201`: `Project`
- Errors: `401`, `403`, `409`, `422`

### Update Project

- Method: `PATCH`
- URL: `/api/v1/projects/{id}`
- Authorization: admin
- Path: `id`
- Request body: partial create body
- Response `200`: `Project`
- Errors: `401`, `403`, `404`, `409`, `422`

### Delete Project

- Method: `DELETE`
- URL: `/api/v1/projects/{id}`
- Authorization: admin
- Path: `id`
- Response `200`: `{ "deleted": true }`
- Errors: `401`, `403`, `404`

### Project Images

| Method   | URL                                      | Auth  | Purpose                      |
| -------- | ---------------------------------------- | ----- | ---------------------------- |
| `GET`    | `/api/v1/projects/{id}/images`           | admin | List project images          |
| `POST`   | `/api/v1/projects/{id}/images`           | admin | Upload project image         |
| `POST`   | `/api/v1/projects/{id}/images/attach`    | admin | Attach a Media Library image |
| `PATCH`  | `/api/v1/projects/{id}/images/{imageId}` | admin | Update image metadata        |
| `PATCH`  | `/api/v1/projects/{id}/images/reorder`   | admin | Bulk reorder project images  |
| `PATCH`  | `/api/v1/projects/{id}/cover-image`      | admin | Set or clear cover image     |
| `DELETE` | `/api/v1/projects/{id}/images/{imageId}` | admin | Delete project image         |

- Upload body: `multipart/form-data` with `file`, `caption`, `sortOrder`
- Attach body: `{ "mediaAssetId": "uuid", "caption": "optional", "sortOrder": 0 }`
- Update body: `{ "caption": "string or null", "sortOrder": 0 }` (all fields optional)
- Reorder body: `{ "items": [{ "id": "uuid", "sortOrder": 0 }] }` — must include every active project image with unique contiguous positions starting at zero
- Cover body: `{ "imageId": "uuid" }`; use `null` to clear
- Responses: `ProjectImage`, `ProjectImage[]`, `Project`, or `{ "deleted": true }`
- `ProjectImage` includes nullable `imageWidth`, `imageHeight`, and `placeholderUrl` fields. Cloudinary image uploads populate these values; legacy and local assets may return `null`.
- Errors: `401`, `403`, `404`, `409`, `413`, `422`

### Project Videos

| Method   | URL                                      | Auth  | Purpose                      |
| -------- | ---------------------------------------- | ----- | ---------------------------- |
| `GET`    | `/api/v1/projects/{id}/videos`           | admin | List project videos          |
| `POST`   | `/api/v1/projects/{id}/videos/attach`    | admin | Attach a Media Library video |
| `POST`   | `/api/v1/projects/{id}/videos/external`  | admin | Add a YouTube or Vimeo video |
| `PATCH`  | `/api/v1/projects/{id}/videos/{videoId}` | admin | Update video metadata        |
| `PATCH`  | `/api/v1/projects/{id}/videos/reorder`   | admin | Bulk reorder project videos  |
| `DELETE` | `/api/v1/projects/{id}/videos/{videoId}` | admin | Remove a project video       |

- Attach body: `mediaAssetId`, optional `title`, `caption`, `sortOrder`
- External body: `externalUrl`, optional `title`, `caption`, `sortOrder`
- Update body: optional `title`, `caption`, `sortOrder`
- Reorder body: `{ "items": [{ "id": "uuid", "sortOrder": 0 }] }` — must include every active project video with unique contiguous positions starting at zero
- Supported external providers: YouTube and Vimeo
- Removing a project video does not delete its Media Library asset
- Errors: `401`, `403`, `404`, `409`, `422`

## Project Categories

- Model fields: `id`, `name`, `slug`, `description`, `sortOrder`, `createdAt`, `updatedAt`

### List Project Categories

- Method: `GET`
- URL: `/api/v1/projects/categories`
- Authorization: public
- Query: none
- Response `200`: `ProjectCategory[]`
- Errors: `429`

Future admin CRUD endpoints:

| Method   | URL                                | Auth  | Purpose         |
| -------- | ---------------------------------- | ----- | --------------- |
| `POST`   | `/api/v1/projects/categories`      | admin | Create category |
| `PATCH`  | `/api/v1/projects/categories/{id}` | admin | Update category |
| `DELETE` | `/api/v1/projects/categories/{id}` | admin | Delete category |

- Create/update body: `name`, `slug`, `description`, `sortOrder`
- Errors: `401`, `403`, `404`, `409`, `422`

## Technologies

- Model fields: `id`, `name`, `slug`, `category`, `icon`, `color`, `sortOrder`

### List Technologies

- Method: `GET`
- URL: `/api/v1/projects/technologies`
- Authorization: public
- Query: `category`
- Response `200`: `Technology[]`
- Errors: `422`, `429`

Future admin CRUD endpoints:

| Method   | URL                                  | Auth  | Purpose           |
| -------- | ------------------------------------ | ----- | ----------------- |
| `POST`   | `/api/v1/projects/technologies`      | admin | Create technology |
| `PATCH`  | `/api/v1/projects/technologies/{id}` | admin | Update technology |
| `DELETE` | `/api/v1/projects/technologies/{id}` | admin | Delete technology |

- Create/update body: `name`, `slug`, `category`, `icon`, `color`, `sortOrder`
- Errors: `401`, `403`, `404`, `409`, `422`

## Blog / Engineering Notes

- Base URL: `/api/v1/blog`
- Summary fields: `id`, `title`, `slug`, `excerpt`, `category`, `tags`, `coverImage`, `status`, `featured`, `readingTimeMinutes`, `publishedAt`, `createdAt`, `updatedAt`
- Detail fields: all summary fields plus `content`, `seoTitle`, and `seoDescription`

| Method   | URL                       | Auth   | Purpose                             |
| -------- | ------------------------- | ------ | ----------------------------------- |
| `GET`    | `/api/v1/blog`            | public | Paginated published post summaries  |
| `GET`    | `/api/v1/blog/featured`   | public | Featured published post summaries   |
| `GET`    | `/api/v1/blog/{slug}`     | public | Published post detail               |
| `GET`    | `/api/v1/blog/admin`      | admin  | Paginated posts across all statuses |
| `GET`    | `/api/v1/blog/admin/{id}` | admin  | Post detail across all statuses     |
| `POST`   | `/api/v1/blog`            | admin  | Create post                         |
| `PATCH`  | `/api/v1/blog/admin/{id}` | admin  | Update post                         |
| `DELETE` | `/api/v1/blog/admin/{id}` | admin  | Soft-delete post                    |

- Public list query: `page`, `pageSize`, `search`, `category`, `tag`, `featured`, `sort`, `order`
- Admin list additionally accepts `status`
- `category` and `tag` filters use taxonomy slugs
- Sort fields: `title`, `createdAt`, `updatedAt`, `publishedAt`
- Create/update body: `title`, `slug`, `excerpt`, `content`, `categoryId`, `coverImageId`, `tagIds`, `status`, `featured`, `readingTimeMinutes`, `seoTitle`, `seoDescription`, `publishedAt`
- Publishing without `publishedAt` assigns the current UTC timestamp
- Cover images must reference active image assets from the Media Library
- List responses omit full `content`; detail responses include it
- Errors: `401`, `403`, `404`, `409`, `422`, `429`

## Blog Categories

| Method   | URL                            | Auth   | Purpose                     |
| -------- | ------------------------------ | ------ | --------------------------- |
| `GET`    | `/api/v1/blog/categories`      | public | Ordered active categories   |
| `POST`   | `/api/v1/blog/categories`      | admin  | Create category             |
| `PATCH`  | `/api/v1/blog/categories/{id}` | admin  | Update category             |
| `DELETE` | `/api/v1/blog/categories/{id}` | admin  | Soft-delete unused category |

- Create/update body: `name`, `slug`, `description`, `sortOrder`
- Assigned categories cannot be deleted
- Errors: `401`, `403`, `404`, `409`, `422`, `429`

## Blog Tags

| Method   | URL                      | Auth   | Purpose                |
| -------- | ------------------------ | ------ | ---------------------- |
| `GET`    | `/api/v1/blog/tags`      | public | List active tags       |
| `POST`   | `/api/v1/blog/tags`      | admin  | Create tag             |
| `PATCH`  | `/api/v1/blog/tags/{id}` | admin  | Update tag             |
| `DELETE` | `/api/v1/blog/tags/{id}` | admin  | Soft-delete unused tag |

- Create/update body: `name`, `slug`, `color`
- Assigned tags cannot be deleted
- Errors: `401`, `403`, `404`, `409`, `422`, `429`

## Skills

- Model fields: `id`, `technologyId`, `name`, `slug`, `category`, `level`, `icon`, `color`,
  `description`, `sortOrder`

| Method   | URL                      | Auth   | Purpose           |
| -------- | ------------------------ | ------ | ----------------- |
| `GET`    | `/api/v1/skills`         | public | List skills       |
| `GET`    | `/api/v1/skills/grouped` | public | Group by category |
| `POST`   | `/api/v1/skills`         | admin  | Create skill      |
| `PATCH`  | `/api/v1/skills/{id}`    | admin  | Update skill      |
| `DELETE` | `/api/v1/skills/{id}`    | admin  | Delete skill      |

- List query: `page`, `pageSize`, `search`, `category`, `level`, `sort`, `order`
- Grouped response: an object keyed by category with ordered skill arrays.
- Create/update body: `technologyId`, `name`, `slug`, `category`, `level`, `icon`, `color`,
  `description`, `sortOrder`
- Slugs remain reserved after soft deletion. Optional `technologyId` must reference an active
  Technology record.
- Errors: `401`, `403`, `404`, `409`, `422`, `429`

## Experience And Education

- Experience fields: `id`, `company`, `role`, `employmentType`, `location`, `startDate`,
  `endDate`, `current`, `summary`, `achievements`, `technologies`, `companyUrl`, `sortOrder`,
  `published`, `createdAt`, `updatedAt`
- Education fields: `id`, `institution`, `degree`, `fieldOfStudy`, `location`, `startDate`,
  `endDate`, `current`, `description`, `achievements`, `institutionUrl`, `sortOrder`,
  `published`, `createdAt`, `updatedAt`

### Certifications

| Method   | URL                                            | Authorization | Purpose                       |
| -------- | ---------------------------------------------- | ------------- | ----------------------------- |
| `GET`    | `/api/v1/experience/certifications`            | public        | List published certifications |
| `GET`    | `/api/v1/experience/admin/certifications`      | admin         | List all certifications       |
| `POST`   | `/api/v1/experience/admin/certifications`      | admin         | Create certification          |
| `PATCH`  | `/api/v1/experience/admin/certifications/{id}` | admin         | Update certification          |
| `DELETE` | `/api/v1/experience/admin/certifications/{id}` | admin         | Soft delete certification     |

Certification fields are `id`, `name`, `issuer`, `credentialId`, `credentialUrl`,
`credentialMediaId`, `credentialMediaUrl`, `issuedAt`, `expiresAt`, `sortOrder`, `published`,
`createdAt`, and `updatedAt`. Credential media must reference an active Media Library asset.
Expiration dates cannot precede issue dates.

| Method   | URL                                       | Auth   | Purpose                   |
| -------- | ----------------------------------------- | ------ | ------------------------- |
| `GET`    | `/api/v1/experience`                      | public | List published experience |
| `GET`    | `/api/v1/experience/education`            | public | List published education  |
| `GET`    | `/api/v1/experience/admin`                | admin  | List all experience       |
| `POST`   | `/api/v1/experience/admin`                | admin  | Create experience         |
| `PATCH`  | `/api/v1/experience/admin/{id}`           | admin  | Update experience         |
| `DELETE` | `/api/v1/experience/admin/{id}`           | admin  | Soft-delete experience    |
| `GET`    | `/api/v1/experience/admin/education`      | admin  | List all education        |
| `POST`   | `/api/v1/experience/admin/education`      | admin  | Create education          |
| `PATCH`  | `/api/v1/experience/admin/education/{id}` | admin  | Update education          |
| `DELETE` | `/api/v1/experience/admin/education/{id}` | admin  | Soft-delete education     |

- List query: optional `search`
- Arrays preserve display order and reject blank or duplicate values.
- `current=true` requires `endDate=null`; `endDate` cannot precede `startDate`.
- Public endpoints return only records with `published=true`.
- Errors: `401`, `403`, `404`, `422`, `429`

## Resume

### Active Resume

- Method: `GET`
- URL: `/api/v1/resume`
- Authorization: public
- Response `200`: active resume metadata and download URL
- Errors: `404`, `429`

### Download Resume

- Method: `GET`
- URL: `/api/v1/resume/download`
- Authorization: public
- Response `307`: redirect to the active file in the configured storage provider; increments the download count
- Errors: `404`, `429`

### Resume Versions

| Method   | URL                                     | Auth  | Purpose                         |
| -------- | --------------------------------------- | ----- | ------------------------------- |
| `GET`    | `/api/v1/resume/versions`               | admin | List versions                   |
| `POST`   | `/api/v1/resume/versions`               | admin | Upload new version              |
| `PATCH`  | `/api/v1/resume/versions/{id}`          | admin | Update title, version, or notes |
| `POST`   | `/api/v1/resume/versions/{id}/activate` | admin | Make a version active           |
| `DELETE` | `/api/v1/resume/versions/{id}`          | admin | Delete version                  |

- Upload body: `multipart/form-data` with PDF `file`, `title`, `version`, optional `notes`, and `isActive`
- The first uploaded version becomes active automatically. The active version must be replaced before deletion.
- Errors: `401`, `403`, `404`, `409`, `413`, `422`

## Media Library

**Implemented** - Admin media library foundation with upload, search, and management.

| Method   | URL                  | Auth  | Purpose                  |
| -------- | -------------------- | ----- | ------------------------ |
| `GET`    | `/api/v1/media`      | admin | List media assets        |
| `GET`    | `/api/v1/media/{id}` | admin | Media details            |
| `POST`   | `/api/v1/media`      | admin | Upload media             |
| `PATCH`  | `/api/v1/media/{id}` | admin | Update alt text/metadata |
| `DELETE` | `/api/v1/media/{id}` | admin | Delete media             |

- List query: `page`, `pageSize`, `search`, `contentType`, `folder`, `sort`, `order`
- Sort values: `created_at`, `original_filename`, `size_bytes`; order: `asc`, `desc`
- Upload body: `multipart/form-data` with `file`, optional `altText`, optional `folder`
- Update body: optional `altText`, optional `folder`
- Response: `MediaAsset`
- Errors: `401`, `403`, `404`, `409` when referenced, `413`, `422`
- Supported file types: images, videos, PDFs
- Max file size: 10MB

## Messages / Communication Terminal

### Create Message

- Method: `POST`
- URL: `/api/v1/messages`
- Authorization: public
- Request body:

```json
{
  "name": "Visitor",
  "email": "visitor@example.com",
  "subject": "Project inquiry",
  "message": "Hello",
  "source": "communication_terminal",
  "website": ""
}
```

- Response `201`: message receipt `{ "id": "uuid", "received": true }`
- `website` is an invisible honeypot field and must remain empty for human submissions.
- Spam controls: content validation, URL-density checks, duplicate suppression, and a persistent
  per-IP submission window.
- Errors: `422`, `429`

### Admin Messages

| Method   | URL                     | Auth  | Purpose                   |
| -------- | ----------------------- | ----- | ------------------------- |
| `GET`    | `/api/v1/messages`      | admin | List messages             |
| `GET`    | `/api/v1/messages/{id}` | admin | Message details           |
| `PATCH`  | `/api/v1/messages/{id}` | admin | Mark read/archive/starred |
| `DELETE` | `/api/v1/messages/{id}` | admin | Delete message            |

- List query: `page`, `pageSize`, `search`, `read`, `archived`, `starred`, `sort`, `order`
- Update body: `read`, `archived`, `starred`
- Errors: `401`, `403`, `404`, `422`

## Settings

### Public Settings

- Method: `GET`
- URL: `/api/v1/settings/public`
- Authorization: public
- Response `200`: public site settings
- Errors: `429`

### Admin Settings

| Method  | URL                | Auth  | Purpose              |
| ------- | ------------------ | ----- | -------------------- |
| `GET`   | `/api/v1/settings` | admin | List settings        |
| `PATCH` | `/api/v1/settings` | admin | Bulk update settings |

- Update body:

```json
{
  "siteTitle": "Sandesh Developer Workspace",
  "siteDescription": "Portfolio",
  "githubUsername": "sandesh",
  "contactEmail": "sandesh@example.com",
  "resumeEnabled": true,
  "analyticsEnabled": true
}
```

- Errors: `401`, `403`, `422`

Settings are validated against a server-side registry. Public settings include site identity,
profile details, social links, availability, feature flags, localization, and SEO preferences.
Secrets such as GitHub tokens, SMTP credentials, and API keys remain environment variables and are
never accepted by this API.

## GitHub Integration

### Public GitHub Summary

- Method: `GET`
- URL: `/api/v1/github/summary`
- Authorization: public
- Response `200`: profile, featured public repositories, aggregate repository statistics, recent public events, cache timestamp, and stale status
- Errors: `404`, `429`, `502`

### GitHub Repositories

- Method: `GET`
- URL: `/api/v1/github/repositories`
- Authorization: public
- Query: `page`, `pageSize`, `search`, `language`, `sort`, `order`
- Response `200`: paginated repositories
- Errors: `429`, `502`

### GitHub Activity

- Method: `GET`
- URL: `/api/v1/github/activity`
- Authorization: public
- Query: `page`, `pageSize`, `type`
- Response `200`: paginated activity events
- Errors: `429`, `502`

### Admin Refresh GitHub Cache

- Method: `POST`
- URL: `/api/v1/github/sync`
- Authorization: admin
- Response `200`: `{ "synced": true, "fetchedAt": "datetime" }`
- Errors: `401`, `403`, `429`, `502`

Public requests use the configured cache TTL and never force upstream GitHub traffic. Admin sync
refreshes profile, owned public repositories, and public events immediately. Expired cache data is
returned with `stale=true` when GitHub is temporarily unavailable or rate limited. Featured
repositories are selected from owned public repositories by stars and recency; GitHub's REST API
does not expose a user's pinned repositories or an exact contribution calendar.

The public settings resource also exposes `githubProfileVisible`, `githubStatsVisible`,
`githubRepositoriesVisible`, `githubInspectorVisible`, and `githubActivityVisible`. Admins can
control each GitHub Explorer region independently through the existing settings update endpoint.

Homepage composition is controlled by `homeProfileVisible`, `homeQuickLinksVisible`,
`homeProjectsVisible`, `homeNotesVisible`, `homeSkillsVisible`, `homeExperienceVisible`, and
`homeGithubVisible`. These public booleans let the Landing Workspace omit individual modules
without requiring a deployment or a separate page-layout API.

Public navigation composition is controlled by `navigationProfileVisible`,
`navigationProjectsVisible`, `navigationAiLabVisible`, `navigationFlutterLabVisible`,
`navigationBlogVisible`, `resumeEnabled`, `navigationGithubVisible`, `navigationSkillsVisible`,
`navigationExperienceVisible`, and `navigationContactVisible`. Device Lab is hidden by default;
admins can expose it later without a deployment.

Developer Profile settings include `profileImageUrl`, admin-only `profileImageMediaId`,
`profileBiography`, `profilePhilosophy`, `profileCurrentFocus`, `profileLocation`, and
`profileCertificationsVisible`. The admin selects profile images through the existing Media Library
picker; public clients receive the image URL but not the internal media identifier.

## Analytics

### Track Event

- Method: `POST`
- URL: `/api/v1/analytics/events`
- Authorization: public
- Request body:

```json
{
  "eventName": "resume_downloaded",
  "path": "/resume",
  "metadata": {}
}
```

- Response `201`: `{ "tracked": true }`. Returns `tracked=false` while analytics is disabled.
- Errors: `422`, `429`

Only allowlisted portfolio events and application-relative paths are accepted. The client uses a
random first-party visitor identifier for aggregate unique-visitor counts; raw IP addresses are not
stored.

### Dashboard Summary

- Method: `GET`
- URL: `/api/v1/analytics/summary`
- Authorization: admin
- Query: `from`, `to`
- Response `200`: totals for visitors, project views, resume downloads, GitHub events, messages, blog views
- Errors: `401`, `403`, `422`

### Analytics Time Series

- Method: `GET`
- URL: `/api/v1/analytics/timeseries`
- Authorization: admin
- Query: `from`, `to`, `metric`, `interval=day|week|month`
- Response `200`: `{ "points": [{ "date": "2026-08-04", "value": 10 }] }`
- Errors: `401`, `403`, `422`

## Health Check

### API Health

- Method: `GET`
- URL: `/api/v1/health`
- Authorization: public
- Response `200`:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "environment": "development"
}
```

- Errors: `429`, `500`

## Authorization Matrix

| Area                          | Public Read | Admin Write |
| ----------------------------- | ----------- | ----------- |
| Auth login/refresh            | yes         | no          |
| Current user/logout           | no          | yes         |
| Projects                      | yes         | yes         |
| Categories                    | yes         | yes         |
| Technologies                  | yes         | yes         |
| Blog posts/tags               | yes         | yes         |
| Skills                        | yes         | yes         |
| Experience                    | yes         | yes         |
| Education                     | yes         | yes         |
| Resume active/download        | yes         | no          |
| Resume versions               | no          | yes         |
| Media library                 | no          | yes         |
| Messages create               | yes         | no          |
| Messages manage               | no          | yes         |
| Public settings               | yes         | no          |
| Admin settings                | no          | yes         |
| GitHub summary/repos/activity | yes         | no          |
| GitHub sync                   | no          | yes         |
| Analytics track event         | yes         | no          |
| Analytics dashboard           | no          | yes         |

## Naming Rules

- Feature-owned resources use concise plural or workspace names such as `/projects`, `/media`, and
  `/blog`; nested taxonomies remain under their owning feature, for example `/blog/categories`.
- JSON fields use camelCase.
- Database fields may use snake_case internally, but API schemas expose camelCase.
- Admin-only endpoints still live under the resource URL and rely on authorization, not `/admin/*`.
- Public list endpoints return only published/visible resources by default.
- Admin list endpoints may expose draft/archived/deleted filters when explicitly authorized.
