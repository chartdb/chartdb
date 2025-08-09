import type { Area, DatabaseType } from '@/lib/domain';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';
import type {
    AreaContext,
    NodeContext,
    NodeType,
    RelevantTableData,
    SchemaContext,
    TableContext,
} from './types';
import type { TreeNode } from '@/components/tree-view/tree';
import { Box, Database, Layers, Table } from 'lucide-react';
import { filterTable } from '@/lib/domain/diagram-filter/filter';
import { defaultSchemas } from '@/lib/data/default-schemas';

export const generateTreeDataByAreas = ({
    areas,
    databaseType,
    filter,
    relevantTableData,
}: {
    areas: Area[];
    databaseType: DatabaseType;
    filter?: DiagramFilter;
    relevantTableData: RelevantTableData[];
}): TreeNode<NodeType, NodeContext>[] => {
    const nodes: TreeNode<NodeType, NodeContext>[] = [];

    // Group tables by area
    const tablesByArea = new Map<string | null, RelevantTableData[]>();
    const tablesWithoutArea: RelevantTableData[] = [];

    relevantTableData.forEach((table) => {
        if (table.parentAreaId) {
            if (!tablesByArea.has(table.parentAreaId)) {
                tablesByArea.set(table.parentAreaId, []);
            }
            tablesByArea.get(table.parentAreaId)!.push(table);
        } else {
            tablesWithoutArea.push(table);
        }
    });

    // Sort tables within each area
    tablesByArea.forEach((areaTables) => {
        areaTables.sort((a, b) => a.name.localeCompare(b.name));
    });
    tablesWithoutArea.sort((a, b) => a.name.localeCompare(b.name));

    // Create nodes for areas
    areas.forEach((area) => {
        const areaTables = tablesByArea.get(area.id) || [];

        // Check if at least one table in the area is visible
        const areaVisible =
            // areaTables.length === 0 ||
            !areaTables.some(
                (table) =>
                    filterTable({
                        table: {
                            id: table.id,
                            schema: table.schema,
                        },
                        filter,
                        options: {
                            defaultSchema: defaultSchemas[databaseType],
                        },
                    }) === false
            );

        const areaNode: TreeNode<NodeType, NodeContext> = {
            id: `area-${area.id}`,
            name: `${area.name} (${areaTables.length})`,
            type: 'area',
            isFolder: true,
            icon: Box,
            context: {
                id: area.id,
                name: area.name,
                visible: areaVisible,
                isUngrouped: false,
            } satisfies AreaContext,
            className: !areaVisible ? 'opacity-50' : '',
            children: areaTables.map(
                (table): TreeNode<NodeType, NodeContext> => {
                    const tableVisible = filterTable({
                        table: {
                            id: table.id,
                            schema: table.schema,
                        },
                        filter,
                        options: {
                            defaultSchema: defaultSchemas[databaseType],
                        },
                    });

                    return {
                        id: table.id,
                        name: table.name,
                        type: 'table',
                        isFolder: false,
                        icon: Table,
                        context: {
                            tableSchema: table.schema,
                            visible: tableVisible,
                        } satisfies TableContext,
                        className: !tableVisible ? 'opacity-50' : '',
                    };
                }
            ),
        };

        if (areaTables.length > 0) {
            nodes.push(areaNode);
        }
    });

    // Add ungrouped tables
    if (tablesWithoutArea.length > 0) {
        const ungroupedVisible = !tablesWithoutArea.some(
            (table) =>
                filterTable({
                    table: {
                        id: table.id,
                        schema: table.schema,
                    },
                    filter,
                    options: {
                        defaultSchema: defaultSchemas[databaseType],
                    },
                }) == false
        );

        const ungroupedNode: TreeNode<NodeType, NodeContext> = {
            id: 'ungrouped',
            name: `Ungrouped (${tablesWithoutArea.length})`,
            type: 'area',
            isFolder: true,
            icon: Layers,
            context: {
                id: 'ungrouped',
                name: 'Ungrouped',
                visible: ungroupedVisible,
                isUngrouped: true,
            } satisfies AreaContext,
            className: !ungroupedVisible ? 'opacity-50' : '',
            children: tablesWithoutArea.map(
                (table): TreeNode<NodeType, NodeContext> => {
                    const tableVisible = filterTable({
                        table: {
                            id: table.id,
                            schema: table.schema,
                        },
                        filter,
                        options: {
                            defaultSchema: defaultSchemas[databaseType],
                        },
                    });

                    return {
                        id: table.id,
                        name: table.name,
                        type: 'table',
                        isFolder: false,
                        icon: Table,
                        context: {
                            tableSchema: table.schema,
                            visible: tableVisible,
                        } satisfies TableContext,
                        className: !tableVisible ? 'opacity-50' : '',
                    };
                }
            ),
        };
        nodes.push(ungroupedNode);
    }

    return nodes;
};

