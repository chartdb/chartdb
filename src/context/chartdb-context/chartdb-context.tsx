import { createContext } from 'react';
import { DBTable } from '@/lib/domain/db-table';
import { emptyFn } from '@/lib/utils';

export interface ChartDBContext {
    createTable: () => void;
    addTable: (table: DBTable) => void;
    removeTable: (id: string) => void;
    updateTable: (id: string, table: Partial<DBTable>) => void;
    tables: DBTable[];
}

export const chartDBContext = createContext<ChartDBContext>({
    createTable: emptyFn,
    addTable: emptyFn,
    removeTable: emptyFn,
    updateTable: emptyFn,
    tables: [],
});
