import { z } from 'zod';

export interface ForeignKeyInfo {
    schema: string;
    table: string;
    column: string;
    foreign_key_name: string;
    reference_schema?: string;
    reference_table: string;
    reference_column: string;
    fk_def: string;
}

export const ForeignKeyInfoSchema: z.ZodType<ForeignKeyInfo> = z.object({
    schema: z.string(),
    table: z.string(),
    column: z.string(),
    foreign_key_name: z.string(),
    reference_schema: z.string().optional(),
    reference_table: z.string(),
    reference_column: z.string(),
    fk_def: z.string(),
});
