import { z } from 'zod';
import { DatabaseType } from '../../domain/database-type';
import { databaseSupportsArrays } from '../../domain/database-capabilities';
import { clickhouseDataTypes } from './clickhouse-data-types';
import { genericDataTypes } from './generic-data-types';
import { mariadbDataTypes } from './mariadb-data-types';
import { mysqlDataTypes } from './mysql-data-types';
import {
    getPostgresPreferredSynonym,
    postgresDataTypes,
} from './postgres-data-types';
import { sqlServerDataTypes } from './sql-server-data-types';
import { sqliteDataTypes } from './sqlite-data-types';
import { oracleDataTypes } from './oracle-data-types';

export interface DataType {
    id: string;
    name: string;
}

export interface FieldAttributeRange {
    max: number;
    min: number;
    default: number;
}

interface FieldAttributes {
    hasCharMaxLength?: boolean;
    hasCharMaxLengthOption?: boolean;
    precision?: FieldAttributeRange;
    scale?: FieldAttributeRange;
    maxLength?: number;
}

export interface DataTypeData extends DataType {
    usageLevel?: 1 | 2; // Level 1 is most common, Level 2 is second most common
    fieldAttributes?: FieldAttributes;
}

export const dataTypeSchema: z.ZodType<DataType> = z.object({
    id: z.string(),
    name: z.string(),
});

export const dataTypeMap: Record<DatabaseType, readonly DataTypeData[]> = {
    [DatabaseType.GENERIC]: genericDataTypes,
    [DatabaseType.POSTGRESQL]: postgresDataTypes,
    [DatabaseType.MYSQL]: mysqlDataTypes,
    [DatabaseType.SQL_SERVER]: sqlServerDataTypes,
    [DatabaseType.MARIADB]: mariadbDataTypes,
    [DatabaseType.SQLITE]: sqliteDataTypes,
    [DatabaseType.CLICKHOUSE]: clickhouseDataTypes,
    [DatabaseType.COCKROACHDB]: postgresDataTypes,
    [DatabaseType.ORACLE]: oracleDataTypes,
} as const;

export const sortDataTypes = (dataTypes: DataTypeData[]): DataTypeData[] => {
    const types = [...dataTypes];
    return types.sort((a, b) => {
        // First sort by usage level (lower numbers first)
        if ((a.usageLevel || 3) < (b.usageLevel || 3)) return -1;
        if ((a.usageLevel || 3) > (b.usageLevel || 3)) return 1;
        // Then sort alphabetically by name
        return a.name.localeCompare(b.name);
    });
};

export const sortedDataTypeMap: Record<DatabaseType, readonly DataTypeData[]> =
    {
        [DatabaseType.GENERIC]: sortDataTypes([
            ...dataTypeMap[DatabaseType.GENERIC],
        ]),
        [DatabaseType.POSTGRESQL]: sortDataTypes([
            ...dataTypeMap[DatabaseType.POSTGRESQL],
        ]),
        [DatabaseType.MYSQL]: sortDataTypes([
            ...dataTypeMap[DatabaseType.MYSQL],
        ]),
        [DatabaseType.SQL_SERVER]: sortDataTypes([
            ...dataTypeMap[DatabaseType.SQL_SERVER],
        ]),
        [DatabaseType.MARIADB]: sortDataTypes([
            ...dataTypeMap[DatabaseType.MARIADB],
        ]),
        [DatabaseType.SQLITE]: sortDataTypes([
            ...dataTypeMap[DatabaseType.SQLITE],
        ]),
        [DatabaseType.CLICKHOUSE]: sortDataTypes([
            ...dataTypeMap[DatabaseType.CLICKHOUSE],
        ]),
        [DatabaseType.COCKROACHDB]: sortDataTypes([
            ...dataTypeMap[DatabaseType.COCKROACHDB],
        ]),
        [DatabaseType.ORACLE]: sortDataTypes([
            ...dataTypeMap[DatabaseType.ORACLE],
        ]),
    } as const;

const compatibleTypes: Record<DatabaseType, Record<string, string[]>> = {
    [DatabaseType.POSTGRESQL]: {
        serial: ['integer'],
        smallserial: ['smallint'],
        bigserial: ['bigint'],
    },
    [DatabaseType.MYSQL]: {
        int: ['integer'],
        tinyint: ['boolean'],
    },
    [DatabaseType.SQL_SERVER]: {},
    [DatabaseType.MARIADB]: {},
    [DatabaseType.SQLITE]: {},
    [DatabaseType.CLICKHOUSE]: {},
    [DatabaseType.COCKROACHDB]: {},
    [DatabaseType.ORACLE]: {},
    [DatabaseType.GENERIC]: {},
};

