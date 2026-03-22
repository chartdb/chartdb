import { describe, expect, it } from 'vitest';
import { serverEnv } from '../config/env.js';

describe('serverEnv', () => {
    it('resolves persistence paths inside the data directory by default', () => {
        expect(serverEnv.appDbPath.endsWith('chartdb-app.sqlite')).toBe(true);
        expect(serverEnv.metadataDbPath.endsWith('schema-sync.sqlite')).toBe(
            true
        );
    });

    it('exposes validated runtime settings', () => {
        expect(serverEnv.port).toBeGreaterThan(0);
        expect(serverEnv.host.length).toBeGreaterThan(0);
        expect(serverEnv.logLevel.length).toBeGreaterThan(0);
        expect(serverEnv.encryptionKey.byteLength).toBeGreaterThan(0);
    });
});
