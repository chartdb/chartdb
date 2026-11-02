import { DATABASE_CAPABILITIES } from './database-capabilities';
import type { DatabaseType } from './database-type';
import type { DBTable } from './db-table';

export interface DBSchema {
    id: string;
    name: string;
    tableCount: number;
}

// Per-diagram map of schema id -> hex color.
export type SchemaColors = Record<string, string>;

export const schemaNameToSchemaId = (schema: string): string =>
    schema.trim().toLowerCase().split(' ').join('_');

// Resolve the color a table should render with, honoring the non-destructive
// schema-color fallback: an explicitly user-picked color wins, otherwise the
// table inherits its schema color, otherwise its own (default) color.
export const getEffectiveTableColor = (
    table: Pick<DBTable, 'color' | 'schema' | 'isColorCustom'>,
    schemaColors?: SchemaColors
): string => {
    if (table.isColorCustom) {
        return table.color;
    }
    const schemaName = schemaNameToDomainSchemaName(table.schema);
    if (schemaName && schemaColors) {
        const schemaColor = schemaColors[schemaNameToSchemaId(schemaName)];
        if (schemaColor) {
            return schemaColor;
        }
    }
    return table.color;
};

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
