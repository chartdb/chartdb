import { z } from 'zod';
import { syncSourceRefSchema, type SyncSourceRef } from './schema-sync';

export interface DBCheckConstraint {
    id: string;
    expression: string;
    createdAt: number;
    syncMetadata?: SyncSourceRef;
}

export const dbCheckConstraintSchema: z.ZodType<DBCheckConstraint> = z.object({
    id: z.string(),
    expression: z.string(),
    createdAt: z.number(),
    syncMetadata: syncSourceRefSchema.optional(),
});
