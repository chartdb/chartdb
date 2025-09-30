import type { DBField } from '@/lib/domain';
import type { ColumnInfo } from '../metadata-types/column-info';
import type { AggregatedIndexInfo } from '../metadata-types/index-info';
import type { PrimaryKeyInfo } from '../metadata-types/primary-key-info';
import type { TableInfo } from '../metadata-types/table-info';
import { generateId } from '@/lib/utils';

export const createFieldsFromMetadata = ({
    tableColumns,
    tablePrimaryKeys,
    aggregatedIndexes,
}: {
    tableColumns: ColumnInfo[];
    tableSchema?: string;
    tableInfo: TableInfo;
    tablePrimaryKeys: PrimaryKeyInfo[];
    aggregatedIndexes: AggregatedIndexInfo[];
}) => {
    const uniqueColumns = tableColumns.reduce((acc, col) => {
        if (!acc.has(col.name)) {
            acc.set(col.name, col);
        }
        return acc;
    }, new Map<string, ColumnInfo>());

    const sortedColumns = Array.from(uniqueColumns.values()).sort(
        (a, b) => a.ordinal_position - b.ordinal_position
    );

    const tablePrimaryKeysColumns = tablePrimaryKeys.map((pk) =>
        pk.column.trim()
    );

    return sortedColumns.map(
        (col: ColumnInfo): DBField => ({
            id: generateId(),
            name: col.name,
            type: {
                id: col.type.split(' ').join('_').toLowerCase(),
                name: col.type.toLowerCase(),
            },
            primaryKey: tablePrimaryKeysColumns.includes(col.name),
            unique: Object.values(aggregatedIndexes).some(
                (idx) =>
                    idx.unique &&
                    idx.columns.length === 1 &&
                    idx.columns[0].name === col.name
            ),
            nullable: Boolean(col.nullable),
            ...(col.character_maximum_length &&
            col.character_maximum_length !== 'null'
                ? { characterMaximumLength: col.character_maximum_length }
                : {}),
            ...(col.precision?.precision
                ? { precision: col.precision.precision }
                : {}),
            ...(col.precision?.scale ? { scale: col.precision.scale } : {}),
            ...(col.default ? { default: col.default } : {}),
            ...(col.collation ? { collation: col.collation } : {}),
            ...(col.is_identity !== undefined
                ? { increment: col.is_identity }
                : {}),
            createdAt: Date.now(),
            comments: col.comment ? col.comment : undefined,
        })
    );
};
