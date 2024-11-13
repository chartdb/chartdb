import type { DatabaseType } from '@/lib/domain/database-type';
import { sha256 } from '@/lib/utils';

export const getFromCache = (key: string): string | null => {
    try {
        return localStorage.getItem(`sql-export-${key}`);
    } catch (e) {
        console.warn('Failed to read from localStorage:', e);
        return null;
    }
};

export const setInCache = (key: string, value: string): void => {
    try {
        localStorage.setItem(`sql-export-${key}`, value);
    } catch (e) {
        console.warn('Failed to write to localStorage:', e);
    }
};

export const generateCacheKey = async (
    databaseType: DatabaseType,
    sqlScript: string
): Promise<string> => {
    const rawKey = `${databaseType}:${sqlScript}`;
    return await sha256(rawKey);
};
