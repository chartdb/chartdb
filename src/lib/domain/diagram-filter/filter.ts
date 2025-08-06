import { schemaNameToSchemaId } from '../db-schema';
import type { DiagramFilter } from './diagram-filter';

export const filterTable = ({
    table,
    filter,
    options = { defaultSchema: undefined },
}: {
    table: { id: string; schema?: string | null };
    filter?: DiagramFilter;
    options?: {
        defaultSchema?: string;
    };
}): boolean => {
    if (!filter) {
        return true;
    }

    if (!filter.tableIds && !filter.schemaIds) {
        return true;
    }

    if (filter.tableIds && filter.tableIds.includes(table.id)) {
        return true;
    }

    const tableSchemaId = table.schema ?? options.defaultSchema;

    if (
        tableSchemaId &&
        filter.schemaIds &&
        filter.schemaIds.includes(schemaNameToSchemaId(tableSchemaId))
    ) {
        return true;
    }

    return false;
};

export const filterTableBySchema = ({
    table,
    schemaIdsFilter,
    options = { defaultSchema: undefined },
}: {
    table: { id: string; schema?: string | null };
    schemaIdsFilter?: string[];
    options?: {
        defaultSchema?: string;
    };
}): boolean => {
    if (!schemaIdsFilter) {
        return true;
    }

    const tableSchemaId = table.schema ?? options.defaultSchema;

    if (tableSchemaId) {
        return schemaIdsFilter.includes(schemaNameToSchemaId(tableSchemaId));
    }

    return false;
};

export const filterSchema = ({
    schemaId,
    schemaIdsFilter,
}: {
    schemaId?: string;
    schemaIdsFilter?: string[];
}): boolean => {
    if (!schemaIdsFilter) {
        return true;
    }

    if (!schemaId) {
        return false;
    }

    return schemaIdsFilter.includes(schemaId);
};

export const filterRelationship = ({
    tableA: { id: tableAId, schema: tableASchema },
    tableB: { id: tableBId, schema: tableBSchema },
    filter,
    options = { defaultSchema: undefined },
}: {
    tableA: { id: string; schema?: string | null };
    tableB: { id: string; schema?: string | null };
    filter?: DiagramFilter;
    options?: {
        defaultSchema?: string;
    };
}): boolean => {
    if (!filter) {
        return true;
    }

    const isTableAVisible = filterTable({
        table: { id: tableAId, schema: tableASchema },
        filter,
        options,
    });

    const isTableBVisible = filterTable({
        table: { id: tableBId, schema: tableBSchema },
        filter,
        options,
    });

    return isTableAVisible && isTableBVisible;
};

export const filterDependency = filterRelationship;
