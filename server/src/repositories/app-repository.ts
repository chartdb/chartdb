import Database from 'better-sqlite3';
import {
    diagramDocumentSchema,
    diagramStatusSchema,
    diagramVisibilitySchema,
    ownershipScopeSchema,
    projectStatusSchema,
    projectVisibilitySchema,
    type DiagramDocument,
    userAuthProviderSchema,
    userStatusSchema,
} from '../schemas/persistence.js';

export interface AppUserRecord {
    id: string;
    email: string | null;
    displayName: string;
    authProvider: 'placeholder' | 'local' | 'oidc';
    status: 'provisioned' | 'active' | 'disabled';
    ownershipScope: 'personal' | 'workspace';
    createdAt: string;
    updatedAt: string;
}

export interface ProjectRecord {
    id: string;
    name: string;
    description: string | null;
    ownerUserId: string | null;
    visibility: 'private' | 'workspace' | 'public';
    status: 'active' | 'archived' | 'deleted';
    createdAt: string;
    updatedAt: string;
}

export interface DiagramRecord {
    id: string;
    projectId: string;
    ownerUserId: string | null;
    name: string;
    description: string | null;
    databaseType: string;
    databaseEdition: string | null;
    visibility: 'private' | 'workspace' | 'public';
    status: 'draft' | 'active' | 'archived';
    document: DiagramDocument;
    createdAt: string;
    updatedAt: string;
}

const parseJson = <T>(value: string): T => JSON.parse(value) as T;

export class AppRepository {
    private readonly db: Database.Database;

    constructor(filename: string) {
        this.db = new Database(filename);
        this.initialize();
    }

    close() {
        this.db.close();
    }

