import { z } from 'zod';

export interface CheckConstraintInfo {
    schema: string;
    table: string;
    expression: string;
}

export const CheckConstraintInfoSchema: z.ZodType<CheckConstraintInfo> =
    z.object({
        schema: z.string(),
        table: z.string(),
        expression: z.string(),
    });
