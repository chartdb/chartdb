import { z } from 'zod';

export interface PrimaryKeyInfo {
    schema: string;
    table: string;
    column: string;
    pk_def: string;
}

export const PrimaryKeyInfoSchema: z.ZodType<PrimaryKeyInfo> = z.object({
    schema: z.string(),
    table: z.string(),
    column: z.string(),
    pk_def: z.string(),
});
