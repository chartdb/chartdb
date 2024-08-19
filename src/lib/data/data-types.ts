import { DatabaseType } from '../domain/database-type';

export const genericDataTypes = [
    'bigint',
    'binary',
    'blob',
    'boolean',
    'char',
    'date',
    'datetime',
    'decimal',
    'double',
    'enum',
    'float',
    'int',
    'json',
    'numeric',
    'real',
    'set',
    'smallint',
    'text',
    'time',
    'timestamp',
    'uuid',
    'varbinary',
    'varchar',
] as const;
export const postgresDataTypes = [
    // Numeric Types
    'smallint',
    'integer',
    'bigint',
    'decimal',
    'numeric',
    'real',
    'double precision',
    'smallserial',
    'serial',
    'bigserial',
    'money',

    // Character Types
    'char',
    'varchar',
    'character varying',
    'text',

    // Binary Data Types
    'bytea',

    // Date/Time Types
    'date',
    'timestamp',
    'timestamp with time zone',
    'timestamp without time zone',
    'time',
    'time with time zone',
    'time without time zone',
    'interval',

    // Boolean Type
    'boolean',

    // Enumerated Types
    'enum',

    // Geometric Types
    'point',
    'line',
    'lseg',
    'box',
    'path',
    'polygon',
    'circle',

    // Network Address Types
    'cidr',
    'inet',
    'macaddr',
    'macaddr8',

    // Bit String Types
    'bit',
    'bit varying',

    // Text Search Types
    'tsvector',
    'tsquery',

    // UUID Type
    'uuid',

    // XML Type
    'xml',

    // JSON Types
    'json',
    'jsonb',

    // Array Types
    'array',

    // Range Types
    'int4range',
    'int8range',
    'numrange',
    'tsrange',
    'tstzrange',
    'daterange',

    // Object Identifier Types
    'oid',
    'regproc',
    'regprocedure',
    'regoper',
    'regoperator',
    'regclass',
    'regtype',
    'regrole',
    'regnamespace',
    'regconfig',
    'regdictionary',

    // User Defined types
    'user-defined',
] as const;
export const mysqlDataTypes = [
    // Numeric Types
    'tinyint',
    'smallint',
    'mediumint',
    'int',
    'bigint',
    'decimal',
    'numeric',
    'float',
    'double',
    'bit',
    'bool',
    'boolean',

    // Date and Time Types
    'date',
    'datetime',
    'timestamp',
    'time',
    'year',

    // String Types
    'char',
    'varchar',
    'binary',
    'varbinary',
    'tinyblob',
    'blob',
    'mediumblob',
    'longblob',
    'tinytext',
    'text',
    'mediumtext',
    'longtext',
    'enum',
    'set',

    // Spatial Types
    'geometry',
    'point',
    'linestring',
    'polygon',
    'multipoint',
    'multilinestring',
    'multipolygon',
    'geometrycollection',

    // JSON Type
    'json',
] as const;
export const sqlServerDataTypes = [
    // Exact Numerics
    'bigint',
    'bit',
    'decimal',
    'int',
    'money',
    'numeric',
    'smallint',
    'smallmoney',
    'tinyint',

    // Approximate Numerics
    'float',
    'real',

    // Date and Time
    'date',
    'datetime2',
    'datetime',
    'datetimeoffset',
    'smalldatetime',
    'time',

    // Character Strings
    'char',
    'varchar',
    'text',

    // Unicode Character Strings
    'nchar',
    'nvarchar',
    'ntext',

    // Binary Strings
    'binary',
    'varbinary',
    'image',

    // Other Data Types
    'cursor',
    'hierarchyid',
    'sql_variant',
    'timestamp',
    'uniqueidentifier',
    'xml',

    // Spatial Data Types
    'geometry',
    'geography',

    // JSON
    'json', // Note: Currently, the JSON data type is available in Azure SQL Database.
] as const;
export const mariadbDataTypes = [
    // Numeric Types
    'tinyint',
    'smallint',
    'mediumint',
    'int',
    'bigint',
    'decimal',
    'numeric',
    'float',
    'double',
    'bit',
    'bool',
    'boolean',

    // Date and Time Types
    'date',
    'datetime',
    'timestamp',
    'time',
    'year',

    // String Types
    'char',
    'varchar',
    'binary',
    'varbinary',
    'tinyblob',
    'blob',
    'mediumblob',
    'longblob',
    'tinytext',
    'text',
    'mediumtext',
    'longtext',
    'enum',
    'set',

    // Spatial Types
    'geometry',
    'point',
    'linestring',
    'polygon',
    'multipoint',
    'multilinestring',
    'multipolygon',
    'geometrycollection',

    // JSON Type
    'json',
] as const;
export const sqliteDataTypes = [
    // Numeric Types
    'integer',
    'real',
    'numeric',

    // Text Type
    'text',

    // Blob Type
    'blob',

    // Date/Time Types (SQLite uses TEXT, REAL, or INTEGER types for dates and times)
    'date',
    'datetime',
] as const;

export const dataTypes = [
    ...new Set([
        ...postgresDataTypes,
        ...mysqlDataTypes,
        ...sqlServerDataTypes,
        ...mariadbDataTypes,
        ...sqliteDataTypes,
        ...genericDataTypes,
    ]),
] as const;

export const dataTypeMap: Record<
    DatabaseType,
    readonly (typeof dataTypes)[number][]
> = {
    [DatabaseType.GENERIC]: genericDataTypes,
    [DatabaseType.POSTGRESQL]: postgresDataTypes,
    [DatabaseType.MYSQL]: mysqlDataTypes,
    [DatabaseType.SQL_SERVER]: sqlServerDataTypes,
    [DatabaseType.MARIADB]: mariadbDataTypes,
    [DatabaseType.SQLITE]: sqliteDataTypes,
} as const;
