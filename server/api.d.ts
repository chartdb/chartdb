import type { IncomingMessage, ServerResponse } from 'node:http';

export type ApiHandler = (
    req: IncomingMessage,
    res: ServerResponse,
    next?: (err?: unknown) => void
) => Promise<boolean>;

export const resolveDataDir: () => string;

export const createApiHandler: (options?: { dataDir?: string }) => ApiHandler;
