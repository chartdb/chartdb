import type { DataTypeData } from './data-types';

export const mariadbDataTypes: readonly DataTypeData[] = [
    // Numeric Types
    { name: 'tinyint', id: 'tinyint' },
    { name: 'smallint', id: 'smallint' },
    { name: 'mediumint', id: 'mediumint' },
    { name: 'int', id: 'int' },
    { name: 'bigint', id: 'bigint' },
    { name: 'decimal', id: 'decimal' },
    { name: 'numeric', id: 'numeric' },
    { name: 'float', id: 'float' },
    { name: 'double', id: 'double' },
    { name: 'bit', id: 'bit' },
    { name: 'bool', id: 'bool' },
    { name: 'boolean', id: 'boolean' },

    // Date and Time Types
    { name: 'date', id: 'date' },
    { name: 'datetime', id: 'datetime' },
    { name: 'timestamp', id: 'timestamp' },
    { name: 'time', id: 'time' },
    { name: 'year', id: 'year' },

    // String Types
    { name: 'char', id: 'char', hasCharMaxLength: true },
    { name: 'varchar', id: 'varchar', hasCharMaxLength: true },
    { name: 'binary', id: 'binary', hasCharMaxLength: true },
    { name: 'varbinary', id: 'varbinary', hasCharMaxLength: true },
    { name: 'tinyblob', id: 'tinyblob' },
    { name: 'blob', id: 'blob' },
    { name: 'mediumblob', id: 'mediumblob' },
    { name: 'longblob', id: 'longblob' },
    { name: 'tinytext', id: 'tinytext' },
    { name: 'text', id: 'text' },
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
    { name: 'json', id: 'json' },
    { name: 'uuid', id: 'uuid' },
] as const;
