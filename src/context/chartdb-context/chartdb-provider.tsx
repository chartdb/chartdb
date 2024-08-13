import React from 'react';
import { DBTable } from '@/lib/domain/db-table';
import { randomHSLA } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { chartDBContext } from './chartdb-context';
import { DatabaseType } from '@/lib/domain/database-type';
import { DBField } from '@/lib/domain/db-field';
import { DBIndex } from '@/lib/domain/db-index';

export const ChartDBProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [databaseType, setDatabaseType] = React.useState<DatabaseType>(
        DatabaseType.GENERIC
    );
    const [tables, setTables] = React.useState<DBTable[]>([]);

    const addTable = (table: DBTable) => {
        setTables((tables) => [...tables, table]);
    };

    const createTable = () => {
        const table: DBTable = {
            id: nanoid(),
            name: `table_${tables.length + 1}`,
            x: 0,
            y: 0,
            fields: [
                {
                    id: nanoid(),
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
            id: nanoid(),
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
            id: nanoid(),
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

    return (
        <chartDBContext.Provider
            value={{
                databaseType,
                tables,
                setDatabaseType,
                createTable,
                addTable,
                getTable,
                removeTable,
                updateTable,
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
            }}
        >
            {children}
        </chartDBContext.Provider>
    );
};
