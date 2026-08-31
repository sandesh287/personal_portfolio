# Sandesh Developer Workspace

A production-oriented personal portfolio for Sandesh, built as a dynamic developer workspace rather
than a traditional landing page. Public content is backed by a versioned FastAPI API and managed
through a protected React admin dashboard.

## Highlights

- Dynamic projects, categories, technologies, media galleries, and project videos
- Engineering notes with categories, tags, publishing controls, and SEO fields
- Skills, experience, education, certifications, resume, and developer profile management
- AI Lab and category-driven project workspaces
- GitHub profile, repository, activity, and section visibility controls
- Contact form with spam protection and an admin message inbox
- Local and Cloudinary storage through a shared storage abstraction
- JWT access tokens, rotating refresh tokens, role support, and protected admin routes
- Light and dark workspace themes based on the designs in `design/`
- Admin-controlled homepage modules and public navigation visibility
- Canonical, Open Graph, Twitter, JSON-LD, robots, and sitemap foundations
- Responsive desktop, tablet, and mobile layouts

## Technology

### Frontend

React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, Zustand,
Axios, React Hook Form, Zod, Framer Motion, GSAP, Lucide React, and dnd-kit.

### Backend

Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, PostgreSQL, JWT,
Passlib/bcrypt, Cloudinary, Pytest, and Ruff.

## Repository Layout

```text
personal_portfolio/
├── backend/             FastAPI application, migrations, tests, and CLI tools
├── frontend/            React application and admin dashboard
├── design/              Google Stitch HTML references and theme specifications
├── docs/                Architecture, API contract, schema, and development notes
├── package.json         Root development commands
└── README.md
```

See [architecture.md](docs/architecture.md), [api-contract.md](docs/api-contract.md), and
[database-schema.md](docs/database-schema.md) for the detailed system contracts.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Python 3.11 or newer
- PostgreSQL, or a Neon PostgreSQL connection string
- A Cloudinary account when persistent cloud media storage is required

## Initial Setup

Run these commands from PowerShell in the repository root.

### 1. Create the Python environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e ".\backend[dev]"
```

### 2. Install frontend dependencies

```powershell
npm install
```

### 3. Configure environment variables

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

At minimum, update these backend values:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET_KEY=replace-with-a-secure-random-secret-at-least-32-characters
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-secure-admin-password
```

For production SEO output, configure the public frontend origin:

```env
VITE_SITE_URL=https://your-domain.example
```

Do not commit `.env` files or credentials.

### 4. Apply database migrations

```powershell
cd backend
..\.venv\Scripts\alembic.exe upgrade head
..\.venv\Scripts\alembic.exe current
cd ..
```

The Alembic configuration is located at `backend/alembic.ini`, so migration commands should be run
from `backend/`.

### 5. Seed the admin account and starter project taxonomy

```powershell
cd backend
..\.venv\Scripts\python.exe -m app.cli.seed_admin
..\.venv\Scripts\python.exe -m app.cli.seed_projects
cd ..
```

## Running Locally

### Run frontend and backend together

From the repository root:

```powershell
npm run dev
```

This starts:

- Frontend: `http://localhost:5173`
- Backend API: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### Run them separately

Backend:

```powershell
cd backend
..\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Frontend, in another terminal:

```powershell
cd frontend
npm run dev
```

## Media Storage

Development defaults to local storage:

```env
STORAGE_PROVIDER=local
UPLOAD_ROOT=uploads
```

Persistent deployment storage uses Cloudinary:

```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=sandesh-portfolio
```

Configured upload limits are:

- Images: 10 MB
- Videos: 100 MB
- Documents: 20 MB

Existing local media can be migrated with the guarded migration CLI. Always start with a dry run:

```powershell
cd backend
..\.venv\Scripts\python.exe -m app.cli.migrate_media_to_cloudinary
..\.venv\Scripts\python.exe -m app.cli.migrate_media_to_cloudinary --apply
```

## Quality Checks

Frontend:

```powershell
cd frontend
npm run typecheck
npm run lint
npm run build
```

Backend:

```powershell
cd backend
..\.venv\Scripts\python.exe -m ruff check app tests
..\.venv\Scripts\python.exe -m ruff format --check app tests
..\.venv\Scripts\python.exe -m pytest
```

The frontend prebuild generates `public/robots.txt` and `public/sitemap.xml` from
`VITE_SITE_URL`. It can also be run directly:

```powershell
cd frontend
npm run generate:seo
```

## Authentication Flow

The admin signs in through `/admin/login`. The API returns a short-lived access token while the
rotating refresh token is stored in a Secure, HttpOnly cookie. Protected frontend routes restore the
session through the refresh endpoint, and revoked refresh-token hashes are persisted in PostgreSQL.

For local HTTP development, `REFRESH_COOKIE_SECURE=false` is required. Set it to `true` in an HTTPS
production deployment.

## Deployment

The intended free-tier deployment shape is:

- Frontend: Vercel
- Backend: Railway or Render
- PostgreSQL: Neon
- Media: Cloudinary

Configure the Vercel frontend project with:

- Root Directory: `frontend`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

The SPA fallback in `frontend/vercel.json` rewrites direct requests such as `/admin`, `/projects`,
and `/blog/some-note` to the root document, allowing React Router to resolve the route. After changing the
rewrite, redeploy the Vercel project and purge the Cloudflare cache if an earlier 404 was cached.

Production configuration should include the deployed frontend origin in
`BACKEND_CORS_ORIGINS`, use HTTPS-only refresh cookies, provide a strong JWT secret, set
`VITE_API_BASE_URL` to the deployed `/api/v1` endpoint, and set `VITE_SITE_URL` to the canonical
portfolio domain.

## Current Admin Areas

- Dashboard and analytics
- Projects, categories, technologies, images, and videos
- Engineering notes, blog categories, and tags
- Skills
- Experience, education, and certifications
- Resume and media library
- Messages
- Profile and profile image
- Workspace, GitHub, homepage, navigation, and SEO settings

## License

This repository is a personal portfolio project. Unless a license is added separately, the source is
not offered for redistribution or reuse.
