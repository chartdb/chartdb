import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/tabs/tabs';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { Textarea } from '@/components/textarea/textarea';
import { Badge } from '@/components/badge/badge';
import { Separator } from '@/components/separator/separator';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useSchemaSync } from '../hooks/use-schema-sync';
import type { ConnectionUpsert } from '@chartdb/schema-sync-core';
import { useChartDB } from '@/hooks/use-chartdb';
import { useToast } from '@/components/toast/use-toast';

const initialConnectionDraft: ConnectionUpsert = {
    name: '',
    engine: 'postgresql',
    defaultSchemas: ['public'],
    secret: {
        host: 'localhost',
        port: 5432,
        database: '',
        username: '',
        password: '',
        sslMode: 'prefer',
    },
};

export const SchemaSyncDialog: React.FC = () => {
    const {
        open,
        setOpen,
        connections,
        selectedConnectionId,
        setSelectedConnectionId,
        previewPlan,
        applyResult,
        lastConnectionTest,
        saveConnection,
        deleteConnection,
        testConnectionDraft,
        importLiveSchema,
        refreshFromDatabase,
        previewChanges,
        applyChanges,
    } = useSchemaSync();
    const { currentDiagram } = useChartDB();
    const { toast } = useToast();
    const [draft, setDraft] = useState<ConnectionUpsert>(
        initialConnectionDraft
    );
    const [editingConnectionId, setEditingConnectionId] = useState<string>();
    const [importSchemas, setImportSchemas] = useState('public');
    const [importMode, setImportMode] = useState<'replace' | 'new'>('replace');
    const [confirmationText, setConfirmationText] = useState('');
    const [busyAction, setBusyAction] = useState<string>();

    const selectedConnection = useMemo(
        () =>
            connections.find(
                (connection) => connection.id === selectedConnectionId
            ),
        [connections, selectedConnectionId]
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        if (selectedConnection) {
            setDraft({
                name: selectedConnection.name,
                engine: 'postgresql',
                defaultSchemas: selectedConnection.defaultSchemas,
                secret: {
                    host: selectedConnection.host,
                    port: selectedConnection.port,
                    database: selectedConnection.database,
                    username: selectedConnection.username,
                    password: '',
                    sslMode: 'prefer',
                },
            });
            setEditingConnectionId(selectedConnection.id);
            setImportSchemas(
                (
                    currentDiagram.schemaSync?.importedSchemas ??
                    selectedConnection.defaultSchemas
                ).join(', ')
            );
        } else {
            setDraft(initialConnectionDraft);
            setEditingConnectionId(undefined);
        }
    }, [currentDiagram.schemaSync?.importedSchemas, open, selectedConnection]);

    const schemaList = importSchemas
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    const destructiveWarnings =
        previewPlan?.warnings.filter(
            (warning) => warning.level === 'destructive'
        ) ?? [];
    const blockedWarnings =
        previewPlan?.warnings.filter((warning) => warning.level === 'blocked') ??
        [];

    const run = async (key: string, fn: () => Promise<void>) => {
        setBusyAction(key);
        try {
            await fn();
        } catch (error) {
            toast({
                title: 'Schema sync action failed',
                description:
                    error instanceof Error
                        ? error.message
                        : 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setBusyAction(undefined);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="flex h-[85vh] w-[min(1100px,96vw)] max-w-none flex-col">
                <DialogHeader>
                    <DialogTitle>Schema Sync</DialogTitle>
                </DialogHeader>

                <Tabs
                    defaultValue="connections"
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="connections">
                            Manage Connections
                        </TabsTrigger>
                        <TabsTrigger value="import">
                            Import Live Schema
                        </TabsTrigger>
                        <TabsTrigger value="preview">
                            Preview & Apply
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="connections" className="min-h-0 flex-1">
                        <div className="grid h-full gap-4 md:grid-cols-[260px_1fr]">
                            <div className="rounded-md border">
                                <div className="flex items-center justify-between border-b px-3 py-2">
                                    <div className="text-sm font-semibold">
                                        Saved Connections
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedConnectionId(undefined);
                                            setEditingConnectionId(undefined);
                                            setDraft(initialConnectionDraft);
                                        }}
                                    >
                                        New
                                    </Button>
                                </div>
                                <ScrollArea className="h-[56vh]">
                                    <div className="flex flex-col p-2">
                                        {connections.map((connection) => (
                                            <button
                                                key={connection.id}
                                                type="button"
                                                className={`rounded-md px-3 py-2 text-left text-sm ${selectedConnectionId === connection.id ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
                                                onClick={() =>
                                                    setSelectedConnectionId(
                                                        connection.id
                                                    )
                                                }
                                            >
                                                <div className="font-medium">
                                                    {connection.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {connection.host}:
                                                    {connection.port} /{' '}
                                                    {connection.database}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="rounded-md border p-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            Connection Name
                                        </label>
                                        <Input
                                            value={draft.name}
                                            onChange={(event) =>
                                                setDraft((current) => ({
                                                    ...current,
                                                    name: event.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            Schemas
                                        </label>
                                        <Input
                                            value={draft.defaultSchemas.join(
                                                ', '
                                            )}
                                            onChange={(event) =>
                                                setDraft((current) => ({
                                                    ...current,
                                                    defaultSchemas:
                                                        event.target.value
                                                            .split(',')
                                                            .map((value) =>
                                                                value.trim()
                                                            )
                                                            .filter(Boolean),
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            Host
                                        </label>
                                        <Input
                                            value={draft.secret.host}
                                            onChange={(event) =>
                                                setDraft((current) => ({
                                                    ...current,
                                                    secret: {
                                                        ...current.secret,
                                                        host: event.target
                                                            .value,
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            Port
                                        </label>
                                        <Input
                                            type="number"
                                            value={draft.secret.port}
                                            onChange={(event) =>
                                                setDraft((current) => ({
                                                    ...current,
                                                    secret: {
                                                        ...current.secret,
                                                        port:
                                                            Number.parseInt(
                                                                event.target
                                                                    .value,
                                                                10
                                                            ) || 5432,
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            Database
                                        </label>
                                        <Input
                                            value={draft.secret.database}
                                            onChange={(event) =>
                                                setDraft((current) => ({
                                                    ...current,
                                                    secret: {
                                                        ...current.secret,
                                                        database:
                                                            event.target.value,
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            Username
                                        </label>
                                        <Input
                                            value={draft.secret.username}
                                            onChange={(event) =>
                                                setDraft((current) => ({
                                                    ...current,
                                                    secret: {
                                                        ...current.secret,
                                                        username:
                                                            event.target.value,
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2 md:col-span-2">
                                        <label className="text-sm font-medium">
                                            Password{' '}
                                            {editingConnectionId
                                                ? '(required again to update securely)'
                                                : ''}
                                        </label>
                                        <Input
                                            type="password"
                                            value={draft.secret.password}
                                            onChange={(event) =>
                                                setDraft((current) => ({
                                                    ...current,
                                                    secret: {
                                                        ...current.secret,
                                                        password:
                                                            event.target.value,
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                {lastConnectionTest ? (
                                    <div className="mt-4 rounded-md border bg-secondary/30 p-3 text-sm">
                                        <div className="font-medium">
                                            {lastConnectionTest.ok
                                                ? 'Test Connection: Success'
                                                : 'Test Connection: Failed'}
                                        </div>
                                        {lastConnectionTest.version ? (
                                            <div className="text-xs text-muted-foreground">
                                                {lastConnectionTest.version}
                                            </div>
                                        ) : null}
                                        {lastConnectionTest.availableSchemas
                                            .length > 0 ? (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {lastConnectionTest.availableSchemas.map(
                                                    (schema) => (
                                                        <Badge
                                                            key={schema}
                                                            variant="secondary"
                                                        >
                                                            {schema}
                                                        </Badge>
                                                    )
                                                )}
                                            </div>
                                        ) : null}
                                        {lastConnectionTest.error ? (
                                            <div className="mt-2 text-xs text-destructive">
                                                {lastConnectionTest.error}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Button
                                        onClick={() =>
                                            run('test-connection', async () => {
                                                await testConnectionDraft(
                                                    draft,
                                                    editingConnectionId
                                                );
                                            })
                                        }
                                        disabled={
                                            busyAction === 'test-connection'
                                        }
                                    >
                                        Test Connection
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            run('save-connection', async () => {
                                                await saveConnection(
                                                    draft,
                                                    editingConnectionId
                                                );
                                            })
                                        }
                                        disabled={
                                            busyAction === 'save-connection'
                                        }
                                    >
                                        {editingConnectionId
                                            ? 'Update Connection'
                                            : 'Save Connection'}
                                    </Button>
                                    {editingConnectionId ? (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                run(
                                                    'delete-connection',
                                                    async () => {
                                                        await deleteConnection(
                                                            editingConnectionId
                                                        );
                                                    }
                                                )
                                            }
                                            disabled={
                                                busyAction ===
                                                'delete-connection'
                                            }
                                        >
                                            Delete Connection
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="import" className="min-h-0 flex-1">
                        <div className="grid gap-4">
                            <div className="rounded-md border p-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            Connection
                                        </label>
                                        <select
                                            className="h-10 rounded-md border bg-background px-3 text-sm"
                                            value={selectedConnectionId ?? ''}
                                            onChange={(event) =>
                                                setSelectedConnectionId(
                                                    event.target.value ||
                                                        undefined
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select a connection
                                            </option>
                                            {connections.map((connection) => (
                                                <option
                                                    key={connection.id}
                                                    value={connection.id}
                                                >
                                                    {connection.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">
                                            Schemas to Import
                                        </label>
                                        <Input
                                            value={importSchemas}
                                            onChange={(event) =>
                                                setImportSchemas(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="public, auth"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 rounded-md border bg-secondary/20 p-3 text-sm">
                                    <div className="font-medium">
                                        Import Behavior
                                    </div>
                                    <div className="mt-2 flex gap-3">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                checked={
                                                    importMode === 'replace'
                                                }
                                                onChange={() =>
                                                    setImportMode('replace')
                                                }
                                            />
                                            Replace current diagram
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                checked={importMode === 'new'}
                                                onChange={() =>
                                                    setImportMode('new')
                                                }
                                            />
                                            Create new diagram
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Button
                                        onClick={() =>
                                            run('import-live', async () => {
                                                if (!selectedConnectionId) {
                                                    throw new Error(
                                                        'Select a connection first.'
                                                    );
                                                }
                                                await importLiveSchema({
                                                    connectionId:
                                                        selectedConnectionId,
                                                    schemas:
                                                        schemaList.length > 0
                                                            ? schemaList
                                                            : ['public'],
                                                    mode: importMode,
                                                });
                                            })
                                        }
                                        disabled={
                                            !selectedConnectionId ||
                                            busyAction === 'import-live'
                                        }
                                    >
                                        Import Live Schema
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            run('refresh-db', async () => {
                                                await refreshFromDatabase();
                                            })
                                        }
                                        disabled={busyAction === 'refresh-db'}
                                    >
                                        Refresh From Database
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="preview" className="min-h-0 flex-1">
                        <div className="grid h-full gap-4 md:grid-cols-[320px_1fr]">
                            <div className="rounded-md border p-4">
                                <div className="text-sm font-semibold">
                                    Preview & Apply
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground">
                                    Baseline snapshot:{' '}
                                    {currentDiagram.schemaSync
                                        ?.baselineSnapshotId ?? 'None yet'}
                                </div>
                                <div className="mt-4 flex flex-col gap-2">
                                    <Button
                                        onClick={() =>
                                            run('preview', async () => {
                                                await previewChanges();
                                            })
                                        }
                                        disabled={busyAction === 'preview'}
                                    >
                                        Preview Changes
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            run('apply', async () => {
                                                await applyChanges(
                                                    confirmationText
                                                );
                                            })
                                        }
                                        disabled={
                                            !previewPlan ||
                                            previewPlan.blocked ||
                                            busyAction === 'apply'
                                        }
                                    >
                                        Apply Changes
                                    </Button>
                                </div>

                                {previewPlan?.blocked ? (
                                    <>
                                        <Separator className="my-4" />
                                        <div className="text-sm font-semibold text-destructive">
                                            Apply blocked
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            Resolve the blocked warnings before
                                            applying this plan.
                                        </div>
                                    </>
                                ) : null}

                                {destructiveWarnings.length > 0 ? (
                                    <>
                                        <Separator className="my-4" />
                                        <div className="text-sm font-semibold">
                                            Destructive Confirmation
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            Type{' '}
                                            <code>
                                                APPLY DESTRUCTIVE CHANGES
                                            </code>{' '}
                                            to approve drops.
                                        </div>
                                        <Input
                                            className="mt-2"
                                            value={confirmationText}
                                            onChange={(event) =>
                                                setConfirmationText(
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </>
                                ) : null}
                            </div>

                            <div className="rounded-md border p-4">
                                <Tabs
                                    defaultValue="summary"
                                    className="flex h-full flex-col"
                                >
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="summary">
                                            Summary
                                        </TabsTrigger>
                                        <TabsTrigger value="diff">
                                            Detailed Diff
                                        </TabsTrigger>
                                        <TabsTrigger value="sql">
                                            Generated SQL
                                        </TabsTrigger>
                                        <TabsTrigger value="warnings">
                                            Risk Warnings
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent
                                        value="summary"
                                        className="min-h-0 flex-1"
                                    >
                                        {previewPlan ? (
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div className="rounded-md border p-3">
                                                    <div className="text-sm font-semibold">
                                                        Counts
                                                    </div>
                                                    <div className="mt-2 text-sm">
                                                        Total:{' '}
                                                        {
                                                            previewPlan.summary
                                                                .totalChanges
                                                        }
                                                    </div>
                                                    <div className="text-sm">
                                                        Safe:{' '}
                                                        {
                                                            previewPlan.summary
                                                                .safeChanges
                                                        }
                                                    </div>
                                                    <div className="text-sm">
                                                        Warning:{' '}
                                                        {
                                                            previewPlan.summary
                                                                .warningChanges
                                                        }
                                                    </div>
                                                    <div className="text-sm">
                                                        Destructive:{' '}
                                                        {
                                                            previewPlan.summary
                                                                .destructiveChanges
                                                        }
                                                    </div>
                                                </div>
                                                <div className="rounded-md border p-3">
                                                    <div className="text-sm font-semibold">
                                                        Status
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <Badge variant="secondary">
                                                            {previewPlan.requiresConfirmation
                                                                ? 'Needs confirmation'
                                                                : 'Ready to apply'}
                                                        </Badge>
                                                        <Badge variant="secondary">
                                                            {previewPlan.blocked
                                                                ? 'Blocked'
                                                                : 'Not blocked'}
                                                        </Badge>
                                                    </div>
                                                    {blockedWarnings.length >
                                                    0 ? (
                                                        <div className="mt-3 text-sm text-destructive">
                                                            {
                                                                blockedWarnings[0]
                                                                    .message
                                                            }
                                                        </div>
                                                    ) : null}
                                                </div>
                                                {applyResult ? (
                                                    <div className="rounded-md border p-3 md:col-span-2">
                                                        <div className="text-sm font-semibold">
                                                            Post-apply result
                                                        </div>
                                                        <div className="mt-2 text-sm">
                                                            Status:{' '}
                                                            {applyResult.status}
                                                        </div>
                                                        {applyResult.error ? (
                                                            <div className="mt-2 text-sm text-destructive">
                                                                {
                                                                    applyResult.error
                                                                }
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">
                                                Run Preview Changes to compute a
                                                persisted change plan.
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent
                                        value="diff"
                                        className="min-h-0 flex-1"
                                    >
                                        <ScrollArea className="h-[52vh]">
                                            <div className="flex flex-col gap-2 pr-4">
                                                {previewPlan?.changes.map(
                                                    (change) => (
                                                        <div
                                                            key={change.id}
                                                            className="rounded-md border p-3 text-sm"
                                                        >
                                                            <div className="font-medium">
                                                                {change.kind}
                                                            </div>
                                                            <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                                                                {JSON.stringify(
                                                                    change,
                                                                    null,
                                                                    2
                                                                )}
                                                            </pre>
                                                        </div>
                                                    )
                                                ) ?? (
                                                    <div className="text-sm text-muted-foreground">
                                                        No preview available
                                                        yet.
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>

                                    <TabsContent
                                        value="sql"
                                        className="min-h-0 flex-1"
                                    >
                                        <ScrollArea className="h-[52vh]">
                                            <Textarea
                                                readOnly
                                                className="min-h-[48vh] font-mono text-xs"
                                                value={
                                                    previewPlan?.sqlStatements.join(
                                                        '\n\n'
                                                    ) ?? ''
                                                }
                                                placeholder="Generated migration SQL will appear here after preview."
                                            />
                                        </ScrollArea>
                                    </TabsContent>

                                    <TabsContent
                                        value="warnings"
                                        className="min-h-0 flex-1"
                                    >
                                        <ScrollArea className="h-[52vh]">
                                            <div className="flex flex-col gap-2 pr-4">
                                                {previewPlan?.warnings
                                                    .length ? (
                                                    previewPlan.warnings.map(
                                                        (warning, index) => (
                                                            <div
                                                                key={`${warning.code}-${index}`}
                                                                className={`rounded-md border p-3 ${
                                                                    warning.level ===
                                                                    'blocked'
                                                                        ? 'border-destructive bg-destructive/5'
                                                                        : ''
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="secondary">
                                                                        {
                                                                            warning.level
                                                                        }
                                                                    </Badge>
                                                                    <div className="text-sm font-medium">
                                                                        {
                                                                            warning.title
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 text-sm text-muted-foreground">
                                                                    {
                                                                        warning.message
                                                                    }
                                                                </div>
                                                            </div>
                                                        )
                                                    )
                                                ) : (
                                                    <div className="text-sm text-muted-foreground">
                                                        No warnings generated
                                                        yet.
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
