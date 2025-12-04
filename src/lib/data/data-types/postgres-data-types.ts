import type { DataTypeData } from './data-types';

export const postgresDataTypes: readonly DataTypeData[] = [
    // Level 1 - Most commonly used types
    // { name: 'integer', id: 'integer', usageLevel: 1 },
    { name: 'int', id: 'int', usageLevel: 1 },
    // { name: 'int4', id: 'int4', usageLevel: 1 },
    {
        name: 'varchar',
        id: 'varchar',
        fieldAttributes: { hasCharMaxLength: true },
        usageLevel: 1,
    },
    { name: 'text', id: 'text', usageLevel: 1 },
    { name: 'boolean', id: 'boolean', usageLevel: 1 },
    // { name: 'bool', id: 'bool', usageLevel: 1 },
    { name: 'timestamp', id: 'timestamp', usageLevel: 1 },
    { name: 'timestamptz', id: 'timestamptz', usageLevel: 1 },
    { name: 'date', id: 'date', usageLevel: 1 },

    // Level 2 - Second most common types
    { name: 'bigint', id: 'bigint', usageLevel: 2 },
    // { name: 'int8', id: 'int8', usageLevel: 2 },
    {
        name: 'decimal',
        id: 'decimal',
        usageLevel: 2,
        fieldAttributes: {
            precision: {
                max: 131072,
                min: 0,
                default: 10,
            },
            scale: {
                max: 16383,
                min: 0,
                default: 2,
            },
        },
    },
    { name: 'serial', id: 'serial', usageLevel: 2 },
    { name: 'json', id: 'json', usageLevel: 2 },
    { name: 'jsonb', id: 'jsonb', usageLevel: 2 },
    { name: 'uuid', id: 'uuid', usageLevel: 2 },
    // {
    //     name: 'timestamp with time zone',
    //     id: 'timestamp_with_time_zone',
    //     usageLevel: 2,
    // },
    // { name: 'int', id: 'int', usageLevel: 2 },

    // Less common types
    {
        name: 'numeric',
        id: 'numeric',
        fieldAttributes: {
            precision: {
                max: 131072,
                min: 0,
                default: 10,
            },
            scale: {
                max: 16383,
                min: 0,
                default: 2,
            },
        },
    },
    { name: 'real', id: 'real' },
    // { name: 'float4', id: 'float4' },
    { name: 'double precision', id: 'double_precision' },
    // { name: 'float8', id: 'float8' },
    { name: 'smallserial', id: 'smallserial' },
    { name: 'bigserial', id: 'bigserial' },
    { name: 'money', id: 'money' },
    { name: 'smallint', id: 'smallint' },
    // { name: 'int2', id: 'int2' },
    { name: 'char', id: 'char', fieldAttributes: { hasCharMaxLength: true } },
    // {
    //     name: 'character',
    //     id: 'character',
    //     fieldAttributes: { hasCharMaxLength: true },
    // },
    // {
    //     name: 'character varying',
    //     id: 'character_varying',
    //     fieldAttributes: { hasCharMaxLength: true },
    // },
    { name: 'time', id: 'time' },
    { name: 'timetz', id: 'timetz' },
    // { name: 'timestamp without time zone', id: 'timestamp_without_time_zone' },
    // { name: 'time with time zone', id: 'time_with_time_zone' },
    // { name: 'time without time zone', id: 'time_without_time_zone' },
    { name: 'interval', id: 'interval' },
    { name: 'bytea', id: 'bytea' },
    { name: 'enum', id: 'enum' },
    { name: 'point', id: 'point' },
    { name: 'line', id: 'line' },
    { name: 'lseg', id: 'lseg' },
    { name: 'box', id: 'box' },
    { name: 'path', id: 'path' },
    { name: 'polygon', id: 'polygon' },
    { name: 'circle', id: 'circle' },
    { name: 'cidr', id: 'cidr' },
    { name: 'inet', id: 'inet' },
    { name: 'macaddr', id: 'macaddr' },
    { name: 'macaddr8', id: 'macaddr8' },
    { name: 'bit', id: 'bit' },
    // { name: 'bit varying', id: 'bit_varying' },
    { name: 'varbit', id: 'varbit' },
    { name: 'tsvector', id: 'tsvector' },
    { name: 'tsquery', id: 'tsquery' },
    { name: 'xml', id: 'xml' },
    { name: 'int4range', id: 'int4range' },
    { name: 'int8range', id: 'int8range' },
    { name: 'numrange', id: 'numrange' },
    { name: 'tsrange', id: 'tsrange' },
    { name: 'tstzrange', id: 'tstzrange' },
    { name: 'daterange', id: 'daterange' },
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
    { name: 'user-defined', id: 'user-defined' },
] as const;

/**
 * Maps data type names to their preferred synonym names.
 * The preferred synonym is typically the more commonly used or shorter form.
 *
 * Based on PostgreSQL official type names and common usage:
 * - Verbose forms map to their shorter equivalents
 * - Less common aliases map to their primary type names
 * - Types with usageLevel: 1 are generally preferred over those with usageLevel: 2 or no level
 *
 * Note: Keys and values use the actual PostgreSQL type names (with spaces where applicable),
 * not the internal ID format.
 */
const synonymMap: Record<string, string> = {
    // Character types
    'character varying': 'varchar',
    character: 'char',

    // Boolean types
    bool: 'boolean',

    // Integer types
    integer: 'int',
    int2: 'smallint',
    int4: 'int',
    int8: 'bigint',

    // Floating point types
    float4: 'real',
    float8: 'double precision',

    // Timestamp types
    'timestamp with time zone': 'timestamptz',
    'timestamp without time zone': 'timestamp',

    // Time types
    'time with time zone': 'timetz',
    'time without time zone': 'time',

    // Bit types
    'bit varying': 'varbit',
} as const;

/**
 * Resolves a data type to its preferred synonym if one exists.
 *
 * For data types that have synonyms in PostgreSQL, this function returns
 * the more commonly used variant. For example, 'character varying' resolves
 * to 'varchar', and 'integer' resolves to 'int'.
 *
 * @param typeName - The name of the data type to check (case-insensitive)
 * @returns The DataTypeData of the preferred synonym, or null if the type
 *          is already the preferred form or has no synonyms
 *
 * @example
 * ```ts
 * getPostgresPreferredSynonym('character varying')
 * // Returns: { name: 'varchar', id: 'varchar', fieldAttributes: { hasCharMaxLength: true }, usageLevel: 1 }
 *
 * getPostgresPreferredSynonym('varchar')
 * // Returns: null (already the preferred form)
 *
 * getPostgresPreferredSynonym('INTEGER')
 * // Returns: { name: 'int', id: 'int', usageLevel: 1 } (case-insensitive)
 * ```
 */
export const getPostgresPreferredSynonym = (
    typeName: string
): DataTypeData | null => {
    // Normalize to lowercase for case-insensitive lookup
    const normalizedTypeName = typeName.toLowerCase().trim();

    const preferredName = synonymMap[normalizedTypeName];

    if (!preferredName) {
        return null;
    }

    return (
        postgresDataTypes.find(
            (dataType) =>
                dataType.name.toLowerCase() === preferredName.toLowerCase()
        ) ?? null
    );
};
