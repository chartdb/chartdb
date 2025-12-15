import { dbIndexSchema, type DBIndex } from './db-index';
import { dbFieldSchema, type DBField } from './db-field';
import type { DBRelationship } from './db-relationship';
import { deepCopy, findContainingArea } from '../utils';
import { schemaNameToDomainSchemaName } from './db-schema';
import { z } from 'zod';
import type { Area } from './area';

export const MAX_TABLE_SIZE = 450;
export const MID_TABLE_SIZE = 337;
export const MIN_TABLE_SIZE = 224;
export const TABLE_MINIMIZED_FIELDS = 10;

export interface DBTable {
    id: string;
    name: string;
    schema?: string | null;
    x: number;
    y: number;
    fields: DBField[];
    indexes: DBIndex[];
    color: string;
    isView: boolean;
    isMaterializedView?: boolean | null;
    createdAt: number;
    width?: number | null;
    comments?: string | null;
    order?: number | null;
    expanded?: boolean | null;
    parentAreaId?: string | null;
}

export const dbTableSchema: z.ZodType<DBTable> = z.object({
    id: z.string(),
    name: z.string(),
    schema: z.string().or(z.null()).optional(),
    x: z.number(),
    y: z.number(),
    fields: z.array(dbFieldSchema),
    indexes: z.array(dbIndexSchema),
    color: z.string(),
    isView: z.boolean(),
    isMaterializedView: z.boolean().or(z.null()).optional(),
    createdAt: z.number(),
    width: z.number().or(z.null()).optional(),
    comments: z.string().or(z.null()).optional(),
    order: z.number().or(z.null()).optional(),
    expanded: z.boolean().or(z.null()).optional(),
    parentAreaId: z.string().or(z.null()).optional(),
});

export const generateTableKey = ({
    schemaName,
    tableName,
}: {
    schemaName: string | null | undefined;
    tableName: string;
}) => `${schemaNameToDomainSchemaName(schemaName) ?? ''}.${tableName}`;

export const adjustTablePositions = ({
    relationships: inputRelationships,
    tables: inputTables,
    areas: inputAreas = [],
    mode = 'all',
}: {
    tables: DBTable[];
    relationships: DBRelationship[];
    areas?: Area[];
    mode?: 'all' | 'perSchema';
}): DBTable[] => {
    // Deep copy inputs for manipulation
    const tables = deepCopy(inputTables);
    const relationships = deepCopy(inputRelationships);
    const areas = deepCopy(inputAreas);

    // If there are no areas, fall back to the original algorithm
    if (areas.length === 0) {
        return adjustTablePositionsWithoutAreas(tables, relationships, mode);
    }

    // Update parentAreaId based on geometric containment before grouping
    // This ensures tables that are visually inside an area get assigned to it
    tables.forEach((table) => {
        const containingArea = findContainingArea(table, areas);
        table.parentAreaId = containingArea?.id || null;
    });

    // Group tables by their parent area
    const tablesByArea = new Map<string | null, DBTable[]>();

    // Initialize with empty arrays for all areas
    areas.forEach((area) => {
        tablesByArea.set(area.id, []);
    });

    // Also create a group for tables without areas
    tablesByArea.set(null, []);

    // Group tables
    tables.forEach((table) => {
        const areaId = table.parentAreaId || null;
        if (areaId && tablesByArea.has(areaId)) {
            tablesByArea.get(areaId)!.push(table);
        } else {
            // If the area doesn't exist or table has no area, put it in the null group
            tablesByArea.get(null)!.push(table);
        }
    });

    // Check and adjust tables within each area
    areas.forEach((area) => {
        const tablesInArea = tablesByArea.get(area.id) || [];
        if (tablesInArea.length === 0) return;

        // Only reposition tables that are outside their area bounds
        const tablesToReposition = tablesInArea.filter((table) => {
            return !isTableInsideArea(table, area);
        });

        if (tablesToReposition.length > 0) {
            // Create a sub-graph of relationships for tables that need repositioning
            const areaRelationships = relationships.filter((rel) => {
                const sourceNeedsReposition = tablesToReposition.some(
                    (t) => t.id === rel.sourceTableId
                );
                const targetNeedsReposition = tablesToReposition.some(
                    (t) => t.id === rel.targetTableId
                );
                return sourceNeedsReposition && targetNeedsReposition;
            });

            // Position only tables that are outside the area bounds
            positionTablesWithinArea(
                tablesToReposition,
                areaRelationships,
                area
            );
        }
        // Tables already inside the area keep their positions
    });

    // Position free tables (those not in any area)
    const freeTables = tablesByArea.get(null) || [];
    if (freeTables.length > 0) {
        // Create a sub-graph of relationships for free tables
        const freeRelationships = relationships.filter((rel) => {
            const sourceIsFree = freeTables.some(
                (t) => t.id === rel.sourceTableId
            );
            const targetIsFree = freeTables.some(
                (t) => t.id === rel.targetTableId
            );
            return sourceIsFree && targetIsFree;
        });

        // Use the original algorithm for free tables with area avoidance
        adjustTablePositionsWithoutAreas(
            freeTables,
            freeRelationships,
            mode,
            areas
        );
    }

    return tables;
};

