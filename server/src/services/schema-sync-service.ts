import {
    createChangePlan,
    hashCanonicalSchema,
    type AuditRecord,
    type ChangePlan,
    type DiffSchemaRequest,
    type DiffSchemaResponse,
    type ImportLiveSchemaRequest,
    type ImportLiveSchemaResponse,
} from '@chartdb/schema-sync-core';
import type {
    MetadataRepository,
    StoredSnapshot,
} from '../repositories/metadata-repository.js';
import { generateId } from '../utils/id.js';
import { introspectPostgresSchema } from '../postgres/introspection.js';
import type { ConnectionsService } from './connections-service.js';

export class SchemaSyncService {
    constructor(
        private readonly repository: MetadataRepository,
        private readonly connectionsService: ConnectionsService
    ) {}

    async importLiveSchema(
        request: ImportLiveSchemaRequest
    ): Promise<ImportLiveSchemaResponse> {
        const connection = this.repository.getConnection(request.connectionId);
        if (!connection) {
            throw new Error(`Connection ${request.connectionId} not found`);
        }

        const secret = this.connectionsService.getDecryptedSecret(
            request.connectionId
        );
        const canonicalSchema = await introspectPostgresSchema({
            secret,
            schemas:
                request.schemas.length > 0
                    ? request.schemas
                    : connection.defaultSchemas,
        });
        const fingerprint = hashCanonicalSchema(canonicalSchema);
        const snapshotId = generateId();
        const snapshot: StoredSnapshot = {
            id: snapshotId,
            connectionId: connection.id,
            kind: 'baseline',
            fingerprint,
            importedSchemas:
                request.schemas.length > 0
                    ? request.schemas
                    : connection.defaultSchemas,
            schema: canonicalSchema,
            createdAt: new Date().toISOString(),
        };

        this.repository.putSnapshot(snapshot);

        return {
            connection,
            snapshotId,
            fingerprint,
            canonicalSchema,
        };
    }

    async diffSchema(request: DiffSchemaRequest): Promise<DiffSchemaResponse> {
        const baseline = this.repository.getSnapshot(
            request.baselineSnapshotId
        );
        if (!baseline) {
            throw new Error(
                `Baseline snapshot ${request.baselineSnapshotId} not found`
            );
        }

        const targetSnapshotId = generateId();
        this.repository.putSnapshot({
            id: targetSnapshotId,
            connectionId: baseline.connectionId,
            kind: 'target',
            fingerprint: hashCanonicalSchema(request.targetSchema),
            importedSchemas: request.targetSchema.schemaNames,
            schema: request.targetSchema,
            createdAt: new Date().toISOString(),
        });

        const plan = createChangePlan({
            id: generateId(),
            baselineSnapshotId: baseline.id,
            connectionId: baseline.connectionId,
            baseline: baseline.schema,
            target: request.targetSchema,
        });
        this.repository.putChangePlan(plan);

        const audit: AuditRecord = {
            id: generateId(),
            actor: request.actor,
            connectionId: baseline.connectionId,
            baselineSnapshotId: baseline.id,
            targetSnapshotId,
            preApplySnapshotId: null,
            postApplySnapshotId: null,
            changePlanId: plan.id,
            sqlStatements: plan.sqlStatements,
            warnings: plan.warnings,
            status: 'pending',
            logs: ['Preview generated'],
            error: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.repository.putAudit(audit);

        return { plan };
    }

    getChangePlan(planId: string): ChangePlan {
        const plan = this.repository.getChangePlan(planId);
        if (!plan) {
            throw new Error(`Change plan ${planId} not found`);
        }
        return plan;
    }
}
