import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { Area } from '@/lib/domain/area';
import {
    adjustTablePositionsWithoutAreas,
    calcTableHeight,
    getTableDimensions,
    MIN_TABLE_SIZE,
} from '@/lib/domain/db-table';

/**
 * Check if a table is inside an area based on their positions and dimensions
 */
export const isTableInsideArea = (table: DBTable, area: Area): boolean => {
    // Get table dimensions (assuming default width if not specified)
    const tableWidth = table.width ?? MIN_TABLE_SIZE;
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
export const findContainingArea = (
    table: DBTable,
    areas: Area[]
): Area | null => {
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
    areas: Area[]
): DBTable[] => {
    return tables.map((table) => {
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

const AREA_PADDING = 30;
const AREA_HEADER_HEIGHT = 50;

/**
 * Arrange tables using the relationship-aware algorithm and fit them into an area.
 * Returns the arranged positions and the required area dimensions.
 */
export const arrangeTablesForArea = (
    tablesToArrange: DBTable[],
    relationships: DBRelationship[],
    areaRect: { x: number; y: number; width: number; height: number }
): {
    positions: { id: string; x: number; y: number }[];
    requiredWidth: number;
    requiredHeight: number;
} => {
    if (tablesToArrange.length === 0) {
        return {
            positions: [],
            requiredWidth: areaRect.width,
            requiredHeight: areaRect.height,
        };
    }

    const cloned = tablesToArrange.map((t) => ({ ...t }));

    const ids = new Set(cloned.map((t) => t.id));
    const areaRels = relationships.filter(
        (rel) => ids.has(rel.sourceTableId) && ids.has(rel.targetTableId)
    );

    adjustTablePositionsWithoutAreas(cloned, areaRels, 'all');

    // Calculate bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    cloned.forEach((t) => {
        const { width, height } = getTableDimensions(t);
        minX = Math.min(minX, t.x);
        minY = Math.min(minY, t.y);
        maxX = Math.max(maxX, t.x + width);
        maxY = Math.max(maxY, t.y + height);
    });

    // Translate into area
    const offsetX = areaRect.x + AREA_PADDING - minX;
    const offsetY = areaRect.y + AREA_HEADER_HEIGHT - minY;

    return {
        positions: cloned.map((t) => ({
            id: t.id,
            x: t.x + offsetX,
            y: t.y + offsetY,
        })),
        requiredWidth: maxX - minX + 2 * AREA_PADDING,
        requiredHeight: maxY - minY + AREA_PADDING + AREA_HEADER_HEIGHT,
    };
};
