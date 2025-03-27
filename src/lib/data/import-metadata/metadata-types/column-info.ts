import { z } from 'zod';

export interface ColumnInfo {
    schema: string;
    table: string;
    name: string;
    type: string;
    ordinal_position: number;
    nullable: boolean;
    character_maximum_length?: string | null; // The maximum length of the column (if applicable), nullable
    precision?: {
        precision: number | null; // The precision for numeric types
        scale: number | null; // The scale for numeric types
    } | null; // Nullable, not all types have precision
    default?: string | null; // Default value for the column, nullable
    collation?: string | null;
    comment?: string | null;
}

export const ColumnInfoSchema: z.ZodType<ColumnInfo> = z.object({
    schema: z.string(),
    table: z.string(),
    name: z.string(),
    type: z.string(),
    ordinal_position: z.number(),
    nullable: z.boolean(),
    character_maximum_length: z.string().nullable(),
    precision: z
        .object({
            precision: z.number().nullable(),
            scale: z.number().nullable(),
        })
        .nullable(),
    default: z.string().nullable(),
    collation: z.string().nullable(),
    comment: z.string().nullable(),
});
