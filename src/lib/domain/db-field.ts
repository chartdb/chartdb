import { nanoid as generateId } from 'nanoid';
import { z } from 'zod';
import { dataTypeSchema, type DataType } from '../data/data-types/data-types';
import type { ColumnInfo } from '../data/import-metadata/metadata-types/column-info';
import type { AggregatedIndexInfo } from '../data/import-metadata/metadata-types/index-info';
import type { PrimaryKeyInfo } from '../data/import-metadata/metadata-types/primary-key-info';
import type { TableInfo } from '../data/import-metadata/metadata-types/table-info';
import type { DBCustomTypeInfo } from '../data/import-metadata/metadata-types/custom-type-info';
import { schemaNameToDomainSchemaName } from './db-schema';

export interface DBField {
    id: string;
    name: string;
    type: DataType;
    primaryKey: boolean;
    unique: boolean;
    nullable: boolean;
    increment?: boolean;
    createdAt: number;
    characterMaximumLength?: string;
    precision?: number;
    scale?: number;
    default?: string;
    collation?: string;
    comments?: string;
}

export const dbFieldSchema: z.ZodType<DBField> = z.object({
    id: z.string(),
    name: z.string(),
    type: dataTypeSchema,
    primaryKey: z.boolean(),
    unique: z.boolean(),
    nullable: z.boolean(),
    increment: z.boolean().optional(),
    createdAt: z.number(),
    characterMaximumLength: z.string().optional(),
    precision: z.number().optional(),
    scale: z.number().optional(),
    default: z.string().optional(),
    collation: z.string().optional(),
    comments: z.string().optional(),
});

// Helper function to find the best matching custom type for a column
const findMatchingCustomType = (
    columnName: string,
    customTypes: DBCustomTypeInfo[]
): DBCustomTypeInfo | undefined => {
    // 1. Exact name match (highest priority)
    const exactMatch = customTypes.find((ct) => ct.type === columnName);
    if (exactMatch) return exactMatch;

    // 2. Check if column name is the base of a custom type (e.g., 'role' matches 'role_enum')
    const prefixMatch = customTypes.find((ct) =>
        ct.type.startsWith(columnName + '_')
    );
    if (prefixMatch) return prefixMatch;

    // 3. Check if a custom type name is the base of the column name (e.g., 'user_role' matches 'role_enum')
    const baseTypeMatch = customTypes.find((ct) => {
        // Extract base name by removing common suffixes
        const baseTypeName = ct.type.replace(/_enum$|_type$/, '');
        return (
            columnName.includes(baseTypeName) ||
            baseTypeName.includes(columnName)
        );
    });
    if (baseTypeMatch) return baseTypeMatch;

    // 4. For composite types, check if any field matches the column name
    const compositeMatch = customTypes.find(
        (ct) =>
            ct.kind === 'composite' &&
            ct.fields?.some((f) => f.field === columnName)
    );
    if (compositeMatch) return compositeMatch;

    // 5. Special case for name/fullname relationship which is common
    if (columnName === 'name') {
        const fullNameType = customTypes.find((ct) => ct.type === 'full_name');
        if (fullNameType) return fullNameType;
    }

    return undefined;
};

export const createFieldsFromMetadata = ({
    columns,
    tableSchema,
    tableInfo,
    primaryKeys,
    aggregatedIndexes,
    customTypes = [],
}: {
    columns: ColumnInfo[];
    tableSchema?: string;
    tableInfo: TableInfo;
    primaryKeys: PrimaryKeyInfo[];
    aggregatedIndexes: AggregatedIndexInfo[];
    customTypes?: DBCustomTypeInfo[];
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

    // Create a mapping between column names and custom types
    const typeMap: Record<string, DBCustomTypeInfo> = {};

    if (customTypes && customTypes.length > 0) {
        // Filter to custom types in this schema
        const schemaCustomTypes = customTypes.filter(
            (ct) => schemaNameToDomainSchemaName(ct.schema) === tableSchema
        );

        // Process user-defined columns to find matching custom types
        for (const column of sortedColumns) {
            if (column.type.toLowerCase() === 'user-defined') {
                const matchingType = findMatchingCustomType(
                    column.name,
                    schemaCustomTypes
                );
                if (matchingType) {
                    typeMap[column.name] = matchingType;
                }
            }
        }
    }

    return sortedColumns.map((col: ColumnInfo): DBField => {
        let type: DataType;

        // Use custom type if available, otherwise use standard type
        if (col.type.toLowerCase() === 'user-defined' && typeMap[col.name]) {
            const customType = typeMap[col.name];
            type = {
                id: `custom-type-${customType.type}`,
                name: customType.type,
            };
        } else {
            type = {
                id: col.type.split(' ').join('_').toLowerCase(),
                name: col.type.toLowerCase(),
            };
        }

        return {
            id: generateId(),
            name: col.name,
            type,
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
        };
    });
};
