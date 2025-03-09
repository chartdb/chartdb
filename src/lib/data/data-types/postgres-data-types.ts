import type { DataTypeData } from './data-types';

export const postgresDataTypes: readonly DataTypeData[] = [
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
    { name: 'char', id: 'char', hasCharMaxLength: true },
    { name: 'varchar', id: 'varchar', hasCharMaxLength: true },
    {
        name: 'character varying',
        id: 'character_varying',
        hasCharMaxLength: true,
    },
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
