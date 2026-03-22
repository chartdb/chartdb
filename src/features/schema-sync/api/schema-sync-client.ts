import { requestJson } from '@/lib/api/request';
import type {
    ApplySchemaRequest,
    ApplySchemaResponse,
    AuditRecord,
    CanonicalSchema,
    ChangePlan,
    ConnectionSummary,
    ConnectionTestRequest,
    ConnectionTestResponse,
    ConnectionUpsert,
    ImportLiveSchemaRequest,
    ImportLiveSchemaResponse,
} from '@chartdb/schema-sync-core';

export const schemaSyncClient = {
    getConnections: async () =>
        requestJson<{ items: ConnectionSummary[] }>('/api/connections'),
    createConnection: async (payload: ConnectionUpsert) =>
        requestJson<{ connection: ConnectionSummary }>('/api/connections', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    updateConnection: async (id: string, payload: ConnectionUpsert) =>
        requestJson<{ connection: ConnectionSummary }>(
            `/api/connections/${id}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
            }
        ),
    deleteConnection: async (id: string) =>
        requestJson<{ ok: boolean }>(`/api/connections/${id}`, {
            method: 'DELETE',
        }),
    testConnection: async (payload: ConnectionTestRequest) =>
        requestJson<ConnectionTestResponse>('/api/connections/test', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    importLiveSchema: async (payload: ImportLiveSchemaRequest) =>
        requestJson<ImportLiveSchemaResponse>('/api/schema/import-live', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    previewChanges: async (payload: {
        baselineSnapshotId: string;
        targetSchema: CanonicalSchema;
        actor: string;
    }) =>
        requestJson<{ plan: ChangePlan }>('/api/schema/diff', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    applyChanges: async (payload: ApplySchemaRequest) =>
        requestJson<ApplySchemaResponse>('/api/schema/apply', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    getAudit: async (auditId: string) =>
        requestJson<AuditRecord>(`/api/audit/${auditId}`),
};
