import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context/app-context.js';

export const registerPersistenceRoutes = (
    app: FastifyInstance,
    context: AppContext
) => {
    app.get('/api/app/bootstrap', async () => {
        return context.persistenceService.bootstrap();
    });

    app.get('/api/projects', async (request) => {
        const query = request.query as { search?: string };
        return {
            items: context.persistenceService.listProjects({
                search: query.search,
            }),
        };
    });

    app.post('/api/projects', async (request) => {
        return {
            project: context.persistenceService.createProject(request.body),
        };
    });

    app.patch('/api/projects/:id', async (request) => {
        const params = request.params as { id: string };
        return {
            project: context.persistenceService.updateProject(
                params.id,
                request.body
            ),
        };
    });

    app.delete('/api/projects/:id', async (request) => {
        const params = request.params as { id: string };
        context.persistenceService.deleteProject(params.id);
        return { ok: true };
    });

    app.get('/api/projects/:id/diagrams', async (request) => {
        const params = request.params as { id: string };
        return {
            items: context.persistenceService.listProjectDiagrams(
                params.id,
                request.query
            ),
        };
    });

    app.get('/api/diagrams/:id', async (request) => {
        const params = request.params as { id: string };
        return context.persistenceService.getDiagram(params.id);
    });

    app.put('/api/diagrams/:id', async (request) => {
        const params = request.params as { id: string };
        return {
            diagram: context.persistenceService.upsertDiagram(
                params.id,
                request.body
            ),
        };
    });

    app.delete('/api/diagrams/:id', async (request) => {
        const params = request.params as { id: string };
        context.persistenceService.deleteDiagram(params.id);
        return { ok: true };
    });
};
