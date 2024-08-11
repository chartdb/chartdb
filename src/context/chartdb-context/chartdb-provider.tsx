import React from 'react';
import { DBTable } from '@/lib/domain/db-table';
import { randomHSLA } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { chartDBContext } from './chartdb-context';

export const ChartDBProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
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

    return (
        <chartDBContext.Provider
            value={{
                createTable,
                addTable,
                removeTable,
                updateTable,
                tables,
            }}
        >
            {children}
        </chartDBContext.Provider>
    );
};
