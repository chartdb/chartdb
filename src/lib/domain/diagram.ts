import { DatabaseMetadata } from '../data/import-metadata/metadata-types/database-metadata';
import { DatabaseType } from './database-type';
import {
    DBRelationship,
    createRelationshipsFromMetadata,
} from './db-relationship';
import {
    DBTable,
    adjustTablePositions,
    createTablesFromMetadata,
} from './db-table';
import { generateId } from '@/lib/utils';
export interface Diagram {
    id: string;
    name: string;
    databaseType: DatabaseType;
    tables?: DBTable[];
    relationships?: DBRelationship[];
}

export const loadFromDatabaseMetadata = ({
    databaseType,
    databaseMetadata,
    diagramNumber,
}: {
    databaseType: DatabaseType;
    databaseMetadata: DatabaseMetadata;
    diagramNumber: number;
}): Diagram => {
    const {
        tables: tableInfos,
        pk_info: primaryKeys,
        columns,
        indexes,
        fk_info: foreignKeys,
    } = databaseMetadata;

    // First pass: Create tables without final positions
    const tables = createTablesFromMetadata({
        tableInfos,
        columns,
        indexes,
        primaryKeys,
    });

    // First pass: Create relationships
    const relationships = createRelationshipsFromMetadata({
        foreignKeys,
        tables,
    });

    // Second pass: Adjust table positions based on relationships
    const adjustedTables = adjustTablePositions({ tables, relationships });

    const sortedTables = adjustedTables.sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    return {
        id: generateId(),
        name: databaseMetadata.server_name || `Diagram ${diagramNumber}`,
        databaseType: databaseType ?? DatabaseType.GENERIC,
        tables: sortedTables,
        relationships,
    };
};
