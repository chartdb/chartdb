import { z } from 'zod';

export const databaseEngineSchema = z.enum(['postgresql']);
export type DatabaseEngine = z.infer<typeof databaseEngineSchema>;

export const syncRefSchema = z.object({
    sourceId: z.string().optional(),
    sourceName: z.string().optional(),
});
export type SyncRef = z.infer<typeof syncRefSchema>;

export const canonicalColumnSchema = z.object({
    id: z.string(),
    name: z.string(),
    dataType: z.string(),
    dataTypeDisplay: z.string().optional(),
    nullable: z.boolean(),
    defaultValue: z.string().nullable().optional(),
    isPrimaryKey: z.boolean().optional(),
    isUnique: z.boolean().optional(),
    isIdentity: z.boolean().optional(),
    identityGeneration: z.enum(['ALWAYS', 'BY DEFAULT']).nullable().optional(),
    isArray: z.boolean().optional(),
    characterMaximumLength: z.number().nullable().optional(),
    precision: z.number().nullable().optional(),
    scale: z.number().nullable().optional(),
    comment: z.string().nullable().optional(),
    sync: syncRefSchema.optional(),
});
export type CanonicalColumn = z.infer<typeof canonicalColumnSchema>;

export const canonicalPrimaryKeySchema = z.object({
    id: z.string(),
    name: z.string().nullable().optional(),
    columnIds: z.array(z.string()),
});
export type CanonicalPrimaryKey = z.infer<typeof canonicalPrimaryKeySchema>;

export const canonicalUniqueConstraintSchema = z.object({
    id: z.string(),
    name: z.string(),
    columnIds: z.array(z.string()),
    sync: syncRefSchema.optional(),
});
export type CanonicalUniqueConstraint = z.infer<
    typeof canonicalUniqueConstraintSchema
>;

export const canonicalIndexSchema = z.object({
    id: z.string(),
    name: z.string(),
    columnIds: z.array(z.string()),
    unique: z.boolean(),
    type: z.string().nullable().optional(),
    comment: z.string().nullable().optional(),
    sync: syncRefSchema.optional(),
});
export type CanonicalIndex = z.infer<typeof canonicalIndexSchema>;

export const canonicalForeignKeySchema = z.object({
    id: z.string(),
    name: z.string(),
    columnIds: z.array(z.string()),
    referencedSchemaName: z.string(),
    referencedTableName: z.string(),
    referencedColumnNames: z.array(z.string()),
    onUpdate: z.string().nullable().optional(),
    onDelete: z.string().nullable().optional(),
    sync: syncRefSchema.optional(),
});
export type CanonicalForeignKey = z.infer<typeof canonicalForeignKeySchema>;

export const canonicalCheckConstraintSchema = z.object({
    id: z.string(),
    name: z.string().nullable().optional(),
    expression: z.string(),
    sync: syncRefSchema.optional(),
});
export type CanonicalCheckConstraint = z.infer<
    typeof canonicalCheckConstraintSchema
>;

export const canonicalTableSchema = z.object({
    id: z.string(),
    schemaName: z.string(),
    name: z.string(),
    kind: z.enum(['table', 'view']).default('table'),
    columns: z.array(canonicalColumnSchema),
    primaryKey: canonicalPrimaryKeySchema.nullable().optional(),
    uniqueConstraints: z.array(canonicalUniqueConstraintSchema).default([]),
    indexes: z.array(canonicalIndexSchema).default([]),
    foreignKeys: z.array(canonicalForeignKeySchema).default([]),
    checkConstraints: z.array(canonicalCheckConstraintSchema).default([]),
    comment: z.string().nullable().optional(),
    sync: syncRefSchema.optional(),
});
export type CanonicalTable = z.infer<typeof canonicalTableSchema>;

export const canonicalSchemaSchema = z.object({
    engine: databaseEngineSchema,
    databaseName: z.string(),
    defaultSchemaName: z.string().default('public'),
    schemaNames: z.array(z.string()).default([]),
    tables: z.array(canonicalTableSchema),
    fingerprint: z.string().optional(),
    importedAt: z.string().optional(),
});
export type CanonicalSchema = z.infer<typeof canonicalSchemaSchema>;

export const riskLevelSchema = z.enum([
    'safe',
    'warning',
    'destructive',
    'blocked',
]);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const riskWarningSchema = z.object({
    code: z.string(),
    level: riskLevelSchema,
    title: z.string(),
    message: z.string(),
    changeIds: z.array(z.string()).default([]),
});
export type RiskWarning = z.infer<typeof riskWarningSchema>;

