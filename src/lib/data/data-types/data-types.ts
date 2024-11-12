import { z } from 'zod';
import { DatabaseType } from '../../domain/database-type';
import { genericDataTypes } from './generic-data-types';
import { mariadbDataTypes } from './mariadb-data-types';
import { mysqlDataTypes } from './mysql-data-types';
import { postgresDataTypes } from './postgres-data-types';
import { sqlServerDataTypes } from './sql-server-data-types';
import { sqliteDataTypes } from './sqlite-data-types';

export interface DataType {
    id: string;
    name: string;
}

export const dataTypeSchema: z.ZodType<DataType> = z.object({
    id: z.string(),
    name: z.string(),
});

export const dataTypeMap: Record<DatabaseType, readonly DataType[]> = {
    [DatabaseType.GENERIC]: genericDataTypes,
    [DatabaseType.POSTGRESQL]: postgresDataTypes,
    [DatabaseType.MYSQL]: mysqlDataTypes,
    [DatabaseType.SQL_SERVER]: sqlServerDataTypes,
    [DatabaseType.MARIADB]: mariadbDataTypes,
    [DatabaseType.SQLITE]: sqliteDataTypes,
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
