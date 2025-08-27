import { z } from 'zod';
import type { DBCustomTypeInfo } from '@/lib/data/import-metadata/metadata-types/custom-type-info';
import { generateId } from '../utils';
import { schemaNameToDomainSchemaName } from './db-schema';

export enum DBCustomTypeKind {
    enum = 'enum',
    composite = 'composite',
}

export interface DBCustomTypeField {
    field: string;
    type: string;
}

export interface DBCustomType {
    id: string;
    schema?: string | null;
    name: string;
    kind: DBCustomTypeKind;
    values?: string[] | null; // For enum types
    fields?: DBCustomTypeField[] | null; // For composite types
    order?: number | null;
}

export const dbCustomTypeFieldSchema = z.object({
    field: z.string(),
    type: z.string(),
});

export const dbCustomTypeSchema: z.ZodType<DBCustomType> = z.object({
    id: z.string(),
    schema: z.string().or(z.null()).optional(),
    name: z.string(),
    kind: z.nativeEnum(DBCustomTypeKind),
    values: z.array(z.string()).or(z.null()).optional(),
    fields: z.array(dbCustomTypeFieldSchema).or(z.null()).optional(),
    order: z.number().or(z.null()).optional(),
});

export const createCustomTypesFromMetadata = ({
    customTypes,
}: {
    customTypes: DBCustomTypeInfo[];
}): DBCustomType[] => {
    return customTypes.map((customType) => {
        return {
            id: generateId(),
            schema: schemaNameToDomainSchemaName(customType.schema),
            name: customType.type,
            kind: customType.kind as DBCustomTypeKind,
            values: customType.values,
            fields: customType.fields,
        };
    });
};

export const customTypeKindToLabel: Record<DBCustomTypeKind, string> = {
    enum: 'Enum',
    composite: 'Composite',
};
