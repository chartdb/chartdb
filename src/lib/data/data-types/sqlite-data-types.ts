import type { DataTypeData } from './data-types';

export const sqliteDataTypes: readonly DataTypeData[] = [
    // Level 1 - Most commonly used types
    { name: 'integer', id: 'integer', usageLevel: 1 },
    { name: 'int', id: 'int', usageLevel: 1 },
    { name: 'text', id: 'text', usageLevel: 1 },
    {
        name: 'varchar',
        id: 'varchar',
        fieldAttributes: { hasCharMaxLength: true },
        usageLevel: 1,
    },
    { name: 'date', id: 'date', usageLevel: 1 },
    { name: 'datetime', id: 'datetime', usageLevel: 1 },
    { name: 'boolean', id: 'boolean', usageLevel: 1 },

    // Level 2 - Second most common types
    {
        name: 'decimal',
        id: 'decimal',
        usageLevel: 2,
        fieldAttributes: {
            hasPrecision: true,
            hasScale: true,
        },
    },
    { name: 'json', id: 'json', usageLevel: 2 },

    // Less common types
    { name: 'real', id: 'real' },
    { name: 'numeric', id: 'numeric' },
    { name: 'float', id: 'float' },
    { name: 'blob', id: 'blob' },
] as const;