export const generateTreeDataBySchemas = ({
    relevantTableData,
    databaseWithSchemas,
    databaseType,
    filter,
}: {
    relevantTableData: RelevantTableData[];
    databaseWithSchemas: boolean;
    databaseType: DatabaseType;
    filter?: DiagramFilter;
}): TreeNode<NodeType, NodeContext>[] => {
    const nodes: TreeNode<NodeType, NodeContext>[] = [];

    // Group tables by schema (existing logic)
    const tablesBySchema = new Map<string, RelevantTableData[]>();

    relevantTableData.forEach((table) => {
        const schema = !databaseWithSchemas
            ? 'All Tables'
            : (table.schema ?? defaultSchemas[databaseType] ?? 'default');

        if (!tablesBySchema.has(schema)) {
            tablesBySchema.set(schema, []);
        }
        tablesBySchema.get(schema)!.push(table);
    });

    // Sort tables within each schema
    tablesBySchema.forEach((tables) => {
        tables.sort((a, b) => a.name.localeCompare(b.name));
    });

    tablesBySchema.forEach((schemaTables, schemaName) => {
        let schemaVisible;

        if (databaseWithSchemas) {
            schemaVisible = !schemaTables.some(
                (table) =>
                    filterTable({
                        table: {
                            id: table.id,
                            schema: table.schema,
                        },
                        filter,
                        options: {
                            defaultSchema: defaultSchemas[databaseType],
                        },
                    }) === false
            );
        } else {
            // if at least one table is visible, the schema is considered visible
            schemaVisible = !schemaTables.some(
                (table) =>
                    filterTable({
                        table: {
                            id: table.id,
                            schema: table.schema,
                        },
                        filter,
                        options: {
                            defaultSchema: defaultSchemas[databaseType],
                        },
                    }) === false
            );
        }

        const schemaNode: TreeNode<NodeType, NodeContext> = {
            id: `schema-${schemaName}`,
            name: `${schemaName} (${schemaTables.length})`,
            type: 'schema',
            isFolder: true,
            icon: Database,
            context: {
                name: schemaName,
                visible: schemaVisible,
            } satisfies SchemaContext,
            className: !schemaVisible ? 'opacity-50' : '',
            children: schemaTables.map(
                (table): TreeNode<NodeType, NodeContext> => {
                    const tableVisible = filterTable({
                        table: {
                            id: table.id,
                            schema: table.schema,
                        },
                        filter,
                        options: {
                            defaultSchema: defaultSchemas[databaseType],
                        },
                    });

                    const hidden = !tableVisible;

                    return {
                        id: table.id,
                        name: table.name,
                        type: 'table',
                        isFolder: false,
                        icon: Table,
                        context: {
                            tableSchema: table.schema,
                            visible: tableVisible,
                        } satisfies TableContext,
                        className: hidden ? 'opacity-50' : '',
                    };
                }
            ),
        };
        nodes.push(schemaNode);
    });

    return nodes;
};
