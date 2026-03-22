import { z } from 'zod';

export const userAuthProviderSchema = z.enum(['placeholder', 'local', 'oidc']);
export const userStatusSchema = z.enum(['provisioned', 'active', 'disabled']);
export const ownershipScopeSchema = z.enum(['personal', 'workspace']);

export const projectVisibilitySchema = z.enum([
    'private',
    'workspace',
    'public',
]);
export const projectStatusSchema = z.enum(['active', 'archived', 'deleted']);

export const diagramVisibilitySchema = z.enum([
    'private',
    'workspace',
    'public',
]);
export const diagramStatusSchema = z.enum(['draft', 'active', 'archived']);

const diagramRecordSchema = z.record(z.string(), z.unknown());

export const diagramDocumentSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    databaseType: z.string().min(1),
    databaseEdition: z.string().min(1).optional(),
    tables: z.array(diagramRecordSchema).optional(),
    relationships: z.array(diagramRecordSchema).optional(),
    dependencies: z.array(diagramRecordSchema).optional(),
    areas: z.array(diagramRecordSchema).optional(),
    customTypes: z.array(diagramRecordSchema).optional(),
    notes: z.array(diagramRecordSchema).optional(),
    schemaSync: diagramRecordSchema.optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export type DiagramDocument = z.infer<typeof diagramDocumentSchema>;

export const createProjectSchema = z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional(),
    visibility: projectVisibilitySchema.optional(),
    status: projectStatusSchema.optional(),
});

export const updateProjectSchema = createProjectSchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one project field must be updated.',
    });

export const listProjectDiagramsQuerySchema = z.object({
    search: z.string().trim().optional(),
    view: z.enum(['summary', 'full']).optional().default('summary'),
});

export const upsertDiagramSchema = z.object({
    projectId: z.string().trim().min(1),
    ownerUserId: z.string().trim().min(1).optional(),
    visibility: diagramVisibilitySchema.optional(),
    status: diagramStatusSchema.optional(),
    description: z.string().trim().max(500).optional(),
    diagram: diagramDocumentSchema,
});
