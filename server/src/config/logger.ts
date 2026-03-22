import type { FastifyServerOptions } from 'fastify';
import type { ServerEnv } from './env.js';

export const buildLoggerOptions = (
    env: Pick<ServerEnv, 'logLevel' | 'nodeEnv'>
): FastifyServerOptions['logger'] => ({
    level: env.logLevel,
    base: {
        service: 'chartdb-api',
        env: env.nodeEnv,
    },
    redact: [
        'req.headers.authorization',
        'req.body.connection.secret.password',
        'req.body.password',
        'req.body.secret',
        'password',
        'secret',
    ],
});
