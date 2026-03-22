<h1 align="center">
  <a href="https://chartdb.io#gh-light-mode-only">
    <img src="https://github.com/chartdb/chartdb/blob/main/src/assets/logo-light.png" width="400" height="70" alt="ChartDB">
  </a>
  <a href="https://chartdb.io##gh-dark-mode-only">
    <img src="https://github.com/chartdb/chartdb/blob/main/src/assets/logo-dark.png" width="400" height="70" alt="ChartDB">
  </a>
  <br>
</h1>

<p align="center">
  <b>Open-source database diagrams editor and schema synchronization platform</b> <br />
  <b>Visual editing • Self-hosted persistence • Live PostgreSQL import • Diff, SQL preview, and safe apply.</b> <br />
</p>

<h3 align="center">
  <a href="https://discord.gg/QeFwyWSKwC">Community</a>  &bull;
  <a href="https://www.chartdb.io?ref=github_readme">Website</a>  &bull;
  <a href="https://chartdb.io/templates?ref=github_readme">Examples</a>  &bull;
  <a href="https://app.chartdb.io?ref=github_readme">Demo</a>
</h3>

<h4 align="center">
  <a href="https://github.com/chartdb/chartdb?tab=AGPL-3.0-1-ov-file#readme">
    <img src="https://img.shields.io/github/license/chartdb/chartdb?color=blue" alt="ChartDB is released under the AGPL license." />
  </a>
  <a href="https://github.com/chartdb/chartdb/blob/main/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen" alt="PRs welcome!" />
  </a>
  <a href="https://discord.gg/QeFwyWSKwC">
    <img src="https://img.shields.io/discord/1277047413705670678?color=5865F2&label=Discord&logo=discord&logoColor=white" alt="Discord community channel" />
  </a>
  <a href="https://x.com/intent/follow?screen_name=jonathanfishner">
    <img src="https://img.shields.io/twitter/follow/jonathanfishner?style=social"/>
  </a>

</h4>

---

<p align="center">
  <img width='700px' src="./public/chartdb.png">
</p>

### 🎉 ChartDB

ChartDB is a powerful, web-based database diagramming editor that now also includes a production-minded schema synchronization workflow for PostgreSQL.
You can import a live schema from a real database, edit it visually, persist projects safely in a self-hosted backend, preview a structured migration plan, inspect generated SQL, and apply approved changes through a server-side safety layer.

**What it does now**:

- **Direct PostgreSQL Connectivity**
  Store database connections server-side, test them safely, and keep passwords out of the browser after submission.

- **Self-Hosted Project Persistence**
  Persist ChartDB projects and diagrams through the backend API instead of relying only on browser storage. The editor still works locally, but a running backend now becomes the durable source of truth for saved work.

- **Live Schema Import**
  Import the live PostgreSQL schema into the existing visual editor and keep a persisted baseline snapshot for later diff/apply.

- **Visual Editing + Change Preview**
  Reuse the existing ChartDB editor to modify tables, columns, constraints, and indexes, then preview a canonical schema diff with grouped warnings and SQL.

- **Migration SQL Generation**
  Generate PostgreSQL migration SQL from the baseline-vs-target diff in dependency-aware order.

- **Safe Apply Workflow**
  Apply approved change plans back to PostgreSQL from the backend with drift detection, preflight checks, destructive confirmations, audit records, and post-apply refresh support.

- **Instant Schema Import**
  Run a single query to instantly retrieve your database schema as JSON. This makes it incredibly fast to visualize your database schema, whether for documentation, team discussions, or simply understanding your data better.

- **AI-Powered Export for Easy Migration**
  Our AI-driven export feature allows you to generate the DDL script in the dialect of your choice. Whether you're migrating from MySQL to PostgreSQL or from SQLite to MariaDB, ChartDB simplifies the process by providing the necessary scripts tailored to your target database.
- **Interactive Editing**
  Fine-tune your database schema using our intuitive editor. Easily make adjustments or annotations to better visualize complex structures.

### Status

ChartDB is currently in Public Beta. Star and watch this repository to get notified of updates.

### Supported Databases

- ✅ PostgreSQL (<img src="./src/assets/postgresql_logo_2.png" width="15"/> + <img src="./src/assets/supabase.png" alt="Supabase" width="15"/> + <img src="./src/assets/timescale.png" alt="Timescale" width="15"/> )
- ✅ MySQL
- ✅ SQL Server
- ✅ MariaDB
- ✅ SQLite (<img src="./src/assets/sqlite_logo_2.png" width="15"/> + <img src="./src/assets/cloudflare_d1.png" alt="Cloudflare D1" width="15"/> Cloudflare D1)
- ✅ CockroachDB
- ✅ ClickHouse

### Live Schema Sync MVP

The first production-oriented schema sync release supports:

- PostgreSQL connection management and testing
- Live schema import into the existing editor
- Canonical baseline/target schema diffing
- Generated migration SQL preview
- Safe apply with destructive confirmations
- Audit trail, execution logs, and drift detection

Planned next adapters:

- MySQL
- MariaDB
- SQL Server

## Getting Started

