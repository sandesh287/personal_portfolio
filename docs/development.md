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

Run migrations from the repository root:

```powershell
.\.venv\Scripts\alembic.exe -c backend\alembic.ini upgrade head
```

Seed the single admin user:

```powershell
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="replace-with-a-secure-admin-password"
.\.venv\Scripts\python.exe -m app.cli.seed_admin
```

The seed command creates the admin user only if the email does not already exist.

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
