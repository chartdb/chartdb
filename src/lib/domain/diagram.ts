import { DatabaseMetadata } from '../import-script-types/database-metadata';
import { DatabaseType } from './database-type';
import { DBRelationship, createRelationships } from './db-relationship';
import { DBTable, adjustTablePositions, createTables } from './db-table';
import { generateId } from '@/lib/utils';
export interface Diagram {
    id: string;
    name: string;
    databaseType: DatabaseType;
    tables?: DBTable[];
    relationships?: DBRelationship[];
}

export const loadFromDatabaseMetadata = (
    databaseType: DatabaseType,
    dm: DatabaseMetadata
): Diagram => {
    const {
        fk_info: foreignKeys,
        pk_info: PrimaryKeyInfo,
        tables: tableInfos,
        columns,
        indexes,
    } = dm;

    // First pass: Create tables without final positions
    const tables = createTables(tableInfos, columns, indexes, PrimaryKeyInfo);

    // First pass: Create relationships
    const relationships = createRelationships(foreignKeys, tables);

    // Second pass: Adjust table positions based on relationships
    const adjustedTables = adjustTablePositions(tables, relationships);

    const sortedTables = adjustedTables.sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    return {
        id: generateId(),
        name: dm.server_name || 'Unnamed Diagram',
        databaseType: databaseType || DatabaseType.GENERIC,
        tables: sortedTables,
        relationships,
    };
};
