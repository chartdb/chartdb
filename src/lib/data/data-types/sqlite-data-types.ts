import type { DataType } from './data-types';

export const sqliteDataTypes: readonly DataType[] = [
    // Numeric Types
    { name: 'integer', id: 'integer' },
    { name: 'real', id: 'real' },
    { name: 'numeric', id: 'numeric' },

    // Text Type
    { name: 'text', id: 'text' },

    // Blob Type
    { name: 'blob', id: 'blob' },

    // Date/Time Types (SQLite uses TEXT, REAL, or INTEGER types for dates and times)
    { name: 'date', id: 'date' },
    { name: 'datetime', id: 'datetime' },

    { name: 'int', id: 'int' },
    { name: 'float', id: 'float' },
    { name: 'boolean', id: 'boolean' },
    { name: 'varchar', id: 'varchar' },
    { name: 'decimal', id: 'decimal' },
] as const;
