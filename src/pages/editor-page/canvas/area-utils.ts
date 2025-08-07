import type { DBTable } from '@/lib/domain/db-table';
import type { Area } from '@/lib/domain/area';
import { calcTableHeight } from '@/lib/domain/db-table';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';
import { filterTable } from '@/lib/domain/diagram-filter/filter';
import { defaultSchemas } from '@/lib/data/default-schemas';
import { DatabaseType } from '@/lib/domain/database-type';

/**
 * Check if a table is inside an area based on their positions and dimensions
 */
const isTableInsideArea = (table: DBTable, area: Area): boolean => {
    // Get table dimensions (assuming default width if not specified)
    const tableWidth = table.width ?? 224; // MIN_TABLE_SIZE from db-table.ts
    const tableHeight = calcTableHeight(table);

    // Check if table's top-left corner is inside the area
    const tableLeft = table.x;
    const tableRight = table.x + tableWidth;
    const tableTop = table.y;
    const tableBottom = table.y + tableHeight;

    const areaLeft = area.x;
    const areaRight = area.x + area.width;
    const areaTop = area.y;
    const areaBottom = area.y + area.height;

    // Check if table is completely inside the area
    return (
        tableLeft >= areaLeft &&
        tableRight <= areaRight &&
        tableTop >= areaTop &&
        tableBottom <= areaBottom
    );
};

/**
 * Check if an area is visible based on its tables
 */
const isAreaVisible = (
    area: Area,
    tables: DBTable[],
    filter?: DiagramFilter,
    databaseType?: DatabaseType
): boolean => {
    const tablesInArea = tables.filter((t) => t.parentAreaId === area.id);

    // If area has no tables, consider it visible
    if (tablesInArea.length === 0) return true;

    // Area is visible if at least one table in it is visible
    return tablesInArea.some((table) =>
        filterTable({
            table: { id: table.id, schema: table.schema },
            filter,
            options: {
                defaultSchema:
                    defaultSchemas[databaseType || DatabaseType.GENERIC],
            },
        })
    );
};

/**
 * Find which area contains a table
 */
const findContainingArea = (
    table: DBTable,
    areas: Area[],
    tables: DBTable[],
    filter?: DiagramFilter,
    databaseType?: DatabaseType
): Area | null => {
    // Sort areas by order (if available) to prioritize top-most areas
    const sortedAreas = [...areas].sort(
        (a, b) => (b.order ?? 0) - (a.order ?? 0)
    );

    for (const area of sortedAreas) {
        // Skip hidden areas - they shouldn't capture tables
        if (!isAreaVisible(area, tables, filter, databaseType)) {
            continue;
        }

        if (isTableInsideArea(table, area)) {
            return area;
        }
    }

    return null;
};

/**
 * Update tables with their parent area IDs based on containment
 */
export const updateTablesParentAreas = (
    tables: DBTable[],
    areas: Area[],
    filter?: DiagramFilter,
    databaseType?: DatabaseType
): DBTable[] => {
    return tables.map((table) => {
        // Skip hidden tables - they shouldn't be assigned to areas
        const isTableVisible = filterTable({
            table: { id: table.id, schema: table.schema },
            filter,
            options: {
                defaultSchema:
                    defaultSchemas[databaseType || DatabaseType.GENERIC],
            },
        });

        if (!isTableVisible) {
            // Hidden tables keep their current parent area (don't change)
            return table;
        }

        const containingArea = findContainingArea(
            table,
            areas,
            tables,
            filter,
            databaseType
        );
        const newParentAreaId = containingArea?.id || null;

        // Only update if parentAreaId has changed
        if (table.parentAreaId !== newParentAreaId) {
            return {
                ...table,
                parentAreaId: newParentAreaId,
            };
        }

        return table;
    });
};

/**
 * Get all tables that are inside a specific area
 */
export const getTablesInArea = (
    areaId: string,
    tables: DBTable[]
): DBTable[] => {
    return tables.filter((table) => table.parentAreaId === areaId);
};

/**
 * Get visible tables that are inside a specific area
 */
export const getVisibleTablesInArea = (
    areaId: string,
    tables: DBTable[],
    filter?: DiagramFilter,
    databaseType?: DatabaseType
): DBTable[] => {
    return tables.filter((table) => {
        if (table.parentAreaId !== areaId) return false;

        return filterTable({
            table: { id: table.id, schema: table.schema },
            filter,
            options: {
                defaultSchema:
                    defaultSchemas[databaseType || DatabaseType.GENERIC],
            },
        });
    });
};
