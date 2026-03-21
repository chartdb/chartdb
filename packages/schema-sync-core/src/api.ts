import { z } from 'zod';
import {
    applyJobStatusSchema,
    canonicalSchemaSchema,
    changePlanSchema,
    riskWarningSchema,
} from './types.js';

export const sslModeSchema = z.enum(['disable', 'prefer', 'require']);

export const databaseConnectionSecretSchema = z.object({
    host: z.string().min(1),
    port: z.number().int().positive().default(5432),
    database: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(1),
    sslMode: sslModeSchema.default('prefer'),
});
export type DatabaseConnectionSecret = z.infer<
    typeof databaseConnectionSecretSchema
>;

export const connectionUpsertSchema = z.object({
    name: z.string().min(1),
    engine: z.literal('postgresql').default('postgresql'),
    defaultSchemas: z.array(z.string()).default(['public']),
    secret: databaseConnectionSecretSchema,
});
export type ConnectionUpsert = z.infer<typeof connectionUpsertSchema>;

export const connectionSummarySchema = z.object({
    id: z.string(),
    name: z.string(),
    engine: z.literal('postgresql'),
    defaultSchemas: z.array(z.string()),
    host: z.string(),
    port: z.number(),
    database: z.string(),
    username: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type ConnectionSummary = z.infer<typeof connectionSummarySchema>;

export const connectionTestRequestSchema = z.object({
    connectionId: z.string().optional(),
    connection: connectionUpsertSchema.optional(),
});
export type ConnectionTestRequest = z.infer<typeof connectionTestRequestSchema>;

export const connectionTestResponseSchema = z.object({
    ok: z.boolean(),
    version: z.string().optional(),
    databaseName: z.string().optional(),
    availableSchemas: z.array(z.string()).default([]),
    error: z.string().optional(),
});
export type ConnectionTestResponse = z.infer<
    typeof connectionTestResponseSchema
>;

export const importLiveSchemaRequestSchema = z.object({
    connectionId: z.string(),
    schemas: z.array(z.string()).default(['public']),
});
export type ImportLiveSchemaRequest = z.infer<
    typeof importLiveSchemaRequestSchema
>;

export const importLiveSchemaResponseSchema = z.object({
    connection: connectionSummarySchema,
    snapshotId: z.string(),
    fingerprint: z.string(),
    canonicalSchema: canonicalSchemaSchema,
});
export type ImportLiveSchemaResponse = z.infer<
    typeof importLiveSchemaResponseSchema
>;

export const diffSchemaRequestSchema = z.object({
    baselineSnapshotId: z.string(),
    targetSchema: canonicalSchemaSchema,
    actor: z.string().default('local-user'),
});
export type DiffSchemaRequest = z.infer<typeof diffSchemaRequestSchema>;

export const diffSchemaResponseSchema = z.object({
    plan: changePlanSchema,
});
export type DiffSchemaResponse = z.infer<typeof diffSchemaResponseSchema>;

export const applySchemaRequestSchema = z.object({
    planId: z.string(),
    actor: z.string().default('local-user'),
    destructiveApproval: z.object({
        confirmed: z.boolean().default(false),
        confirmationText: z.string().default(''),
    }),
});
export type ApplySchemaRequest = z.infer<typeof applySchemaRequestSchema>;

export const applySchemaResponseSchema = z.object({
    jobId: z.string(),
    status: applyJobStatusSchema,
    executedStatements: z.array(z.string()).default([]),
    logs: z.array(z.string()).default([]),
    error: z.string().nullable().optional(),
    auditId: z.string(),
    postApplySnapshotId: z.string().nullable().optional(),
});
export type ApplySchemaResponse = z.infer<typeof applySchemaResponseSchema>;

export const applyJobResponseSchema = z.object({
    id: z.string(),
    status: applyJobStatusSchema,
    logs: z.array(z.string()).default([]),
    error: z.string().nullable().optional(),
    executedStatements: z.array(z.string()).default([]),
    auditId: z.string(),
});
export type ApplyJobResponse = z.infer<typeof applyJobResponseSchema>;

export const auditRecordSchema = z.object({
    id: z.string(),
    actor: z.string(),
    connectionId: z.string(),
    baselineSnapshotId: z.string(),
    targetSnapshotId: z.string().nullable().optional(),
    preApplySnapshotId: z.string().nullable().optional(),
    postApplySnapshotId: z.string().nullable().optional(),
    changePlanId: z.string(),
    sqlStatements: z.array(z.string()).default([]),
    warnings: z.array(riskWarningSchema).default([]),
    status: applyJobStatusSchema,
    logs: z.array(z.string()).default([]),
    error: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type AuditRecord = z.infer<typeof auditRecordSchema>;
