import React from 'react';
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

export const StorageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const db = new Dexie('ChartDB') as Dexie & {
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
        config: EntityTable<
            ChartDBConfig & { id: number },
            'id' // primary key "id" (for the typings only)
        >;
    };

    // Schema declaration:
    db.version(1).stores({
        diagrams: '++id, name, databaseType, createdAt, updatedAt',
        db_tables:
            '++id, diagramId, name, x, y, fields, indexes, color, createdAt, width',
        db_relationships:
            '++id, diagramId, name, sourceTableId, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
        config: '++id, defaultDiagramId',
    });

    db.version(2).upgrade((tx) =>
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

    db.version(3).stores({
        diagrams:
            '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
        db_tables:
            '++id, diagramId, name, x, y, fields, indexes, color, createdAt, width',
        db_relationships:
            '++id, diagramId, name, sourceTableId, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
        config: '++id, defaultDiagramId',
    });

    db.version(4).stores({
        diagrams:
            '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
        db_tables:
            '++id, diagramId, name, x, y, fields, indexes, color, createdAt, width, comment',
        db_relationships:
            '++id, diagramId, name, sourceTableId, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
        config: '++id, defaultDiagramId',
    });

    db.version(5).stores({
        diagrams:
            '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
        db_tables:
            '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment',
        db_relationships:
            '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
        config: '++id, defaultDiagramId',
    });

    db.version(6).upgrade((tx) =>
        tx
            .table<DBRelationship & { diagramId: string }>('db_relationships')
            .toCollection()
            .modify((relationship, ref) => {
                const {
                    sourceCardinality,
                    targetCardinality,
                } = // @ts-expect-error string before
                    determineCardinalities(relationship.type ?? 'one_to_one');

                relationship.sourceCardinality = sourceCardinality;
                relationship.targetCardinality = targetCardinality;

                // @ts-expect-error string before
                delete ref.value.type;
            })
    );

    db.version(7).stores({
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

    db.version(8).stores({
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

    db.version(9).upgrade((tx) =>
        tx
            .table<DBTable & { diagramId: string }>('db_tables')
            .toCollection()
            .modify((table) => {
                for (const field of table.fields) {
                    if (typeof field.nullable === 'string') {
                        field.nullable =
                            (field.nullable as string).toLowerCase() === 'true';
                    }
                }
            })
    );

    db.version(10).stores({
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

    db.on('ready', async () => {
        const config = await getConfig();

        if (!config) {
            const diagrams = await db.diagrams.toArray();

            await db.config.add({
                id: 1,
                defaultDiagramId: diagrams?.[0]?.id ?? '',
            });
        }
    });

    const getConfig: StorageContext['getConfig'] = async (): Promise<
        ChartDBConfig | undefined
    > => {
        return await db.config.get(1);
    };

    const updateConfig: StorageContext['updateConfig'] = async (
        config: Partial<ChartDBConfig>
    ) => {
        await db.config.update(1, config);
    };

    const addDiagram: StorageContext['addDiagram'] = async ({
        diagram,
    }: {
        diagram: Diagram;
    }) => {
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
            ...tables.map((table) => addTable({ diagramId: diagram.id, table }))
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

        await Promise.all(promises);
    };

    const listDiagrams: StorageContext['listDiagrams'] = async (
        options: {
            includeTables?: boolean;
            includeRelationships?: boolean;
            includeDependencies?: boolean;
            includeAreas?: boolean;
        } = {
            includeRelationships: false,
            includeTables: false,
            includeDependencies: false,
            includeAreas: false,
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
                    diagram.relationships = await listRelationships(diagram.id);
                    return diagram;
                })
            );
        }

        if (options.includeDependencies) {
            diagrams = await Promise.all(
                diagrams.map(async (diagram) => {
                    diagram.dependencies = await listDependencies(diagram.id);
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

        return diagrams;
    };

    const getDiagram: StorageContext['getDiagram'] = async (
        id: string,
        options: {
            includeTables?: boolean;
            includeRelationships?: boolean;
            includeDependencies?: boolean;
            includeAreas?: boolean;
        } = {
            includeRelationships: false,
            includeTables: false,
            includeDependencies: false,
            includeAreas: false,
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

        return diagram;
    };

    const updateDiagram: StorageContext['updateDiagram'] = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<Diagram>;
    }) => {
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
            ]);
        }
    };

    const deleteDiagram: StorageContext['deleteDiagram'] = async (
        id: string
    ) => {
        await Promise.all([
            db.diagrams.delete(id),
            db.db_tables.where('diagramId').equals(id).delete(),
            db.db_relationships.where('diagramId').equals(id).delete(),
            db.db_dependencies.where('diagramId').equals(id).delete(),
            db.areas.where('diagramId').equals(id).delete(),
        ]);
    };

    const addTable: StorageContext['addTable'] = async ({
        diagramId,
        table,
    }: {
        diagramId: string;
        table: DBTable;
    }) => {
        await db.db_tables.add({
            ...table,
            diagramId,
        });
    };

    const getTable: StorageContext['getTable'] = async ({
        id,
        diagramId,
    }: {
        diagramId: string;
        id: string;
    }): Promise<DBTable | undefined> => {
        return await db.db_tables.get({ id, diagramId });
    };

    const deleteDiagramTables: StorageContext['deleteDiagramTables'] = async (
        diagramId: string
    ) => {
        await db.db_tables.where('diagramId').equals(diagramId).delete();
    };

    const updateTable: StorageContext['updateTable'] = async ({
        id,
        attributes,
    }) => {
        await db.db_tables.update(id, attributes);
    };

    const putTable: StorageContext['putTable'] = async ({
        diagramId,
        table,
    }) => {
        await db.db_tables.put({ ...table, diagramId });
    };

    const deleteTable: StorageContext['deleteTable'] = async ({
        id,
        diagramId,
    }: {
        id: string;
        diagramId: string;
    }) => {
        await db.db_tables.where({ id, diagramId }).delete();
    };

    const listTables: StorageContext['listTables'] = async (
        diagramId: string
    ): Promise<DBTable[]> => {
        // Fetch all tables associated with the diagram
        const tables = await db.db_tables
            .where('diagramId')
            .equals(diagramId)
            .toArray();

        return tables;
    };

    const addRelationship: StorageContext['addRelationship'] = async ({
        diagramId,
        relationship,
    }: {
        diagramId: string;
        relationship: DBRelationship;
    }) => {
        await db.db_relationships.add({
            ...relationship,
            diagramId,
        });
    };

    const deleteDiagramRelationships: StorageContext['deleteDiagramRelationships'] =
        async (diagramId: string) => {
            await db.db_relationships
                .where('diagramId')
                .equals(diagramId)
                .delete();
        };

    const getRelationship: StorageContext['getRelationship'] = async ({
        id,
        diagramId,
    }: {
        diagramId: string;
        id: string;
    }): Promise<DBRelationship | undefined> => {
        return await db.db_relationships.get({ id, diagramId });
    };

    const updateRelationship: StorageContext['updateRelationship'] = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<DBRelationship>;
    }) => {
        await db.db_relationships.update(id, attributes);
    };

    const deleteRelationship: StorageContext['deleteRelationship'] = async ({
        id,
        diagramId,
    }: {
        id: string;
        diagramId: string;
    }) => {
        await db.db_relationships.where({ id, diagramId }).delete();
    };

    const listRelationships: StorageContext['listRelationships'] = async (
        diagramId: string
    ): Promise<DBRelationship[]> => {
        // Sort relationships alphabetically
        return (
            await db.db_relationships
                .where('diagramId')
                .equals(diagramId)
                .toArray()
        ).sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
    };

    const addDependency: StorageContext['addDependency'] = async ({
        diagramId,
        dependency,
    }) => {
        await db.db_dependencies.add({
            ...dependency,
            diagramId,
        });
    };

    const getDependency: StorageContext['getDependency'] = async ({
        diagramId,
        id,
    }) => {
        return await db.db_dependencies.get({ id, diagramId });
    };

    const updateDependency: StorageContext['updateDependency'] = async ({
        id,
        attributes,
    }) => {
        await db.db_dependencies.update(id, attributes);
    };

    const deleteDependency: StorageContext['deleteDependency'] = async ({
        diagramId,
        id,
    }) => {
        await db.db_dependencies.where({ id, diagramId }).delete();
    };

    const listDependencies: StorageContext['listDependencies'] = async (
        diagramId
    ) => {
        return await db.db_dependencies
            .where('diagramId')
            .equals(diagramId)
            .toArray();
    };

    const deleteDiagramDependencies: StorageContext['deleteDiagramDependencies'] =
        async (diagramId) => {
            await db.db_dependencies
                .where('diagramId')
                .equals(diagramId)
                .delete();
        };

    const addArea: StorageContext['addArea'] = async ({ area, diagramId }) => {
        await db.areas.add({
            ...area,
            diagramId,
        });
    };

    const getArea: StorageContext['getArea'] = async ({ diagramId, id }) => {
        return await db.areas.get({ id, diagramId });
    };

    const updateArea: StorageContext['updateArea'] = async ({
        id,
        attributes,
    }) => {
        await db.areas.update(id, attributes);
    };

    const deleteArea: StorageContext['deleteArea'] = async ({
        diagramId,
        id,
    }) => {
        await db.areas.where({ id, diagramId }).delete();
    };

    const listAreas: StorageContext['listAreas'] = async (diagramId) => {
        return await db.areas.where('diagramId').equals(diagramId).toArray();
    };

    const deleteDiagramAreas: StorageContext['deleteDiagramAreas'] = async (
        diagramId
    ) => {
        await db.areas.where('diagramId').equals(diagramId).delete();
    };

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
            }}
        >
            {children}
        </storageContext.Provider>
    );
};
