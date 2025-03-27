import { z } from 'zod';

export interface TableInfo {
    schema: string;
    table: string;
    rows: number;
    type: string;
    engine: string;
    collation: string;
    comment?: string;
}

export const TableInfoSchema: z.ZodType<TableInfo> = z.object({
    schema: z.string(),
    table: z.string(),
    rows: z.number(),
    type: z.string(),
    engine: z.string(),
    collation: z.string(),
    comment: z.string().optional(),
});