// Helper function to check if a table is inside an area
function isTableInsideArea(table: DBTable, area: Area): boolean {
    const tableDimensions = getTableDimensions(table);
    const padding = 20; // Same padding as used in positioning

    return (
        table.x >= area.x + padding &&
        table.x + tableDimensions.width <= area.x + area.width - padding &&
        table.y >= area.y + padding &&
        table.y + tableDimensions.height <= area.y + area.height - padding
    );
}

// Helper function to position tables within an area
function positionTablesWithinArea(
    tables: DBTable[],
    _relationships: DBRelationship[],
    area: Area
) {
    if (tables.length === 0) return;

    const padding = 20; // Padding from area edges
    const gapX = 50;
    const gapY = 50;

    // Available space within the area
    const availableWidth = area.width - 2 * padding;
    const availableHeight = area.height - 2 * padding;

    // Simple grid layout within the area
    const cols = Math.max(1, Math.floor(availableWidth / 250));
    const rows = Math.ceil(tables.length / cols);

    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / Math.max(rows, 1);

    tables.forEach((table, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        // Position relative to area
        table.x = area.x + padding + col * cellWidth + gapX / 2;
        table.y = area.y + padding + row * cellHeight + gapY / 2;

        // Ensure table stays within area bounds
        const tableDimensions = getTableDimensions(table);
        const maxX = area.x + area.width - padding - tableDimensions.width;
        const maxY = area.y + area.height - padding - tableDimensions.height;

        table.x = Math.min(table.x, maxX);
        table.y = Math.min(table.y, maxY);
        table.x = Math.max(table.x, area.x + padding);
        table.y = Math.max(table.y, area.y + padding);
    });
}

