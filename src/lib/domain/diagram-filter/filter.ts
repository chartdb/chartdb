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

    const tableSchema = table.schema ?? options.defaultSchema;

    if (
        tableSchema &&
        filter.schemaIds &&
        filter.schemaIds.includes(schemaNameToSchemaId(tableSchema))
    ) {
        return true;
    }

    return false;
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
