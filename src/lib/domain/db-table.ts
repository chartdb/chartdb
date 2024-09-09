import { DBIndex } from './db-index';
import { DBField } from './db-field';
import { TableInfo } from '../data/import-metadata/metadata-types/table-info';
import { ColumnInfo } from '../data/import-metadata/metadata-types/column-info';
import { IndexInfo } from '../data/import-metadata/metadata-types/index-info';
import { greyColor, randomColor } from '@/lib/colors';
import { DBRelationship } from './db-relationship';
import { PrimaryKeyInfo } from '../data/import-metadata/metadata-types/primary-key-info';
import { ViewInfo } from '../data/import-metadata/metadata-types/view-info';
import { generateId } from '../utils';

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
    createdAt: number;
    width?: number;
    comments?: string;
    hidden?: boolean;
}

export const createTablesFromMetadata = ({
    tableInfos,
    columns,
    indexes,
    primaryKeys,
    views,
}: {
    tableInfos: TableInfo[];
    columns: ColumnInfo[];
    indexes: IndexInfo[];
    primaryKeys: PrimaryKeyInfo[];
    views: ViewInfo[];
}): DBTable[] => {
    return tableInfos.map((tableInfo: TableInfo) => {
        // Filter, make unique, and sort columns based on ordinal_position
        const uniqueColumns = new Map<string, ColumnInfo>();
        columns
            .filter(
                (col) =>
                    col.schema === tableInfo.schema &&
                    col.table === tableInfo.table
            )
            .forEach((col) => {
                if (!uniqueColumns.has(col.name)) {
                    uniqueColumns.set(col.name, col);
                }
            });

        const sortedColumns = Array.from(uniqueColumns.values()).sort(
            (a, b) => a.ordinal_position - b.ordinal_position
        );

        const tablePrimaryKeys = primaryKeys.filter(
            (pk) => pk.table === tableInfo.table
        );

        const tableIndexes = indexes.filter((idx) => {
            const indexSchema =
                (idx.schema ?? '').trim() === '' ? undefined : idx.schema;
            return (
                idx.table === tableInfo.table &&
                indexSchema === tableInfo.schema
            );
        });

        const fields: DBField[] = sortedColumns.map(
            (col: ColumnInfo): DBField => ({
                id: generateId(),
                name: col.name,
                type: { id: col.type.split(' ').join('_'), name: col.type },
                primaryKey: tablePrimaryKeys.some(
                    (pk) => pk.column === col.name
                ),
                unique: tableIndexes.some(
                    (idx) => idx.column === col.name && idx.unique
                ),
                nullable: col.nullable,
                ...(col.character_maximum_length &&
                col.character_maximum_length !== 'null'
                    ? { character_maximum_length: col.character_maximum_length }
                    : {}),
                ...(col.precision?.precision
                    ? { precision: col.precision.precision }
                    : {}),
                ...(col.precision?.scale ? { scale: col.precision.scale } : {}),
                ...(col.default ? { default: col.default } : {}),
                ...(col.collation ? { collation: col.collation } : {}),
                createdAt: Date.now(),
                comments: col.comment ? col.comment : undefined,
            })
        );

        const dbIndexes: DBIndex[] = tableIndexes.map(
            (idx: IndexInfo): DBIndex => ({
                id: generateId(),
                name: idx.name,
                unique: idx.unique,
                fieldIds: fields
                    .filter((field) => field.name === idx.column)
                    .map((field) => field.id),
                createdAt: Date.now(),
            })
        );

        // Determine if the current table is a view by checking against viewInfo
        const isView = views.some(
            (view) =>
                view.schema === tableInfo.schema &&
                view.view_name === tableInfo.table
        );

        const schema =
            (tableInfo.schema ?? '').trim() === ''
                ? undefined
                : tableInfo.schema;

        // Initial random positions; these will be adjusted later
        return {
            id: generateId(),
            name: tableInfo.table,
            schema,
            x: Math.random() * 1000, // Placeholder X
            y: Math.random() * 800, // Placeholder Y
            fields,
            indexes: dbIndexes,
            color: isView ? greyColor : randomColor(),
            isView: isView,
            createdAt: Date.now(),
            comments: tableInfo.comment ? tableInfo.comment : undefined,
        };
    });
};

export const adjustTablePositions = ({
    relationships,
    tables,
    filteredSchemas,
}: {
    tables: DBTable[];
    relationships: DBRelationship[];
    filteredSchemas?: string[];
}): DBTable[] => {
    const filteredTables = filteredSchemas
        ? tables.filter(
              (table) => !table.schema || filteredSchemas.includes(table.schema)
          )
        : tables;

    // Filter relationships to only include those between filtered tables
    const filteredRelationships = relationships.filter(
        (rel) =>
            filteredTables.some((t) => t.id === rel.sourceTableId) &&
            filteredTables.some((t) => t.id === rel.targetTableId)
    );

    const tableWidth = 200;
    const tableHeight = 300;
    const gapX = 100;
    const gapY = 100;
    const startX = 100;
    const startY = 100;

    // Create a map of table connections
    const tableConnections = new Map<string, Set<string>>();
    filteredRelationships.forEach((rel) => {
        if (!tableConnections.has(rel.sourceTableId)) {
            tableConnections.set(rel.sourceTableId, new Set());
        }
        if (!tableConnections.has(rel.targetTableId)) {
            tableConnections.set(rel.targetTableId, new Set());
        }
        tableConnections.get(rel.sourceTableId)!.add(rel.targetTableId);
        tableConnections.get(rel.targetTableId)!.add(rel.sourceTableId);
    });

    // Sort tables by number of connections
    const sortedTables = [...filteredTables].sort(
        (a, b) =>
            (tableConnections.get(b.id)?.size || 0) -
            (tableConnections.get(a.id)?.size || 0)
    );

    const positionedTables = new Set<string>();
    const tablePositions = new Map<string, { x: number; y: number }>();

    const isOverlapping = (
        x: number,
        y: number,
        currentTableId: string
    ): boolean => {
        for (const [tableId, pos] of tablePositions) {
            if (tableId === currentTableId) continue;
            if (
                Math.abs(x - pos.x) < tableWidth + gapX &&
                Math.abs(y - pos.y) < tableHeight + gapY
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
        const spiralStep = Math.max(tableWidth, tableHeight) / 2;
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

    const positionTable = (table: DBTable, baseX: number, baseY: number) => {
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
                const connectedTable = filteredTables.find(
                    (t) => t.id === connectedTableId
                );
                if (connectedTable) {
                    const newX = x + Math.cos(angle) * (tableWidth + gapX * 2);
                    const newY = y + Math.sin(angle) * (tableHeight + gapY * 2);
                    positionTable(connectedTable, newX, newY);
                    angle += angleStep;
                }
            }
        });
    };

    // Position tables
    sortedTables.forEach((table, index) => {
        if (!positionedTables.has(table.id)) {
            const row = Math.floor(index / 6);
            const col = index % 6;
            const x = startX + col * (tableWidth + gapX * 2);
            const y = startY + row * (tableHeight + gapY * 2);
            positionTable(table, x, y);
        }
    });

    // Apply positions to filtered tables
    filteredTables.forEach((table) => {
        const position = tablePositions.get(table.id);
        if (position) {
            table.x = position.x;
            table.y = position.y;
        }
    });

    return tables; // Return all tables, but only filtered ones are positioned
};
