import type { DBSchema } from '@/lib/domain';
import type {
    DiagramFilter,
    FilterTableInfo,
} from '@/lib/domain/diagram-filter/diagram-filter';
import { emptyFn } from '@/lib/utils';
import { createContext } from 'react';

export interface DiagramFilterContext {
    filter?: DiagramFilter;
    loading: boolean;

    hasActiveFilter: boolean;
    schemasDisplayed: DBSchema[];

    clearSchemaIdsFilter: () => void;
    clearTableIdsFilter: () => void;

    setTableIdsFilterEmpty: () => void;

    // reset
    resetFilter: () => void;

    toggleSchemaFilter: (schemaId: string) => void;
    toggleTableFilter: (tableId: string) => void;
    addSchemaToFilter: (schemaId: string) => void;
    addTablesToFilter: (attrs: {
        tableIds?: string[];
        filterCallback?: (table: FilterTableInfo) => boolean;
    }) => void;
    removeTablesFromFilter: (attrs: {
        tableIds?: string[];
        filterCallback?: (table: FilterTableInfo) => boolean;
    }) => void;
}

export const diagramFilterContext = createContext<DiagramFilterContext>({
    hasActiveFilter: false,
    clearSchemaIdsFilter: emptyFn,
    clearTableIdsFilter: emptyFn,
    setTableIdsFilterEmpty: emptyFn,
    resetFilter: emptyFn,
    toggleSchemaFilter: emptyFn,
    toggleTableFilter: emptyFn,
    addSchemaToFilter: emptyFn,
    schemasDisplayed: [],
    addTablesToFilter: emptyFn,
    removeTablesFromFilter: emptyFn,
    loading: false,
});