    private initialize() {
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS app_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            );
        `);

        const appliedVersions = new Set(
            (
                this.db
                    .prepare(
                        `SELECT version FROM app_migrations ORDER BY version ASC`
                    )
                    .all() as Array<{ version: number }>
            ).map((row) => row.version)
        );

        const migrations = [
            {
                version: 1,
                sql: `
                    CREATE TABLE IF NOT EXISTS app_config (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS app_users (
                        id TEXT PRIMARY KEY,
                        email TEXT UNIQUE,
                        display_name TEXT NOT NULL,
                        auth_provider TEXT NOT NULL,
                        status TEXT NOT NULL,
                        ownership_scope TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS app_projects (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT,
                        owner_user_id TEXT,
                        visibility TEXT NOT NULL,
                        status TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        FOREIGN KEY(owner_user_id) REFERENCES app_users(id) ON DELETE SET NULL
                    );

                    CREATE TABLE IF NOT EXISTS app_diagrams (
                        id TEXT PRIMARY KEY,
                        project_id TEXT NOT NULL,
                        owner_user_id TEXT,
                        name TEXT NOT NULL,
                        description TEXT,
                        database_type TEXT NOT NULL,
                        database_edition TEXT,
                        visibility TEXT NOT NULL,
                        status TEXT NOT NULL,
                        document_json TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        FOREIGN KEY(project_id) REFERENCES app_projects(id) ON DELETE CASCADE,
                        FOREIGN KEY(owner_user_id) REFERENCES app_users(id) ON DELETE SET NULL
                    );

                    CREATE INDEX IF NOT EXISTS idx_app_projects_owner_updated
                    ON app_projects(owner_user_id, updated_at DESC);

                    CREATE INDEX IF NOT EXISTS idx_app_diagrams_project_updated
                    ON app_diagrams(project_id, updated_at DESC);

                    CREATE INDEX IF NOT EXISTS idx_app_diagrams_project_name
                    ON app_diagrams(project_id, name);
                `,
            },
        ] as const;

        for (const migration of migrations) {
            if (appliedVersions.has(migration.version)) {
                continue;
            }

            const now = new Date().toISOString();
            const applyMigration = this.db.transaction(() => {
                this.db.exec(migration.sql);
                this.db
                    .prepare(
                        `
                        INSERT INTO app_migrations (version, applied_at)
                        VALUES (?, ?)
                        `
                    )
                    .run(migration.version, now);
            });
            applyMigration();
        }
    }

    getConfigValue(key: string): string | undefined {
        const row = this.db
            .prepare(`SELECT value FROM app_config WHERE key = ?`)
            .get(key) as { value: string } | undefined;

        return row?.value;
    }

    setConfigValue(key: string, value: string) {
        const now = new Date().toISOString();
        this.db
            .prepare(
                `
                INSERT INTO app_config (key, value, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    updated_at = excluded.updated_at
                `
            )
            .run(key, value, now);
    }

    putUser(user: AppUserRecord) {
        this.db
            .prepare(
                `
                INSERT INTO app_users (
                    id, email, display_name, auth_provider, status,
                    ownership_scope, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    email = excluded.email,
                    display_name = excluded.display_name,
                    auth_provider = excluded.auth_provider,
                    status = excluded.status,
                    ownership_scope = excluded.ownership_scope,
                    updated_at = excluded.updated_at
                `
            )
            .run(
                user.id,
                user.email,
                user.displayName,
                user.authProvider,
                user.status,
                user.ownershipScope,
                user.createdAt,
                user.updatedAt
            );
    }

    getUser(id: string): AppUserRecord | undefined {
        const row = this.db
            .prepare(
                `
                SELECT id, email, display_name, auth_provider, status,
                    ownership_scope, created_at, updated_at
                FROM app_users
                WHERE id = ?
                `
            )
            .get(id) as Record<string, unknown> | undefined;

        return row ? this.mapUser(row) : undefined;
    }

    listProjects(): ProjectRecord[] {
        const rows = this.db
            .prepare(
                `
                SELECT id, name, description, owner_user_id, visibility, status, created_at, updated_at
                FROM app_projects
                ORDER BY updated_at DESC, created_at DESC
                `
            )
            .all() as Array<Record<string, unknown>>;

        return rows.map((row) => this.mapProject(row));
    }

    getProject(id: string): ProjectRecord | undefined {
        const row = this.db
            .prepare(
                `
                SELECT id, name, description, owner_user_id, visibility, status, created_at, updated_at
                FROM app_projects
                WHERE id = ?
                `
            )
            .get(id) as Record<string, unknown> | undefined;

        return row ? this.mapProject(row) : undefined;
    }

    putProject(project: ProjectRecord) {
        this.db
            .prepare(
                `
                INSERT INTO app_projects (
                    id, name, description, owner_user_id, visibility, status, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    description = excluded.description,
                    owner_user_id = excluded.owner_user_id,
                    visibility = excluded.visibility,
                    status = excluded.status,
                    updated_at = excluded.updated_at
                `
            )
            .run(
                project.id,
                project.name,
                project.description,
                project.ownerUserId,
                project.visibility,
                project.status,
                project.createdAt,
                project.updatedAt
            );
    }

    deleteProject(id: string) {
        this.db.prepare(`DELETE FROM app_projects WHERE id = ?`).run(id);
    }

    listProjectDiagrams(projectId: string): DiagramRecord[] {
        const rows = this.db
            .prepare(
                `
                SELECT
                    id, project_id, owner_user_id, name, description,
                    database_type, database_edition, visibility, status,
                    document_json, created_at, updated_at
                FROM app_diagrams
                WHERE project_id = ?
                ORDER BY updated_at DESC, created_at DESC
                `
            )
            .all(projectId) as Array<Record<string, unknown>>;

        return rows.map((row) => this.mapDiagram(row));
    }

    getDiagram(id: string): DiagramRecord | undefined {
        const row = this.db
            .prepare(
                `
                SELECT
                    id, project_id, owner_user_id, name, description,
                    database_type, database_edition, visibility, status,
                    document_json, created_at, updated_at
                FROM app_diagrams
                WHERE id = ?
                `
            )
            .get(id) as Record<string, unknown> | undefined;

        return row ? this.mapDiagram(row) : undefined;
    }

    putDiagram(diagram: DiagramRecord) {
        this.db
            .prepare(
                `
                INSERT INTO app_diagrams (
                    id, project_id, owner_user_id, name, description, database_type,
                    database_edition, visibility, status, document_json, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    project_id = excluded.project_id,
                    owner_user_id = excluded.owner_user_id,
                    name = excluded.name,
                    description = excluded.description,
                    database_type = excluded.database_type,
                    database_edition = excluded.database_edition,
                    visibility = excluded.visibility,
                    status = excluded.status,
                    document_json = excluded.document_json,
                    updated_at = excluded.updated_at
                `
            )
            .run(
                diagram.id,
                diagram.projectId,
                diagram.ownerUserId,
                diagram.name,
                diagram.description,
                diagram.databaseType,
                diagram.databaseEdition,
                diagram.visibility,
                diagram.status,
                JSON.stringify(diagram.document),
                diagram.createdAt,
                diagram.updatedAt
            );
    }

    deleteDiagram(id: string) {
        this.db.prepare(`DELETE FROM app_diagrams WHERE id = ?`).run(id);
    }

    private mapUser(row: Record<string, unknown>): AppUserRecord {
        return {
            id: String(row.id),
            email: row.email ? String(row.email) : null,
            displayName: String(row.display_name),
            authProvider: userAuthProviderSchema.parse(row.auth_provider),
            status: userStatusSchema.parse(row.status),
            ownershipScope: ownershipScopeSchema.parse(row.ownership_scope),
            createdAt: String(row.created_at),
            updatedAt: String(row.updated_at),
        };
    }

    private mapProject(row: Record<string, unknown>): ProjectRecord {
        return {
            id: String(row.id),
            name: String(row.name),
            description: row.description ? String(row.description) : null,
            ownerUserId: row.owner_user_id ? String(row.owner_user_id) : null,
            visibility: projectVisibilitySchema.parse(row.visibility),
            status: projectStatusSchema.parse(row.status),
            createdAt: String(row.created_at),
            updatedAt: String(row.updated_at),
        };
    }

    private mapDiagram(row: Record<string, unknown>): DiagramRecord {
        return {
            id: String(row.id),
            projectId: String(row.project_id),
            ownerUserId: row.owner_user_id ? String(row.owner_user_id) : null,
            name: String(row.name),
            description: row.description ? String(row.description) : null,
            databaseType: String(row.database_type),
            databaseEdition: row.database_edition
                ? String(row.database_edition)
                : null,
            visibility: diagramVisibilitySchema.parse(row.visibility),
            status: diagramStatusSchema.parse(row.status),
            document: diagramDocumentSchema.parse(
                parseJson<DiagramDocument>(String(row.document_json))
            ),
            createdAt: String(row.created_at),
            updatedAt: String(row.updated_at),
        };
    }
}
