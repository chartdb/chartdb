import { z } from 'zod';

export interface SyncSourceRef {
    sourceId?: string;
    sourceName?: string;
}

export const syncSourceRefSchema: z.ZodType<SyncSourceRef> = z.object({
    sourceId: z.string().optional(),
    sourceName: z.string().optional(),
});

export interface DiagramSchemaSync {
    connectionId?: string;
    baselineSnapshotId?: string;
    baselineFingerprint?: string;
    importedSchemas?: string[];
    lastImportedAt?: string;
    lastPreviewPlanId?: string | null;
    lastPreviewedAt?: string | null;
    lastAuditId?: string | null;
    lastPostApplySnapshotId?: string | null;
}

export const diagramSchemaSyncSchema: z.ZodType<DiagramSchemaSync> = z.object({
    connectionId: z.string().optional(),
    baselineSnapshotId: z.string().optional(),
    baselineFingerprint: z.string().optional(),
    importedSchemas: z.array(z.string()).optional(),
    lastImportedAt: z.string().optional(),
    lastPreviewPlanId: z.string().nullable().optional(),
    lastPreviewedAt: z.string().nullable().optional(),
    lastAuditId: z.string().nullable().optional(),
    lastPostApplySnapshotId: z.string().nullable().optional(),
});
