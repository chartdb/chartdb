import type { DataTypeData } from './data-types';

export const genericDataTypes: readonly DataTypeData[] = [
    // Level 1 - Most commonly used types
    {
        name: 'varchar',
        id: 'varchar',
        fieldAttributes: { hasCharMaxLength: true },
        usageLevel: 1,
    },
    { name: 'int', id: 'int', usageLevel: 1 },
    { name: 'text', id: 'text', usageLevel: 1 },
    { name: 'boolean', id: 'boolean', usageLevel: 1 },
    { name: 'date', id: 'date', usageLevel: 1 },
    { name: 'timestamp', id: 'timestamp', usageLevel: 1 },

    // Level 2 - Second most common types
    {
        name: 'decimal',
        id: 'decimal',
        usageLevel: 2,
        fieldAttributes: {
            precision: {
                max: 999,
                min: 1,
                default: 10,
            },
            scale: {
                max: 999,
                min: 0,
                default: 2,
            },
        },
    },
    { name: 'datetime', id: 'datetime', usageLevel: 2 },
    { name: 'json', id: 'json', usageLevel: 2 },
    { name: 'uuid', id: 'uuid', usageLevel: 2 },

    // Less common types
    { name: 'bigint', id: 'bigint' },
    {
        name: 'binary',
        id: 'binary',
        fieldAttributes: { hasCharMaxLength: true },
    },
    { name: 'blob', id: 'blob' },
    { name: 'char', id: 'char', fieldAttributes: { hasCharMaxLength: true } },
    { name: 'double', id: 'double' },
    { name: 'enum', id: 'enum' },
    { name: 'float', id: 'float' },
    {
        name: 'numeric',
        id: 'numeric',
        fieldAttributes: {
            precision: {
                max: 999,
                min: 1,
                default: 10,
            },
            scale: {
                max: 999,
                min: 0,
                default: 2,
            },
        },
    },
    { name: 'real', id: 'real' },
    { name: 'set', id: 'set' },
    { name: 'smallint', id: 'smallint' },
    { name: 'time', id: 'time' },
    {
        name: 'varbinary',
        id: 'varbinary',
        fieldAttributes: { hasCharMaxLength: true },
    },
] as const;
