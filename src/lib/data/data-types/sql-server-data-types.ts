import type { DataTypeData } from './data-types';

export const sqlServerDataTypes: readonly DataTypeData[] = [
    // Level 1 - Most commonly used types
    { name: 'int', id: 'int', usageLevel: 1 },
    { name: 'bit', id: 'bit', usageLevel: 1 },
    { name: 'varchar', id: 'varchar', hasCharMaxLength: true, usageLevel: 1 },
    { name: 'nvarchar', id: 'nvarchar', hasCharMaxLength: true, usageLevel: 1 },
    { name: 'text', id: 'text', usageLevel: 1 },
    { name: 'datetime', id: 'datetime', usageLevel: 1 },
    { name: 'date', id: 'date', usageLevel: 1 },

    // Level 2 - Second most common types
    { name: 'bigint', id: 'bigint', usageLevel: 2 },
    { name: 'decimal', id: 'decimal', usageLevel: 2 },
    { name: 'datetime2', id: 'datetime2', usageLevel: 2 },
    { name: 'uniqueidentifier', id: 'uniqueidentifier', usageLevel: 2 },
    { name: 'json', id: 'json', usageLevel: 2 },

    // Less common types
    { name: 'numeric', id: 'numeric' },
    { name: 'smallint', id: 'smallint' },
    { name: 'smallmoney', id: 'smallmoney' },
    { name: 'tinyint', id: 'tinyint' },
    { name: 'money', id: 'money' },
    { name: 'float', id: 'float' },
    { name: 'real', id: 'real' },
    { name: 'char', id: 'char', hasCharMaxLength: true },
    { name: 'nchar', id: 'nchar', hasCharMaxLength: true },
    { name: 'ntext', id: 'ntext' },
    { name: 'binary', id: 'binary', hasCharMaxLength: true },
    { name: 'varbinary', id: 'varbinary', hasCharMaxLength: true },
    { name: 'image', id: 'image' },
    { name: 'datetimeoffset', id: 'datetimeoffset' },
    { name: 'smalldatetime', id: 'smalldatetime' },
    { name: 'time', id: 'time' },
    { name: 'timestamp', id: 'timestamp' },
    { name: 'xml', id: 'xml' },
    { name: 'cursor', id: 'cursor' },
    { name: 'hierarchyid', id: 'hierarchyid' },
    { name: 'sql_variant', id: 'sql_variant' },
    { name: 'geometry', id: 'geometry' },
    { name: 'geography', id: 'geography' },
] as const;
