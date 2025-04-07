import type { DataTypeData } from './data-types';

export const sqliteDataTypes: readonly DataTypeData[] = [
    // Numeric Types
    { name: 'integer', id: 'integer', frequentlyUsed: true },
    { name: 'real', id: 'real' },
    { name: 'numeric', id: 'numeric' },
    { name: 'int', id: 'int', frequentlyUsed: true },
    { name: 'decimal', id: 'decimal', frequentlyUsed: true },
    { name: 'float', id: 'float' },

    // Text Type
    { name: 'text', id: 'text', frequentlyUsed: true },
    {
        name: 'varchar',
        id: 'varchar',
        hasCharMaxLength: true,
        frequentlyUsed: true,
    },

    // Blob Type
    { name: 'blob', id: 'blob' },

    // JSON Type
    { name: 'json', id: 'json', frequentlyUsed: true },

    // Date/Time Types (SQLite uses TEXT, REAL, or INTEGER types for dates and times)
    { name: 'date', id: 'date', frequentlyUsed: true },
    { name: 'datetime', id: 'datetime', frequentlyUsed: true },

    // Other Types
    { name: 'boolean', id: 'boolean', frequentlyUsed: true },
] as const;
