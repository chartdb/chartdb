import { ollamaSelectedModelKey } from '@/context/local-config-context/local-config-provider';
import type { DatabaseType } from '@/lib/domain/database-type';
import { sha256 } from '@/lib/utils';
import { LLMProvider } from '@/llms/providers';

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
    sqlScript: string,
    llmProvider: LLMProvider
): Promise<string> => {
    let llmProviderKeyPart = llmProvider.toString();
    if (llmProvider == LLMProvider.Ollama) {
        llmProviderKeyPart +=
            localStorage.getItem(ollamaSelectedModelKey) ?? ``;
    }
    const rawKey = `${databaseType}:${sqlScript}:${llmProviderKeyPart}`;
    return await sha256(rawKey);
};
