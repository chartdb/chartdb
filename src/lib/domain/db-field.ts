import { z } from 'zod';
import {
    dataTypeSchema,
    findDataTypeDataById,
    type DataType,
} from '../data/data-types/data-types';
import type { ColumnInfo } from '../data/import-metadata/metadata-types/column-info';
import type { AggregatedIndexInfo } from '../data/import-metadata/metadata-types/index-info';
import type { PrimaryKeyInfo } from '../data/import-metadata/metadata-types/primary-key-info';
import type { TableInfo } from '../data/import-metadata/metadata-types/table-info';
import { generateId } from '../utils';
import type { DatabaseType } from './database-type';

export interface DBField {
    id: string;
    name: string;
    type: DataType;
    primaryKey: boolean;
    unique: boolean;
    nullable: boolean;
    increment?: boolean | null;
    array?: boolean | null;
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
    array: z.boolean().or(z.null()).optional(),
    createdAt: z.number(),
    characterMaximumLength: z.string().or(z.null()).optional(),
    precision: z.number().or(z.null()).optional(),
    scale: z.number().or(z.null()).optional(),
    default: z.string().or(z.null()).optional(),
    collation: z.string().or(z.null()).optional(),
    comments: z.string().or(z.null()).optional(),
});

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

    return sortedColumns.map((col: ColumnInfo): DBField => {
        // Check if type is an array (ends with [])
        const isArrayType = col.type.endsWith('[]');
        let baseType = col.type;

        // Extract base type and any parameters if it's an array
        if (isArrayType) {
            baseType = col.type.slice(0, -2); // Remove the [] suffix
        }

        // Extract parameters from types like "character varying(100)" or "numeric(10,2)"
        let charMaxLength = col.character_maximum_length;
        let precision = col.precision?.precision;
        let scale = col.precision?.scale;

        // Handle types with single parameter like varchar(100)
        const singleParamMatch = baseType.match(/^(.+?)\((\d+)\)$/);
        if (singleParamMatch) {
            baseType = singleParamMatch[1];
            if (!charMaxLength || charMaxLength === 'null') {
                charMaxLength = singleParamMatch[2];
            }
        }

        // Handle types with two parameters like numeric(10,2)
        const twoParamMatch = baseType.match(/^(.+?)\((\d+),\s*(\d+)\)$/);
        if (twoParamMatch) {
            baseType = twoParamMatch[1];
            if (!precision) {
                precision = parseInt(twoParamMatch[2]);
            }
            if (!scale) {
                scale = parseInt(twoParamMatch[3]);
            }
        }

        return {
            id: generateId(),
            name: col.name,
            type: {
                id: baseType.split(' ').join('_').toLowerCase(),
                name: baseType.toLowerCase(),
            },
            primaryKey: tablePrimaryKeysColumns.includes(col.name),
            unique: Object.values(aggregatedIndexes).some(
                (idx) =>
                    idx.unique &&
                    idx.columns.length === 1 &&
                    idx.columns[0].name === col.name
            ),
            nullable: Boolean(col.nullable),
            ...(isArrayType ? { array: true } : {}),
            ...(charMaxLength && charMaxLength !== 'null'
                ? { characterMaximumLength: charMaxLength }
                : {}),
            ...(precision ? { precision } : {}),
            ...(scale ? { scale } : {}),
            ...(col.default ? { default: col.default } : {}),
            ...(col.collation ? { collation: col.collation } : {}),
            createdAt: Date.now(),
            comments: col.comment ? col.comment : undefined,
        };
    });
};

export const generateDBFieldSuffix = (
    field: DBField,
    {
        databaseType,
        forceExtended = false,
        typeId,
    }: {
        databaseType?: DatabaseType;
        forceExtended?: boolean;
        typeId?: string;
    } = {}
): string => {
    if (databaseType && forceExtended && typeId) {
        return generateExtendedSuffix(field, databaseType, typeId);
    }

    return generateStandardSuffix(field);
};

const generateExtendedSuffix = (
    field: DBField,
    databaseType: DatabaseType,
    typeId: string
): string => {
    const type = findDataTypeDataById(typeId, databaseType);

    if (!type?.fieldAttributes) {
        return '';
    }

    const { fieldAttributes } = type;

    // Character maximum length types (e.g., VARCHAR)
    if (fieldAttributes.hasCharMaxLength) {
        const maxLength = field.characterMaximumLength ?? 'n';
        return `(${maxLength})`;
    }

    // Precision and scale types (e.g., DECIMAL)
    if (fieldAttributes.precision && fieldAttributes.scale) {
        return formatPrecisionAndScale(field.precision, field.scale, '(p, s)');
    }

    // Precision only types (e.g., FLOAT)
    if (fieldAttributes.precision) {
        const precision = field.precision ?? 'p';
        return `(${precision})`;
    }

    return '';
};

const generateStandardSuffix = (field: DBField): string => {
    // Character maximum length
    if (field.characterMaximumLength) {
        return `(${field.characterMaximumLength})`;
    }

    return formatPrecisionAndScale(field.precision, field.scale, '');
};

const formatPrecisionAndScale = (
    precision: number | null | undefined,
    scale: number | null | undefined,
    fallback: string
): string => {
    if (precision && scale) {
        return `(${precision}, ${scale})`;
    }

    if (precision) {
        return `(${precision})`;
    }

    return fallback;
};
