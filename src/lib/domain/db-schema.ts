import { DatabaseType } from './database-type';

export interface DBSchema {
    id: string;
    name: string;
    tableCount: number;
}

export const schemaNameToSchemaId = (schema: string): string =>
    schema.trim().toLowerCase().split(' ').join('_');

export const schemaNameToDomainSchemaName = (
    schema: string | null | undefined
): string | undefined =>
    schema === null
        ? undefined
        : (schema ?? '').trim() === ''
          ? undefined
          : schema?.trim();

export const databasesWithSchemas: DatabaseType[] = [
    DatabaseType.POSTGRESQL,
    DatabaseType.SQL_SERVER,
    DatabaseType.CLICKHOUSE,
    DatabaseType.COCKROACHDB,
];
