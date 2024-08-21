import React from 'react';
import { StorageContext, storageContext } from './storage-context';
import Dexie, { type EntityTable } from 'dexie';
import { Diagram } from '@/lib/domain/diagram';
import { DBTable } from '@/lib/domain/db-table';
import { DBRelationship } from '@/lib/domain/db-relationship';
import { ChartDBConfig } from '@/lib/domain/config';

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
        config: EntityTable<
            ChartDBConfig & { id: number },
            'id' // primary key "id" (for the typings only)
        >;
    };

    // Schema declaration:
    db.version(1).stores({
        diagrams: '++id, name, databaseType, createdAt, updatedAt',
        db_tables:
            '++id, diagramId, name, x, y, fields, indexes, color, createdAt',
        db_relationships:
            '++id, diagramId, name, sourceTableId, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
        config: '++id, defaultDiagramId',
    });

    db.on('ready', async () => {
        const config = await getConfig();

        if (!config) {
            await db.config.add({
                id: 1,
                defaultDiagramId: '',
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

        await Promise.all(promises);
    };

    const listDiagrams: StorageContext['listDiagrams'] = async (): Promise<
        Diagram[]
    > => {
        return await db.diagrams.toArray();
    };

    const getDiagram: StorageContext['getDiagram'] = async (
        id: string,
        options: {
            includeTables?: boolean;
            includeRelationships?: boolean;
        } = { includeRelationships: false, includeTables: false }
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
    };

    const deleteDiagram: StorageContext['deleteDiagram'] = async (
        id: string
    ) => {
        await Promise.all([
            db.diagrams.delete(id),
            db.db_tables.where('diagramId').equals(id).delete(),
            db.db_relationships.where('diagramId').equals(id).delete(),
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

    const updateTable: StorageContext['updateTable'] = async ({
        id,
        attributes,
    }) => {
        await db.db_tables.update(id, attributes);
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

        // Sort tables first alphabetically, then views alphabetically
        return tables.sort((a, b) => {
            if (a.isView === b.isView) {
                // Both are either tables or views, so sort alphabetically by name
                return a.name.localeCompare(b.name);
            }
            // If one is a view and the other is not, put tables first
            return a.isView ? 1 : -1;
        });
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
        return await db.db_relationships
            .where('diagramId')
            .equals(diagramId)
            .toArray();
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
                deleteTable,
                listTables,
                addRelationship,
                getRelationship,
                updateRelationship,
                deleteRelationship,
                listRelationships,
            }}
        >
            {children}
        </storageContext.Provider>
    );
};
