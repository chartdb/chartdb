import { defaultSchemas } from '@/lib/data/default-schemas';
import { schemaNameToSchemaId } from '../db-schema';
import type { Diagram } from '../diagram';
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

export const applyFilterOnDiagram = ({
    diagram,
    filter,
}: {
    diagram: Diagram;
    filter: DiagramFilter;
}): Diagram => {
    const defaultSchema = defaultSchemas[diagram.databaseType];
    const filteredTables = diagram.tables?.filter((table) =>
        filterTable({
            table: { id: table.id, schema: table.schema },
            filter,
            options: { defaultSchema },
        })
    );

    const filteredRelationships = diagram.relationships?.filter(
        (relationship) =>
            filterRelationship({
                tableA: {
                    id: relationship.sourceTableId,
                    schema: relationship.sourceSchema,
                },
                tableB: {
                    id: relationship.targetTableId,
                    schema: relationship.targetSchema,
                },
                filter,
                options: { defaultSchema },
            })
    );

    const filteredDependencies = diagram.dependencies?.filter((dependency) =>
        filterDependency({
            tableA: {
                id: dependency.tableId,
                schema: dependency.schema,
            },
            tableB: {
                id: dependency.dependentTableId,
                schema: dependency.dependentSchema,
            },
            filter,
            options: { defaultSchema },
        })
    );

    const filteredAreas = diagram.areas?.filter((area) =>
        filteredTables?.some((table) => table.parentAreaId === area.id)
    );

    return {
        ...diagram,
        tables: filteredTables,
        relationships: filteredRelationships,
        dependencies: filteredDependencies,
        areas: filteredAreas,
    };
};
