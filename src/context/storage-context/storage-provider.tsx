import React, { useCallback, useMemo } from 'react';
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

export const StorageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
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
            config: EntityTable<
                ChartDBConfig & { id: number },
                'id' // primary key "id" (for the typings only)
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

    const addTable: StorageContext['addTable'] = useCallback(
        async ({ diagramId, table }) => {
            await db.db_tables.add({
                ...table,
                diagramId,
            });
        },
        [db]
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
            },
            [db]
        );

    const updateTable: StorageContext['updateTable'] = useCallback(
        async ({ id, attributes }) => {
            await db.db_tables.update(id, attributes);
        },
        [db]
    );

    const putTable: StorageContext['putTable'] = useCallback(
        async ({ diagramId, table }) => {
            await db.db_tables.put({ ...table, diagramId });
        },
        [db]
    );

    const deleteTable: StorageContext['deleteTable'] = useCallback(
        async ({ id, diagramId }) => {
            await db.db_tables.where({ id, diagramId }).delete();
        },
        [db]
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
        },
        [db]
    );

    const deleteDiagramRelationships: StorageContext['deleteDiagramRelationships'] =
        useCallback(
            async (diagramId) => {
                await db.db_relationships
                    .where('diagramId')
                    .equals(diagramId)
                    .delete();
            },
            [db]
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
            },
            [db]
        );

    const deleteRelationship: StorageContext['deleteRelationship'] =
        useCallback(
            async ({ id, diagramId }) => {
                await db.db_relationships.where({ id, diagramId }).delete();
            },
            [db]
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
        },
        [db]
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
        },
        [db]
    );

    const deleteDependency: StorageContext['deleteDependency'] = useCallback(
        async ({ diagramId, id }) => {
            await db.db_dependencies.where({ id, diagramId }).delete();
        },
        [db]
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
            },
            [db]
        );

    const addArea: StorageContext['addArea'] = useCallback(
        async ({ area, diagramId }) => {
            await db.areas.add({
                ...area,
                diagramId,
            });
        },
        [db]
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
        },
        [db]
    );

    const deleteArea: StorageContext['deleteArea'] = useCallback(
        async ({ diagramId, id }) => {
            await db.areas.where({ id, diagramId }).delete();
        },
        [db]
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
            },
            [db]
        );

    // Custom type operations
    const addCustomType: StorageContext['addCustomType'] = useCallback(
        async ({ diagramId, customType }) => {
            await db.db_custom_types.add({
                ...customType,
                diagramId,
            });
        },
        [db]
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
        },
        [db]
    );

    const deleteCustomType: StorageContext['deleteCustomType'] = useCallback(
        async ({ diagramId, id }) => {
            await db.db_custom_types.where({ id, diagramId }).delete();
        },
        [db]
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
            },
            [db]
        );

    const addDiagram: StorageContext['addDiagram'] = useCallback(
        async ({ diagram }) => {
            const promises = [];
            promises.push(
                db.diagrams.add({
                    id: diagram.id,
                    name: diagram.name,
                    databaseType: diagram.databaseType,
                    databaseEdition: diagram.databaseEdition,
                    createdAt: diagram.createdAt,
                    updatedAt: diagram.updatedAt,
                })
            );

            const tables = diagram.tables ?? [];
            promises.push(
                ...tables.map((table) =>
                    addTable({ diagramId: diagram.id, table })
                )
            );

            const relationships = diagram.relationships ?? [];
            promises.push(
                ...relationships.map((relationship) =>
                    addRelationship({ diagramId: diagram.id, relationship })
                )
            );

            const dependencies = diagram.dependencies ?? [];
            promises.push(
                ...dependencies.map((dependency) =>
                    addDependency({ diagramId: diagram.id, dependency })
                )
            );

            const areas = diagram.areas ?? [];
            promises.push(
                ...areas.map((area) => addArea({ diagramId: diagram.id, area }))
            );

            const customTypes = diagram.customTypes ?? [];
            promises.push(
                ...customTypes.map((customType) =>
                    addCustomType({ diagramId: diagram.id, customType })
                )
            );

            await Promise.all(promises);
        },
        [db, addArea, addCustomType, addDependency, addRelationship, addTable]
    );

    const listDiagrams: StorageContext['listDiagrams'] = useCallback(
        async (
            options = {
                includeRelationships: false,
                includeTables: false,
                includeDependencies: false,
                includeAreas: false,
                includeCustomTypes: false,
            }
        ): Promise<Diagram[]> => {
            let diagrams = await db.diagrams.toArray();

            if (options.includeTables) {
                diagrams = await Promise.all(
                    diagrams.map(async (diagram) => {
                        diagram.tables = await listTables(diagram.id);
                        return diagram;
                    })
                );
            }

            if (options.includeRelationships) {
                diagrams = await Promise.all(
                    diagrams.map(async (diagram) => {
                        diagram.relationships = await listRelationships(
                            diagram.id
                        );
                        return diagram;
                    })
                );
            }

            if (options.includeDependencies) {
                diagrams = await Promise.all(
                    diagrams.map(async (diagram) => {
                        diagram.dependencies = await listDependencies(
                            diagram.id
                        );
                        return diagram;
                    })
                );
            }

            if (options.includeAreas) {
                diagrams = await Promise.all(
                    diagrams.map(async (diagram) => {
                        diagram.areas = await listAreas(diagram.id);
                        return diagram;
                    })
                );
            }

            if (options.includeCustomTypes) {
                diagrams = await Promise.all(
                    diagrams.map(async (diagram) => {
                        diagram.customTypes = await listCustomTypes(diagram.id);
                        return diagram;
                    })
                );
            }

            return diagrams;
        },
        [
            db,
            listAreas,
            listCustomTypes,
            listDependencies,
            listRelationships,
            listTables,
        ]
    );

    const getDiagram: StorageContext['getDiagram'] = useCallback(
        async (
            id,
            options = {
                includeRelationships: false,
                includeTables: false,
                includeDependencies: false,
                includeAreas: false,
                includeCustomTypes: false,
            }
        ): Promise<Diagram | undefined> => {
            const diagram = await db.diagrams.get(id);

            if (!diagram) {
                return undefined;
            }

            if (options.includeTables) {
                diagram.tables = await listTables(id);
            }

            if (options.includeRelationships) {
                diagram.relationships = await listRelationships(id);
            }

            if (options.includeDependencies) {
                diagram.dependencies = await listDependencies(id);
            }

            if (options.includeAreas) {
                diagram.areas = await listAreas(id);
            }

            if (options.includeCustomTypes) {
                diagram.customTypes = await listCustomTypes(id);
            }

            return diagram;
        },
        [
            db,
            listAreas,
            listCustomTypes,
            listDependencies,
            listRelationships,
            listTables,
        ]
    );

    const updateDiagram: StorageContext['updateDiagram'] = useCallback(
        async ({ id, attributes }) => {
            await db.diagrams.update(id, attributes);

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
                ]);
            }
        },
        [db]
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
            ]);
        },
        [db]
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
            }}
        >
            {children}
        </storageContext.Provider>
    );
};