Use the [cloud version](https://app.chartdb.io?ref=github_readme_2) or deploy locally.

### Local Development

Install everything and run the frontend and backend separately:

```bash
npm install
npm run dev:server
npm run dev:web
```

The Vite development server proxies `/api` to `http://localhost:4010` by default.
When the backend is available, ChartDB bootstraps a default self-hosted owner/project and persists diagrams there.

### Full Local Stack With Docker

```bash
docker compose up --build
```

This starts:

- `web` on `http://localhost:8080`
- `api` on `http://localhost:4010`
- `postgres` on `localhost:5432`

### Environment Variables

See [`.env.example`](./.env.example) for the full list.

Key variables:

- `VITE_API_BASE_URL`: optional frontend API base override
- `CHARTDB_API_HOST`: backend bind host
- `CHARTDB_API_PORT`: backend port
- `CHARTDB_SECRET_KEY`: encryption key for stored connection secrets
- `CHARTDB_DATA_DIR`: default directory for backend SQLite files
- `CHARTDB_APP_DB_PATH`: optional override for the self-hosted app persistence database
- `CHARTDB_METADATA_DB_PATH`: optional override for the schema-sync metadata database
- `CHARTDB_LOG_LEVEL`: Fastify/Pino log level
- `CHARTDB_DEFAULT_PROJECT_NAME`: initial self-hosted project name
- `CHARTDB_DEFAULT_OWNER_NAME`: initial placeholder owner name
- `CHARTDB_CORS_ORIGIN`: backend CORS policy

### Build

```bash
npm install
npm run build
```

### Run Only The Backend

```bash
npm run dev -w @chartdb/server
```

Useful backend endpoints:

- `GET /api/health`
- `GET /api/app/bootstrap`
- `GET /api/projects`
- `GET /api/projects/:projectId/diagrams`

### Run Only The Frontend

```bash
npm run dev:web
```

## Schema Sync Workflow

1. Open `Schema Sync` from the editor toolbar.
2. Create or update a PostgreSQL connection.
3. Click `Test Connection`.
4. Use `Import Live Schema` to bring the live schema into the canvas.
5. Modify the schema visually in ChartDB.
6. Open `Preview Changes` to inspect:
   - summary
   - detailed diff
   - generated SQL
   - risk warnings
7. If destructive operations are present, type the required confirmation text.
8. Click `Apply Changes`.
9. Review the result and then `Refresh From Database` to re-import the live state.

## Architecture

- `packages/schema-sync-core`
  Shared canonical schema model, diff engine, SQL generation, risk analysis, and API contracts.
- `server`
  Fastify API for self-hosted app persistence, connection storage, PostgreSQL introspection, plan generation, apply execution, and audit/history persistence.
- `src`
  Existing ChartDB editor plus schema-sync UI, a hybrid local/remote storage boundary, adapters between `Diagram` and `CanonicalSchema`, and toolbar/dialog integration.

See [docs/schema-sync-architecture.md](./docs/schema-sync-architecture.md) for the detailed design.
See [docs/backend-persistence-foundation.md](./docs/backend-persistence-foundation.md) for the self-hosted backend/persistence foundation.

## Security Considerations

- Browser clients never connect directly to PostgreSQL.
- Raw database passwords are never returned to the browser after submission.
- Connection secrets are encrypted at rest using application-level AES-256-GCM.
- The UI cannot execute arbitrary SQL.
- Apply only executes server-generated plans.
- Destructive operations require explicit confirmation text.
- The backend re-introspects the live schema before apply and rejects drift.
- `SET NOT NULL` changes run preflight null checks.

## Limitations of v1

- Live connection/import/diff/apply currently targets PostgreSQL only.
- The apply engine focuses on table/column/constraint/index operations, not every PostgreSQL object type.
- Composite foreign keys are preserved in the canonical model, but the current visual relationship editor remains optimized for single-column relationships.
- Automatic rollback SQL is not generated in v1; instead, pre/post snapshots and audit logs support rollback-oriented operational workflows.

## CI and Delivery

- `npm run lint`
- `npm run typecheck`
- `npm run test:ci`
- `npm run build`

The CI workflow runs these checks on pull requests.

## 💚 Community & Support

- [Discord](https://discord.gg/QeFwyWSKwC) (For live discussion with the community and the ChartDB team)
- [GitHub Issues](https://github.com/chartdb/chartdb/issues) (For any bugs and errors you encounter using ChartDB)
- [Twitter](https://x.com/intent/follow?screen_name=jonathanfishner) (Get news fast)

## Contributing

We welcome community contributions, big or small, and are here to guide you along
the way. Message us in the [ChartDB Community Discord](https://discord.gg/QeFwyWSKwC).

For more information on how to contribute, please see our
[Contributing Guide](/CONTRIBUTING.md).

This project is released with a [Contributor Code of Conduct](/CODE_OF_CONDUCT.md).
By participating in this project, you agree to follow its terms.

Thank you for helping us make ChartDB better for everyone :heart:.

## License

ChartDB is licensed under the [GNU Affero General Public License v3.0](LICENSE)
