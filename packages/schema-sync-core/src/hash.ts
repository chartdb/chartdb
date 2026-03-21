import { createHash } from 'node:crypto';
import type { CanonicalSchema } from './types.js';

const stableSort = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(stableSort);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([key, child]) => [key, stableSort(child)])
        );
    }

    return value;
};

export const hashCanonicalSchema = (schema: CanonicalSchema): string => {
    const normalized = stableSort(schema);
    return createHash('sha256')
        .update(JSON.stringify(normalized))
        .digest('hex');
};
