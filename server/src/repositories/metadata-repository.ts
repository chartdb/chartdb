import Database from 'better-sqlite3';
import type {
    AuditRecord,
    ChangePlan,
    ConnectionSummary,
} from '@chartdb/schema-sync-core';
import type { CanonicalSchema } from '@chartdb/schema-sync-core';

export interface StoredConnection extends ConnectionSummary {
    secretCiphertext: string;
}

export interface StoredSnapshot {
    id: string;
    connectionId: string;
    kind: 'baseline' | 'target' | 'pre_apply' | 'post_apply';
    fingerprint: string;
    importedSchemas: string[];
    schema: CanonicalSchema;
    createdAt: string;
}

export interface StoredApplyJob {
    id: string;
    planId: string;
    auditId: string;
    status: 'pending' | 'running' | 'succeeded' | 'failed';
    logs: string[];
    executedStatements: string[];
    error?: string | null;
    createdAt: string;
    updatedAt: string;
}

const parseJson = <T>(value: string | null): T =>
    value ? (JSON.parse(value) as T) : ([] as unknown as T);

export class MetadataRepository {
    private readonly db: Database.Database;

    constructor(filename: string) {
        this.db = new Database(filename);
        this.initialize();
    }

    close() {
        this.db.close();
    }

    private initialize() {
        this.db.exec(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS connections (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                engine TEXT NOT NULL,
                default_schemas TEXT NOT NULL,
                host TEXT NOT NULL,
                port INTEGER NOT NULL,
                database_name TEXT NOT NULL,
                username TEXT NOT NULL,
                secret_ciphertext TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS snapshots (
                id TEXT PRIMARY KEY,
                connection_id TEXT NOT NULL,
                kind TEXT NOT NULL,
                fingerprint TEXT NOT NULL,
                imported_schemas TEXT NOT NULL,
                schema_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS change_plans (
                id TEXT PRIMARY KEY,
                connection_id TEXT NOT NULL,
                baseline_snapshot_id TEXT NOT NULL,
                plan_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS apply_jobs (
                id TEXT PRIMARY KEY,
                plan_id TEXT NOT NULL,
                audit_id TEXT NOT NULL,
                status TEXT NOT NULL,
                logs_json TEXT NOT NULL,
                executed_statements_json TEXT NOT NULL,
                error TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS audits (
                id TEXT PRIMARY KEY,
                actor TEXT NOT NULL,
                connection_id TEXT NOT NULL,
                baseline_snapshot_id TEXT NOT NULL,
                target_snapshot_id TEXT,
                pre_apply_snapshot_id TEXT,
                post_apply_snapshot_id TEXT,
                change_plan_id TEXT NOT NULL,
                sql_statements_json TEXT NOT NULL,
                warnings_json TEXT NOT NULL,
                status TEXT NOT NULL,
                logs_json TEXT NOT NULL,
                error TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        `);
    }

    listConnections(): ConnectionSummary[] {
        const rows = this.db
            .prepare(
                `
                SELECT id, name, engine, default_schemas, host, port, database_name, username, created_at, updated_at
                FROM connections
                ORDER BY updated_at DESC
                `
            )
            .all() as Array<Record<string, unknown>>;

        return rows.map((row) => this.mapConnectionSummary(row));
    }

    getConnection(id: string): StoredConnection | undefined {
        const row = this.db
            .prepare(
                `
                SELECT id, name, engine, default_schemas, host, port, database_name, username, secret_ciphertext, created_at, updated_at
                FROM connections
                WHERE id = ?
                `
            )
            .get(id) as Record<string, unknown> | undefined;

        if (!row) {
            return undefined;
        }

        return {
            ...this.mapConnectionSummary(row),
            secretCiphertext: String(row.secret_ciphertext),
        };
    }

    putConnection(connection: StoredConnection) {
        this.db
            .prepare(
                `
                INSERT INTO connections (
                    id, name, engine, default_schemas, host, port, database_name,
                    username, secret_ciphertext, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    default_schemas = excluded.default_schemas,
                    host = excluded.host,
                    port = excluded.port,
                    database_name = excluded.database_name,
                    username = excluded.username,
                    secret_ciphertext = excluded.secret_ciphertext,
                    updated_at = excluded.updated_at
                `
            )
            .run(
                connection.id,
                connection.name,
                connection.engine,
                JSON.stringify(connection.defaultSchemas),
                connection.host,
                connection.port,
                connection.database,
                connection.username,
                connection.secretCiphertext,
                connection.createdAt,
                connection.updatedAt
            );
    }

    deleteConnection(id: string) {
        this.db.prepare(`DELETE FROM connections WHERE id = ?`).run(id);
    }

    putSnapshot(snapshot: StoredSnapshot) {
        this.db
            .prepare(
                `
                INSERT INTO snapshots (id, connection_id, kind, fingerprint, imported_schemas, schema_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `
            )
            .run(
                snapshot.id,
                snapshot.connectionId,
                snapshot.kind,
                snapshot.fingerprint,
                JSON.stringify(snapshot.importedSchemas),
                JSON.stringify(snapshot.schema),
                snapshot.createdAt
            );
    }

    getSnapshot(id: string): StoredSnapshot | undefined {
        const row = this.db
            .prepare(
                `
                SELECT id, connection_id, kind, fingerprint, imported_schemas, schema_json, created_at
                FROM snapshots
                WHERE id = ?
                `
            )
            .get(id) as Record<string, unknown> | undefined;

        if (!row) {
            return undefined;
        }

        return {
            id: String(row.id),
            connectionId: String(row.connection_id),
            kind: row.kind as StoredSnapshot['kind'],
            fingerprint: String(row.fingerprint),
            importedSchemas: parseJson<string[]>(String(row.imported_schemas)),
            schema: JSON.parse(String(row.schema_json)) as CanonicalSchema,
            createdAt: String(row.created_at),
        };
    }

    putChangePlan(plan: ChangePlan) {
        this.db
            .prepare(
                `
                INSERT INTO change_plans (id, connection_id, baseline_snapshot_id, plan_json, created_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    plan_json = excluded.plan_json
                `
            )
            .run(
                plan.id,
                plan.connectionId,
                plan.baselineSnapshotId,
                JSON.stringify(plan),
                plan.createdAt
            );
    }

    getChangePlan(id: string): ChangePlan | undefined {
        const row = this.db
            .prepare(`SELECT plan_json FROM change_plans WHERE id = ?`)
            .get(id) as { plan_json: string } | undefined;

        return row ? (JSON.parse(row.plan_json) as ChangePlan) : undefined;
    }

    putApplyJob(job: StoredApplyJob) {
        this.db
            .prepare(
                `
                INSERT INTO apply_jobs (
                    id, plan_id, audit_id, status, logs_json, executed_statements_json, error, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    status = excluded.status,
                    logs_json = excluded.logs_json,
                    executed_statements_json = excluded.executed_statements_json,
                    error = excluded.error,
                    updated_at = excluded.updated_at
                `
            )
            .run(
                job.id,
                job.planId,
                job.auditId,
                job.status,
                JSON.stringify(job.logs),
                JSON.stringify(job.executedStatements),
                job.error ?? null,
                job.createdAt,
                job.updatedAt
            );
    }

    getApplyJob(id: string): StoredApplyJob | undefined {
        const row = this.db
            .prepare(
                `
                SELECT id, plan_id, audit_id, status, logs_json, executed_statements_json, error, created_at, updated_at
                FROM apply_jobs
                WHERE id = ?
                `
            )
            .get(id) as Record<string, unknown> | undefined;

        if (!row) {
            return undefined;
        }

        return {
            id: String(row.id),
            planId: String(row.plan_id),
            auditId: String(row.audit_id),
            status: row.status as StoredApplyJob['status'],
            logs: parseJson<string[]>(String(row.logs_json)),
            executedStatements: parseJson<string[]>(
                String(row.executed_statements_json)
            ),
            error: row.error ? String(row.error) : null,
            createdAt: String(row.created_at),
            updatedAt: String(row.updated_at),
        };
    }

    putAudit(audit: AuditRecord) {
        this.db
            .prepare(
                `
                INSERT INTO audits (
                    id, actor, connection_id, baseline_snapshot_id, target_snapshot_id,
                    pre_apply_snapshot_id, post_apply_snapshot_id, change_plan_id,
                    sql_statements_json, warnings_json, status, logs_json, error,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    target_snapshot_id = excluded.target_snapshot_id,
                    pre_apply_snapshot_id = excluded.pre_apply_snapshot_id,
                    post_apply_snapshot_id = excluded.post_apply_snapshot_id,
                    sql_statements_json = excluded.sql_statements_json,
                    warnings_json = excluded.warnings_json,
                    status = excluded.status,
                    logs_json = excluded.logs_json,
                    error = excluded.error,
                    updated_at = excluded.updated_at
                `
            )
            .run(
                audit.id,
                audit.actor,
                audit.connectionId,
                audit.baselineSnapshotId,
                audit.targetSnapshotId ?? null,
                audit.preApplySnapshotId ?? null,
                audit.postApplySnapshotId ?? null,
                audit.changePlanId,
                JSON.stringify(audit.sqlStatements),
                JSON.stringify(audit.warnings),
                audit.status,
                JSON.stringify(audit.logs),
                audit.error ?? null,
                audit.createdAt,
                audit.updatedAt
            );
    }

    getAudit(id: string): AuditRecord | undefined {
        const row = this.db
            .prepare(
                `
                SELECT id, actor, connection_id, baseline_snapshot_id, target_snapshot_id, pre_apply_snapshot_id,
                       post_apply_snapshot_id, change_plan_id, sql_statements_json, warnings_json,
                       status, logs_json, error, created_at, updated_at
                FROM audits
                WHERE id = ?
                `
            )
            .get(id) as Record<string, unknown> | undefined;

        if (!row) {
            return undefined;
        }

        return {
            id: String(row.id),
            actor: String(row.actor),
            connectionId: String(row.connection_id),
            baselineSnapshotId: String(row.baseline_snapshot_id),
            targetSnapshotId: row.target_snapshot_id
                ? String(row.target_snapshot_id)
                : null,
            preApplySnapshotId: row.pre_apply_snapshot_id
                ? String(row.pre_apply_snapshot_id)
                : null,
            postApplySnapshotId: row.post_apply_snapshot_id
                ? String(row.post_apply_snapshot_id)
                : null,
            changePlanId: String(row.change_plan_id),
            sqlStatements: parseJson<string[]>(String(row.sql_statements_json)),
            warnings: parseJson<AuditRecord['warnings']>(
                AuditWarningsJson(row.warnings_json)
            ),
            status: row.status as AuditRecord['status'],
            logs: parseJson<string[]>(String(row.logs_json)),
            error: row.error ? String(row.error) : null,
            createdAt: String(row.created_at),
            updatedAt: String(row.updated_at),
        };
    }

    private mapConnectionSummary(
        row: Record<string, unknown>
    ): ConnectionSummary {
        return {
            id: String(row.id),
            name: String(row.name),
            engine: 'postgresql',
            defaultSchemas: parseJson<string[]>(String(row.default_schemas)),
            host: String(row.host),
            port: Number(row.port),
            database: String(row.database_name),
            username: String(row.username),
            createdAt: String(row.created_at),
            updatedAt: String(row.updated_at),
        };
    }
}

const AuditWarningsJson = (value: unknown): string =>
    typeof value === 'string' ? value : '[]';
