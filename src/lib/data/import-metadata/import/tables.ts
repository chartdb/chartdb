import type { DBIndex, DBTable } from '@/lib/domain';
import {
    DatabaseType,
    generateTableKey,
    schemaNameToDomainSchemaName,
} from '@/lib/domain';
import type { DatabaseMetadata } from '../metadata-types/database-metadata';
import type { TableInfo } from '../metadata-types/table-info';
import { createAggregatedIndexes } from '../metadata-types/index-info';
import {
    decodeBase64ToUtf16LE,
    decodeBase64ToUtf8,
    generateId,
} from '@/lib/utils';
import {
    defaultTableColor,
    materializedViewColor,
    viewColor,
} from '@/lib/colors';
import { createFieldsFromMetadata } from './fields';
import { createIndexesFromMetadata } from './indexes';

export const decodeViewDefinition = (
    databaseType: DatabaseType,
    viewDefinition?: string
): string => {
    if (!viewDefinition) {
        return '';
    }

    let decodedViewDefinition: string;
    if (databaseType === DatabaseType.SQL_SERVER) {
        decodedViewDefinition = decodeBase64ToUtf16LE(viewDefinition);
    } else {
        decodedViewDefinition = decodeBase64ToUtf8(viewDefinition);
    }

    return decodedViewDefinition;
};

export const createTablesFromMetadata = ({
    databaseMetadata,
    databaseType,
}: {
    databaseMetadata: DatabaseMetadata;
    databaseType: DatabaseType;
}): DBTable[] => {
    const {
        tables: tableInfos,
        pk_info: primaryKeys,
        columns,
        indexes,
        views: views,
    } = databaseMetadata;

    // Pre-compute view names for faster lookup if there are views
    const viewNamesSet = new Set<string>();
    const materializedViewNamesSet = new Set<string>();

    if (views && views.length > 0) {
        views.forEach((view) => {
            const key = generateTableKey({
                schemaName: view.schema,
                tableName: view.view_name,
            });
            viewNamesSet.add(key);

            if (
                view.view_definition &&
                decodeViewDefinition(databaseType, view.view_definition)
                    .toLowerCase()
                    .includes('materialized')
            ) {
                materializedViewNamesSet.add(key);
            }
        });
    }

    // Pre-compute lookup maps for better performance
    const columnsByTable = new Map<string, (typeof columns)[0][]>();
    const indexesByTable = new Map<string, (typeof indexes)[0][]>();
    const primaryKeysByTable = new Map<string, (typeof primaryKeys)[0][]>();

    // Group columns by table
    columns.forEach((col) => {
        const key = generateTableKey({
            schemaName: col.schema,
            tableName: col.table,
        });
        if (!columnsByTable.has(key)) {
            columnsByTable.set(key, []);
        }
        columnsByTable.get(key)!.push(col);
    });

    // Group indexes by table
    indexes.forEach((idx) => {
        const key = generateTableKey({
            schemaName: idx.schema,
            tableName: idx.table,
        });
        if (!indexesByTable.has(key)) {
            indexesByTable.set(key, []);
        }
        indexesByTable.get(key)!.push(idx);
    });

    // Group primary keys by table
    primaryKeys.forEach((pk) => {
        const key = generateTableKey({
            schemaName: pk.schema,
            tableName: pk.table,
        });
        if (!primaryKeysByTable.has(key)) {
            primaryKeysByTable.set(key, []);
        }
        primaryKeysByTable.get(key)!.push(pk);
    });

    const result = tableInfos.map((tableInfo: TableInfo) => {
        const tableSchema = schemaNameToDomainSchemaName(tableInfo.schema);
        const tableKey = generateTableKey({
            schemaName: tableInfo.schema,
            tableName: tableInfo.table,
        });

        // Use pre-computed lookups instead of filtering entire arrays
        const tableIndexes = indexesByTable.get(tableKey) || [];
        const tablePrimaryKeys = primaryKeysByTable.get(tableKey) || [];
        const tableColumns = columnsByTable.get(tableKey) || [];

        // Aggregate indexes with multiple columns
        const aggregatedIndexes = createAggregatedIndexes({
            tableInfo,
            tableSchema,
            tableIndexes,
        });

        const fields = createFieldsFromMetadata({
            aggregatedIndexes,
            tableColumns,
            tablePrimaryKeys,
            tableInfo,
            tableSchema,
            databaseType,
        });

        // Check for composite primary key and find matching index name
        const primaryKeyFields = fields.filter((f) => f.primaryKey);
        let pkMatchingIndexName: string | undefined;
        let pkIndex: DBIndex | undefined;

        if (primaryKeyFields.length >= 1) {
            // We have a composite primary key, look for an index that matches all PK columns
            const pkFieldNames = primaryKeyFields.map((f) => f.name).sort();

            // Find an index that matches the primary key columns exactly
            const matchingIndex = aggregatedIndexes.find((index) => {
                const indexColumnNames = index.columns
                    .map((c) => c.name)
                    .sort();
                return (
                    indexColumnNames.length === pkFieldNames.length &&
                    indexColumnNames.every((col, i) => col === pkFieldNames[i])
                );
            });

            if (matchingIndex) {
                pkMatchingIndexName = matchingIndex.name;
                // Create a special PK index
                pkIndex = {
                    id: generateId(),
                    name: matchingIndex.name,
                    unique: true,
                    fieldIds: primaryKeyFields.map((f) => f.id),
                    createdAt: Date.now(),
                    isPrimaryKey: true,
                };
            }
        }

        // Filter out the index that matches the composite PK (to avoid duplication)
        const filteredAggregatedIndexes = pkMatchingIndexName
            ? aggregatedIndexes.filter(
                  (idx) => idx.name !== pkMatchingIndexName
              )
            : aggregatedIndexes;

        const dbIndexes = createIndexesFromMetadata({
            aggregatedIndexes: filteredAggregatedIndexes,
            fields,
        });

        // Add the PK index if it exists
        if (pkIndex) {
            dbIndexes.push(pkIndex);
        }

        // Determine if the current table is a view by checking against pre-computed sets
        const viewKey = generateTableKey({
            schemaName: tableSchema,
            tableName: tableInfo.table,
        });
        const isView = viewNamesSet.has(viewKey);
        const isMaterializedView = materializedViewNamesSet.has(viewKey);

        // Initial random positions; these will be adjusted later
        return {
            id: generateId(),
            name: tableInfo.table,
            schema: tableSchema,
            x: Math.random() * 1000, // Placeholder X
            y: Math.random() * 800, // Placeholder Y
            fields,
            indexes: dbIndexes,
            color: isMaterializedView
                ? materializedViewColor
                : isView
                  ? viewColor
                  : defaultTableColor,
            isView: isView,
            isMaterializedView: isMaterializedView,
            createdAt: Date.now(),
            comments: tableInfo.comment ? tableInfo.comment : undefined,
        };
    });

    return result;
};
