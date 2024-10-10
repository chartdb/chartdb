import type { DatabaseMetadata } from '../data/import-metadata/metadata-types/database-metadata';
import type { DatabaseEdition } from './database-edition';
import { DatabaseType } from './database-type';
import type { DBDependency } from './db-dependency';
import { createDependenciesFromMetadata } from './db-dependency';
import type { DBRelationship } from './db-relationship';
import { createRelationshipsFromMetadata } from './db-relationship';
import type { DBTable } from './db-table';
import { adjustTablePositions, createTablesFromMetadata } from './db-table';
import { generateDiagramId } from '@/lib/utils';
export interface Diagram {
    id: string;
    name: string;
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
    tables?: DBTable[];
    relationships?: DBRelationship[];
    dependencies?: DBDependency[];
    createdAt: Date;
    updatedAt: Date;
}

export const loadFromDatabaseMetadata = async ({
    databaseType,
    databaseMetadata,
    diagramNumber,
    databaseEdition,
}: {
    databaseType: DatabaseType;
    databaseMetadata: DatabaseMetadata;
    diagramNumber?: number;
    databaseEdition?: DatabaseEdition;
}): Promise<Diagram> => {
    const {
        tables: tableInfos,
        pk_info: primaryKeys,
        columns,
        indexes,
        fk_info: foreignKeys,
        views: views,
    } = databaseMetadata;

    // First pass: Create tables without final positions
    const tables = createTablesFromMetadata({
        tableInfos,
        columns,
        indexes,
        primaryKeys,
        views,
        databaseType,
    });

    // First pass: Create relationships
    const relationships = createRelationshipsFromMetadata({
        foreignKeys,
        tables,
    });

    // First pass: Create dependencies
    const dependencies = await createDependenciesFromMetadata({
        views,
        tables,
        databaseType,
    });

    // Second pass: Adjust table positions based on relationships
    const adjustedTables = adjustTablePositions({
        tables,
        relationships,
        mode: 'perSchema',
    });

    const sortedTables = adjustedTables.sort((a, b) => {
        if (a.isView === b.isView) {
            // Both are either tables or views, so sort alphabetically by name
            return a.name.localeCompare(b.name);
        }
        // If one is a view and the other is not, put tables first
        return a.isView ? 1 : -1;
    });

    return {
        id: generateDiagramId(),
        name: databaseMetadata.database_name
            ? `${databaseMetadata.database_name}-db`
            : diagramNumber
              ? `Diagram ${diagramNumber}`
              : 'New Diagram',
        databaseType: databaseType ?? DatabaseType.GENERIC,
        databaseEdition,
        tables: sortedTables,
        relationships,
        dependencies,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};
