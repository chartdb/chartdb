# Schema Sync Architecture

## Summary

ChartDB now has a split architecture:

- `src/`: the existing Vite/React editor, still local-first for visual editing and diagram persistence
- `packages/schema-sync-core/`: shared canonical schema model, diff engine, SQL generation, warnings, and API contracts
- `server/`: Fastify backend for secure database connectivity, secret storage, introspection, apply orchestration, and audit/history

The frontend remains the interactive editor. The backend owns all live database access and sensitive state.

## Core Data Model

The schema sync flow uses a canonical schema representation that is:

- database-vendor-aware enough to model PostgreSQL safely
- independent from the React canvas representation
- reusable for import, diff, SQL generation, and apply validation

Key entities:

- `CanonicalSchema`
- `CanonicalTable`
- `CanonicalColumn`
- `CanonicalPrimaryKey`
- `CanonicalUniqueConstraint`
- `CanonicalIndex`
- `CanonicalForeignKey`
- `CanonicalCheckConstraint`
- `SchemaChange`
- `ChangePlan`
- `RiskWarning`

The editor model (`Diagram`, `DBTable`, `DBField`, `DBIndex`, `DBRelationship`) is extended with sync metadata so imported objects retain stable references back to the baseline snapshot.

## Request Flow

### 1. Connection Management

- The browser submits connection details to `POST /api/connections`.
- The backend encrypts secrets with AES-256-GCM and stores metadata in the internal SQLite database.
- Only non-secret connection summary data is returned to the browser.

### 2. Test Connection

- The browser calls `POST /api/connections/test` or `POST /api/connections/:id/test`.
- The backend opens a PostgreSQL connection using the decrypted secret.
- The response includes version and discovered schemas, never the password.

### 3. Import Live Schema

- The browser calls `POST /api/schema/import-live`.
- The backend introspects PostgreSQL system catalogs into `CanonicalSchema`.
- The backend stores a baseline snapshot with a schema fingerprint.
- The frontend maps `CanonicalSchema -> Diagram` and loads it into the existing editor.

### 4. Preview Changes

- The frontend maps `Diagram -> CanonicalSchema`.
- The browser sends `baselineSnapshotId + targetSchema` to `POST /api/schema/diff`.
- The backend loads the baseline snapshot, computes a canonical diff, classifies warnings, generates SQL, stores the plan, and returns a `ChangePlan`.

### 5. Apply Changes

- The browser submits `planId` and destructive confirmation metadata to `POST /api/schema/apply`.
- The backend:
  - reloads the saved plan
  - re-introspects the live schema
  - rejects apply if drift changed the baseline fingerprint
  - runs preflight checks such as `SET NOT NULL` null-count validation
  - executes only generated SQL from the plan
  - records execution logs, audit metadata, and pre/post snapshots

## Backend Persistence

The backend uses an internal SQLite metadata database for:

- saved connections
- baseline snapshots
- target snapshots
- change plans
- apply jobs
- audit records

This keeps operational state out of the browser while remaining easy to run locally and in containers.

## Safety Model

Safety-first v1 decisions:

- No browser-to-database direct connectivity
- No arbitrary SQL execution from the UI
- Apply requires a persisted plan id
- Destructive operations require typed confirmation
- Drift detection blocks stale plans
- `SET NOT NULL` runs row-level null preflight checks
- Execution occurs inside a transaction when possible

Warnings are grouped as:

- `safe`
- `warning`
- `destructive`
- `blocked`

## Current PostgreSQL Coverage

Supported in v1:

- schemas
- tables
- views import
- columns
- primary keys
- unique constraints
- indexes
- foreign keys
- check constraints
- defaults
- identity/serial detection

Apply generation is focused on:

- create/drop/rename/move tables
- add/drop/rename columns
- alter type
- alter default
- alter nullability
- add/drop PK/unique/check/index/FK

## Extensibility Path

The architecture is designed so MySQL, MariaDB, and SQL Server can be added later by:

- adding new connector/introspection modules in `server/`
- mapping each engine to the same `CanonicalSchema`
- reusing the existing diff/risk/plan pipeline
- implementing engine-specific SQL generators alongside the PostgreSQL one
