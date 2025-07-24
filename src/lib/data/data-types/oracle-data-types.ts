import type { DataTypeData } from './data-types';

export const oracleDataTypes: readonly DataTypeData[] = [
    // Character types
    {
        name: 'VARCHAR2',
        id: 'varchar2',
        usageLevel: 1,
        fieldAttributes: { hasCharMaxLength: true },
    },
    {
        name: 'NVARCHAR2',
        id: 'nvarchar2',
        usageLevel: 1,
        fieldAttributes: { hasCharMaxLength: true },
    },
    {
        name: 'CHAR',
        id: 'char',
        usageLevel: 2,
        fieldAttributes: { hasCharMaxLength: true },
    },
    {
        name: 'NCHAR',
        id: 'nchar',
        usageLevel: 2,
        fieldAttributes: { hasCharMaxLength: true },
    },
    { name: 'CLOB', id: 'clob', usageLevel: 2 },
    { name: 'NCLOB', id: 'nclob', usageLevel: 2 },

    // Numeric types
    { name: 'NUMBER', id: 'number', usageLevel: 1 },
    { name: 'FLOAT', id: 'float', usageLevel: 2 },
    { name: 'BINARY_FLOAT', id: 'binary_float', usageLevel: 2 },
    { name: 'BINARY_DOUBLE', id: 'binary_double', usageLevel: 2 },

    // Date/Time types
    { name: 'DATE', id: 'date', usageLevel: 1 },
    { name: 'TIMESTAMP', id: 'timestamp', usageLevel: 1 },
    {
        name: 'TIMESTAMP WITH TIME ZONE',
        id: 'timestamp_with_time_zone',
        usageLevel: 2,
    },
    {
        name: 'TIMESTAMP WITH LOCAL TIME ZONE',
        id: 'timestamp_with_local_time_zone',
        usageLevel: 2,
    },
    {
        name: 'INTERVAL YEAR TO MONTH',
        id: 'interval_year_to_month',
        usageLevel: 2,
    },
    {
        name: 'INTERVAL DAY TO SECOND',
        id: 'interval_day_to_second',
        usageLevel: 2,
    },

    // Large Object types
    { name: 'BLOB', id: 'blob', usageLevel: 2 },
    { name: 'BFILE', id: 'bfile', usageLevel: 2 },

    // Other types
    {
        name: 'RAW',
        id: 'raw',
        usageLevel: 2,
        fieldAttributes: { hasCharMaxLength: true },
    },
    { name: 'LONG RAW', id: 'long_raw', usageLevel: 2 },
    { name: 'ROWID', id: 'rowid', usageLevel: 2 },
    { name: 'UROWID', id: 'urowid', usageLevel: 2 },
    { name: 'XMLType', id: 'xmltype', usageLevel: 2 },
] as const;
