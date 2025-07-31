import type { DBTable } from '@/lib/domain/db-table';
import type { Area } from '@/lib/domain/area';
import {
    calcTableHeight,
    shouldShowTablesBySchemaFilter,
} from '@/lib/domain/db-table';

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
 * Find which area contains a table
 */
const findContainingArea = (table: DBTable, areas: Area[]): Area | null => {
    // Sort areas by order (if available) to prioritize top-most areas
    const sortedAreas = [...areas].sort(
        (a, b) => (b.order ?? 0) - (a.order ?? 0)
    );

    for (const area of sortedAreas) {
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
    hiddenTableIds?: string[],
    filteredSchemas?: string[]
): DBTable[] => {
    return tables.map((table) => {
        // Check if table is hidden by direct hiding or schema filter
        const isHiddenDirectly = hiddenTableIds?.includes(table.id) ?? false;
        const isHiddenBySchema = !shouldShowTablesBySchemaFilter(
            table,
            filteredSchemas
        );
        const isHidden = isHiddenDirectly || isHiddenBySchema;

        // If table is hidden, remove it from any area
        if (isHidden) {
            if (table.parentAreaId !== null) {
                return {
                    ...table,
                    parentAreaId: null,
                };
            }
            return table;
        }

        // For visible tables, find containing area as before
        const containingArea = findContainingArea(table, areas);
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
