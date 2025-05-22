import { z } from 'zod';

export interface CustomTypeFieldInfo {
    field: string;
    type: string;
}

export const CustomTypeFieldInfoSchema = z.object({
    field: z.string(),
    type: z.string(),
});

export interface CustomTypeInfo {
    schema: string;
    type: string;
    kind: 'enum' | 'composite';
    values?: string[];
    fields?: CustomTypeFieldInfo[];
}

export const CustomTypeInfoSchema: z.ZodType<CustomTypeInfo> = z.object({
    schema: z.string(),
    type: z.string(),
    kind: z.enum(['enum', 'composite']),
    values: z.array(z.string()).optional(),
    fields: z.array(CustomTypeFieldInfoSchema).optional(),
});
