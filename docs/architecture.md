# Sandesh Portfolio Architecture

This document captures the initial production architecture for the dynamic developer-workspace portfolio.

## Monorepo Shape

- `frontend/`: React 19, TypeScript, Vite, TailwindCSS application.
- `backend/`: FastAPI, SQLAlchemy 2, Alembic, PostgreSQL API service.
- `docs/`: Architecture, decisions, API notes, and operational documentation.

## Frontend Structure

- `src/app/`: App bootstrap, root shell, and application-level setup.
- `src/assets/`: Static assets committed with the app.
- `src/components/ui/`: shadcn/ui primitives and design-system-level components.
- `src/components/common/`: Shared composed components used across features.
- `src/config/`: Environment-backed runtime configuration.
- `src/features/`: Feature modules containing screens, components, hooks, schemas, and API bindings.
- `src/hooks/`: Generic reusable React hooks.
- `src/layouts/`: Public, admin, auth, and workspace layouts.
- `src/lib/`: Third-party library configuration and typed wrappers.
- `src/providers/`: React context providers for query, auth, theme, and app services.
- `src/routes/`: Route definitions and route guards.
- `src/services/`: Shared API clients and service adapters.
- `src/stores/`: Zustand stores for client-only UI state.
- `src/styles/`: Tailwind entrypoint and global styles.
- `src/types/`: Shared TypeScript types.
- `src/utils/`: Pure helper utilities.

## Backend Structure

- `app/api/v1/`: Versioned API router composition.
- `app/auth/`: JWT, refresh token, password, and role helpers.
- `app/core/`: Settings, security, logging, and application configuration.
- `app/db/`: SQLAlchemy session, base metadata, and database setup.
- `app/features/`: Feature modules containing routers, services, repositories, and schemas.
- `app/integrations/`: External integrations such as GitHub.
- `app/models/`: Shared SQLAlchemy models.
- `app/repositories/`: Reusable data access abstractions.
- `app/schemas/`: Shared Pydantic v2 schemas.
- `app/services/`: Cross-feature business services.
- `app/storage/`: Storage provider interface and local implementation.
- `app/tasks/`: Background jobs and scheduled sync entry points.
- `app/utils/`: Pure backend utilities.
- `alembic/`: Database migrations.
- `tests/`: Backend test suite.

## Architecture Direction

The system uses feature-based architecture, versioned APIs, typed request/response contracts, and a clean separation between transport, business logic, persistence, and external providers.
