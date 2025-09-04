import { z } from 'zod';

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

export const customTypeKindToLabel: Record<DBCustomTypeKind, string> = {
    enum: 'Enum',
    composite: 'Composite',
};
