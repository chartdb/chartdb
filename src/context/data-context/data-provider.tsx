import React from 'react';
import { DataContext, dataContext } from './data-context';
import Dexie, { type EntityTable } from 'dexie';
import { Diagram } from '@/lib/domain/diagram';
import { DBTable } from '@/lib/domain/db-table';
import { DBRelationship } from '@/lib/domain/db-relationship';
import { ChartDBConfig } from '@/lib/domain/config';

export const DataProvider: React.FC<React.PropsWithChildren> = ({
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
        diagrams: '++id, name, databaseType, tables, relationships',
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

    const getConfig: DataContext['getConfig'] = async (): Promise<
        ChartDBConfig | undefined
    > => {
        return await db.config.get(1);
    };

    const updateConfig: DataContext['updateConfig'] = async (
        config: Partial<ChartDBConfig>
    ) => {
        await db.config.update(1, config);
    };

    const addDiagram: DataContext['addDiagram'] = async ({
        diagram,
    }: {
        diagram: Diagram;
    }) => {
        await db.diagrams.add(diagram);
    };

    const listDiagrams: DataContext['listDiagrams'] = async (): Promise<
        Diagram[]
    > => {
        return await db.diagrams.toArray();
    };

    const getDiagram: DataContext['getDiagram'] = async (
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

    const updateDiagram: DataContext['updateDiagram'] = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<Diagram>;
    }) => {
        await db.diagrams.update(id, attributes);
    };

    const deleteDiagram: DataContext['deleteDiagram'] = async (id: string) => {
        await Promise.all([
            db.diagrams.delete(id),
            db.db_tables.where('diagramId').equals(id).delete(),
            db.db_relationships.where('diagramId').equals(id).delete(),
        ]);
    };

    const addTable: DataContext['addTable'] = async ({
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

    const getTable: DataContext['getTable'] = async ({
        id,
        diagramId,
    }: {
        diagramId: string;
        id: string;
    }): Promise<DBTable | undefined> => {
        return await db.db_tables.get({ id, diagramId });
    };

    const updateTable: DataContext['updateTable'] = async ({
        id,
        attributes,
    }) => {
        await db.db_tables.update(id, attributes);
    };

    const deleteTable: DataContext['deleteTable'] = async ({
        id,
        diagramId,
    }: {
        id: string;
        diagramId: string;
    }) => {
        await db.db_tables.where({ id, diagramId }).delete();
    };

    const listTables: DataContext['listTables'] = async (
        diagramId: string
    ): Promise<DBTable[]> => {
        return await db.db_tables
            .where('diagramId')
            .equals(diagramId)
            .toArray();
    };

    const addRelationship: DataContext['addRelationship'] = async ({
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

    const getRelationship: DataContext['getRelationship'] = async ({
        id,
        diagramId,
    }: {
        diagramId: string;
        id: string;
    }): Promise<DBRelationship | undefined> => {
        return await db.db_relationships.get({ id, diagramId });
    };

    const updateRelationship: DataContext['updateRelationship'] = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<DBRelationship>;
    }) => {
        await db.db_relationships.update(id, attributes);
    };

    const deleteRelationship: DataContext['deleteRelationship'] = async ({
        id,
        diagramId,
    }: {
        id: string;
        diagramId: string;
    }) => {
        await db.db_relationships.where({ id, diagramId }).delete();
    };

    const listRelationships: DataContext['listRelationships'] = async (
        diagramId: string
    ): Promise<DBRelationship[]> => {
        return await db.db_relationships
            .where('diagramId')
            .equals(diagramId)
            .toArray();
    };

    return (
        <dataContext.Provider
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
        </dataContext.Provider>
    );
};
