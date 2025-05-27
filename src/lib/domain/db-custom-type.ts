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
    schema?: string;
    name: string;
    kind: DBCustomTypeKind;
    values?: string[]; // For enum types
    fields?: DBCustomTypeField[]; // For composite types
    order?: number;
}

export const dbCustomTypeFieldSchema = z.object({
    field: z.string(),
    type: z.string(),
});

export const dbCustomTypeSchema: z.ZodType<DBCustomType> = z.object({
    id: z.string(),
    schema: z.string(),
    name: z.string(),
    kind: z.nativeEnum(DBCustomTypeKind),
    values: z.array(z.string()).optional(),
    fields: z.array(dbCustomTypeFieldSchema).optional(),
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
