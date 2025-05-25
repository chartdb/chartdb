import { z } from 'zod';
import type { DBCustomTypeInfo } from '@/lib/data/import-metadata/metadata-types/custom-type-info';
import { generateId } from '../utils';

export type DBCustomTypeKind = 'enum' | 'composite';

export interface DBCustomTypeField {
    field: string;
    type: string;
}

export interface DBCustomType {
    id: string;
    schema: string;
    type: string; // The name of the type
    kind: DBCustomTypeKind;
    values?: string[]; // For enum types
    fields?: DBCustomTypeField[]; // For composite types
}

export const dbCustomTypeFieldSchema = z.object({
    field: z.string(),
    type: z.string(),
});

export const dbCustomTypeSchema: z.ZodType<DBCustomType> = z.object({
    id: z.string(),
    schema: z.string(),
    type: z.string(),
    kind: z.enum(['enum', 'composite']),
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
            schema: customType.schema,
            type: customType.type,
            kind: customType.kind,
            values: customType.values,
            fields: customType.fields,
        };
    });
};