// Original algorithm with area avoidance
function adjustTablePositionsWithoutAreas(
    tables: DBTable[],
    relationships: DBRelationship[],
    mode: 'all' | 'perSchema',
    areas: Area[] = []
): DBTable[] {
    const adjustPositionsForTables = (tablesToAdjust: DBTable[]) => {
        const defaultTableWidth = 200;
        const defaultTableHeight = 300;
        const gapX = 100;
        const gapY = 100;
        const startX = 100;
        const startY = 100;

        // Create a map of table connections
        const tableConnections = new Map<string, Set<string>>();
        relationships.forEach((rel) => {
            if (!tableConnections.has(rel.sourceTableId)) {
                tableConnections.set(rel.sourceTableId, new Set());
            }
            if (!tableConnections.has(rel.targetTableId)) {
                tableConnections.set(rel.targetTableId, new Set());
            }
            tableConnections.get(rel.sourceTableId)!.add(rel.targetTableId);
            tableConnections.get(rel.targetTableId)!.add(rel.sourceTableId);
        });

        // Separate tables into connected and isolated
        const connectedTables: DBTable[] = [];
        const isolatedTables: DBTable[] = [];

        tablesToAdjust.forEach((table) => {
            if (
                tableConnections.has(table.id) &&
                tableConnections.get(table.id)!.size > 0
            ) {
                connectedTables.push(table);
            } else {
                isolatedTables.push(table);
            }
        });

        // Sort connected tables by number of connections (most connected first)
        connectedTables.sort(
            (a, b) =>
                (tableConnections.get(b.id)?.size || 0) -
                (tableConnections.get(a.id)?.size || 0)
        );

        const positionedTables = new Set<string>();
        const tablePositions = new Map<string, { x: number; y: number }>();

        const getTableWidthAndHeight = (
            tableId: string
        ): {
            width: number;
            height: number;
        } => {
            const table = tablesToAdjust.find((t) => t.id === tableId);

            if (!table)
                return { width: defaultTableWidth, height: defaultTableHeight };

            return getTableDimensions(table);
        };

        const isOverlapping = (
            x: number,
            y: number,
            currentTableId: string
        ): boolean => {
            // Check overlap with other tables
            for (const [tableId, pos] of tablePositions) {
                if (tableId === currentTableId) continue;

                const { width, height } = getTableWidthAndHeight(tableId);
                if (
                    Math.abs(x - pos.x) < width + gapX &&
                    Math.abs(y - pos.y) < height + gapY
                ) {
                    return true;
                }
            }

            // Check overlap with areas
            const { width: currentWidth, height: currentHeight } =
                getTableWidthAndHeight(currentTableId);
            const buffer = 50; // Add buffer around areas to keep tables away

            for (const area of areas) {
                // Check if the table position would overlap with the area (with buffer)
                if (
                    !(
                        x + currentWidth < area.x - buffer ||
                        x > area.x + area.width + buffer ||
                        y + currentHeight < area.y - buffer ||
                        y > area.y + area.height + buffer
                    )
                ) {
                    return true;
                }
            }

            return false;
        };

        const findNonOverlappingPosition = (
            baseX: number,
            baseY: number,
            tableId: string
        ): { x: number; y: number } => {
            const { width, height } = getTableWidthAndHeight(tableId);
            const spiralStep = Math.max(width, height) / 2;
            let angle = 0;
            let radius = 0;
            let iterations = 0;
            const maxIterations = 1000; // Prevent infinite loop

            while (iterations < maxIterations) {
                const x = baseX + radius * Math.cos(angle);
                const y = baseY + radius * Math.sin(angle);
                if (!isOverlapping(x, y, tableId)) {
                    return { x, y };
                }
                angle += Math.PI / 4;
                if (angle >= 2 * Math.PI) {
                    angle = 0;
                    radius += spiralStep;
                }
                iterations++;
            }

            // If we can't find a non-overlapping position, return a position far from others
            return {
                x: baseX + radius * Math.cos(angle),
                y: baseY + radius * Math.sin(angle),
            };
        };

        const positionTable = (
            table: DBTable,
            baseX: number,
            baseY: number
        ) => {
            if (positionedTables.has(table.id)) return;

            const { x, y } = findNonOverlappingPosition(baseX, baseY, table.id);

            table.x = x;
            table.y = y;
            tablePositions.set(table.id, { x: table.x, y: table.y });
            positionedTables.add(table.id);

            // Position connected tables
            const connectedTables = tableConnections.get(table.id) || new Set();
            let angle = 0;
            const angleStep = (2 * Math.PI) / connectedTables.size;

            connectedTables.forEach((connectedTableId) => {
                if (!positionedTables.has(connectedTableId)) {
                    const connectedTable = tablesToAdjust.find(
                        (t) => t.id === connectedTableId
                    );
                    if (connectedTable) {
                        const { width: tableWidth, height: tableHeight } =
                            getTableWidthAndHeight(table.id);
                        const {
                            width: connectedTableWidth,
                            height: connectedTableHeight,
                        } = getTableWidthAndHeight(connectedTableId);
                        const avgWidth = (tableWidth + connectedTableWidth) / 2;

                        const avgHeight =
                            (tableHeight + connectedTableHeight) / 2;

                        const newX =
                            x + Math.cos(angle) * (avgWidth + gapX * 2);
                        const newY =
                            y + Math.sin(angle) * (avgHeight + gapY * 2);
                        positionTable(connectedTable, newX, newY);
                        angle += angleStep;
                    }
                }
            });
        };

        // Position connected tables first
        if (connectedTables.length < 100) {
            // Use relationship-based positioning for small sets of connected tables
            connectedTables.forEach((table, index) => {
                if (!positionedTables.has(table.id)) {
                    const row = Math.floor(index / 6);
                    const col = index % 6;
                    const { width: tableWidth, height: tableHeight } =
                        getTableWidthAndHeight(table.id);

                    const x = startX + col * (tableWidth + gapX * 2);
                    const y = startY + row * (tableHeight + gapY * 2);
                    positionTable(table, x, y);
                }
            });
        } else {
            // Use simple grid layout for large sets of connected tables
            connectedTables.forEach((table, index) => {
                if (!positionedTables.has(table.id)) {
                    const row = Math.floor(index / 10); // More columns for large sets
                    const col = index % 10;
                    const { width: tableWidth, height: tableHeight } =
                        getTableWidthAndHeight(table.id);

                    const x = startX + col * (tableWidth + gapX);
                    const y = startY + row * (tableHeight + gapY);

                    // Direct positioning without relationship-based clustering
                    const finalPos = findNonOverlappingPosition(x, y, table.id);
                    table.x = finalPos.x;
                    table.y = finalPos.y;
                    tablePositions.set(table.id, { x: table.x, y: table.y });
                    positionedTables.add(table.id);
                }
            });
        }

        // Find the bottommost position of connected tables for isolated table placement
        let maxY = startY;
        for (const pos of tablePositions.values()) {
            const tableId = [...tablePositions.entries()].find(
                ([, p]) => p === pos
            )?.[0];
            if (tableId) {
                const { height } = getTableWidthAndHeight(tableId);
                maxY = Math.max(maxY, pos.y + height);
            }
        }

        // Position isolated tables after connected ones
        if (isolatedTables.length > 0) {
            const isolatedStartY = maxY + gapY * 2;
            const isolatedStartX = startX;

            isolatedTables.forEach((table, index) => {
                if (!positionedTables.has(table.id)) {
                    const row = Math.floor(index / 8); // More columns for isolated tables
                    const col = index % 8;
                    const { width: tableWidth, height: tableHeight } =
                        getTableWidthAndHeight(table.id);

                    // Use a simple grid layout for isolated tables
                    const x = isolatedStartX + col * (tableWidth + gapX);
                    const y = isolatedStartY + row * (tableHeight + gapY);

                    // Find non-overlapping position
                    const finalPos = findNonOverlappingPosition(x, y, table.id);
                    table.x = finalPos.x;
                    table.y = finalPos.y;
                    tablePositions.set(table.id, { x: table.x, y: table.y });
                    positionedTables.add(table.id);
                }
            });
        }

        // Apply positions to tables
        tablesToAdjust.forEach((table) => {
            const position = tablePositions.get(table.id);
            if (position) {
                table.x = position.x;
                table.y = position.y;
            }
        });
    };

    if (mode === 'perSchema') {
        // Group tables by schema
        const tablesBySchema = tables.reduce(
            (acc, table) => {
                const schema = table.schema || 'default';
                if (!acc[schema]) {
                    acc[schema] = [];
                }
                acc[schema].push(table);
                return acc;
            },
            {} as Record<string, DBTable[]>
        );

        // Adjust positions for each schema group
        Object.values(tablesBySchema).forEach(adjustPositionsForTables);
    } else {
        // Adjust positions for all tables
        adjustPositionsForTables(tables);
    }

    return tables;
}

export const calcTableHeight = (table?: DBTable): number => {
    if (!table) {
        return 300;
    }

    const FIELD_HEIGHT = 32; // h-8 per field
    const TABLE_FOOTER_HEIGHT = 32; // h-8 for show more button
    const TABLE_HEADER_HEIGHT = 42;
    // Calculate how many fields are visible
    const fieldCount = table.fields.length;
    let visibleFieldCount = fieldCount;

    // If not expanded, use minimum of field count and TABLE_MINIMIZED_FIELDS
    if (!table.expanded) {
        visibleFieldCount = Math.min(fieldCount, TABLE_MINIMIZED_FIELDS);
    }

    // Calculate height based on visible fields
    const fieldsHeight = visibleFieldCount * FIELD_HEIGHT;
    const showMoreButtonHeight =
        fieldCount > TABLE_MINIMIZED_FIELDS ? TABLE_FOOTER_HEIGHT : 0;

    return TABLE_HEADER_HEIGHT + fieldsHeight + showMoreButtonHeight;
};

export const getTableDimensions = (
    table: DBTable
): { width: number; height: number } => {
    const height = calcTableHeight(table);
    const width = table.width || MIN_TABLE_SIZE;
    return { width, height };
};
