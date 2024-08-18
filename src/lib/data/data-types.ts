import { DatabaseType } from '../domain/database-type';

export const genericDataTypes = ['bigint', 'bfile', 'clob', 'cursor'] as const;
export const postgresDataTypes = ['bigint', 'bigserial'] as const;
export const mysqlDataTypes = ['bigint', 'bigserial'] as const;

export const dataTypes = [
    ...new Set([...postgresDataTypes, ...mysqlDataTypes, ...genericDataTypes]),
] as const;

export const dataTypeMap: Record<
    DatabaseType,
    readonly (typeof dataTypes)[number][]
> = {
    [DatabaseType.GENERIC]: genericDataTypes,
    [DatabaseType.POSTGRESQL]: postgresDataTypes,
    [DatabaseType.MYSQL]: mysqlDataTypes,
    [DatabaseType.SQL_SERVER]: [],
    [DatabaseType.MARIADB]: [],
    [DatabaseType.SQLITE]: [],
} as const;
