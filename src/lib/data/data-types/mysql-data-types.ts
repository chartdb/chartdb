import type { DataTypeData } from './data-types';

export const mysqlDataTypes: readonly DataTypeData[] = [
    // Level 1 - Most commonly used types
    { name: 'int', id: 'int', usageLevel: 1 },
    { name: 'varchar', id: 'varchar', hasCharMaxLength: true, usageLevel: 1 },
    { name: 'text', id: 'text', usageLevel: 1 },
    { name: 'boolean', id: 'boolean', usageLevel: 1 },
    { name: 'timestamp', id: 'timestamp', usageLevel: 1 },
    { name: 'date', id: 'date', usageLevel: 1 },

    // Level 2 - Second most common types
    { name: 'bigint', id: 'bigint', usageLevel: 2 },
    { name: 'decimal', id: 'decimal', usageLevel: 2 },
    { name: 'datetime', id: 'datetime', usageLevel: 2 },
    { name: 'json', id: 'json', usageLevel: 2 },

    // Less common types
    { name: 'tinyint', id: 'tinyint' },
    { name: 'smallint', id: 'smallint' },
    { name: 'mediumint', id: 'mediumint' },
    { name: 'float', id: 'float' },
    { name: 'double', id: 'double' },
    { name: 'bit', id: 'bit' },
    { name: 'char', id: 'char', hasCharMaxLength: true },
    { name: 'tinytext', id: 'tinytext' },
    { name: 'mediumtext', id: 'mediumtext' },
    { name: 'longtext', id: 'longtext' },
    { name: 'binary', id: 'binary' },
    { name: 'varbinary', id: 'varbinary' },
    { name: 'tinyblob', id: 'tinyblob' },
    { name: 'blob', id: 'blob' },
    { name: 'mediumblob', id: 'mediumblob' },
    { name: 'longblob', id: 'longblob' },
    { name: 'enum', id: 'enum' },
    { name: 'set', id: 'set' },
    { name: 'time', id: 'time' },
    { name: 'year', id: 'year' },
    { name: 'geometry', id: 'geometry' },
    { name: 'point', id: 'point' },
    { name: 'linestring', id: 'linestring' },
    { name: 'polygon', id: 'polygon' },
    { name: 'multipoint', id: 'multipoint' },
    { name: 'multilinestring', id: 'multilinestring' },
    { name: 'multipolygon', id: 'multipolygon' },
    { name: 'geometrycollection', id: 'geometrycollection' },
] as const;
