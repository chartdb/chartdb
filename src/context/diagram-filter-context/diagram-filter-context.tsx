import type { DBSchema } from '@/lib/domain';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';
import { emptyFn } from '@/lib/utils';
import { createContext } from 'react';

export interface DiagramFilterContext {
    filter?: DiagramFilter;

    hasActiveFilter: boolean;
    schemasDisplayed: DBSchema[];

    // schemas
    schemaIdsFilter?: string[];
    addSchemaIdsFilter: (...ids: string[]) => void;
    removeSchemaIdsFilter: (...ids: string[]) => void;
    clearSchemaIdsFilter: () => void;

    // tables
    tableIdsFilter?: string[];
    addTableIdsFilter: (...ids: string[]) => void;
    removeTableIdsFilter: (...ids: string[]) => void;
    clearTableIdsFilter: () => void;

    // reset
    resetFilter: () => void;

    // smart filters
    toggleSchemaFilter: (schemaId: string) => boolean;
    toggleTableFilter: (tableId: string) => boolean;
    addSchemaIfFiltered: (schemaId: string) => void;

    // shouldFilterTable: (tableId: string) => boolean;
    // shouldFilterSchema: (schemaId: string) => boolean;
    // shouldFilterRelationship: (relationshipId: string) => boolean;
}

export const diagramFilterContext = createContext<DiagramFilterContext>({
    hasActiveFilter: false,
    addSchemaIdsFilter: emptyFn,
    addTableIdsFilter: emptyFn,
    clearSchemaIdsFilter: emptyFn,
    clearTableIdsFilter: emptyFn,
    removeSchemaIdsFilter: emptyFn,
    removeTableIdsFilter: emptyFn,
    resetFilter: emptyFn,
    toggleSchemaFilter: emptyFn,
    toggleTableFilter: emptyFn,
    addSchemaIfFiltered: emptyFn,
    schemasDisplayed: [],
    // shouldFilterTable: emptyFn,
    // shouldFilterSchema: emptyFn,
    // shouldFilterRelationship: emptyFn,
});
