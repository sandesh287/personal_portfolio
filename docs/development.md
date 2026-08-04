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
