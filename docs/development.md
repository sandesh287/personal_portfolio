# Development

## Backend Virtual Environment

The backend uses a project-local virtual environment at the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".\backend[dev]"
```

`pip` installs packages. `uvicorn` runs the FastAPI application.

## Run The Project

Run frontend and backend together from the repository root:

```powershell
npm run dev
```

Run only the backend:

```powershell
npm run dev:backend
```

The backend runs at:

```txt
http://127.0.0.1:8000
```

Swagger UI:

```txt
http://127.0.0.1:8000/docs
```

Health check:

```txt
http://127.0.0.1:8000/api/v1/health
```

## Database

Run migrations from the backend directory (to ensure .env file is found):

```powershell
cd backend
..\.venv\Scripts\alembic.exe upgrade head
cd ..
```

Or use the repository root command:

```powershell
.\.venv\Scripts\alembic.exe -c backend\alembic.ini upgrade head
```

**Note:** If using a remote database (e.g., Neon), ensure your DATABASE_URL in `backend/.env` is correctly configured.

Seed the single admin user:

```powershell
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="replace-with-a-secure-admin-password"
.\.venv\Scripts\python.exe -m app.cli.seed_admin
```

The seed command creates the admin user only if the email does not already exist.

Seed project categories, technologies, and starter projects:

```powershell
.\.venv\Scripts\python.exe -m app.cli.seed_projects
```

The project seed command is idempotent and updates existing seed records by slug.

Run only the frontend:

```powershell
npm run dev:frontend
```

The frontend usually runs at:

```txt
http://localhost:5173
```

## Reference Design Files

The `design/` folder contains the Google Stitch reference HTML files and theme markdown files.
These files are treated as implementation references for future frontend work and should not be copied blindly into the application.

## Cloudinary Storage

Local storage remains the default for development. To use persistent Cloudinary storage, create a
free Cloudinary account and set these values in `backend/.env` or the backend host environment:

```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=sandesh-portfolio
MAX_DOCUMENT_UPLOAD_SIZE_MB=10
```

Never expose `CLOUDINARY_API_SECRET` in the frontend or commit it to Git. Restart the backend after
changing providers. Existing local files are not automatically migrated; new uploads use the active
provider. Cloudinary's free-plan limits should be reviewed before changing upload size settings.

Preview migration of existing local media records and files:

```powershell
cd backend
..\.venv\Scripts\python.exe -m app.cli.migrate_media_to_cloudinary
```

Apply the migration while retaining local files as a backup:

```powershell
..\.venv\Scripts\python.exe -m app.cli.migrate_media_to_cloudinary --apply
```

To upload and remove local sources in the same operation, use:

```powershell
..\.venv\Scripts\python.exe -m app.cli.migrate_media_to_cloudinary --apply --delete-local
```

The command is idempotent: records already carrying a Cloudinary storage reference are skipped.

If migration was already applied while retaining local files, preview safe cleanup matches with:

```powershell
..\.venv\Scripts\python.exe -m app.cli.migrate_media_to_cloudinary --cleanup-local
```

Delete only uniquely matched local copies after reviewing the preview counts:

```powershell
..\.venv\Scripts\python.exe -m app.cli.migrate_media_to_cloudinary --cleanup-local --apply
```

Cleanup matches on sanitized filename and exact byte size. Extra local candidates are deleted only
when SHA-256 hashing confirms they are byte-for-byte identical copies. Same-size files with different
content, missing matches, and other ambiguous groups are never deleted automatically.

After applying the image metadata database migration, preview metadata backfill for existing
Cloudinary images:

```powershell
..\.venv\Scripts\python.exe -m app.cli.backfill_cloudinary_metadata
```

Apply the idempotent backfill after reviewing the counts:

```powershell
..\.venv\Scripts\python.exe -m app.cli.backfill_cloudinary_metadata --apply
```
