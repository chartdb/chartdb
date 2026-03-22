import { describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';

describe('schema sync api', () => {
    it('exposes a health endpoint', async () => {
        const app = buildApp();
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual(expect.objectContaining({ ok: true }));
    });

    it('allows connection test drafts without a saved connection name', async () => {
        const app = buildApp();
        const response = await app.inject({
            method: 'POST',
            url: '/api/connections/test',
            payload: {
                connection: {
                    name: '',
                    engine: 'postgresql',
                    defaultSchemas: ['public'],
                    secret: {
                        host: '127.0.0.1',
                        port: 1,
                        database: 'postgres',
                        username: 'postgres',
                        password: 'postgres',
                        sslMode: 'disable',
                    },
                },
            },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual(
            expect.objectContaining({
                ok: false,
                availableSchemas: [],
            })
        );
    });

    it('returns 400 for invalid request payloads', async () => {
        const app = buildApp();
        const response = await app.inject({
            method: 'POST',
            url: '/api/connections/test',
            payload: {
                connection: {
                    secret: {
                        host: '',
                        port: 5432,
                        database: '',
                        username: '',
                        password: '',
                        sslMode: 'prefer',
                    },
                },
            },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual(
            expect.objectContaining({
                error: 'Invalid request payload.',
            })
        );
    });
});