export function areFieldTypesCompatible(
    type1: DataType,
    type2: DataType,
    databaseType: DatabaseType
): boolean {
    if (type1.id === type2.id) {
        return true;
    }

    const dbCompatibleTypes = compatibleTypes[databaseType] || {};
    return (
        dbCompatibleTypes[type1.id]?.includes(type2.id) ||
        dbCompatibleTypes[type2.id]?.includes(type1.id)
    );
}

export const dataTypes = Object.values(dataTypeMap).flat();

export const dataTypeDataToDataType = (
    dataTypeData: DataTypeData
): DataType => ({
    id: dataTypeData.id,
    name: dataTypeData.name,
});

export const findDataTypeDataById = (
    id: string,
    databaseType?: DatabaseType
): DataTypeData | undefined => {
    const dataTypesOptions = databaseType
        ? dataTypeMap[databaseType]
        : dataTypes;

    return dataTypesOptions.find((dataType) => dataType.id === id);
};

export const supportsAutoIncrementDataType = (
    dataTypeName: string
): boolean => {
    return [
        'integer',
        'int',
        'bigint',
        'smallint',
        'tinyint',
        'mediumint',
        'serial',
        'bigserial',
        'smallserial',
        'number',
        'numeric',
        'decimal',
    ].includes(dataTypeName.toLocaleLowerCase());
};

export const autoIncrementAlwaysOn = (dataTypeName: string): boolean => {
    return ['serial', 'bigserial', 'smallserial'].includes(
        dataTypeName.toLowerCase()
    );
};

export const requiresNotNull = (dataTypeName: string): boolean => {
    return ['serial', 'bigserial', 'smallserial'].includes(
        dataTypeName.toLowerCase()
    );
};

const ARRAY_INCOMPATIBLE_TYPES = [
    'serial',
    'bigserial',
    'smallserial',
] as const;

export const supportsArrayDataType = (
    dataTypeName: string,
    databaseType: DatabaseType
): boolean => {
    if (!databaseSupportsArrays(databaseType)) {
        return false;
    }

    return !ARRAY_INCOMPATIBLE_TYPES.includes(
        dataTypeName.toLowerCase() as (typeof ARRAY_INCOMPATIBLE_TYPES)[number]
    );
};

/**
 * Resolves a data type to its preferred synonym if one exists for the given database type.
 *
 * This function acts as a dispatcher to database-specific synonym resolution functions.
 * Currently supports PostgreSQL synonyms.
 *
 * @param typeName - The name of the data type to check (case-insensitive)
 * @param databaseType - The database type (e.g., PostgreSQL, MySQL, etc.)
 * @returns The DataTypeData of the preferred synonym, or null if the type
 *          is already the preferred form, has no synonyms, or the database type
 *          doesn't have synonym mappings
 *
 * @example
 * ```ts
 * getPreferredSynonym('character varying', DatabaseType.POSTGRESQL)
 * // Returns: { name: 'varchar', id: 'varchar', ... }
 *
 * getPreferredSynonym('varchar', DatabaseType.POSTGRESQL)
 * // Returns: null (already the preferred form)
 *
 * getPreferredSynonym('character varying', DatabaseType.MYSQL)
 * // Returns: null (MySQL synonym mappings not implemented)
 * ```
 */
export const getPreferredSynonym = (
    typeName: string,
    databaseType: DatabaseType
): DataTypeData | null => {
    const nameLower = typeName.toLowerCase().trim();

    if (
        databaseType === DatabaseType.POSTGRESQL ||
        databaseType === DatabaseType.COCKROACHDB
    ) {
        return getPostgresPreferredSynonym(nameLower);
    }

    return null;
};

/**
 * Returns the default primary key data type for a given database type.
 *
 * Different databases have different conventions for auto-increment primary key types:
 * - SQLite: INTEGER (required for AUTOINCREMENT)
 * - Oracle: NUMBER (Oracle doesn't have bigint - uses NUMBER for all numeric types)
 * - Others: BIGINT (PostgreSQL, MySQL, SQL Server, MariaDB, etc.)
 *
 * @param databaseType - The database type
 * @returns The DataType object with id and name for the default primary key type
 *
 * @example
 * ```ts
 * getDefaultPrimaryKeyType(DatabaseType.SQLITE)
 * // Returns: { id: 'integer', name: 'integer' }
 *
 * getDefaultPrimaryKeyType(DatabaseType.ORACLE)
 * // Returns: { id: 'number', name: 'number' }
 *
 * getDefaultPrimaryKeyType(DatabaseType.POSTGRESQL)
 * // Returns: { id: 'bigint', name: 'bigint' }
 * ```
 */
export const getDefaultPrimaryKeyType = (
    databaseType: DatabaseType
): DataType => {
    switch (databaseType) {
        case DatabaseType.SQLITE:
            return { id: 'integer', name: 'integer' };
        case DatabaseType.ORACLE:
            return { id: 'number', name: 'number' };
        default:
            return { id: 'bigint', name: 'bigint' };
    }
};
