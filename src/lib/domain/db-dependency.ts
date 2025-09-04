import { z } from 'zod';

export interface DBDependency {
    id: string;
    schema?: string | null;
    tableId: string;
    dependentSchema?: string | null;
    dependentTableId: string;
    createdAt: number;
}

export const dbDependencySchema: z.ZodType<DBDependency> = z.object({
    id: z.string(),
    schema: z.string().or(z.null()).optional(),
    tableId: z.string(),
    dependentSchema: z.string().or(z.null()).optional(),
    dependentTableId: z.string(),
    createdAt: z.number(),
});
