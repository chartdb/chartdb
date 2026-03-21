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
});
