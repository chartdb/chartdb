import { createContext } from 'react';
import type {
    ApplySchemaResponse,
    ChangePlan,
    ConnectionSummary,
    ConnectionTestResponse,
    ConnectionUpsert,
} from '@chartdb/schema-sync-core';

type ImportMode = 'replace' | 'new';

export interface SchemaSyncContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
    connections: ConnectionSummary[];
    connectionsLoading: boolean;
    selectedConnectionId?: string;
    setSelectedConnectionId: (connectionId?: string) => void;
    previewPlan?: ChangePlan;
    applyResult?: ApplySchemaResponse;
    lastConnectionTest?: ConnectionTestResponse;
    refreshConnections: () => Promise<void>;
    saveConnection: (
        payload: ConnectionUpsert,
        connectionId?: string
    ) => Promise<void>;
    deleteConnection: (connectionId: string) => Promise<void>;
    testConnectionDraft: (payload: ConnectionUpsert) => Promise<void>;
    importLiveSchema: (params: {
        connectionId: string;
        schemas: string[];
        mode: ImportMode;
    }) => Promise<void>;
    refreshFromDatabase: () => Promise<void>;
    previewChanges: () => Promise<void>;
    applyChanges: (confirmationText: string) => Promise<void>;
}

export const SchemaSyncContext = createContext<
    SchemaSyncContextValue | undefined
>(undefined);
