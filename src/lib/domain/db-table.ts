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
}: {
    tables: DBTable[];
    relationships: DBRelationship[];
}): DBTable[] => {
    const tableWidth = 200;
    const tableHeight = 300; // Approximate height of each table, adjust as needed
    const gapX = 55;
    const gapY = 42;
    const maxTablesPerRow = 6; // Maximum number of tables per row
    const startX = 100;
    const startY = 100;

    let currentX = startX;
    let currentY = startY;
    let tablesInCurrentRow = 0;

    // Step 1: Identify the most connected table and sort the tables by their connectivity
    const tableConnections = new Map<string, number>();
    relationships.forEach((rel) => {
        tableConnections.set(
            rel.sourceTableId,
            (tableConnections.get(rel.sourceTableId) || 0) + 1
        );
        tableConnections.set(
            rel.targetTableId,
            (tableConnections.get(rel.targetTableId) || 0) + 1
        );
    });

    const sortedTableIds = [...tableConnections.entries()]
        .sort((a, b) => b[1] - a[1])
        .map((entry) => entry[0]);

    const positionedTables = new Set<string>();

    const positionTable = (tableId: string) => {
        const table = tables.find((t) => t.id === tableId);
        if (!table || positionedTables.has(tableId)) {
            return;
        }

        // Set the X and Y positions
        table.x = currentX;
        table.y = currentY;
        positionedTables.add(tableId);

        // Update position for the next table
        tablesInCurrentRow++;
        if (tablesInCurrentRow >= maxTablesPerRow) {
            tablesInCurrentRow = 0;
            currentX = startX;
            currentY += tableHeight + gapY;
        } else {
            currentX += tableWidth + gapX;
        }

        // Position connected tables recursively
        const connectedTables = relationships
            .filter(
                (rel) =>
                    rel.sourceTableId === tableId ||
                    rel.targetTableId === tableId
            )
            .map((rel) =>
                rel.sourceTableId === tableId
                    ? rel.targetTableId
                    : rel.sourceTableId
            );

        connectedTables.forEach(positionTable);
    };

    // Step 2: Start positioning with the most connected tables first
    sortedTableIds.forEach((tableId) => {
        if (!positionedTables.has(tableId)) {
            positionTable(tableId);
        }
    });

    // Step 3: Handle any remaining unpositioned tables
    tables.forEach((table) => {
        if (!positionedTables.has(table.id)) {
            positionTable(table.id);
        }
    });

    return tables;
};
