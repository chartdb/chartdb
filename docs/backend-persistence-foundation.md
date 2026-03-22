# Backend And Persistence Foundation

## Goal

ChartDB now has a minimal self-hosted backend foundation for durable application data, without expanding into full auth, sharing, or admin flows yet.

## What Was Added

- A validated Fastify backend foundation with:
  - structured logging
  - environment-based configuration
  - centralized route registration
  - health and bootstrap endpoints
- A dedicated application persistence store in SQLite for:
  - placeholder users
  - projects
  - diagrams
  - ownership metadata
  - visibility/status metadata
  - timestamps
- A frontend storage boundary that:
  - keeps Dexie as the editor’s local working cache
  - hydrates from the backend when available
  - syncs diagrams back to the backend for durable storage
  - falls back to local-only behavior if the backend is unavailable

## Repository Shape

- `server/src/config`
  Backend env parsing and logger setup.
- `server/src/context`
  Application wiring for repositories and services.
- `server/src/repositories`
  SQLite-backed persistence for schema-sync metadata and app data.
- `server/src/routes`
  Health, persistence, and schema-sync route registration.
- `server/src/services`
  Business logic for persistence and schema-sync workflows.
- `src/context/storage-context`
  Hybrid local/remote storage provider used by the existing editor.
- `src/features/persistence/api`
  Frontend client for the new persistence API.

## Current Model

### Users

`app_users` stores an auth-ready placeholder identity for self-hosted deployments. Today this is a default local owner record bootstrapped on first run.

### Projects

`app_projects` is the stable top-level container for future saved-project, collection, search, auth, and sharing features.

### Diagrams

`app_diagrams` stores:

- project association
- owner placeholder
- name/description
- visibility
- status
- database type metadata
- serialized diagram document
- created/updated timestamps

## API Shape

- `GET /api/health`
  Liveness and persistence readiness.
- `GET /api/app/bootstrap`
  Ensures the default placeholder owner and project exist.
- `GET /api/projects`
  Project listing surface for future dashboard work.
- `POST /api/projects`
  Minimal project creation.
- `PATCH /api/projects/:id`
  Minimal project updates.
- `DELETE /api/projects/:id`
  Minimal project deletion.
- `GET /api/projects/:id/diagrams`
  Diagram listing for a project.
- `GET /api/diagrams/:id`
  Full diagram fetch.
- `PUT /api/diagrams/:id`
  Full diagram upsert.
- `DELETE /api/diagrams/:id`
  Diagram deletion.

## Why This Shape

The implementation adapts only the useful architectural patterns from ExcaliDash:

- backend-first persistence instead of browser-only storage
- explicit config validation
- route grouping by domain
- durable top-level models that are ready for future ownership and sharing features

It intentionally does **not** add auth, collaboration, or permission enforcement yet.

## Current Constraints

- The editor still behaves like a single-user app.
- The UI does not expose project switching yet; diagrams are persisted into a bootstrapped default project.
- Browser-local Dexie remains in place as a working cache for compatibility with the current editor architecture.
