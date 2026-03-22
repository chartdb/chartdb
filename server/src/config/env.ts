import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const dataDir = process.env.CHARTDB_DATA_DIR
    ? path.resolve(process.env.CHARTDB_DATA_DIR)
    : path.resolve(cwd, '.chartdb-data');

mkdirSync(dataDir, { recursive: true });

const rawEncryptionKey =
    process.env.CHARTDB_SECRET_KEY ?? 'chartdb-local-dev-secret';

export const serverEnv = {
    host: process.env.CHARTDB_API_HOST ?? '0.0.0.0',
    port: Number.parseInt(process.env.CHARTDB_API_PORT ?? '4010', 10),
    corsOrigin: process.env.CHARTDB_CORS_ORIGIN ?? '*',
    dataDir,
    metadataDbPath: path.join(dataDir, 'schema-sync.sqlite'),
    encryptionKey: createHash('sha256').update(rawEncryptionKey).digest(),
};
