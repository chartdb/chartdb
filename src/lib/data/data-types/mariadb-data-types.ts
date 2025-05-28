import type { DataTypeData } from './data-types';

export const mariadbDataTypes: readonly DataTypeData[] = [
    // Level 1 - Most commonly used types
    { name: 'int', id: 'int', usageLevel: 1 },
    { name: 'bigint', id: 'bigint', usageLevel: 1 },
    {
        name: 'decimal',
        id: 'decimal',
        usageLevel: 1,
        fieldAttributes: {
            precision: {
                max: 65,
                min: 1,
                default: 10,
            },
            scale: {
                max: 30,
                min: 0,
                default: 0,
            },
        },
    },
    { name: 'boolean', id: 'boolean', usageLevel: 1 },
    { name: 'datetime', id: 'datetime', usageLevel: 1 },
    { name: 'date', id: 'date', usageLevel: 1 },
    { name: 'timestamp', id: 'timestamp', usageLevel: 1 },
    {
        name: 'varchar',
        id: 'varchar',
        fieldAttributes: { hasCharMaxLength: true },
    },
    { name: 'text', id: 'text', usageLevel: 1 },

    // Level 2 - Second most common types
    { name: 'json', id: 'json', usageLevel: 2 },
    { name: 'uuid', id: 'uuid', usageLevel: 2 },

    // Less common types
    { name: 'tinyint', id: 'tinyint' },
    { name: 'smallint', id: 'smallint' },
    { name: 'mediumint', id: 'mediumint' },
    {
        name: 'numeric',
        id: 'numeric',
        fieldAttributes: {
            precision: {
                max: 65,
                min: 1,
                default: 10,
            },
            scale: {
                max: 30,
                min: 0,
                default: 0,
            },
        },
    },
    { name: 'float', id: 'float' },
    { name: 'double', id: 'double' },
    { name: 'bit', id: 'bit' },
    { name: 'bool', id: 'bool' },
    { name: 'time', id: 'time' },
    { name: 'year', id: 'year' },
    { name: 'char', id: 'char', fieldAttributes: { hasCharMaxLength: true } },
    {
        name: 'binary',
        id: 'binary',
        fieldAttributes: { hasCharMaxLength: true },
    },
    {
        name: 'varbinary',
        id: 'varbinary',
        fieldAttributes: { hasCharMaxLength: true },
    },
    { name: 'tinyblob', id: 'tinyblob' },
    { name: 'blob', id: 'blob' },
    { name: 'mediumblob', id: 'mediumblob' },
    { name: 'longblob', id: 'longblob' },
    { name: 'tinytext', id: 'tinytext' },
    { name: 'mediumtext', id: 'mediumtext' },
    { name: 'longtext', id: 'longtext' },
    { name: 'enum', id: 'enum' },
    { name: 'set', id: 'set' },
    { name: 'geometry', id: 'geometry' },
    { name: 'point', id: 'point' },
    { name: 'linestring', id: 'linestring' },
    { name: 'polygon', id: 'polygon' },
    { name: 'multipoint', id: 'multipoint' },
    { name: 'multilinestring', id: 'multilinestring' },
    { name: 'multipolygon', id: 'multipolygon' },
    { name: 'geometrycollection', id: 'geometrycollection' },
] as const;
