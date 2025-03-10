import type { DataTypeData } from './data-types';

export const sqlServerDataTypes: readonly DataTypeData[] = [
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
    { name: 'char', id: 'char', hasCharMaxLength: true },
    { name: 'varchar', id: 'varchar', hasCharMaxLength: true },
    { name: 'text', id: 'text' },

    // Unicode Character Strings
    { name: 'nchar', id: 'nchar', hasCharMaxLength: true },
    { name: 'nvarchar', id: 'nvarchar', hasCharMaxLength: true },
    { name: 'ntext', id: 'ntext' },

    // Binary Strings
    { name: 'binary', id: 'binary', hasCharMaxLength: true },
    { name: 'varbinary', id: 'varbinary', hasCharMaxLength: true },
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
