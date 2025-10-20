import { DATABASE_CAPABILITIES } from './database-capabilities';
import type { DatabaseType } from './database-type';

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

export const databasesWithSchemas: DatabaseType[] = Object.keys(
    DATABASE_CAPABILITIES
).filter(
    (dbType) => DATABASE_CAPABILITIES[dbType as DatabaseType].supportsSchemas
) as DatabaseType[];
