import { createContext } from 'react';
import { DBTable } from '@/lib/domain/db-table';
import { emptyFn } from '@/lib/utils';
import { DatabaseType } from '@/lib/domain/database-type';
import { DBField } from '@/lib/domain/db-field';

export interface ChartDBContext {
    databaseType: DatabaseType;
    tables: DBTable[];

    // Database type operations
    setDatabaseType: (databaseType: DatabaseType) => void;

    // Table operations
    createTable: () => void;
    addTable: (table: DBTable) => void;
    removeTable: (id: string) => void;
    updateTable: (id: string, table: Partial<DBTable>) => void;

    // Field operations
    updateField: (
        tableId: string,
        fieldId: string,
        field: Partial<DBField>
    ) => void;
}

export const chartDBContext = createContext<ChartDBContext>({
    databaseType: DatabaseType.GENERIC,
    tables: [],

    // Database type operations
    setDatabaseType: emptyFn,

    // Table operations
    createTable: emptyFn,
    addTable: emptyFn,
    removeTable: emptyFn,
    updateTable: emptyFn,

    // Field operations
    updateField: emptyFn,
});
