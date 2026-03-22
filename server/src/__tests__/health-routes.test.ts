import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import type { ServerEnv } from '../config/env.js';

const tempDirs: string[] = [];

const createTestEnv = (): ServerEnv => {
    const dataDir = mkdtempSync(path.join(os.tmpdir(), 'chartdb-health-'));
    tempDirs.push(dataDir);
    return {
        nodeEnv: 'test',
        host: '127.0.0.1',
        port: 4010,
        corsOrigin: '*',
        logLevel: 'silent',
        dataDir,
        metadataDbPath: path.join(dataDir, 'schema-sync.sqlite'),
        appDbPath: path.join(dataDir, 'chartdb-app.sqlite'),
        encryptionKey: Buffer.from('test-key'),
        defaultOwnerName: 'Test Owner',
        defaultProjectName: 'Test Project',
    };
};

afterEach(() => {
    while (tempDirs.length > 0) {
        const dir = tempDirs.pop();
        if (dir) {
            rmSync(dir, { recursive: true, force: true });
        }
    }
});

describe('health routes', () => {
    it('returns backend and persistence readiness', async () => {
        const app = buildApp({ env: createTestEnv() });
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
            ok: true,
            service: 'chartdb-api',
            persistence: {
                app: 'sqlite',
                schemaSync: 'sqlite',
            },
        });

        await app.close();
    });
});
