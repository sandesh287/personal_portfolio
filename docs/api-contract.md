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
- `413 Payload Too Large`: upload exceeds configured limit
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
  "url": "/uploads/cover.png",
  "contentType": "image/png",
  "sizeBytes": 123456,
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
  "refreshToken": "jwt",
  "tokenType": "bearer",
  "expiresIn": 900,
  "user": {}
}
```

- Errors: `401`, `422`, `429`

### Refresh Token

- Method: `POST`
- URL: `/api/v1/auth/refresh`
- Authorization: public, requires valid refresh token
- Request body:

```json
{
  "refreshToken": "jwt"
}
```

- Response `200`: same token schema as login
- Errors: `401`, `422`, `429`

### Logout

- Method: `POST`
- URL: `/api/v1/auth/logout`
- Authorization: admin
- Request body:

```json
{
  "refreshToken": "jwt"
}
```

- Response `200`: `{ "loggedOut": true }`
- Errors: `401`, `403`, `422`

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

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/projects/{id}/images` | admin | List project images |
| `POST` | `/api/v1/projects/{id}/images` | admin | Upload project image |
| `POST` | `/api/v1/projects/{id}/images/attach` | admin | Attach a Media Library image |
| `PATCH` | `/api/v1/projects/{id}/images/{imageId}` | admin | Update image metadata |
| `PATCH` | `/api/v1/projects/{id}/images/reorder` | admin | Bulk reorder project images |
| `PATCH` | `/api/v1/projects/{id}/cover-image` | admin | Set or clear cover image |
| `DELETE` | `/api/v1/projects/{id}/images/{imageId}` | admin | Delete project image |

- Upload body: `multipart/form-data` with `file`, `caption`, `sortOrder`
- Attach body: `{ "mediaAssetId": "uuid", "caption": "optional", "sortOrder": 0 }`
- Update body: `{ "caption": "string or null", "sortOrder": 0 }` (all fields optional)
- Reorder body: `{ "items": [{ "id": "uuid", "sortOrder": 0 }] }` — must include every active project image with unique contiguous positions starting at zero
- Cover body: `{ "imageId": "uuid" }`; use `null` to clear
- Responses: `ProjectImage`, `ProjectImage[]`, `Project`, or `{ "deleted": true }`
- Errors: `401`, `403`, `404`, `409`, `413`, `422`

### Project Videos

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/projects/{id}/videos` | admin | List project videos |
| `POST` | `/api/v1/projects/{id}/videos/attach` | admin | Attach a Media Library video |
| `POST` | `/api/v1/projects/{id}/videos/external` | admin | Add a YouTube or Vimeo video |
| `PATCH` | `/api/v1/projects/{id}/videos/{videoId}` | admin | Update video metadata |
| `PATCH` | `/api/v1/projects/{id}/videos/reorder` | admin | Bulk reorder project videos |
| `DELETE` | `/api/v1/projects/{id}/videos/{videoId}` | admin | Remove a project video |

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

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/projects/categories` | admin | Create category |
| `PATCH` | `/api/v1/projects/categories/{id}` | admin | Update category |
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

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/projects/technologies` | admin | Create technology |
| `PATCH` | `/api/v1/projects/technologies/{id}` | admin | Update technology |
| `DELETE` | `/api/v1/projects/technologies/{id}` | admin | Delete technology |

- Create/update body: `name`, `slug`, `category`, `icon`, `color`, `sortOrder`
- Errors: `401`, `403`, `404`, `409`, `422`

## Blog / Engineering Notes

- Model fields: `id`, `title`, `slug`, `excerpt`, `content`, `coverImage`, `tags`, `status`, `featured`, `readingTimeMinutes`, `publishedAt`, `seoTitle`, `seoDescription`

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/blog-posts` | public | List published posts |
| `GET` | `/api/v1/blog-posts/featured` | public | Featured posts |
| `GET` | `/api/v1/blog-posts/{slug}` | public | Post details |
| `POST` | `/api/v1/blog-posts` | admin | Create post |
| `PATCH` | `/api/v1/blog-posts/{id}` | admin | Update post |
| `DELETE` | `/api/v1/blog-posts/{id}` | admin | Delete post |

- List query: `page`, `pageSize`, `search`, `tag`, `status`, `featured`, `sort`, `order`
- Create/update body: `title`, `slug`, `excerpt`, `content`, `coverImageId`, `tagIds`, `status`, `featured`, `seoTitle`, `seoDescription`
- Errors: `401`, `403`, `404`, `409`, `422`

## Blog Tags

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/blog-tags` | public | List tags |
| `POST` | `/api/v1/blog-tags` | admin | Create tag |
| `PATCH` | `/api/v1/blog-tags/{id}` | admin | Update tag |
| `DELETE` | `/api/v1/blog-tags/{id}` | admin | Delete tag |

- Create/update body: `name`, `slug`, `color`

## Skills

- Model fields: `id`, `name`, `slug`, `category`, `level`, `icon`, `color`, `description`, `sortOrder`

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/skills` | public | List skills |
| `GET` | `/api/v1/skills/grouped` | public | Group by category |
| `POST` | `/api/v1/skills` | admin | Create skill |
| `PATCH` | `/api/v1/skills/{id}` | admin | Update skill |
| `DELETE` | `/api/v1/skills/{id}` | admin | Delete skill |

