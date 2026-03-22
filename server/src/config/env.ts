import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotEnv } from 'dotenv';
import { z } from 'zod';

const serverRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..'
);
const repoRoot = path.resolve(serverRoot, '..');

loadDotEnv({ path: path.join(repoRoot, '.env'), override: false, quiet: true });
loadDotEnv({
    path: path.join(serverRoot, '.env'),
    override: false,
    quiet: true,
});

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .optional()
        .default('development'),
    CHARTDB_API_HOST: z.string().optional().default('0.0.0.0'),
    CHARTDB_API_PORT: z.coerce
        .number()
        .int()
        .positive()
        .optional()
        .default(4010),
    CHARTDB_CORS_ORIGIN: z.string().optional().default('*'),
    CHARTDB_DATA_DIR: z.string().optional(),
    CHARTDB_METADATA_DB_PATH: z.string().optional(),
    CHARTDB_APP_DB_PATH: z.string().optional(),
    CHARTDB_SECRET_KEY: z.string().optional(),
    CHARTDB_LOG_LEVEL: z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
        .optional()
        .default('info'),
    CHARTDB_DEFAULT_PROJECT_NAME: z.string().optional().default('My Diagrams'),
    CHARTDB_DEFAULT_OWNER_NAME: z.string().optional().default('Local Owner'),
});

const parsedEnv = envSchema.parse(process.env);

const dataDir = parsedEnv.CHARTDB_DATA_DIR
    ? path.resolve(parsedEnv.CHARTDB_DATA_DIR)
    : path.resolve(repoRoot, '.chartdb-data');

mkdirSync(dataDir, { recursive: true });

const resolveSecretKey = (): string => {
    const provided = parsedEnv.CHARTDB_SECRET_KEY?.trim();
    const isPlaceholder =
        !provided || provided === 'change-me-before-production';

    if (!isPlaceholder) {
        return provided;
    }

    if (parsedEnv.NODE_ENV === 'production') {
        throw new Error(
            'CHARTDB_SECRET_KEY must be set to a non-placeholder value in production.'
        );
    }

    console.warn(
        '[config] CHARTDB_SECRET_KEY is not configured. Using an ephemeral development key.'
    );
    return randomBytes(32).toString('hex');
};

const rawEncryptionKey = resolveSecretKey();

export interface ServerEnv {
    nodeEnv: 'development' | 'test' | 'production';
    host: string;
    port: number;
    corsOrigin: string;
    logLevel:
        | 'fatal'
        | 'error'
        | 'warn'
        | 'info'
        | 'debug'
        | 'trace'
        | 'silent';
    dataDir: string;
    metadataDbPath: string;
    appDbPath: string;
    encryptionKey: Buffer;
    defaultProjectName: string;
    defaultOwnerName: string;
}

export const serverEnv: ServerEnv = {
    nodeEnv: parsedEnv.NODE_ENV,
    host: parsedEnv.CHARTDB_API_HOST,
    port: parsedEnv.CHARTDB_API_PORT,
    corsOrigin: parsedEnv.CHARTDB_CORS_ORIGIN,
    logLevel: parsedEnv.CHARTDB_LOG_LEVEL,
    dataDir,
    metadataDbPath: parsedEnv.CHARTDB_METADATA_DB_PATH
        ? path.resolve(parsedEnv.CHARTDB_METADATA_DB_PATH)
        : path.join(dataDir, 'schema-sync.sqlite'),
    appDbPath: parsedEnv.CHARTDB_APP_DB_PATH
        ? path.resolve(parsedEnv.CHARTDB_APP_DB_PATH)
        : path.join(dataDir, 'chartdb-app.sqlite'),
    encryptionKey: createHash('sha256').update(rawEncryptionKey).digest(),
    defaultProjectName: parsedEnv.CHARTDB_DEFAULT_PROJECT_NAME,
    defaultOwnerName: parsedEnv.CHARTDB_DEFAULT_OWNER_NAME,
};
