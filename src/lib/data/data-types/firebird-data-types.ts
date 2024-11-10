import type { DataType } from './data-types';

export const firebirdDataTypes: readonly DataType[] = [
    // Numeric Types
    { name: 'smallint', id: 'smallint' },
    { name: 'integer', id: 'integer' },
    { name: 'bigint', id: 'bigint' },
    { name: 'int128', id: 'int128' },
    { name: 'float', id: 'float' },
    { name: 'real', id: 'real' },
    { name: 'doubleprecision', id: 'doubleprecision' },
    { name: 'decfloat', id: 'decfloat' },
    { name: 'decimal', id: 'decimal' },
    { name: 'numeric', id: 'numeric' },
    { name: 'double', id: 'double' },

    { name: 'bit', id: 'bit' },
    { name: 'bool', id: 'bool' },
    { name: 'boolean', id: 'boolean' },

    // Date and Time Types
    { name: 'date', id: 'date' },
    { name: 'time', id: 'time' },
    { name: 'timestamp', id: 'timestamp' },

    // String Types
    { name: 'binary', id: 'binary' },
    { name: 'char', id: 'char' },
    { name: 'varbinary', id: 'varbinary' },
    { name: 'varchar', id: 'varchar' },
    { name: 'nchar', id: 'nchar' },
    { name: 'blob', id: 'blob' },
] as const;
