import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context/app-context.js';

export const registerHealthRoutes = (
    app: FastifyInstance,
    context: AppContext
) => {
    app.get('/api/health', async () => {
        const bootstrap = context.persistenceService.bootstrap();
        return {
            ok: true,
            service: 'chartdb-api',
            environment: context.env.nodeEnv,
            persistence: {
                app: 'sqlite',
                schemaSync: 'sqlite',
            },
            defaultProjectId: bootstrap.defaultProject.id,
            timestamp: new Date().toISOString(),
        };
    });
};
