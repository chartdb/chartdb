import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { StorageContext } from './storage-context';
import { storageContext } from './storage-context';
import Dexie, { type EntityTable } from 'dexie';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import { determineCardinalities } from '@/lib/domain/db-relationship';
import type { ChartDBConfig } from '@/lib/domain/config';
import type { DBDependency } from '@/lib/domain/db-dependency';
import type { Area } from '@/lib/domain/area';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';
import type { Note } from '@/lib/domain/note';
import {
    deserializeDiagram,
    persistenceClient,
    serializeDiagram,
    type PersistedDiagramRecord,
} from '@/features/persistence/api/persistence-client';

const DEFAULT_DIAGRAM_INCLUDE_OPTIONS = {
    includeRelationships: false,
    includeTables: false,
    includeDependencies: false,
    includeAreas: false,
    includeCustomTypes: false,
    includeNotes: false,
};

const FULL_DIAGRAM_INCLUDE_OPTIONS = {
    includeRelationships: true,
    includeTables: true,
    includeDependencies: true,
    includeAreas: true,
    includeCustomTypes: true,
    includeNotes: true,
};

const normalizeIncludeOptions = (
    options?: Partial<typeof DEFAULT_DIAGRAM_INCLUDE_OPTIONS>
) => ({
    ...DEFAULT_DIAGRAM_INCLUDE_OPTIONS,
    ...(options ?? {}),
});

