import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { CustomTypeInfo } from '@/lib/data/import-metadata/metadata-types/custom-type-info';

export type CustomTypeKind = 'enum' | 'composite';

export interface CustomTypeField {
    field: string;
    type: string;
}

export interface CustomType {
    id: string;
    schema: string;
    type: string; // The name of the type
    kind: CustomTypeKind;
    values?: string[]; // For enum types
    fields?: CustomTypeField[]; // For composite types
}

export const customTypeFieldSchema = z.object({
    field: z.string(),
    type: z.string(),
});

export const customTypeSchema: z.ZodType<CustomType> = z.object({
    id: z.string(),
    schema: z.string(),
    type: z.string(),
    kind: z.enum(['enum', 'composite']),
    values: z.array(z.string()).optional(),
    fields: z.array(customTypeFieldSchema).optional(),
});

export const createCustomType = (
    params: Omit<CustomType, 'id'>
): CustomType => {
    return {
        id: nanoid(),
        ...params,
    };
};

export const createCustomTypesFromMetadata = ({
    customTypes,
}: {
    customTypes: CustomTypeInfo[];
}): CustomType[] => {
    return customTypes.map((customType) => {
        return createCustomType({
            schema: customType.schema,
            type: customType.type,
            kind: customType.kind,
            values: customType.values,
            fields: customType.fields,
        });
    });
};
