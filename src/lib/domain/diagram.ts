import { z } from 'zod';
import type { DatabaseMetadata } from '../data/import-metadata/metadata-types/database-metadata';
import { DatabaseEdition } from './database-edition';
import { DatabaseType } from './database-type';
import type { DBDependency } from './db-dependency';
import {
    createDependenciesFromMetadata,
    dbDependencySchema,
} from './db-dependency';
import type { DBRelationship } from './db-relationship';
import {
    createRelationshipsFromMetadata,
    dbRelationshipSchema,
} from './db-relationship';
import type { DBTable } from './db-table';
import {
    adjustTablePositions,
    createTablesFromMetadata,
    dbTableSchema,
} from './db-table';
import { generateDiagramId } from '@/lib/utils';
import { areaSchema, type Area } from './area';
export interface Diagram {
    id: string;
    name: string;
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
    tables?: DBTable[];
    relationships?: DBRelationship[];
    dependencies?: DBDependency[];
    areas?: Area[];
    createdAt: Date;
    updatedAt: Date;
}

export const diagramSchema: z.ZodType<Diagram> = z.object({
    id: z.string(),
    name: z.string(),
    databaseType: z.nativeEnum(DatabaseType),
    databaseEdition: z.nativeEnum(DatabaseEdition).optional(),
    tables: z.array(dbTableSchema).optional(),
    relationships: z.array(dbRelationshipSchema).optional(),
    dependencies: z.array(dbDependencySchema).optional(),
    areas: z.array(areaSchema).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

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
    const { fk_info: foreignKeys, views: views } = databaseMetadata;

    const tables = createTablesFromMetadata({
        databaseMetadata,
        databaseType,
    });

    const relationships = createRelationshipsFromMetadata({
        foreignKeys,
        tables,
    });

    const dependencies = await createDependenciesFromMetadata({
        views,
        tables,
        databaseType,
    });

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