export const StorageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const remoteProjectIdRef = useRef<string>();
    const remoteReadyRef = useRef(false);
    const remoteInitializedRef = useRef(false);
    const remoteInitPromiseRef = useRef<Promise<void> | null>(null);
    const syncTimersRef = useRef<Map<string, number>>(new Map());

    const db = useMemo(() => {
        const dexieDB = new Dexie('ChartDB') as Dexie & {
            diagrams: EntityTable<
                Diagram,
                'id' // primary key "id" (for the typings only)
            >;
            db_tables: EntityTable<
                DBTable & { diagramId: string },
                'id' // primary key "id" (for the typings only)
            >;
            db_relationships: EntityTable<
                DBRelationship & { diagramId: string },
                'id' // primary key "id" (for the typings only)
            >;
            db_dependencies: EntityTable<
                DBDependency & { diagramId: string },
                'id' // primary key "id" (for the typings only)
            >;
            areas: EntityTable<
                Area & { diagramId: string },
                'id' // primary key "id" (for the typings only)
            >;
            db_custom_types: EntityTable<
                DBCustomType & { diagramId: string },
                'id' // primary key "id" (for the typings only)
            >;
            notes: EntityTable<
                Note & { diagramId: string },
                'id' // primary key "id" (for the typings only)
            >;
            config: EntityTable<
                ChartDBConfig & { id: number },
                'id' // primary key "id" (for the typings only)
            >;
            diagram_filters: EntityTable<
                DiagramFilter & { diagramId: string },
                'diagramId' // primary key "id" (for the typings only)
            >;
        };

        // Schema declaration:
        dexieDB.version(1).stores({
            diagrams: '++id, name, databaseType, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, x, y, fields, indexes, color, createdAt, width',
            db_relationships:
                '++id, diagramId, name, sourceTableId, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(2).upgrade((tx) =>
            tx
                .table<DBTable & { diagramId: string }>('db_tables')
                .toCollection()
                .modify((table) => {
                    for (const field of table.fields) {
                        field.type = {
                            // @ts-expect-error string before
                            id: (field.type as string).split(' ').join('_'),
                            // @ts-expect-error string before
                            name: field.type,
                        };
                    }
                })
        );

        dexieDB.version(3).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, x, y, fields, indexes, color, createdAt, width',
            db_relationships:
                '++id, diagramId, name, sourceTableId, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(4).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, x, y, fields, indexes, color, createdAt, width, comment',
            db_relationships:
                '++id, diagramId, name, sourceTableId, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(5).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment',
            db_relationships:
                '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(6).upgrade((tx) =>
            tx
                .table<DBRelationship & { diagramId: string }>(
                    'db_relationships'
                )
                .toCollection()
                .modify((relationship, ref) => {
                    const { sourceCardinality, targetCardinality } =
                        determineCardinalities(
                            // @ts-expect-error string before
                            relationship.type ?? 'one_to_one'
                        );

                    relationship.sourceCardinality = sourceCardinality;
                    relationship.targetCardinality = targetCardinality;

                    // @ts-expect-error string before
                    delete ref.value.type;
                })
        );

        dexieDB.version(7).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment',
            db_relationships:
                '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            db_dependencies:
                '++id, diagramId, schema, tableId, dependentSchema, dependentTableId, createdAt',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(8).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment, isView, isMaterializedView, order',
            db_relationships:
                '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            db_dependencies:
                '++id, diagramId, schema, tableId, dependentSchema, dependentTableId, createdAt',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(9).upgrade((tx) =>
            tx
                .table<DBTable & { diagramId: string }>('db_tables')
                .toCollection()
                .modify((table) => {
                    for (const field of table.fields) {
                        if (typeof field.nullable === 'string') {
                            field.nullable =
                                (field.nullable as string).toLowerCase() ===
                                'true';
                        }
                    }
                })
        );

        dexieDB.version(10).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment, isView, isMaterializedView, order',
            db_relationships:
                '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            db_dependencies:
                '++id, diagramId, schema, tableId, dependentSchema, dependentTableId, createdAt',
            areas: '++id, diagramId, name, x, y, width, height, color',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(11).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment, isView, isMaterializedView, order',
            db_relationships:
                '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            db_dependencies:
                '++id, diagramId, schema, tableId, dependentSchema, dependentTableId, createdAt',
            areas: '++id, diagramId, name, x, y, width, height, color',
            db_custom_types:
                '++id, diagramId, schema, type, kind, values, fields',
            config: '++id, defaultDiagramId',
        });

        dexieDB
            .version(12)
            .stores({
                diagrams:
                    '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
                db_tables:
                    '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment, isView, isMaterializedView, order',
                db_relationships:
                    '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
                db_dependencies:
                    '++id, diagramId, schema, tableId, dependentSchema, dependentTableId, createdAt',
                areas: '++id, diagramId, name, x, y, width, height, color',
                db_custom_types:
                    '++id, diagramId, schema, type, kind, values, fields',
                config: '++id, defaultDiagramId',
                diagram_filters: 'diagramId, tableIds, schemasIds',
            })
            .upgrade((tx) => {
                tx.table('config').clear();
            });

        dexieDB.version(13).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment, isView, isMaterializedView, order',
            db_relationships:
                '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            db_dependencies:
                '++id, diagramId, schema, tableId, dependentSchema, dependentTableId, createdAt',
            areas: '++id, diagramId, name, x, y, width, height, color',
            db_custom_types:
                '++id, diagramId, schema, type, kind, values, fields',
            config: '++id, defaultDiagramId',
            diagram_filters: 'diagramId, tableIds, schemasIds',
            notes: '++id, diagramId, content, x, y, width, height, color',
        });

        dexieDB.on('ready', async () => {
            const config = await dexieDB.config.get(1);

            if (!config) {
                const diagrams = await dexieDB.diagrams.toArray();

                await dexieDB.config.add({
                    id: 1,
                    defaultDiagramId: diagrams?.[0]?.id ?? '',
                });
            }
        });
        return dexieDB;
    }, []);

    useEffect(
        () => () => {
            for (const timer of syncTimersRef.current.values()) {
                window.clearTimeout(timer);
            }
            syncTimersRef.current.clear();
        },
        []
    );

    const getConfig: StorageContext['getConfig'] =
        useCallback(async (): Promise<ChartDBConfig | undefined> => {
            return await db.config.get(1);
        }, [db]);

    const updateConfig: StorageContext['updateConfig'] = useCallback(
        async (config) => {
            await db.config.update(1, config);
        },
        [db]
    );

    const getDiagramFilter: StorageContext['getDiagramFilter'] = useCallback(
        async (diagramId: string): Promise<DiagramFilter | undefined> => {
            const filter = await db.diagram_filters.get({ diagramId });

            return filter;
        },
        [db]
    );

    const updateDiagramFilter: StorageContext['updateDiagramFilter'] =
        useCallback(
            async (diagramId, filter): Promise<void> => {
                await db.diagram_filters.put({
                    diagramId,
                    ...filter,
                });
            },
            [db]
        );

    const deleteDiagramFilter: StorageContext['deleteDiagramFilter'] =
        useCallback(
            async (diagramId: string): Promise<void> => {
                await db.diagram_filters.where({ diagramId }).delete();
            },
            [db]
        );

    const hydrateDiagram = useCallback(
        async (
            inputDiagram: Diagram,
            options?: Partial<typeof DEFAULT_DIAGRAM_INCLUDE_OPTIONS>
        ): Promise<Diagram> => {
            const resolvedOptions = normalizeIncludeOptions(options);
            const diagram = { ...inputDiagram };

            if (resolvedOptions.includeTables) {
                diagram.tables = await db.db_tables
                    .where('diagramId')
                    .equals(diagram.id)
                    .toArray();
            }

            if (resolvedOptions.includeRelationships) {
                diagram.relationships = (
                    await db.db_relationships
                        .where('diagramId')
                        .equals(diagram.id)
                        .toArray()
                ).sort((a, b) => a.name.localeCompare(b.name));
            }

            if (resolvedOptions.includeDependencies) {
                diagram.dependencies = await db.db_dependencies
                    .where('diagramId')
                    .equals(diagram.id)
                    .toArray();
            }

            if (resolvedOptions.includeAreas) {
                diagram.areas = await db.areas
                    .where('diagramId')
                    .equals(diagram.id)
                    .toArray();
            }

            if (resolvedOptions.includeCustomTypes) {
                diagram.customTypes = (
                    await db.db_custom_types
                        .where('diagramId')
                        .equals(diagram.id)
                        .toArray()
                ).sort((a, b) => a.name.localeCompare(b.name));
            }

            if (resolvedOptions.includeNotes) {
                diagram.notes = await db.notes
                    .where('diagramId')
                    .equals(diagram.id)
                    .toArray();
            }

            return diagram;
        },
        [db]
    );

    const readLocalDiagram = useCallback(
        async (
            id: string,
            options?: Partial<typeof DEFAULT_DIAGRAM_INCLUDE_OPTIONS>
        ): Promise<Diagram | undefined> => {
            const diagram = await db.diagrams.get(id);
            if (!diagram) {
                return undefined;
            }

            return await hydrateDiagram(diagram, options);
        },
        [db, hydrateDiagram]
    );

    const readLocalDiagrams = useCallback(
        async (
            options?: Partial<typeof DEFAULT_DIAGRAM_INCLUDE_OPTIONS>
        ): Promise<Diagram[]> => {
            const diagrams = await db.diagrams.toArray();
            return await Promise.all(
                diagrams.map((diagram) => hydrateDiagram(diagram, options))
            );
        },
        [db, hydrateDiagram]
    );

    const replaceLocalDiagramSnapshot = useCallback(
        async (diagram: Diagram): Promise<void> => {
            await db.transaction(
                'rw',
                [
                    db.diagrams,
                    db.db_tables,
                    db.db_relationships,
                    db.db_dependencies,
                    db.areas,
                    db.db_custom_types,
                    db.notes,
                ],
                async () => {
                    await db.diagrams.put({
                        id: diagram.id,
                        name: diagram.name,
                        databaseType: diagram.databaseType,
                        databaseEdition: diagram.databaseEdition,
                        schemaSync: diagram.schemaSync,
                        createdAt: diagram.createdAt,
                        updatedAt: diagram.updatedAt,
                    });

                    await Promise.all([
                        db.db_tables
                            .where('diagramId')
                            .equals(diagram.id)
                            .delete(),
                        db.db_relationships
                            .where('diagramId')
                            .equals(diagram.id)
                            .delete(),
                        db.db_dependencies
                            .where('diagramId')
                            .equals(diagram.id)
                            .delete(),
                        db.areas.where('diagramId').equals(diagram.id).delete(),
                        db.db_custom_types
                            .where('diagramId')
                            .equals(diagram.id)
                            .delete(),
                        db.notes.where('diagramId').equals(diagram.id).delete(),
                    ]);

                    const tables = (diagram.tables ?? []).map((table) => ({
                        ...table,
                        diagramId: diagram.id,
                    }));
                    const relationships = (diagram.relationships ?? []).map(
                        (relationship) => ({
                            ...relationship,
                            diagramId: diagram.id,
                        })
                    );
                    const dependencies = (diagram.dependencies ?? []).map(
                        (dependency) => ({
                            ...dependency,
                            diagramId: diagram.id,
                        })
                    );
                    const areas = (diagram.areas ?? []).map((area) => ({
                        ...area,
                        diagramId: diagram.id,
                    }));
                    const customTypes = (diagram.customTypes ?? []).map(
                        (customType) => ({
                            ...customType,
                            diagramId: diagram.id,
                        })
                    );
                    const notes = (diagram.notes ?? []).map((note) => ({
                        ...note,
                        diagramId: diagram.id,
                    }));

                    if (tables.length > 0) {
                        await db.db_tables.bulkPut(tables);
                    }
                    if (relationships.length > 0) {
                        await db.db_relationships.bulkPut(relationships);
                    }
                    if (dependencies.length > 0) {
                        await db.db_dependencies.bulkPut(dependencies);
                    }
                    if (areas.length > 0) {
                        await db.areas.bulkPut(areas);
                    }
                    if (customTypes.length > 0) {
                        await db.db_custom_types.bulkPut(customTypes);
                    }
                    if (notes.length > 0) {
                        await db.notes.bulkPut(notes);
                    }
                }
            );
        },
        [db]
    );

    const ensureRemotePersistenceReady =
        useCallback(async (): Promise<void> => {
            if (remoteInitializedRef.current) {
                return;
            }

            if (remoteInitPromiseRef.current) {
                return await remoteInitPromiseRef.current;
            }

            remoteInitPromiseRef.current = (async () => {
                try {
                    const bootstrap = await persistenceClient.bootstrap();
                    remoteProjectIdRef.current = bootstrap.defaultProject.id;

                    const remoteResponse =
                        await persistenceClient.listProjectDiagrams(
                            bootstrap.defaultProject.id,
                            { view: 'full' }
                        );
                    const remoteDiagrams =
                        remoteResponse.items as PersistedDiagramRecord[];

                    for (const remoteDiagram of remoteDiagrams) {
                        await replaceLocalDiagramSnapshot(
                            deserializeDiagram(remoteDiagram.diagram)
                        );
                    }

                    const localDiagrams = await readLocalDiagrams(
                        FULL_DIAGRAM_INCLUDE_OPTIONS
                    );
                    const remoteIds = new Set(
                        remoteDiagrams.map((item) => item.id)
                    );

                    for (const localDiagram of localDiagrams) {
                        if (remoteIds.has(localDiagram.id)) {
                            continue;
                        }

                        await persistenceClient.upsertDiagram(localDiagram.id, {
                            projectId: bootstrap.defaultProject.id,
                            diagram: serializeDiagram(localDiagram),
                        });
                    }

                    remoteReadyRef.current = true;
                } catch (error) {
                    remoteReadyRef.current = false;
                    console.warn(
                        'ChartDB server persistence is unavailable; continuing with local browser storage only.',
                        error
                    );
                } finally {
                    remoteInitializedRef.current = true;
                }
            })();

            return await remoteInitPromiseRef.current;
        }, [readLocalDiagrams, replaceLocalDiagramSnapshot]);

    useEffect(() => {
        void ensureRemotePersistenceReady();
    }, [ensureRemotePersistenceReady]);

    const syncDiagramToRemote = useCallback(
        async (diagramId: string): Promise<void> => {
            await ensureRemotePersistenceReady();
            if (!remoteReadyRef.current || !remoteProjectIdRef.current) {
                return;
            }

            const diagram = await readLocalDiagram(
                diagramId,
                FULL_DIAGRAM_INCLUDE_OPTIONS
            );
            if (!diagram) {
                return;
            }

            await persistenceClient.upsertDiagram(diagramId, {
                projectId: remoteProjectIdRef.current,
                diagram: serializeDiagram(diagram),
            });
        },
        [ensureRemotePersistenceReady, readLocalDiagram]
    );

    const scheduleDiagramSync = useCallback(
        (diagramId: string): void => {
            const existingTimer = syncTimersRef.current.get(diagramId);
            if (existingTimer !== undefined) {
                window.clearTimeout(existingTimer);
            }

            const timer = window.setTimeout(() => {
                syncTimersRef.current.delete(diagramId);
                void syncDiagramToRemote(diagramId).catch((error) => {
                    console.warn(
                        'Failed to synchronize diagram to ChartDB API.',
                        {
                            diagramId,
                            error,
                        }
                    );
                });
            }, 400);

            syncTimersRef.current.set(diagramId, timer);
        },
        [syncDiagramToRemote]
    );

    const addTable: StorageContext['addTable'] = useCallback(
        async ({ diagramId, table }) => {
            await db.db_tables.add({
                ...table,
                diagramId,
            });
            scheduleDiagramSync(diagramId);
        },
        [db, scheduleDiagramSync]
    );

    const getTable: StorageContext['getTable'] = useCallback(
        async ({ id, diagramId }): Promise<DBTable | undefined> => {
            return await db.db_tables.get({ id, diagramId });
        },
        [db]
    );

    const deleteDiagramTables: StorageContext['deleteDiagramTables'] =
        useCallback(
            async (diagramId) => {
                await db.db_tables
                    .where('diagramId')
                    .equals(diagramId)
                    .delete();
                scheduleDiagramSync(diagramId);
            },
            [db, scheduleDiagramSync]
        );

    const updateTable: StorageContext['updateTable'] = useCallback(
        async ({ id, attributes }) => {
            await db.db_tables.update(id, attributes);
            const table = await db.db_tables.get(id);
            if (table?.diagramId) {
                scheduleDiagramSync(table.diagramId);
            }
        },
        [db, scheduleDiagramSync]
    );

    const putTable: StorageContext['putTable'] = useCallback(
        async ({ diagramId, table }) => {
            await db.db_tables.put({ ...table, diagramId });
            scheduleDiagramSync(diagramId);
        },
        [db, scheduleDiagramSync]
    );

    const deleteTable: StorageContext['deleteTable'] = useCallback(
        async ({ id, diagramId }) => {
            await db.db_tables.where({ id, diagramId }).delete();
            scheduleDiagramSync(diagramId);
        },
        [db, scheduleDiagramSync]
    );

    const listTables: StorageContext['listTables'] = useCallback(
        async (diagramId): Promise<DBTable[]> => {
            // Fetch all tables associated with the diagram
            const tables = await db.db_tables
                .where('diagramId')
                .equals(diagramId)
                .toArray();

            return tables;
        },
        [db]
    );

    const addRelationship: StorageContext['addRelationship'] = useCallback(
        async ({ diagramId, relationship }) => {
            await db.db_relationships.add({
                ...relationship,
                diagramId,
            });
            scheduleDiagramSync(diagramId);
        },
        [db, scheduleDiagramSync]
    );

    const deleteDiagramRelationships: StorageContext['deleteDiagramRelationships'] =
        useCallback(
            async (diagramId) => {
                await db.db_relationships
                    .where('diagramId')
                    .equals(diagramId)
                    .delete();
                scheduleDiagramSync(diagramId);
            },
            [db, scheduleDiagramSync]
        );

    const getRelationship: StorageContext['getRelationship'] = useCallback(
        async ({ id, diagramId }): Promise<DBRelationship | undefined> => {
            return await db.db_relationships.get({ id, diagramId });
        },
        [db]
    );

    const updateRelationship: StorageContext['updateRelationship'] =
        useCallback(
            async ({ id, attributes }) => {
                await db.db_relationships.update(id, attributes);
                const relationship = await db.db_relationships.get(id);
                if (relationship?.diagramId) {
                    scheduleDiagramSync(relationship.diagramId);
                }
            },
            [db, scheduleDiagramSync]
        );

    const deleteRelationship: StorageContext['deleteRelationship'] =
        useCallback(
            async ({ id, diagramId }) => {
                await db.db_relationships.where({ id, diagramId }).delete();
                scheduleDiagramSync(diagramId);
            },
            [db, scheduleDiagramSync]
        );

    const listRelationships: StorageContext['listRelationships'] = useCallback(
        async (diagramId): Promise<DBRelationship[]> => {
            // Sort relationships alphabetically
            return (
                await db.db_relationships
                    .where('diagramId')
                    .equals(diagramId)
                    .toArray()
            ).sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
        },
        [db]
    );

    const addDependency: StorageContext['addDependency'] = useCallback(
        async ({ diagramId, dependency }) => {
            await db.db_dependencies.add({
                ...dependency,
                diagramId,
            });
            scheduleDiagramSync(diagramId);
        },
        [db, scheduleDiagramSync]
    );

    const getDependency: StorageContext['getDependency'] = useCallback(
        async ({ diagramId, id }) => {
            return await db.db_dependencies.get({ id, diagramId });
        },
        [db]
    );

    const updateDependency: StorageContext['updateDependency'] = useCallback(
        async ({ id, attributes }) => {
            await db.db_dependencies.update(id, attributes);
            const dependency = await db.db_dependencies.get(id);
            if (dependency?.diagramId) {
                scheduleDiagramSync(dependency.diagramId);
            }
        },
        [db, scheduleDiagramSync]
    );

    const deleteDependency: StorageContext['deleteDependency'] = useCallback(
        async ({ diagramId, id }) => {
            await db.db_dependencies.where({ id, diagramId }).delete();
            scheduleDiagramSync(diagramId);
        },
        [db, scheduleDiagramSync]
    );

    const listDependencies: StorageContext['listDependencies'] = useCallback(
        async (diagramId) => {
            return await db.db_dependencies
                .where('diagramId')
                .equals(diagramId)
                .toArray();
        },
        [db]
    );

    const deleteDiagramDependencies: StorageContext['deleteDiagramDependencies'] =
        useCallback(
            async (diagramId) => {
                await db.db_dependencies
                    .where('diagramId')
                    .equals(diagramId)
                    .delete();
                scheduleDiagramSync(diagramId);
            },
            [db, scheduleDiagramSync]
        );

    const addArea: StorageContext['addArea'] = useCallback(
        async ({ area, diagramId }) => {
            await db.areas.add({
                ...area,
                diagramId,
            });
            scheduleDiagramSync(diagramId);
        },
        [db, scheduleDiagramSync]
    );

    const getArea: StorageContext['getArea'] = useCallback(
        async ({ diagramId, id }) => {
            return await db.areas.get({ id, diagramId });
        },
        [db]
    );

    const updateArea: StorageContext['updateArea'] = useCallback(
        async ({ id, attributes }) => {
            await db.areas.update(id, attributes);
            const area = await db.areas.get(id);
            if (area?.diagramId) {
                scheduleDiagramSync(area.diagramId);
            }
        },
        [db, scheduleDiagramSync]
    );

    const deleteArea: StorageContext['deleteArea'] = useCallback(
        async ({ diagramId, id }) => {
            await db.areas.where({ id, diagramId }).delete();
            scheduleDiagramSync(diagramId);
        },
        [db, scheduleDiagramSync]
    );

    const listAreas: StorageContext['listAreas'] = useCallback(
        async (diagramId) => {
            return await db.areas
                .where('diagramId')
                .equals(diagramId)
                .toArray();
        },
        [db]
    );

    const deleteDiagramAreas: StorageContext['deleteDiagramAreas'] =
        useCallback(
            async (diagramId) => {
                await db.areas.where('diagramId').equals(diagramId).delete();
                scheduleDiagramSync(diagramId);
            },
            [db, scheduleDiagramSync]
        );

    // Custom type operations
    const addCustomType: StorageContext['addCustomType'] = useCallback(
        async ({ diagramId, customType }) => {
            await db.db_custom_types.add({
                ...customType,
                diagramId,
            });
            scheduleDiagramSync(diagramId);
        },
        [db, scheduleDiagramSync]
    );

    const getCustomType: StorageContext['getCustomType'] = useCallback(
        async ({ diagramId, id }): Promise<DBCustomType | undefined> => {
            return await db.db_custom_types.get({ id, diagramId });
        },
        [db]
    );

    const updateCustomType: StorageContext['updateCustomType'] = useCallback(
        async ({ id, attributes }) => {
            await db.db_custom_types.update(id, attributes);
            const customType = await db.db_custom_types.get(id);
            if (customType?.diagramId) {
                scheduleDiagramSync(customType.diagramId);
            }
        },
        [db, scheduleDiagramSync]
    );

    const deleteCustomType: StorageContext['deleteCustomType'] = useCallback(
        async ({ diagramId, id }) => {
            await db.db_custom_types.where({ id, diagramId }).delete();
            scheduleDiagramSync(diagramId);
        },
        [db, scheduleDiagramSync]
    );

    const listCustomTypes: StorageContext['listCustomTypes'] = useCallback(
        async (diagramId): Promise<DBCustomType[]> => {
            return (
                await db.db_custom_types
                    .where('diagramId')
                    .equals(diagramId)
                    .toArray()
            ).sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
        },
        [db]
    );

    const deleteDiagramCustomTypes: StorageContext['deleteDiagramCustomTypes'] =
        useCallback(
            async (diagramId) => {
                await db.db_custom_types
                    .where('diagramId')
                    .equals(diagramId)
                    .delete();
                scheduleDiagramSync(diagramId);
            },
            [db, scheduleDiagramSync]
        );

    // Note operations
    const addNote: StorageContext['addNote'] = useCallback(
        async ({ note, diagramId }) => {
            await db.notes.add({
                ...note,
                diagramId,
            });
            scheduleDiagramSync(diagramId);
        },
        [db, scheduleDiagramSync]
    );

    const getNote: StorageContext['getNote'] = useCallback(
        async ({ diagramId, id }) => {
            return await db.notes.get({ id, diagramId });
        },
        [db]
    );

    const updateNote: StorageContext['updateNote'] = useCallback(
        async ({ id, attributes }) => {
            await db.notes.update(id, attributes);
            const note = await db.notes.get(id);
            if (note?.diagramId) {
                scheduleDiagramSync(note.diagramId);
            }
        },
        [db, scheduleDiagramSync]
    );

    const deleteNote: StorageContext['deleteNote'] = useCallback(
        async ({ diagramId, id }) => {
            await db.notes.where({ id, diagramId }).delete();
            scheduleDiagramSync(diagramId);
        },
        [db, scheduleDiagramSync]
    );

    const listNotes: StorageContext['listNotes'] = useCallback(
        async (diagramId) => {
            return await db.notes
                .where('diagramId')
                .equals(diagramId)
                .toArray();
        },
        [db]
    );

    const deleteDiagramNotes: StorageContext['deleteDiagramNotes'] =
        useCallback(
            async (diagramId) => {
                await db.notes.where('diagramId').equals(diagramId).delete();
                scheduleDiagramSync(diagramId);
            },
            [db, scheduleDiagramSync]
        );

    const addDiagram: StorageContext['addDiagram'] = useCallback(
        async ({ diagram }) => {
            await replaceLocalDiagramSnapshot(diagram);
            void syncDiagramToRemote(diagram.id);
        },
        [replaceLocalDiagramSnapshot, syncDiagramToRemote]
    );

    const listDiagrams: StorageContext['listDiagrams'] = useCallback(
        async (
            options = DEFAULT_DIAGRAM_INCLUDE_OPTIONS
        ): Promise<Diagram[]> => {
            await ensureRemotePersistenceReady();
            return await readLocalDiagrams(options);
        },
        [ensureRemotePersistenceReady, readLocalDiagrams]
    );

    const getDiagram: StorageContext['getDiagram'] = useCallback(
        async (
            id,
            options = DEFAULT_DIAGRAM_INCLUDE_OPTIONS
        ): Promise<Diagram | undefined> => {
            await ensureRemotePersistenceReady();

            if (remoteReadyRef.current) {
                try {
                    const remoteDiagram =
                        await persistenceClient.getDiagram(id);
                    await replaceLocalDiagramSnapshot(
                        deserializeDiagram(remoteDiagram.diagram)
                    );
                } catch (error) {
                    console.warn(
                        'Failed to refresh diagram from ChartDB API.',
                        {
                            id,
                            error,
                        }
                    );
                }
            }

            return await readLocalDiagram(id, options);
        },
        [
            ensureRemotePersistenceReady,
            readLocalDiagram,
            replaceLocalDiagramSnapshot,
        ]
    );

    const updateDiagram: StorageContext['updateDiagram'] = useCallback(
        async ({ id, attributes }) => {
            await db.diagrams.update(id, attributes);
            const nextDiagramId = attributes.id ?? id;

            if (attributes.id) {
                await Promise.all([
                    db.db_tables
                        .where('diagramId')
                        .equals(id)
                        .modify({ diagramId: attributes.id }),
                    db.db_relationships
                        .where('diagramId')
                        .equals(id)
                        .modify({ diagramId: attributes.id }),
                    db.db_dependencies
                        .where('diagramId')
                        .equals(id)
                        .modify({ diagramId: attributes.id }),
                    db.areas.where('diagramId').equals(id).modify({
                        diagramId: attributes.id,
                    }),
                    db.db_custom_types
                        .where('diagramId')
                        .equals(id)
                        .modify({ diagramId: attributes.id }),
                    db.notes.where('diagramId').equals(id).modify({
                        diagramId: attributes.id,
                    }),
                ]);

                await ensureRemotePersistenceReady();
                if (remoteReadyRef.current) {
                    void persistenceClient.deleteDiagram(id).catch((error) => {
                        console.warn(
                            'Failed to remove previous remote diagram id.',
                            {
                                id,
                                error,
                            }
                        );
                    });
                }
            }

            scheduleDiagramSync(nextDiagramId);
        },
        [db, ensureRemotePersistenceReady, scheduleDiagramSync]
    );

    const deleteDiagram: StorageContext['deleteDiagram'] = useCallback(
        async (id) => {
            await Promise.all([
                db.diagrams.delete(id),
                db.db_tables.where('diagramId').equals(id).delete(),
                db.db_relationships.where('diagramId').equals(id).delete(),
                db.db_dependencies.where('diagramId').equals(id).delete(),
                db.areas.where('diagramId').equals(id).delete(),
                db.db_custom_types.where('diagramId').equals(id).delete(),
                db.notes.where('diagramId').equals(id).delete(),
            ]);

            await ensureRemotePersistenceReady();
            if (remoteReadyRef.current) {
                try {
                    await persistenceClient.deleteDiagram(id);
                } catch (error) {
                    console.warn('Failed to delete remote diagram.', {
                        id,
                        error,
                    });
                }
            }
        },
        [db, ensureRemotePersistenceReady]
    );

    return (
        <storageContext.Provider
            value={{
                getConfig,
                updateConfig,
                addDiagram,
                listDiagrams,
                getDiagram,
                updateDiagram,
                deleteDiagram,
                addTable,
                getTable,
                updateTable,
                putTable,
                deleteTable,
                listTables,
                addRelationship,
                getRelationship,
                updateRelationship,
                deleteRelationship,
                listRelationships,
                deleteDiagramTables,
                deleteDiagramRelationships,
                addDependency,
                getDependency,
                updateDependency,
                deleteDependency,
                listDependencies,
                deleteDiagramDependencies,
                addArea,
                getArea,
                updateArea,
                deleteArea,
                listAreas,
                deleteDiagramAreas,
                addCustomType,
                getCustomType,
                updateCustomType,
                deleteCustomType,
                listCustomTypes,
                deleteDiagramCustomTypes,
                addNote,
                getNote,
                updateNote,
                deleteNote,
                listNotes,
                deleteDiagramNotes,
                getDiagramFilter,
                updateDiagramFilter,
                deleteDiagramFilter,
            }}
        >
            {children}
        </storageContext.Provider>
    );
};
