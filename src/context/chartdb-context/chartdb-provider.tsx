import React from 'react';
import { DBTable } from '@/lib/domain/db-table';
import { randomHSLA } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { chartDBContext } from './chartdb-context';
import { DatabaseType } from '@/lib/domain/database-type';
import { DBField } from '@/lib/domain/db-field';

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
        addTable({
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
        });
    };

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

    return (
        <chartDBContext.Provider
            value={{
                databaseType,
                tables,
                setDatabaseType,
                createTable,
                addTable,
                removeTable,
                updateTable,
                updateField,
            }}
        >
            {children}
        </chartDBContext.Provider>
    );
};