- List query: `page`, `pageSize`, `search`, `category`, `level`, `sort`, `order`
- Create/update body: `name`, `slug`, `category`, `level`, `icon`, `color`, `description`, `sortOrder`
- Errors: `401`, `403`, `404`, `409`, `422`

## Experience

- Model fields: `id`, `company`, `role`, `location`, `employmentType`, `startDate`, `endDate`, `current`, `summary`, `highlights`, `technologyIds`, `sortOrder`

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/experiences` | public | List experience |
| `GET` | `/api/v1/experiences/{id}` | public | Experience details |
| `POST` | `/api/v1/experiences` | admin | Create experience |
| `PATCH` | `/api/v1/experiences/{id}` | admin | Update experience |
| `DELETE` | `/api/v1/experiences/{id}` | admin | Delete experience |

- List query: `page`, `pageSize`, `search`, `current`, `sort`, `order`
- Create/update body: `company`, `role`, `location`, `employmentType`, `startDate`, `endDate`, `current`, `summary`, `highlights`, `technologyIds`, `sortOrder`
- Errors: `401`, `403`, `404`, `422`

## Education

- Model fields: `id`, `institution`, `degree`, `fieldOfStudy`, `location`, `startDate`, `endDate`, `current`, `summary`, `sortOrder`

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/education` | public | List education |
| `GET` | `/api/v1/education/{id}` | public | Education details |
| `POST` | `/api/v1/education` | admin | Create education |
| `PATCH` | `/api/v1/education/{id}` | admin | Update education |
| `DELETE` | `/api/v1/education/{id}` | admin | Delete education |

- List query: `page`, `pageSize`, `search`, `current`, `sort`, `order`
- Create/update body: `institution`, `degree`, `fieldOfStudy`, `location`, `startDate`, `endDate`, `current`, `summary`, `sortOrder`
- Errors: `401`, `403`, `404`, `422`

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
- Response `200`: file response
- Errors: `404`, `429`

### Resume Versions

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/resume/versions` | admin | List versions |
| `POST` | `/api/v1/resume/versions` | admin | Upload new version |
| `PATCH` | `/api/v1/resume/versions/{id}` | admin | Update metadata or active flag |
| `DELETE` | `/api/v1/resume/versions/{id}` | admin | Delete version |

- Upload body: `multipart/form-data` with `file`, `title`, `version`, `isActive`
- Errors: `401`, `403`, `404`, `413`, `422`

## Media Library

**Implemented** - Admin media library foundation with upload, search, and management.

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/media` | admin | List media assets |
| `GET` | `/api/v1/media/{id}` | admin | Media details |
| `POST` | `/api/v1/media` | admin | Upload media |
| `PATCH` | `/api/v1/media/{id}` | admin | Update alt text/metadata |
| `DELETE` | `/api/v1/media/{id}` | admin | Delete media |

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
  "source": "communication_terminal"
}
```

- Response `201`: message receipt `{ "id": "uuid", "received": true }`
- Errors: `422`, `429`

### Admin Messages

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/messages` | admin | List messages |
| `GET` | `/api/v1/messages/{id}` | admin | Message details |
| `PATCH` | `/api/v1/messages/{id}` | admin | Mark read/archive/starred |
| `DELETE` | `/api/v1/messages/{id}` | admin | Delete message |

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

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/settings` | admin | List settings |
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

## GitHub Integration

### Public GitHub Summary

- Method: `GET`
- URL: `/api/v1/github/summary`
- Authorization: public
- Query: `refresh=false`
- Response `200`: profile, pinned repos, contribution summary, recent events
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
- Response `202`: `{ "queued": true }`
- Errors: `401`, `403`, `429`, `502`

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

- Response `201`: `{ "tracked": true }`
- Errors: `422`, `429`

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

| Area | Public Read | Admin Write |
| --- | --- | --- |
| Auth login/refresh | yes | no |
| Current user/logout | no | yes |
| Projects | yes | yes |
| Categories | yes | yes |
| Technologies | yes | yes |
| Blog posts/tags | yes | yes |
| Skills | yes | yes |
| Experience | yes | yes |
| Education | yes | yes |
| Resume active/download | yes | no |
| Resume versions | no | yes |
| Media library | no | yes |
| Messages create | yes | no |
| Messages manage | no | yes |
| Public settings | yes | no |
| Admin settings | no | yes |
| GitHub summary/repos/activity | yes | no |
| GitHub sync | no | yes |
| Analytics track event | yes | no |
| Analytics dashboard | no | yes |

## Naming Rules

- Resource URLs use kebab-case plural names: `/blog-posts`, `/project-categories`.
- JSON fields use camelCase.
- Database fields may use snake_case internally, but API schemas expose camelCase.
- Admin-only endpoints still live under the resource URL and rely on authorization, not `/admin/*`.
- Public list endpoints return only published/visible resources by default.
- Admin list endpoints may expose draft/archived/deleted filters when explicitly authorized.
