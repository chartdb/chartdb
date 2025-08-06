// union logic filter
export interface DiagramFilter {
    schemaIds?: string[];
    tableIds?: string[];
}

export interface TableInfo {
    id: string;
    schemaId?: string;
}

/**
 * Reduces/optimizes a DiagramFilter by removing redundant entries
 * - Removes tableIds that belong to schemas already in schemaIds (union logic)
 * - Consolidates complete schemas: if all tables from a schema are in tableIds, adds the schema to schemaIds
 * - Returns undefined for both fields if everything is displayed
 * - Returns empty arrays if nothing should be displayed
 */
export function reduceFilter(
    filter: DiagramFilter,
    tables: TableInfo[]
): DiagramFilter {
    let { schemaIds, tableIds } = filter;

    // If no filters are defined, everything is visible
    if (!schemaIds && !tableIds) {
        return { schemaIds: undefined, tableIds: undefined };
    }

    // Get all unique schema IDs from tables
    const allSchemaIds = [
        ...new Set(tables.filter((t) => t.schemaId).map((t) => t.schemaId!)),
    ];
    const allTableIds = tables.map((t) => t.id);

    // Build a map of schema to its tables
    const schemaToTables = new Map<string, string[]>();
    tables.forEach((table) => {
        if (table.schemaId) {
            if (!schemaToTables.has(table.schemaId)) {
                schemaToTables.set(table.schemaId, []);
            }
            schemaToTables.get(table.schemaId)!.push(table.id);
        }
    });

    // Consolidate complete schemas: if all tables from a schema are in tableIds, add schema to schemaIds
    if (tableIds) {
        const tableSet = new Set(tableIds);
        const consolidatedSchemaIds = new Set(schemaIds || []);
        let consolidatedTableIds = [...tableIds];

        for (const [schemaId, schemaTables] of schemaToTables.entries()) {
            // Check if all tables from this schema are in tableIds
            if (schemaTables.every((tableId) => tableSet.has(tableId))) {
                // Add schema to schemaIds
                consolidatedSchemaIds.add(schemaId);
                // Remove these tables from tableIds
                consolidatedTableIds = consolidatedTableIds.filter(
                    (id) => !schemaTables.includes(id)
                );
            }
        }

        schemaIds =
            consolidatedSchemaIds.size > 0
                ? Array.from(consolidatedSchemaIds)
                : schemaIds;
        tableIds =
            consolidatedTableIds.length > 0 ? consolidatedTableIds : undefined;
    }

    // If all schemas are in the filter, everything is visible
    if (schemaIds && schemaIds.length === allSchemaIds.length) {
        const schemasSet = new Set(schemaIds);
        const allSchemasIncluded = allSchemaIds.every((id) =>
            schemasSet.has(id)
        );
        if (allSchemasIncluded) {
            return { schemaIds: undefined, tableIds: undefined };
        }
    }

    // If schemaIds is defined, remove tables from tableIds that belong to those schemas
    let reducedTableIds = tableIds;
    if (schemaIds && tableIds) {
        const schemaSet = new Set(schemaIds);
        reducedTableIds = tableIds.filter((tableId) => {
            const table = tables.find((t) => t.id === tableId);
            // Keep table in tableIds only if it doesn't belong to a schema in schemaIds
            return !table?.schemaId || !schemaSet.has(table.schemaId);
        });

        // If no tables remain after reduction, set to undefined
        if (reducedTableIds.length === 0) {
            reducedTableIds = undefined;
        }
    }

    // Check if all tables are now visible (either through schemas or direct table IDs)
    if (schemaIds && reducedTableIds) {
        const schemaSet = new Set(schemaIds);
        const tableSet = new Set(reducedTableIds);

        const visibleTables = tables.filter((table) => {
            // Table is visible if it's in tableIds OR its schema is in schemaIds
            return (
                tableSet.has(table.id) ||
                (table.schemaId && schemaSet.has(table.schemaId))
            );
        });

        if (visibleTables.length === tables.length) {
            return { schemaIds: undefined, tableIds: undefined };
        }
    } else if (schemaIds && !reducedTableIds) {
        // Only schemaIds is defined, check if all tables are covered by schemas
        const schemaSet = new Set(schemaIds);
        const visibleTables = tables.filter(
            (table) => table.schemaId && schemaSet.has(table.schemaId)
        );

        if (visibleTables.length === tables.length) {
            return { schemaIds: undefined, tableIds: undefined };
        }
    } else if (!schemaIds && reducedTableIds) {
        // Only tableIds is defined, check if all tables are in the filter
        if (reducedTableIds.length === allTableIds.length) {
            return { schemaIds: undefined, tableIds: undefined };
        }
    }

    return {
        schemaIds,
        tableIds: reducedTableIds,
    };
}
