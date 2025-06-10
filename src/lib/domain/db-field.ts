import { z } from 'zod';
import { dataTypeSchema, type DataType } from '../data/data-types/data-types';
import type { ColumnInfo } from '../data/import-metadata/metadata-types/column-info';
import type { AggregatedIndexInfo } from '../data/import-metadata/metadata-types/index-info';
import type { PrimaryKeyInfo } from '../data/import-metadata/metadata-types/primary-key-info';
import type { TableInfo } from '../data/import-metadata/metadata-types/table-info';
import { schemaNameToDomainSchemaName } from './db-schema';
import { generateId } from '../utils';

export interface DBField {
    id: string;
    name: string;
    type: DataType;
    primaryKey: boolean;
    unique: boolean;
    nullable: boolean;
    increment?: boolean | null;
    createdAt: number;
    characterMaximumLength?: string | null;
    precision?: number | null;
    scale?: number | null;
    default?: string | null;
    collation?: string | null;
    comments?: string | null;
}

export const dbFieldSchema: z.ZodType<DBField> = z.object({
    id: z.string(),
    name: z.string(),
    type: dataTypeSchema,
    primaryKey: z.boolean(),
    unique: z.boolean(),
    nullable: z.boolean(),
    increment: z.boolean().or(z.null()).optional(),
    createdAt: z.number(),
    characterMaximumLength: z.string().or(z.null()).optional(),
    precision: z.number().or(z.null()).optional(),
    scale: z.number().or(z.null()).optional(),
    default: z.string().or(z.null()).optional(),
    collation: z.string().or(z.null()).optional(),
    comments: z.string().or(z.null()).optional(),
});

export const createFieldsFromMetadata = ({
    columns,
    tableSchema,
    tableInfo,
    primaryKeys,
    aggregatedIndexes,
}: {
    columns: ColumnInfo[];
    tableSchema?: string;
    tableInfo: TableInfo;
    primaryKeys: PrimaryKeyInfo[];
    aggregatedIndexes: AggregatedIndexInfo[];
}) => {
    const uniqueColumns = columns
        .filter(
            (col) =>
                schemaNameToDomainSchemaName(col.schema) === tableSchema &&
                col.table === tableInfo.table
        )
        .reduce((acc, col) => {
            if (!acc.has(col.name)) {
                acc.set(col.name, col);
            }
            return acc;
        }, new Map<string, ColumnInfo>());

    const sortedColumns = Array.from(uniqueColumns.values()).sort(
        (a, b) => a.ordinal_position - b.ordinal_position
    );

    const tablePrimaryKeys = primaryKeys
        .filter(
            (pk) =>
                pk.table === tableInfo.table &&
                schemaNameToDomainSchemaName(pk.schema) === tableSchema
        )
        .map((pk) => pk.column.trim());

    return sortedColumns.map(
        (col: ColumnInfo): DBField => ({
            id: generateId(),
            name: col.name,
            type: {
                id: col.type.split(' ').join('_').toLowerCase(),
                name: col.type.toLowerCase(),
            },
            primaryKey: tablePrimaryKeys.includes(col.name),
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
            createdAt: Date.now(),
            comments: col.comment ? col.comment : undefined,
        })
    );
};
