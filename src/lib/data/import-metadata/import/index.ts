import type { DatabaseEdition, Diagram } from '@/lib/domain';
import {
    adjustTablePositions,
    DatabaseType,
    getTableIndexesWithPrimaryKey,
} from '@/lib/domain';
import { generateDiagramId } from '@/lib/utils';
import type { DatabaseMetadata } from '../metadata-types/database-metadata';
import { createCustomTypesFromMetadata } from './custom-types';
import { createRelationshipsFromMetadata } from './relationships';
import { createTablesFromMetadata } from './tables';
import { createDependenciesFromMetadata } from './dependencies';

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
        fk_info: foreignKeys,
        views: views,
        custom_types: customTypes,
    } = databaseMetadata;

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

    const dbCustomTypes = customTypes
        ? createCustomTypesFromMetadata({
              customTypes,
          })
        : [];

    const adjustedTables = adjustTablePositions({
        tables,
        relationships,
        mode: 'perSchema',
    });

    const sortedTables = adjustedTables
        .map((table) => ({
            ...table,
            indexes: getTableIndexesWithPrimaryKey({ table }),
        }))
        .sort((a, b) => {
            if (a.isView === b.isView) {
                // Both are either tables or views, so sort alphabetically by name
                return a.name.localeCompare(b.name);
            }
            // If one is a view and the other is not, put tables first
            return a.isView ? 1 : -1;
        });

    const diagram: Diagram = {
        id: generateDiagramId(),
        name: databaseMetadata.database_name
            ? `${databaseMetadata.database_name}`
            : diagramNumber
              ? `Diagram ${diagramNumber}`
              : 'New Diagram',
        databaseType: databaseType ?? DatabaseType.GENERIC,
        databaseEdition,
        tables: sortedTables,
        relationships,
        dependencies,
        customTypes: dbCustomTypes,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    return diagram;
};
