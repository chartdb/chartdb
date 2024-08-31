import { DatabaseType } from '../domain/database-type';

export interface DataType {
    id: string;
    name: string;
}

export const genericDataTypes: readonly DataType[] = [
    { name: 'bigint', id: 'bigint' },
    { name: 'binary', id: 'binary' },
    { name: 'blob', id: 'blob' },
    { name: 'boolean', id: 'boolean' },
    { name: 'char', id: 'char' },
    { name: 'date', id: 'date' },
    { name: 'datetime', id: 'datetime' },
    { name: 'decimal', id: 'decimal' },
    { name: 'double', id: 'double' },
    { name: 'enum', id: 'enum' },
    { name: 'float', id: 'float' },
    { name: 'int', id: 'int' },
    { name: 'json', id: 'json' },
    { name: 'numeric', id: 'numeric' },
    { name: 'real', id: 'real' },
    { name: 'set', id: 'set' },
    { name: 'smallint', id: 'smallint' },
    { name: 'text', id: 'text' },
    { name: 'time', id: 'time' },
    { name: 'timestamp', id: 'timestamp' },
    { name: 'uuid', id: 'uuid' },
    { name: 'varbinary', id: 'varbinary' },
    { name: 'varchar', id: 'varchar' },
] as const;

export const postgresDataTypes: readonly DataType[] = [
    // Numeric Types
    { name: 'smallint', id: 'smallint' },
    { name: 'integer', id: 'integer' },
    { name: 'bigint', id: 'bigint' },
    { name: 'decimal', id: 'decimal' },
    { name: 'numeric', id: 'numeric' },
    { name: 'real', id: 'real' },
    { name: 'double precision', id: 'double_precision' },
    { name: 'smallserial', id: 'smallserial' },
    { name: 'serial', id: 'serial' },
    { name: 'bigserial', id: 'bigserial' },
    { name: 'money', id: 'money' },

    // Character Types
    { name: 'char', id: 'char' },
    { name: 'varchar', id: 'varchar' },
    { name: 'character varying', id: 'character_varying' },
    { name: 'text', id: 'text' },

    // Binary Data Types
    { name: 'bytea', id: 'bytea' },

    // Date/Time Types
    { name: 'date', id: 'date' },
    { name: 'timestamp', id: 'timestamp' },
    { name: 'timestamp with time zone', id: 'timestamp_with_time_zone' },
    { name: 'timestamp without time zone', id: 'timestamp_without_time_zone' },
    { name: 'time', id: 'time' },
    { name: 'time with time zone', id: 'time_with_time_zone' },
    { name: 'time without time zone', id: 'time_without_time_zone' },
    { name: 'interval', id: 'interval' },

    // Boolean Type
    { name: 'boolean', id: 'boolean' },

    // Enumerated Types
    { name: 'enum', id: 'enum' },

    // Geometric Types
    { name: 'point', id: 'point' },
    { name: 'line', id: 'line' },
    { name: 'lseg', id: 'lseg' },
    { name: 'box', id: 'box' },
    { name: 'path', id: 'path' },
    { name: 'polygon', id: 'polygon' },
    { name: 'circle', id: 'circle' },

    // Network Address Types
    { name: 'cidr', id: 'cidr' },
    { name: 'inet', id: 'inet' },
    { name: 'macaddr', id: 'macaddr' },
    { name: 'macaddr8', id: 'macaddr8' },

    // Bit String Types
    { name: 'bit', id: 'bit' },
    { name: 'bit varying', id: 'bit_varying' },

    // Text Search Types
    { name: 'tsvector', id: 'tsvector' },
    { name: 'tsquery', id: 'tsquery' },

    // UUID Type
    { name: 'uuid', id: 'uuid' },

    // XML Type
    { name: 'xml', id: 'xml' },

    // JSON Types
    { name: 'json', id: 'json' },
    { name: 'jsonb', id: 'jsonb' },

    // Array Types
    { name: 'array', id: 'array' },

    // Range Types
    { name: 'int4range', id: 'int4range' },
    { name: 'int8range', id: 'int8range' },
    { name: 'numrange', id: 'numrange' },
    { name: 'tsrange', id: 'tsrange' },
    { name: 'tstzrange', id: 'tstzrange' },
    { name: 'daterange', id: 'daterange' },

    // Object Identifier Types
    { name: 'oid', id: 'oid' },
    { name: 'regproc', id: 'regproc' },
    { name: 'regprocedure', id: 'regprocedure' },
    { name: 'regoper', id: 'regoper' },
    { name: 'regoperator', id: 'regoperator' },
    { name: 'regclass', id: 'regclass' },
    { name: 'regtype', id: 'regtype' },
    { name: 'regrole', id: 'regrole' },
    { name: 'regnamespace', id: 'regnamespace' },
    { name: 'regconfig', id: 'regconfig' },
    { name: 'regdictionary', id: 'regdictionary' },

    // User Defined types
    { name: 'user-defined', id: 'user-defined' },
] as const;

