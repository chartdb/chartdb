import { API_BASE_URL } from '@/lib/env';
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

const apiPath = (path: string) =>
    `${API_BASE_URL}${path.startsWith('/api') ? path : `/api${path}`}`;

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(apiPath(path), {
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
        ...init,
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as unknown) : {};

    if (!response.ok) {
        const error =
            typeof payload === 'object' &&
            payload &&
            'error' in payload &&
            typeof payload.error === 'string'
                ? payload.error
                : `Request to ${path} failed`;
        throw new Error(error);
    }

    return payload as T;
};

export const schemaSyncClient = {
    getConnections: async () =>
        request<{ items: ConnectionSummary[] }>('/api/connections'),
    createConnection: async (payload: ConnectionUpsert) =>
        request<{ connection: ConnectionSummary }>('/api/connections', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    updateConnection: async (id: string, payload: ConnectionUpsert) =>
        request<{ connection: ConnectionSummary }>(`/api/connections/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),
    deleteConnection: async (id: string) =>
        request<{ ok: boolean }>(`/api/connections/${id}`, {
            method: 'DELETE',
        }),
    testConnection: async (payload: ConnectionTestRequest) =>
        request<ConnectionTestResponse>('/api/connections/test', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    importLiveSchema: async (payload: ImportLiveSchemaRequest) =>
        request<ImportLiveSchemaResponse>('/api/schema/import-live', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    previewChanges: async (payload: {
        baselineSnapshotId: string;
        targetSchema: CanonicalSchema;
        actor: string;
    }) =>
        request<{ plan: ChangePlan }>('/api/schema/diff', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    applyChanges: async (payload: ApplySchemaRequest) =>
        request<ApplySchemaResponse>('/api/schema/apply', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    getAudit: async (auditId: string) =>
        request<AuditRecord>(`/api/audit/${auditId}`),
};
