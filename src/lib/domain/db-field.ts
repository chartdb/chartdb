import { z } from 'zod';
import {
    dataTypeSchema,
    findDataTypeDataById,
    supportsArrayDataType,
    type DataType,
} from '../data/data-types/data-types';
import { DatabaseType } from './database-type';

export interface DBField {
    id: string;
    name: string;
    type: DataType;
    primaryKey: boolean;
    unique: boolean;
    nullable: boolean;
    increment?: boolean | null;
    isArray?: boolean | null;
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
    isArray: z.boolean().or(z.null()).optional(),
    createdAt: z.number(),
    characterMaximumLength: z.string().or(z.null()).optional(),
    precision: z.number().or(z.null()).optional(),
    scale: z.number().or(z.null()).optional(),
    default: z.string().or(z.null()).optional(),
    collation: z.string().or(z.null()).optional(),
    comments: z.string().or(z.null()).optional(),
});

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
    let suffix = '';

    if (databaseType && forceExtended && typeId) {
        suffix = generateExtendedSuffix(field, databaseType, typeId);
    } else {
        suffix = generateStandardSuffix(field);
    }

    // Add array notation if field is an array
    if (
        field.isArray &&
        supportsArrayDataType(
            typeId ?? field.type.id,
            databaseType ?? DatabaseType.GENERIC
        )
    ) {
        suffix += '[]';
    }

    return suffix;
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
