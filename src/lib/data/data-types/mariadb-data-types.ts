import type { DataTypeData } from './data-types';

export const mariadbDataTypes: readonly DataTypeData[] = [
    // Numeric Types
    { name: 'int', id: 'int', frequentlyUsed: true },
    { name: 'bigint', id: 'bigint', frequentlyUsed: true },
    { name: 'decimal', id: 'decimal', frequentlyUsed: true },
    { name: 'tinyint', id: 'tinyint' },
    { name: 'smallint', id: 'smallint' },
    { name: 'mediumint', id: 'mediumint' },
    { name: 'numeric', id: 'numeric' },
    { name: 'float', id: 'float' },
    { name: 'double', id: 'double' },
    { name: 'bit', id: 'bit' },
    { name: 'bool', id: 'bool' },
    { name: 'boolean', id: 'boolean', frequentlyUsed: true },

    // Date and Time Types
    { name: 'datetime', id: 'datetime', frequentlyUsed: true },
    { name: 'date', id: 'date', frequentlyUsed: true },
    { name: 'timestamp', id: 'timestamp', frequentlyUsed: true },
    { name: 'time', id: 'time' },
    { name: 'year', id: 'year' },

    // String Types
    {
        name: 'varchar',
        id: 'varchar',
        hasCharMaxLength: true,
        frequentlyUsed: true,
    },
    { name: 'text', id: 'text', frequentlyUsed: true },
    { name: 'char', id: 'char', hasCharMaxLength: true },
    { name: 'binary', id: 'binary', hasCharMaxLength: true },
    { name: 'varbinary', id: 'varbinary', hasCharMaxLength: true },
    { name: 'tinyblob', id: 'tinyblob' },
    { name: 'blob', id: 'blob' },
    { name: 'mediumblob', id: 'mediumblob' },
    { name: 'longblob', id: 'longblob' },
    { name: 'tinytext', id: 'tinytext' },
    { name: 'mediumtext', id: 'mediumtext' },
    { name: 'longtext', id: 'longtext' },
    { name: 'enum', id: 'enum' },
    { name: 'set', id: 'set' },

    // Spatial Types
    { name: 'geometry', id: 'geometry' },
    { name: 'point', id: 'point' },
    { name: 'linestring', id: 'linestring' },
    { name: 'polygon', id: 'polygon' },
    { name: 'multipoint', id: 'multipoint' },
    { name: 'multilinestring', id: 'multilinestring' },
    { name: 'multipolygon', id: 'multipolygon' },
    { name: 'geometrycollection', id: 'geometrycollection' },

    // JSON Type
    { name: 'json', id: 'json', frequentlyUsed: true },
    { name: 'uuid', id: 'uuid', frequentlyUsed: true },
] as const;
