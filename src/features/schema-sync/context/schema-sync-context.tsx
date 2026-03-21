import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
    ApplySchemaResponse,
    ChangePlan,
    ConnectionSummary,
    ConnectionTestResponse,
    ConnectionUpsert,
} from '@chartdb/schema-sync-core';
import { schemaSyncClient } from '../api/schema-sync-client';
import {
    canonicalSchemaToDiagram,
    diagramToCanonicalSchema,
} from '../lib/canonical-adapters';
import { useChartDB } from '@/hooks/use-chartdb';
import { useStorage } from '@/hooks/use-storage';
import { useNavigate } from 'react-router-dom';
import { generateDiagramId } from '@/lib/utils';
import { useToast } from '@/components/toast/use-toast';
import { useConfig } from '@/hooks/use-config';
import {
    SchemaSyncContext,
    type SchemaSyncContextValue,
} from './schema-sync-context-object';

type ImportMode = 'replace' | 'new';

export const SchemaSyncProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [open, setOpen] = useState(false);
    const [connections, setConnections] = useState<ConnectionSummary[]>([]);
    const [connectionsLoading, setConnectionsLoading] = useState(false);
    const [selectedConnectionId, setSelectedConnectionIdState] = useState<
        string | undefined
    >();
    const [previewPlan, setPreviewPlan] = useState<ChangePlan>();
    const [applyResult, setApplyResult] = useState<ApplySchemaResponse>();
    const [lastConnectionTest, setLastConnectionTest] =
        useState<ConnectionTestResponse>();
    const { currentDiagram, updateDiagramData } = useChartDB();
    const storage = useStorage();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { updateConfig } = useConfig();

    const refreshConnections = useCallback(async () => {
        setConnectionsLoading(true);
        try {
            const response = await schemaSyncClient.getConnections();
            setConnections(response.items);
            setSelectedConnectionIdState(
                (current) => current ?? response.items[0]?.id
            );
        } finally {
            setConnectionsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshConnections();
    }, [refreshConnections]);

    const setSelectedConnectionId = useCallback((connectionId?: string) => {
        setSelectedConnectionIdState(connectionId);
    }, []);

    const updateDiagramSyncMetadata = useCallback(
        async (
            attributes: Partial<NonNullable<typeof currentDiagram.schemaSync>>
        ) => {
            await updateDiagramData(
                {
                    ...currentDiagram,
                    schemaSync: {
                        ...(currentDiagram.schemaSync ?? {}),
                        ...attributes,
                    },
                    updatedAt: new Date(),
                },
                { forceUpdateStorage: true }
            );
        },
        [currentDiagram, updateDiagramData]
    );

    const saveConnection = useCallback(
        async (payload: ConnectionUpsert, connectionId?: string) => {
            if (connectionId) {
                const response = await schemaSyncClient.updateConnection(
                    connectionId,
                    payload
                );
                setSelectedConnectionIdState(response.connection.id);
                toast({
                    title: 'Connection updated',
                    description: `${response.connection.name} is ready to use.`,
                });
            } else {
                const response =
                    await schemaSyncClient.createConnection(payload);
                setSelectedConnectionIdState(response.connection.id);
                toast({
                    title: 'Connection saved',
                    description: `${response.connection.name} is ready to use.`,
                });
            }

            await refreshConnections();
        },
        [refreshConnections, toast]
    );

    const deleteConnection = useCallback(
        async (connectionId: string) => {
            await schemaSyncClient.deleteConnection(connectionId);
            setPreviewPlan(undefined);
            setApplyResult(undefined);
            toast({
                title: 'Connection removed',
            });
            await refreshConnections();
        },
        [refreshConnections, toast]
    );

    const testConnectionDraft = useCallback(
        async (payload: ConnectionUpsert) => {
            const result = await schemaSyncClient.testConnection({
                connection: payload,
            });
            setLastConnectionTest(result);
        },
        []
    );

    const importLiveSchema = useCallback(
        async ({
            connectionId,
            schemas,
            mode,
        }: {
            connectionId: string;
            schemas: string[];
            mode: ImportMode;
        }) => {
            const response = await schemaSyncClient.importLiveSchema({
                connectionId,
                schemas,
            });
            const nextSchemaSync = {
                connectionId: response.connection.id,
                baselineSnapshotId: response.snapshotId,
                baselineFingerprint: response.fingerprint,
                importedSchemas: schemas,
                lastImportedAt: new Date().toISOString(),
                lastPreviewPlanId: null,
                lastPreviewedAt: null,
            };

            if (mode === 'replace') {
                const diagram = canonicalSchemaToDiagram({
                    canonicalSchema: response.canonicalSchema,
                    diagramId: currentDiagram.id,
                    diagramName:
                        currentDiagram.name || response.connection.database,
                    schemaSync: nextSchemaSync,
                });
                await updateDiagramData(diagram, { forceUpdateStorage: true });
            } else {
                const diagram = canonicalSchemaToDiagram({
                    canonicalSchema: response.canonicalSchema,
                    diagramId: generateDiagramId(),
                    diagramName: response.connection.database,
                    schemaSync: nextSchemaSync,
                });
                await storage.addDiagram({ diagram });
                await updateConfig({
                    config: { defaultDiagramId: diagram.id },
                });
                navigate(`/diagrams/${diagram.id}`);
            }

            setSelectedConnectionIdState(connectionId);
            setPreviewPlan(undefined);
            setApplyResult(undefined);
            toast({
                title: 'Live schema imported',
                description:
                    'The canvas is now backed by a fresh baseline snapshot.',
            });
        },
        [
            currentDiagram.id,
            currentDiagram.name,
            navigate,
            storage,
            toast,
            updateConfig,
            updateDiagramData,
        ]
    );

    const refreshFromDatabase = useCallback(async () => {
        const connectionId =
            currentDiagram.schemaSync?.connectionId ?? selectedConnectionId;
        if (!connectionId) {
            throw new Error('Choose a connection before refreshing.');
        }
        await importLiveSchema({
            connectionId,
            schemas: currentDiagram.schemaSync?.importedSchemas ?? ['public'],
            mode: 'replace',
        });
    }, [currentDiagram.schemaSync, importLiveSchema, selectedConnectionId]);

    const previewChanges = useCallback(async () => {
        if (!currentDiagram.schemaSync?.baselineSnapshotId) {
            throw new Error(
                'Import a live baseline before previewing changes.'
            );
        }

        const targetSchema = diagramToCanonicalSchema(currentDiagram);
        const response = await schemaSyncClient.previewChanges({
            baselineSnapshotId: currentDiagram.schemaSync.baselineSnapshotId,
            targetSchema,
            actor: 'local-user',
        });
        setPreviewPlan(response.plan);
        setApplyResult(undefined);
        await updateDiagramSyncMetadata({
            lastPreviewPlanId: response.plan.id,
            lastPreviewedAt: new Date().toISOString(),
        });
        toast({
            title: 'Preview generated',
            description: `${response.plan.summary.totalChanges} change(s) analyzed.`,
        });
    }, [currentDiagram, toast, updateDiagramSyncMetadata]);

    const applyChanges = useCallback(
        async (confirmationText: string) => {
            if (!previewPlan) {
                throw new Error('Preview changes before applying them.');
            }

            const result = await schemaSyncClient.applyChanges({
                planId: previewPlan.id,
                actor: 'local-user',
                destructiveApproval: {
                    confirmed: true,
                    confirmationText,
                },
            });
            setApplyResult(result);
            await updateDiagramSyncMetadata({
                lastAuditId: result.auditId,
                lastPostApplySnapshotId: result.postApplySnapshotId ?? null,
            });
            toast({
                title:
                    result.status === 'succeeded'
                        ? 'Schema applied'
                        : 'Schema apply failed',
                description:
                    result.status === 'succeeded'
                        ? 'Refresh from database to import the post-apply state.'
                        : (result.error ?? 'The apply job did not succeed.'),
            });
        },
        [previewPlan, toast, updateDiagramSyncMetadata]
    );

    const value = useMemo<SchemaSyncContextValue>(
        () => ({
            open,
            setOpen,
            connections,
            connectionsLoading,
            selectedConnectionId,
            setSelectedConnectionId,
            previewPlan,
            applyResult,
            lastConnectionTest,
            refreshConnections,
            saveConnection,
            deleteConnection,
            testConnectionDraft,
            importLiveSchema,
            refreshFromDatabase,
            previewChanges,
            applyChanges,
        }),
        [
            open,
            connections,
            connectionsLoading,
            selectedConnectionId,
            previewPlan,
            applyResult,
            lastConnectionTest,
            refreshConnections,
            saveConnection,
            deleteConnection,
            testConnectionDraft,
            importLiveSchema,
            refreshFromDatabase,
            previewChanges,
            applyChanges,
            setSelectedConnectionId,
        ]
    );

    return (
        <SchemaSyncContext.Provider value={value}>
            {children}
        </SchemaSyncContext.Provider>
    );
};
