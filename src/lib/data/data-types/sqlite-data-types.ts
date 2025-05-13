import type { DataTypeData } from './data-types';

export const sqliteDataTypes: readonly DataTypeData[] = [
    // Level 1 - Most commonly used types - SQLite's 5 storage classes
    { name: 'integer', id: 'integer', usageLevel: 1 },
    { name: 'text', id: 'text', usageLevel: 1 },
    { name: 'real', id: 'real', usageLevel: 1 },
    { name: 'blob', id: 'blob', usageLevel: 1 },
    { name: 'null', id: 'null', usageLevel: 1 },

    // SQLite type aliases and common types
    { name: 'int', id: 'int', usageLevel: 1 },
    { name: 'varchar', id: 'varchar', hasCharMaxLength: true, usageLevel: 1 },
    { name: 'timestamp', id: 'timestamp', usageLevel: 1 },
    { name: 'date', id: 'date', usageLevel: 1 },
    { name: 'datetime', id: 'datetime', usageLevel: 1 },
    { name: 'boolean', id: 'boolean', usageLevel: 1 },

    // Level 2 - Second most common types
    { name: 'numeric', id: 'numeric', usageLevel: 2 },
    { name: 'decimal', id: 'decimal', usageLevel: 2 },
    { name: 'float', id: 'float', usageLevel: 2 },
    { name: 'double', id: 'double', usageLevel: 2 },
    { name: 'json', id: 'json', usageLevel: 2 },

    // Less common types (all map to SQLite storage classes)
    { name: 'char', id: 'char', hasCharMaxLength: true },
    { name: 'binary', id: 'binary' },
    { name: 'varbinary', id: 'varbinary' },
    { name: 'smallint', id: 'smallint' },
    { name: 'bigint', id: 'bigint' },
    { name: 'bool', id: 'bool' },
    { name: 'time', id: 'time' },
] as const;