export const schemaChangeSchema = z.discriminatedUnion('kind', [
    z.object({
        id: z.string(),
        kind: z.literal('create_schema'),
        schemaName: z.string(),
    }),
    z.object({
        id: z.string(),
        kind: z.literal('create_table'),
        table: canonicalTableSchema,
    }),
    z.object({
        id: z.string(),
        kind: z.literal('drop_table'),
        table: canonicalTableSchema,
    }),
    z.object({
        id: z.string(),
        kind: z.literal('rename_table'),
        tableId: z.string(),
        schemaName: z.string(),
        fromName: z.string(),
        toName: z.string(),
    }),
    z.object({
        id: z.string(),
        kind: z.literal('move_table'),
        tableId: z.string(),
        tableName: z.string(),
        fromSchema: z.string(),
        toSchema: z.string(),
    }),
    z.object({
        id: z.string(),
        kind: z.literal('add_column'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        column: canonicalColumnSchema,
    }),
    z.object({
        id: z.string(),
        kind: z.literal('drop_column'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        column: canonicalColumnSchema,
    }),
    z.object({
        id: z.string(),
        kind: z.literal('rename_column'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        columnId: z.string(),
        fromName: z.string(),
        toName: z.string(),
    }),
    z.object({
        id: z.string(),
        kind: z.literal('alter_column_type'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        columnId: z.string(),
        columnName: z.string(),
        fromType: z.string(),
        toType: z.string(),
    }),
    z.object({
        id: z.string(),
        kind: z.literal('alter_column_nullability'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        columnId: z.string(),
        columnName: z.string(),
        fromNullable: z.boolean(),
        toNullable: z.boolean(),
    }),
    z.object({
        id: z.string(),
        kind: z.literal('alter_column_default'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        columnId: z.string(),
        columnName: z.string(),
        fromDefault: z.string().nullable().optional(),
        toDefault: z.string().nullable().optional(),
    }),
    z.object({
        id: z.string(),
        kind: z.literal('add_primary_key'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        primaryKey: canonicalPrimaryKeySchema,
    }),
    z.object({
        id: z.string(),
        kind: z.literal('drop_primary_key'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        primaryKey: canonicalPrimaryKeySchema,
    }),
    z.object({
        id: z.string(),
        kind: z.literal('add_unique_constraint'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        constraint: canonicalUniqueConstraintSchema,
    }),
    z.object({
        id: z.string(),
        kind: z.literal('drop_unique_constraint'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        constraint: canonicalUniqueConstraintSchema,
    }),
    z.object({
        id: z.string(),
        kind: z.literal('add_index'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        index: canonicalIndexSchema,
    }),
    z.object({
        id: z.string(),
        kind: z.literal('drop_index'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        index: canonicalIndexSchema,
    }),
    z.object({
        id: z.string(),
        kind: z.literal('add_foreign_key'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        foreignKey: canonicalForeignKeySchema,
    }),
    z.object({
        id: z.string(),
        kind: z.literal('drop_foreign_key'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        foreignKey: canonicalForeignKeySchema,
    }),
    z.object({
        id: z.string(),
        kind: z.literal('add_check_constraint'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        constraint: canonicalCheckConstraintSchema,
    }),
    z.object({
        id: z.string(),
        kind: z.literal('drop_check_constraint'),
        tableId: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        constraint: canonicalCheckConstraintSchema,
    }),
]);
export type SchemaChange = z.infer<typeof schemaChangeSchema>;

export const schemaChangeSummarySchema = z.object({
    totalChanges: z.number(),
    safeChanges: z.number(),
    warningChanges: z.number(),
    destructiveChanges: z.number(),
    blockedChanges: z.number(),
});
export type SchemaChangeSummary = z.infer<typeof schemaChangeSummarySchema>;

export const changePlanSchema = z.object({
    id: z.string(),
    baselineSnapshotId: z.string(),
    connectionId: z.string(),
    engine: databaseEngineSchema,
    baselineFingerprint: z.string(),
    targetFingerprint: z.string(),
    changes: z.array(schemaChangeSchema),
    warnings: z.array(riskWarningSchema),
    sqlStatements: z.array(z.string()),
    summary: schemaChangeSummarySchema,
    requiresConfirmation: z.boolean(),
    blocked: z.boolean(),
    createdAt: z.string(),
});
export type ChangePlan = z.infer<typeof changePlanSchema>;

export const applyJobStatusSchema = z.enum([
    'pending',
    'running',
    'succeeded',
    'failed',
]);
export type ApplyJobStatus = z.infer<typeof applyJobStatusSchema>;

export interface ChangePlanContext {
    riskByChangeId: Map<string, RiskLevel>;
}
