import type { DatabaseMetadata } from './metadata-types/database-metadata';
import { schemaNameToDomainSchemaName } from '@/lib/domain/db-schema';

/**
 * Filters database metadata to include only the specified tables and their related data
 * @param metadata - The complete database metadata
 * @param selectedTables - Array of table identifiers in format "schema.table"
 * @returns Filtered database metadata
 */
export function filterMetadataByTables(
    metadata: DatabaseMetadata,
    selectedTables: string[]
): DatabaseMetadata {
    // Remove type prefixes (table: or view:) and create a set for faster lookup
    const cleanedTables = selectedTables.map((tableId) => {
        // Remove "table:" or "view:" prefix if present
        return tableId.replace(/^(table:|view:)/, '');
    });
    const selectedTableSet = new Set(cleanedTables);

    // Filter tables
    const filteredTables = metadata.tables.filter((table) => {
        const schema = schemaNameToDomainSchemaName(table.schema) || 'default';
        const tableId = `${schema}.${table.table}`;
        return selectedTableSet.has(tableId);
    });

    // Filter views - include views that were explicitly selected
    const filteredViews =
        metadata.views?.filter((view) => {
            const schema =
                schemaNameToDomainSchemaName(view.schema) || 'default';
            const viewName = view.view_name || '';
            const viewId = `${schema}.${viewName}`;
            return selectedTableSet.has(viewId);
        }) || [];

    // Get the raw schema.table combinations for filtering other metadata
    const rawTablePairs = filteredTables.map((table) => ({
        schema: table.schema,
        table: table.table,
    }));

    // Get the raw schema.view combinations for filtering metadata
    const rawViewPairs = filteredViews.map((view) => ({
        schema: view.schema,
        view: view.view_name || '',
    }));

    // Filter columns - include columns from both tables and views
    const filteredColumns = metadata.columns.filter((col) => {
        const fromTable = rawTablePairs.some(
            (pair) => pair.schema === col.schema && pair.table === col.table
        );
        // For views, the column.table field might contain the view name
        const fromView = rawViewPairs.some(
            (pair) => pair.schema === col.schema && pair.view === col.table
        );
        return fromTable || fromView;
    });

    // Filter primary keys
    const filteredPrimaryKeys = metadata.pk_info.filter((pk) =>
        rawTablePairs.some(
            (pair) => pair.schema === pk.schema && pair.table === pk.table
        )
    );

    // Filter indexes
    const filteredIndexes = metadata.indexes.filter((idx) =>
        rawTablePairs.some(
            (pair) => pair.schema === idx.schema && pair.table === idx.table
        )
    );

    // Filter foreign keys - include if either source or target table is selected
    // This ensures all relationships related to selected tables are preserved
    const filteredForeignKeys = metadata.fk_info.filter((fk) => {
        // Handle reference_schema and reference_table fields from the JSON
        const targetSchema = fk.reference_schema;
        const targetTable = (fk.reference_table || '').replace(/^"+|"+$/g, ''); // Remove extra quotes

        const sourceIncluded = rawTablePairs.some(
            (pair) => pair.schema === fk.schema && pair.table === fk.table
        );
        const targetIncluded = rawTablePairs.some(
            (pair) => pair.schema === targetSchema && pair.table === targetTable
        );
        return sourceIncluded || targetIncluded;
    });

    // Filter custom types if they exist
    const filteredCustomTypes =
        metadata.custom_types?.filter((type) => {
            // Include custom types from schemas that have selected tables or views
            const schemasWithTables = new Set(
                rawTablePairs.map((pair) => pair.schema)
            );
            const schemasWithViews = new Set(
                rawViewPairs.map((pair) => pair.schema)
            );

            // Also check if the type is used by any of the selected tables' columns
            const typeUsedInColumns = filteredColumns.some(
                (col) => col.type === type.type || col.type.includes(type.type) // Handle array types like "custom_type[]"
            );

            return (
                schemasWithTables.has(type.schema) ||
                schemasWithViews.has(type.schema) ||
                typeUsedInColumns
            );
        }) || [];

    return {
        ...metadata,
        tables: filteredTables,
        columns: filteredColumns,
        pk_info: filteredPrimaryKeys,
        indexes: filteredIndexes,
        fk_info: filteredForeignKeys,
        views: filteredViews,
        custom_types: filteredCustomTypes,
    };
}
