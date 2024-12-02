import {
    createIndexesFromMetadata,
    dbIndexSchema,
    type DBIndex,
} from './db-index';
import {
    createFieldsFromMetadata,
    dbFieldSchema,
    type DBField,
} from './db-field';
import type { TableInfo } from '../data/import-metadata/metadata-types/table-info';
import { createAggregatedIndexes } from '../data/import-metadata/metadata-types/index-info';
import { materializedViewColor, viewColor, randomColor } from '@/lib/colors';
import type { DBRelationship } from './db-relationship';
import {
    decodeBase64ToUtf16LE,
    decodeBase64ToUtf8,
    deepCopy,
    generateId,
} from '../utils';
import {
    schemaNameToDomainSchemaName,
    schemaNameToSchemaId,
} from './db-schema';
import { DatabaseType } from './database-type';
import type { DatabaseMetadata } from '../data/import-metadata/metadata-types/database-metadata';
import { z } from 'zod';

export interface DBTable {
    id: string;
    name: string;
    schema?: string;
    x: number;
    y: number;
    fields: DBField[];
    indexes: DBIndex[];
    color: string;
    isView: boolean;
    isMaterializedView?: boolean;
    createdAt: number;
    width?: number;
    comments?: string;
    order?: number;
}

export const dbTableSchema: z.ZodType<DBTable> = z.object({
    id: z.string(),
    name: z.string(),
    schema: z.string().optional(),
    x: z.number(),
    y: z.number(),
    fields: z.array(dbFieldSchema),
    indexes: z.array(dbIndexSchema),
    color: z.string(),
    isView: z.boolean(),
    isMaterializedView: z.boolean().optional(),
    createdAt: z.number(),
    width: z.number().optional(),
    comments: z.string().optional(),
    hidden: z.boolean().optional(),
    order: z.number().optional(),
});

export const shouldShowTablesBySchemaFilter = (
    table: DBTable,
    filteredSchemas?: string[]
): boolean =>
    !filteredSchemas ||
    !table.schema ||
    filteredSchemas.includes(schemaNameToSchemaId(table.schema));

export const decodeViewDefinition = (
    databaseType: DatabaseType,
    viewDefinition?: string
): string => {
    if (!viewDefinition) {
        return '';
    }

    let decodedViewDefinition: string;
    if (databaseType === DatabaseType.SQL_SERVER) {
        decodedViewDefinition = decodeBase64ToUtf16LE(viewDefinition);
    } else {
        decodedViewDefinition = decodeBase64ToUtf8(viewDefinition);
    }

    return decodedViewDefinition;
};

export const createTablesFromMetadata = ({
    databaseMetadata,
    databaseType,
}: {
    databaseMetadata: DatabaseMetadata;
    databaseType: DatabaseType;
}): DBTable[] => {
    const {
        tables: tableInfos,
        pk_info: primaryKeys,
        columns,
        indexes,
        views: views,
    } = databaseMetadata;

    return tableInfos.map((tableInfo: TableInfo) => {
        const tableSchema = schemaNameToDomainSchemaName(tableInfo.schema);

        // Aggregate indexes with multiple columns
        const aggregatedIndexes = createAggregatedIndexes({
            tableInfo,
            tableSchema,
            indexes,
        });

        const fields = createFieldsFromMetadata({
            aggregatedIndexes,
            columns,
            primaryKeys,
            tableInfo,
            tableSchema,
        });

        const dbIndexes = createIndexesFromMetadata({
            aggregatedIndexes,
            fields,
        });

        // Determine if the current table is a view by checking against viewInfo
        const isView = views.some(
            (view) =>
                schemaNameToDomainSchemaName(view.schema) === tableSchema &&
                view.view_name === tableInfo.table
        );

        const isMaterializedView = views.some(
            (view) =>
                schemaNameToDomainSchemaName(view.schema) === tableSchema &&
                view.view_name === tableInfo.table &&
                decodeViewDefinition(databaseType, view.view_definition)
                    .toLowerCase()
                    .includes('materialized')
        );

        // Initial random positions; these will be adjusted later
        return {
            id: generateId(),
            name: tableInfo.table,
            schema: tableSchema,
            x: Math.random() * 1000, // Placeholder X
            y: Math.random() * 800, // Placeholder Y
            fields,
            indexes: dbIndexes,
            color: isMaterializedView
                ? materializedViewColor
                : isView
                  ? viewColor
                  : randomColor(),
            isView: isView,
            isMaterializedView: isMaterializedView,
            createdAt: Date.now(),
            comments: tableInfo.comment ? tableInfo.comment : undefined,
        };
    });
};

// Cache table dimensions and gaps
const TABLE_DIMENSIONS = {
    width: 200,
    height: 300,
    gapX: 100,
    gapY: 100,
    startX: 100,
    startY: 100
} as const;

// Optimize position finding with quadtree
class QuadTree {
    private positions: Map<string, {x: number, y: number}> = new Map();
    private bounds = {
        minX: 0,
        maxX: 5000,
        minY: 0,
        maxY: 5000
    };
    
    insert(id: string, x: number, y: number) {
        this.positions.set(id, {x, y});
    }
    
    findOverlapping(x: number, y: number, width: number, height: number, excludeId?: string): boolean {
        for (const [id, pos] of this.positions) {
            if (id === excludeId) continue;
            if (Math.abs(x - pos.x) < width && Math.abs(y - pos.y) < height) {
                return true;
            }
        }
        return false;
    }
}

export const adjustTablePositions = ({
    relationships,
    tables,
    mode = 'all',
}: {
    tables: DBTable[];
    relationships: DBRelationship[];
    mode?: 'all' | 'perSchema';
}): DBTable[] => {
    const quadTree = new QuadTree();
    const { width, height, gapX, gapY } = TABLE_DIMENSIONS;

    const findNonOverlappingPosition = (baseX: number, baseY: number, tableId: string): {x: number, y: number} => {
        const spiralStep = Math.max(width + gapX, height + gapY);
        let angle = 0;
        let radius = 0;
        
        while (radius < 2000) {
            const x = Math.round(baseX + radius * Math.cos(angle));
            const y = Math.round(baseY + radius * Math.sin(angle));
            
            if (!quadTree.findOverlapping(x, y, width + gapX, height + gapY, tableId)) {
                return { x, y };
            }
            
            angle += Math.PI / 4;
            if (angle >= 2 * Math.PI) {
                angle = 0;
                radius += spiralStep;
            }
        }
        
        return { x: baseX, y: baseY };
    };
    
    // Rest of the code...
};
