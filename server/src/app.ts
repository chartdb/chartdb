import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { serverEnv, type ServerEnv } from './config/env.js';
import { buildLoggerOptions } from './config/logger.js';
import { createAppContext } from './context/app-context.js';
import type { AppRepository } from './repositories/app-repository.js';
import type { MetadataRepository } from './repositories/metadata-repository.js';
import { registerHealthRoutes } from './routes/health-routes.js';
import { registerPersistenceRoutes } from './routes/persistence-routes.js';
import { registerSchemaSyncRoutes } from './routes/schema-sync-routes.js';
import { AppError } from './utils/app-error.js';

export const buildApp = (options?: {
    env?: ServerEnv;
    metadataRepository?: MetadataRepository;
    appRepository?: AppRepository;
}) => {
    const env = options?.env ?? serverEnv;
    const app = Fastify({
        logger: buildLoggerOptions(env),
    });
    const context = createAppContext(env, {
        metadataRepository: options?.metadataRepository,
        appRepository: options?.appRepository,
    });

    app.register(cors, {
        origin: env.corsOrigin === '*' ? true : env.corsOrigin,
    });

    app.setErrorHandler((error, request, reply) => {
        if (error instanceof ZodError) {
            return reply.code(400).send({
                error: 'Invalid request payload.',
                issues: error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            });
        }

        if (error instanceof AppError) {
            return reply.code(error.statusCode).send({
                error: error.message,
                code: error.code,
            });
        }

        request.log.error(error);
        return reply.code(500).send({
            error: 'Internal server error.',
        });
    });

    registerHealthRoutes(app, context);
    registerPersistenceRoutes(app, context);
    registerSchemaSyncRoutes(app, context);

    app.addHook('onClose', async () => {
        context.close();
    });

    return app;
};
