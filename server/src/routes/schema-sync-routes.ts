import type { FastifyInstance } from 'fastify';
import {
    applySchemaRequestSchema,
    connectionTestRequestSchema,
    connectionUpsertSchema,
    diffSchemaRequestSchema,
    importLiveSchemaRequestSchema,
} from '@chartdb/schema-sync-core';
import type { AppContext } from '../context/app-context.js';

export const registerSchemaSyncRoutes = (
    app: FastifyInstance,
    context: AppContext
) => {
    app.get('/api/connections', async () => ({
        items: context.connectionsService.listConnections(),
    }));

    app.post('/api/connections', async (request) => {
        const payload = connectionUpsertSchema.parse(request.body);
        return {
            connection: context.connectionsService.createConnection(payload),
        };
    });

    app.patch('/api/connections/:id', async (request) => {
        const payload = connectionUpsertSchema.parse(request.body);
        const params = request.params as { id: string };
        return {
            connection: context.connectionsService.updateConnection(
                params.id,
                payload
            ),
        };
    });

    app.delete('/api/connections/:id', async (request) => {
        const params = request.params as { id: string };
        context.connectionsService.deleteConnection(params.id);
        return { ok: true };
    });

    app.post('/api/connections/test', async (request) => {
        const payload = connectionTestRequestSchema.parse(request.body);
        return await context.connectionsService.testConnection(payload);
    });

    app.post('/api/connections/:id/test', async (request) => {
        const params = request.params as { id: string };
        return await context.connectionsService.testConnection({
            connectionId: params.id,
        });
    });

    app.post('/api/schema/import-live', async (request) => {
        const payload = importLiveSchemaRequestSchema.parse(request.body);
        return await context.schemaSyncService.importLiveSchema(payload);
    });

    app.post('/api/schema/diff', async (request) => {
        const payload = diffSchemaRequestSchema.parse(request.body);
        return await context.schemaSyncService.diffSchema(payload);
    });

    app.post('/api/schema/apply', async (request) => {
        const payload = applySchemaRequestSchema.parse(request.body);
        return await context.applyService.applyPlan(payload);
    });

    app.get('/api/schema/jobs/:id', async (request, reply) => {
        const params = request.params as { id: string };
        const job = context.metadataRepository.getApplyJob(params.id);
        if (!job) {
            return reply.code(404).send({ error: 'Job not found' });
        }
        return {
            id: job.id,
            status: job.status,
            logs: job.logs,
            error: job.error ?? null,
            executedStatements: job.executedStatements,
            auditId: job.auditId,
        };
    });

    app.get('/api/audit/:id', async (request, reply) => {
        const params = request.params as { id: string };
        const audit = context.metadataRepository.getAudit(params.id);
        if (!audit) {
            return reply.code(404).send({ error: 'Audit record not found' });
        }
        return audit;
    });
};