export const mysqlDataTypes: readonly DataType[] = [
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
    { name: 'char', id: 'char' },
    { name: 'varchar', id: 'varchar' },
    { name: 'binary', id: 'binary' },
    { name: 'varbinary', id: 'varbinary' },
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
] as const;

export const sqlServerDataTypes: readonly DataType[] = [
    // Exact Numerics
    { name: 'bigint', id: 'bigint' },
    { name: 'bit', id: 'bit' },
    { name: 'decimal', id: 'decimal' },
    { name: 'int', id: 'int' },
    { name: 'money', id: 'money' },
    { name: 'numeric', id: 'numeric' },
    { name: 'smallint', id: 'smallint' },
    { name: 'smallmoney', id: 'smallmoney' },
    { name: 'tinyint', id: 'tinyint' },

    // Approximate Numerics
    { name: 'float', id: 'float' },
    { name: 'real', id: 'real' },

    // Date and Time
    { name: 'date', id: 'date' },
    { name: 'datetime2', id: 'datetime2' },
    { name: 'datetime', id: 'datetime' },
    { name: 'datetimeoffset', id: 'datetimeoffset' },
    { name: 'smalldatetime', id: 'smalldatetime' },
    { name: 'time', id: 'time' },

    // Character Strings
    { name: 'char', id: 'char' },
    { name: 'varchar', id: 'varchar' },
    { name: 'text', id: 'text' },

    // Unicode Character Strings
    { name: 'nchar', id: 'nchar' },
    { name: 'nvarchar', id: 'nvarchar' },
    { name: 'ntext', id: 'ntext' },

    // Binary Strings
    { name: 'binary', id: 'binary' },
    { name: 'varbinary', id: 'varbinary' },
    { name: 'image', id: 'image' },

    // Other Data Types
    { name: 'cursor', id: 'cursor' },
    { name: 'hierarchyid', id: 'hierarchyid' },
    { name: 'sql_variant', id: 'sql_variant' },
    { name: 'timestamp', id: 'timestamp' },
    { name: 'uniqueidentifier', id: 'uniqueidentifier' },
    { name: 'xml', id: 'xml' },

    // Spatial Data Types
    { name: 'geometry', id: 'geometry' },
    { name: 'geography', id: 'geography' },

    // JSON
    { name: 'json', id: 'json' },
] as const;

export const mariadbDataTypes: readonly DataType[] = [
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
    { name: 'char', id: 'char' },
    { name: 'varchar', id: 'varchar' },
    { name: 'binary', id: 'binary' },
    { name: 'varbinary', id: 'varbinary' },
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
] as const;

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

export const dataTypeMap: Record<DatabaseType, readonly DataType[]> = {
    [DatabaseType.GENERIC]: genericDataTypes,
    [DatabaseType.POSTGRESQL]: postgresDataTypes,
    [DatabaseType.MYSQL]: mysqlDataTypes,
    [DatabaseType.SQL_SERVER]: sqlServerDataTypes,
    [DatabaseType.MARIADB]: mariadbDataTypes,
    [DatabaseType.SQLITE]: sqliteDataTypes,
} as const;
