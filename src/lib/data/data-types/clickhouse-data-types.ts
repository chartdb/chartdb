import type { DataTypeData } from './data-types';

export const clickhouseDataTypes: readonly DataTypeData[] = [
    // Numeric Types
    { name: 'uint8', id: 'uint8' },
    { name: 'uint16', id: 'uint16' },
    { name: 'uint32', id: 'uint32' },
    { name: 'uint64', id: 'uint64' },
    { name: 'uint128', id: 'uint128' },
    { name: 'uint256', id: 'uint256' },
    { name: 'int8', id: 'int8' },
    { name: 'int16', id: 'int16' },
    { name: 'int32', id: 'int32' },
    { name: 'int64', id: 'int64' },
    { name: 'int128', id: 'int128' },
    { name: 'int256', id: 'int256' },
    { name: 'float32', id: 'float32' },
    { name: 'float64', id: 'float64' },
    { name: 'tinyint', id: 'tinyint' },
    { name: 'int1', id: 'int1' },
    { name: 'byte', id: 'byte' },
    { name: 'tinyint signed', id: 'tinyint_signed' },
    { name: 'int1 signed', id: 'int1_signed' },
    { name: 'smallint', id: 'smallint' },
    { name: 'smallint signed', id: 'smallint_signed' },
    { name: 'int', id: 'int' },
    { name: 'integer', id: 'integer' },
    { name: 'mediumint', id: 'mediumint' },
    { name: 'mediumint signed', id: 'mediumint_signed' },
    { name: 'int signed', id: 'int_signed' },
    { name: 'integer signed', id: 'integer_signed' },
    { name: 'bigint', id: 'bigint' },
    { name: 'signed', id: 'signed' },
    { name: 'bigint signed', id: 'bigint_signed' },
    { name: 'time', id: 'time' },
    { name: 'float', id: 'float' },
    { name: 'double', id: 'double' },
    { name: 'real', id: 'real' },
    { name: 'single', id: 'single' },
    { name: 'double precision', id: 'double_precision' },

    // string Types
    { name: 'longtext', id: 'longtext' },
    { name: 'mediumtext', id: 'mediumtext' },
    { name: 'tinytext', id: 'tinytext' },
    { name: 'text', id: 'text' },
    { name: 'longblob', id: 'longblob' },
    { name: 'mediumblob', id: 'mediumblob' },
    { name: 'tinyblob', id: 'tinyblob' },
    { name: 'blob', id: 'blob' },
    { name: 'varchar', id: 'varchar', hasCharMaxLength: true },
    { name: 'char', id: 'char', hasCharMaxLength: true },
    { name: 'char large object', id: 'char_large_object' },
    { name: 'char varying', id: 'char_varying', hasCharMaxLength: true },
    { name: 'character large object', id: 'character_large_object' },
    {
        name: 'character varying',
        id: 'character_varying',
        hasCharMaxLength: true,
    },
    { name: 'nchar large object', id: 'nchar_large_object' },
    { name: 'nchar varying', id: 'nchar_varying', hasCharMaxLength: true },
    {
        name: 'national character large object',
        id: 'national_character_large_object',
    },
    {
        name: 'national character varying',
        id: 'national_character_varying',
        hasCharMaxLength: true,
    },
    {
        name: 'national char varying',
        id: 'national_char_varying',
        hasCharMaxLength: true,
    },
    {
        name: 'national character',
        id: 'national_character',
        hasCharMaxLength: true,
    },
    { name: 'national char', id: 'national_char', hasCharMaxLength: true },
    { name: 'binary large object', id: 'binary_large_object' },
    { name: 'binary varying', id: 'binary_varying', hasCharMaxLength: true },
    { name: 'fixedstring', id: 'fixedstring', hasCharMaxLength: true },
    { name: 'string', id: 'string' },

    // Date Types
    { name: 'date', id: 'date' },
    { name: 'date32', id: 'date32' },
    { name: 'datetime', id: 'datetime' },
    { name: 'datetime64', id: 'datetime64' },

    // JSON Types
    { name: 'object', id: 'object' },
    { name: 'json', id: 'json' },

    // UUID Type
    { name: 'uuid', id: 'uuid' },

    // Boolean Type
    { name: 'boolean', id: 'boolean' },

    // Enum Type
    { name: 'enum', id: 'enum' },
    { name: 'lowcardinality', id: 'lowcardinality' },

    // Array Type
    { name: 'array', id: 'array' },

    // Tuple Type
    { name: 'tuple', id: 'tuple' },
    { name: 'map', id: 'map' },

    { name: 'simpleaggregatefunction', id: 'simpleaggregatefunction' },
    { name: 'aggregatefunction', id: 'aggregatefunction' },

    { name: 'nested', id: 'nested' },

    { name: 'ipv4', id: 'ipv4' },
    { name: 'ipv6', id: 'ipv6' },

    // Geography Types
    { name: 'point', id: 'point' },
    { name: 'ring', id: 'ring' },
    { name: 'polygon', id: 'polygon' },
    { name: 'multipolygon', id: 'multipolygon' },

    { name: 'expression', id: 'expression' },
    { name: 'set', id: 'set' },
    { name: 'nothing', id: 'nothing' },
    { name: 'interval', id: 'interval' },
] as const;
