import type { DataTypeData } from './data-types';

export const sqlServerDataTypes: readonly DataTypeData[] = [
    // Exact Numerics
    { name: 'int', id: 'int', frequentlyUsed: true },
    { name: 'bigint', id: 'bigint', frequentlyUsed: true },
    { name: 'decimal', id: 'decimal', frequentlyUsed: true },
    { name: 'bit', id: 'bit', frequentlyUsed: true }, // Often used for boolean values in SQL Server
    { name: 'numeric', id: 'numeric' },
    { name: 'smallint', id: 'smallint' },
    { name: 'smallmoney', id: 'smallmoney' },
    { name: 'tinyint', id: 'tinyint' },
    { name: 'money', id: 'money' },

    // Approximate Numerics
    { name: 'float', id: 'float' },
    { name: 'real', id: 'real' },

    // Date and Time
    { name: 'datetime2', id: 'datetime2', frequentlyUsed: true },
    { name: 'date', id: 'date', frequentlyUsed: true },
    { name: 'datetime', id: 'datetime', frequentlyUsed: true },
    { name: 'datetimeoffset', id: 'datetimeoffset' },
    { name: 'smalldatetime', id: 'smalldatetime' },
    { name: 'time', id: 'time' },

    // Character Strings
    {
        name: 'varchar',
        id: 'varchar',
        hasCharMaxLength: true,
        frequentlyUsed: true,
    },
    {
        name: 'nvarchar',
        id: 'nvarchar',
        hasCharMaxLength: true,
        frequentlyUsed: true,
    },
    { name: 'text', id: 'text', frequentlyUsed: true },
    { name: 'char', id: 'char', hasCharMaxLength: true },
    { name: 'nchar', id: 'nchar', hasCharMaxLength: true },
    { name: 'ntext', id: 'ntext' },

    // Binary Strings
    { name: 'binary', id: 'binary', hasCharMaxLength: true },
    { name: 'varbinary', id: 'varbinary', hasCharMaxLength: true },
    { name: 'image', id: 'image' },

    // Other Data Types
    { name: 'uniqueidentifier', id: 'uniqueidentifier', frequentlyUsed: true },
    { name: 'xml', id: 'xml' },
    { name: 'cursor', id: 'cursor' },
    { name: 'hierarchyid', id: 'hierarchyid' },
    { name: 'sql_variant', id: 'sql_variant' },
    { name: 'timestamp', id: 'timestamp' },

    // Spatial Data Types
    { name: 'geometry', id: 'geometry' },
    { name: 'geography', id: 'geography' },

    // JSON
    { name: 'json', id: 'json', frequentlyUsed: true },
] as const;
