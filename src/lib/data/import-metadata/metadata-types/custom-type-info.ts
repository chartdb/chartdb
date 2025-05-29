import { z } from 'zod';

export interface DBCustomTypeFieldInfo {
    field: string;
    type: string;
}

export const DBCustomTypeFieldInfoSchema = z.object({
    field: z.string(),
    type: z.string(),
});

export interface DBCustomTypeInfo {
    schema: string;
    type: string;
    kind: 'enum' | 'composite';
    values?: string[];
    fields?: DBCustomTypeFieldInfo[];
}

export const DBCustomTypeInfoSchema: z.ZodType<DBCustomTypeInfo> = z.object({
    schema: z.string(),
    type: z.string(),
    kind: z.enum(['enum', 'composite']),
    values: z.array(z.string()).optional(),
    fields: z.array(DBCustomTypeFieldInfoSchema).optional(),
});
