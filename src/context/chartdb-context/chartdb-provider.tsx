import React from 'react';
import { DBTable } from '@/lib/domain/db-table';
import { generateId, randomHSLA } from '@/lib/utils';
import { chartDBContext } from './chartdb-context';
import { DatabaseType } from '@/lib/domain/database-type';
import { DBField } from '@/lib/domain/db-field';
import { DBIndex } from '@/lib/domain/db-index';
import { DBRelationship } from '@/lib/domain/db-relationship';

export const ChartDBProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [diagramId, setDiagramId] = React.useState('');
    const [diagramName, setDiagramName] = React.useState('New Diagram');
    const [databaseType, setDatabaseType] = React.useState<DatabaseType>(
        DatabaseType.GENERIC
    );
    const [tables, setTables] = React.useState<DBTable[]>([]);
    const [relationships, setRelationships] = React.useState<DBRelationship[]>(
        []
    );

    const updateDatabaseType = setDatabaseType;
    const updateDiagramId = setDiagramId;
    const updateDiagramName = setDiagramName;

    const addTable = (table: DBTable) => {
        setTables((tables) => [...tables, table]);
    };

    const createTable = () => {
        const table: DBTable = {
            id: generateId(),
            name: `table_${tables.length + 1}`,
            x: 0,
            y: 0,
            fields: [
                {
                    id: generateId(),
                    name: 'id',
                    type: 'bigint',
                    unique: true,
                    nullable: false,
                    primaryKey: true,
                    createdAt: Date.now(),
                },
            ],
            indexes: [],
            color: randomHSLA(),
            createdAt: Date.now(),
        };
        addTable(table);

        return table;
    };

    const getTable = (id: string) =>
        tables.find((table) => table.id === id) ?? null;

    const removeTable = (id: string) => {
        setTables((tables) => tables.filter((table) => table.id !== id));
    };

    const updateTable = (id: string, table: Partial<DBTable>) => {
        setTables((tables) =>
            tables.map((t) => (t.id === id ? { ...t, ...table } : t))
        );
    };

    const updateTables = (tables: PartialExcept<DBTable, 'id'>[]) => {
        setTables((currentTables) =>
            currentTables.map((table) => {
                const updatedTable = tables.find((t) => t.id === table.id);
                return updatedTable ? { ...table, ...updatedTable } : table;
            })
        );
    };

    const updateTablesState = (
        updateFn: (tables: DBTable[]) => PartialExcept<DBTable, 'id'>[]
    ) => {
        setTables((prevTables) => {
            const updatedTables = updateFn(prevTables);
            return prevTables
                .map((prevTable) => {
                    const updatedTable = updatedTables.find(
                        (t) => t.id === prevTable.id
                    );
                    return updatedTable
                        ? { ...prevTable, ...updatedTable }
                        : prevTable;
                })
                .filter((prevTable) =>
                    updatedTables.some((t) => t.id === prevTable.id)
                );
        });
    };

    const updateField = (
        tableId: string,
        fieldId: string,
        field: Partial<DBField>
    ) => {
        setTables((tables) =>
            tables.map((table) =>
                table.id === tableId
                    ? {
                          ...table,
                          fields: table.fields.map((f) =>
                              f.id === fieldId ? { ...f, ...field } : f
                          ),
                      }
                    : table
            )
        );
    };

    const removeField = (tableId: string, fieldId: string) => {
        setTables((tables) =>
            tables.map((table) =>
                table.id === tableId
                    ? {
                          ...table,
                          fields: table.fields.filter((f) => f.id !== fieldId),
                      }
                    : table
            )
        );
    };

    const addField = (tableId: string, field: DBField) => {
        setTables((tables) =>
            tables.map((table) =>
                table.id === tableId
                    ? { ...table, fields: [...table.fields, field] }
                    : table
            )
        );
    };

    const getField = (tableId: string, fieldId: string) => {
        const table = getTable(tableId);
        return table?.fields.find((f) => f.id === fieldId) ?? null;
    };

    const createField = (tableId: string) => {
        const table = getTable(tableId);
        const field: DBField = {
            id: generateId(),
            name: `field_${(table?.fields?.length ?? 0) + 1}`,
            type: 'bigint',
            unique: false,
            nullable: true,
            primaryKey: false,
            createdAt: Date.now(),
        };

        addField(tableId, field);

        return field;
    };

    const addIndex = (tableId: string, index: DBIndex) => {
        setTables((tables) =>
            tables.map((table) =>
                table.id === tableId
                    ? { ...table, indexes: [...table.indexes, index] }
                    : table
            )
        );
    };

    const removeIndex = (tableId: string, indexId: string) => {
        setTables((tables) =>
            tables.map((table) =>
                table.id === tableId
                    ? {
                          ...table,
                          indexes: table.indexes.filter(
                              (i) => i.id !== indexId
                          ),
                      }
                    : table
            )
        );
    };

    const createIndex = (tableId: string) => {
        const table = getTable(tableId);
        const index: DBIndex = {
            id: generateId(),
            name: `index_${(table?.indexes?.length ?? 0) + 1}`,
            fieldIds: [],
            unique: false,
            createdAt: Date.now(),
        };

        addIndex(tableId, index);

        return index;
    };

    const getIndex = (tableId: string, indexId: string) => {
        const table = getTable(tableId);
        return table?.indexes.find((i) => i.id === indexId) ?? null;
    };

    const updateIndex = (
        tableId: string,
        indexId: string,
        index: Partial<DBIndex>
    ) => {
        setTables((tables) =>
            tables.map((table) =>
                table.id === tableId
                    ? {
                          ...table,
                          indexes: table.indexes.map((i) =>
                              i.id === indexId ? { ...i, ...index } : i
                          ),
                      }
                    : table
            )
        );
    };

    const addRelationship = (relationship: DBRelationship) => {
        setRelationships((relationships) => [...relationships, relationship]);
    };

    const createRelationship = ({
        sourceTableId,
        targetTableId,
        sourceFieldId,
        targetFieldId,
    }: {
        sourceTableId: string;
        targetTableId: string;
        sourceFieldId: string;
        targetFieldId: string;
    }) => {
        const sourceTableName = getTable(sourceTableId)?.name ?? '';
        const targetTableName = getTable(targetTableId)?.name ?? '';
        const relationship: DBRelationship = {
            id: generateId(),
            name: `${sourceTableName}_${targetTableName}_fk`,
            sourceTableId,
            targetTableId,
            sourceFieldId,
            targetFieldId,
            type: 'one_to_one',
            createdAt: Date.now(),
        };

        addRelationship(relationship);

        return relationship;
    };

    const getRelationship = (id: string) =>
        relationships.find((relationship) => relationship.id === id) ?? null;

    const removeRelationship = (id: string) => {
        setRelationships((relationships) =>
            relationships.filter((relationship) => relationship.id !== id)
        );
    };

    const removeRelationships = (...ids: string[]) => {
        setRelationships((relationships) =>
            relationships.filter(
                (relationship) => !ids.includes(relationship.id)
            )
        );
    };

    const updateRelationship = (
        id: string,
        relationship: Partial<DBRelationship>
    ) => {
        setRelationships((relationships) =>
            relationships.map((r) =>
                r.id === id ? { ...r, ...relationship } : r
            )
        );
    };

    return (
        <chartDBContext.Provider
            value={{
                diagramId,
                diagramName,
                databaseType,
                tables,
                relationships,
                updateDiagramId,
                updateDiagramName,
                updateDatabaseType,
                createTable,
                addTable,
                getTable,
                removeTable,
                updateTable,
                updateTables,
                updateTablesState,
                updateField,
                removeField,
                createField,
                addField,
                addIndex,
                createIndex,
                removeIndex,
                getField,
                getIndex,
                updateIndex,
                addRelationship,
                createRelationship,
                getRelationship,
                removeRelationship,
                removeRelationships,
                updateRelationship,
            }}
        >
            {children}
        </chartDBContext.Provider>
    );
};
