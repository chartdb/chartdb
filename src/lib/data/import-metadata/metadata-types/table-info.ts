import { z } from 'zod';

export interface TableInfo {
    schema: string;
    table: string;
    rows?: number;
    type?: string;
    engine?: string;
    collation?: string;
    comment?: string;
}

export const TableInfoSchema: z.ZodType<TableInfo> = z.object({
    schema: z.string(),
    table: z.string(),
    rows: z.number().optional(),
    type: z.string().optional(),
    engine: z.string().optional(),
    collation: z.string().optional(),
    comment: z.string().optional(),
});
