import type { DataTypeData } from './data-types';

export const sqliteDataTypes: readonly DataTypeData[] = [
    // Numeric Types
    { name: 'integer', id: 'integer' },
    { name: 'real', id: 'real' },
    { name: 'numeric', id: 'numeric' },

    // Text Type
    { name: 'text', id: 'text' },

    // Blob Type
    { name: 'blob', id: 'blob' },

    // Blob Type
    { name: 'json', id: 'json' },

    // Date/Time Types (SQLite uses TEXT, REAL, or INTEGER types for dates and times)
    { name: 'date', id: 'date' },
    { name: 'datetime', id: 'datetime' },

    { name: 'int', id: 'int' },
    { name: 'float', id: 'float' },
    { name: 'boolean', id: 'boolean' },
    { name: 'varchar', id: 'varchar', hasCharMaxLength: true },
    { name: 'decimal', id: 'decimal' },
] as const;
