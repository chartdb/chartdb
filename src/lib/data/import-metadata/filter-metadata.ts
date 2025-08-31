import type { DatabaseMetadata } from './metadata-types/database-metadata';
import { schemaNameToDomainSchemaName } from '@/lib/domain/db-schema';

export interface SelectedTable {
    schema?: string | null;
    table: string;
    type: 'table' | 'view';
}

export function filterMetadataByTables({
    metadata,
    selectedTables: inputSelectedTables,
}: {
    metadata: DatabaseMetadata;
    selectedTables: SelectedTable[];
}): DatabaseMetadata {
    const selectedTables = inputSelectedTables.map((st) => {
        // Normalize schema names to ensure consistent filtering
        const schema = schemaNameToDomainSchemaName(st.schema) ?? '';
        return {
            ...st,
            schema,
        };
    });

    // Create sets for faster lookup
    const selectedTableSet = new Set(
        selectedTables
            .filter((st) => st.type === 'table')
            .map((st) => `${st.schema}.${st.table}`)
    );
    const selectedViewSet = new Set(
        selectedTables
            .filter((st) => st.type === 'view')
            .map((st) => `${st.schema}.${st.table}`)
    );

    // Filter tables
    const filteredTables = metadata.tables.filter((table) => {
        const schema = schemaNameToDomainSchemaName(table.schema) ?? '';
        const tableId = `${schema}.${table.table}`;
        return selectedTableSet.has(tableId);
    });

    // Filter views - include views that were explicitly selected
    const filteredViews =
        metadata.views?.filter((view) => {
            const schema = schemaNameToDomainSchemaName(view.schema) ?? '';
            const viewName = view.view_name ?? '';
            const viewId = `${schema}.${viewName}`;
            return selectedViewSet.has(viewId);
        }) || [];

    // Filter columns - include columns from both tables and views
    const filteredColumns = metadata.columns.filter((col) => {
        const fromTable = filteredTables.some(
            (tb) => tb.schema === col.schema && tb.table === col.table
        );
        // For views, the column.table field might contain the view name
        const fromView = filteredViews.some(
            (view) => view.schema === col.schema && view.view_name === col.table
        );
        return fromTable || fromView;
    });

    // Filter primary keys
    const filteredPrimaryKeys = metadata.pk_info.filter((pk) =>
        filteredTables.some(
            (tb) => tb.schema === pk.schema && tb.table === pk.table
        )
    );

    // Filter indexes
    const filteredIndexes = metadata.indexes.filter((idx) =>
        filteredTables.some(
            (tb) => tb.schema === idx.schema && tb.table === idx.table
        )
    );

    // Filter foreign keys - include if either source or target table is selected
    // This ensures all relationships related to selected tables are preserved
    const filteredForeignKeys = metadata.fk_info.filter((fk) => {
        // Handle reference_schema and reference_table fields from the JSON
        const targetSchema = fk.reference_schema;
        const targetTable = (fk.reference_table || '').replace(/^"+|"+$/g, ''); // Remove extra quotes

        const sourceIncluded = filteredTables.some(
            (tb) => tb.schema === fk.schema && tb.table === fk.table
        );
        const targetIncluded = filteredTables.some(
            (tb) => tb.schema === targetSchema && tb.table === targetTable
        );
        return sourceIncluded || targetIncluded;
    });

    const schemasWithTables = new Set(filteredTables.map((tb) => tb.schema));
    const schemasWithViews = new Set(filteredViews.map((view) => view.schema));

    // Filter custom types if they exist
    const filteredCustomTypes =
        metadata.custom_types?.filter((customType) => {
            // Also check if the type is used by any of the selected tables' columns
            const typeUsedInColumns = filteredColumns.some(
                (col) =>
                    col.type === customType.type ||
                    col.type.includes(customType.type) // Handle array types like "custom_type[]"
            );

            return (
                schemasWithTables.has(customType.schema) ||
                schemasWithViews.has(customType.schema) ||
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
