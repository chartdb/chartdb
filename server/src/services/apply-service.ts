import type {
    ApplySchemaRequest,
    ApplySchemaResponse,
    AuditRecord,
    DatabaseConnectionSecret,
    RiskWarning,
    SchemaChange,
} from '@chartdb/schema-sync-core';
import { generateId } from '../utils/id.js';
import type { MetadataRepository } from '../repositories/metadata-repository.js';
import type { ConnectionsService } from './connections-service.js';
import type { SchemaSyncService } from './schema-sync-service.js';
import { introspectPostgresSchema } from '../postgres/introspection.js';
import { Client } from 'pg';
import { hashCanonicalSchema } from '@chartdb/schema-sync-core';

const quoteIdent = (value: string) => `"${value.replace(/"/g, '""')}"`;
const qualify = (schemaName: string, tableName: string) =>
    `${quoteIdent(schemaName)}.${quoteIdent(tableName)}`;

const requiresDestructiveApproval = (warnings: RiskWarning[]) =>
    warnings.some((warning) => warning.level === 'destructive');

const expectedConfirmationText = 'APPLY DESTRUCTIVE CHANGES';

export class ApplyService {
    constructor(
        private readonly repository: MetadataRepository,
        private readonly connectionsService: ConnectionsService,
        private readonly schemaSyncService: SchemaSyncService
    ) {}

    private async makeClient(secret: DatabaseConnectionSecret) {
        const client = new Client({
            host: secret.host,
            port: secret.port,
            database: secret.database,
            user: secret.username,
            password: secret.password,
            ssl:
                secret.sslMode === 'disable'
                    ? false
                    : { rejectUnauthorized: false },
        });
        await client.connect();
        return client;
    }

    private async validatePlanPreflight(
        client: Client,
        changes: SchemaChange[],
        logs: string[]
    ) {
        for (const change of changes) {
            if (
                change.kind === 'alter_column_nullability' &&
                change.toNullable === false
            ) {
                const result = await client.query<{ count: string }>(
                    `SELECT COUNT(*)::text AS count FROM ${qualify(
                        change.schemaName,
                        change.tableName
                    )} WHERE ${quoteIdent(change.columnName)} IS NULL`
                );
                const count = Number.parseInt(result.rows[0]?.count ?? '0', 10);
                logs.push(
                    `Preflight check ${change.tableName}.${change.columnName}: ${count} null rows`
                );
                if (count > 0) {
                    throw new Error(
                        `Cannot set ${change.tableName}.${change.columnName} to NOT NULL while ${count} rows still contain NULL values.`
                    );
                }
            }
        }
    }

    async applyPlan(request: ApplySchemaRequest): Promise<ApplySchemaResponse> {
        const plan = this.schemaSyncService.getChangePlan(request.planId);
        const baselineSnapshot = this.repository.getSnapshot(
            plan.baselineSnapshotId
        );
        if (!baselineSnapshot) {
            throw new Error(
                `Baseline snapshot ${plan.baselineSnapshotId} not found`
            );
        }

        if (plan.blocked) {
            throw new Error('This plan is blocked and cannot be applied.');
        }

        if (
            requiresDestructiveApproval(plan.warnings) &&
            (!request.destructiveApproval.confirmed ||
                request.destructiveApproval.confirmationText.trim() !==
                    expectedConfirmationText)
        ) {
            throw new Error(
                `Destructive changes require confirmation text: ${expectedConfirmationText}`
            );
        }

        const jobId = generateId();
        const auditId = generateId();
        const now = new Date().toISOString();
        const logs: string[] = ['Apply requested'];
        const executedStatements: string[] = [];

        const audit: AuditRecord = {
            id: auditId,
            actor: request.actor,
            connectionId: plan.connectionId,
            baselineSnapshotId: plan.baselineSnapshotId,
            targetSnapshotId: null,
            preApplySnapshotId: null,
            postApplySnapshotId: null,
            changePlanId: plan.id,
            sqlStatements: plan.sqlStatements,
            warnings: plan.warnings,
            status: 'running',
            logs,
            error: null,
            createdAt: now,
            updatedAt: now,
        };
        this.repository.putAudit(audit);
        this.repository.putApplyJob({
            id: jobId,
            planId: plan.id,
            auditId,
            status: 'running',
            logs,
            executedStatements,
            error: null,
            createdAt: now,
            updatedAt: now,
        });

        const secret = this.connectionsService.getDecryptedSecret(
            plan.connectionId
        );
        const liveSchema = await introspectPostgresSchema({
            secret,
            schemas: baselineSnapshot.importedSchemas,
        });
        const liveFingerprint =
            liveSchema.fingerprint ?? hashCanonicalSchema(liveSchema);
        if (liveFingerprint !== plan.baselineFingerprint) {
            throw new Error(
                'Live database schema drift detected. Refresh from database before applying changes.'
            );
        }

        const preApplySnapshotId = generateId();
        this.repository.putSnapshot({
            id: preApplySnapshotId,
            connectionId: plan.connectionId,
            kind: 'pre_apply',
            fingerprint: liveFingerprint,
            importedSchemas: baselineSnapshot.importedSchemas,
            schema: liveSchema,
            createdAt: new Date().toISOString(),
        });

        const client = await this.makeClient(secret);
        try {
            await this.validatePlanPreflight(client, plan.changes, logs);

            await client.query('BEGIN');
            logs.push('Transaction started');

            for (const statement of plan.sqlStatements) {
                logs.push(`Executing: ${statement}`);
                await client.query(statement);
                executedStatements.push(statement);
            }

            await client.query('COMMIT');
            logs.push('Transaction committed');
        } catch (error) {
            await client.query('ROLLBACK');
            logs.push('Transaction rolled back');
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to apply plan.';

            this.repository.putAudit({
                ...audit,
                preApplySnapshotId,
                status: 'failed',
                logs,
                error: message,
                updatedAt: new Date().toISOString(),
            });
            this.repository.putApplyJob({
                id: jobId,
                planId: plan.id,
                auditId,
                status: 'failed',
                logs,
                executedStatements,
                error: message,
                createdAt: now,
                updatedAt: new Date().toISOString(),
            });
            throw error;
        } finally {
            await client.end();
        }

        const postApplySchema = await introspectPostgresSchema({
            secret,
            schemas: baselineSnapshot.importedSchemas,
        });
        const postApplySnapshotId = generateId();
        this.repository.putSnapshot({
            id: postApplySnapshotId,
            connectionId: plan.connectionId,
            kind: 'post_apply',
            fingerprint:
                postApplySchema.fingerprint ??
                hashCanonicalSchema(postApplySchema),
            importedSchemas: baselineSnapshot.importedSchemas,
            schema: postApplySchema,
            createdAt: new Date().toISOString(),
        });

        this.repository.putAudit({
            ...audit,
            preApplySnapshotId,
            postApplySnapshotId,
            status: 'succeeded',
            logs,
            error: null,
            updatedAt: new Date().toISOString(),
        });
        this.repository.putApplyJob({
            id: jobId,
            planId: plan.id,
            auditId,
            status: 'succeeded',
            logs,
            executedStatements,
            error: null,
            createdAt: now,
            updatedAt: new Date().toISOString(),
        });

        return {
            jobId,
            status: 'succeeded',
            executedStatements,
            logs,
            error: null,
            auditId,
            postApplySnapshotId,
        };
    }
}
