import { z } from 'zod';

export interface DBCheckConstraint {
    id: string;
    expression: string;
    createdAt: number;
}

export const dbCheckConstraintSchema: z.ZodType<DBCheckConstraint> = z.object({
    id: z.string(),
    expression: z.string(),
    createdAt: z.number(),
});
