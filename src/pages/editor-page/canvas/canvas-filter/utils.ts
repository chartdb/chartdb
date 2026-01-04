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
import { Box, Database, Layers, Table, View } from 'lucide-react';
import { filterTable } from '@/lib/domain/diagram-filter/filter';
import { defaultSchemas } from '@/lib/data/default-schemas';

type TableWithVisibility = RelevantTableData & { visible: boolean };

const computeTableVisibility = (
    tables: RelevantTableData[],
    filter: DiagramFilter | undefined,
    databaseType: DatabaseType
): TableWithVisibility[] =>
    tables.map((table) => ({
        ...table,
        visible: filterTable({
            table: {
                id: table.id,
                schema: table.schema,
            },
            filter,
            options: {
                defaultSchema: defaultSchemas[databaseType],
            },
        }),
    }));

const createTableChildren = (
    tablesWithVisibility: TableWithVisibility[]
): TreeNode<NodeType, NodeContext>[] =>
    tablesWithVisibility.map((table) => ({
        id: table.id,
        name: table.name,
        type: 'table' as const,
        isFolder: false,
        icon: table.isView ? View : Table,
        context: {
            tableSchema: table.schema,
            visible: table.visible,
        } satisfies TableContext,
        className: !table.visible ? 'opacity-50' : '',
    }));

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
        if (areaTables.length === 0) return;

        // Pre-compute visibility for all tables in this area (single pass)
        const tablesWithVisibility = computeTableVisibility(
            areaTables,
            filter,
            databaseType
        );
        const visibleCount = tablesWithVisibility.filter(
            (t) => t.visible
        ).length;
        const areaVisible = visibleCount === areaTables.length;

        const areaNode: TreeNode<NodeType, NodeContext> = {
            id: `area-${area.id}`,
            name: area.name,
            suffix: `${visibleCount}/${areaTables.length}`,
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
            children: createTableChildren(tablesWithVisibility),
        };

        nodes.push(areaNode);
    });

    // Add ungrouped tables
    if (tablesWithoutArea.length > 0) {
        const tablesWithVisibility = computeTableVisibility(
            tablesWithoutArea,
            filter,
            databaseType
        );
        const visibleCount = tablesWithVisibility.filter(
            (t) => t.visible
        ).length;
        const ungroupedVisible = visibleCount === tablesWithoutArea.length;

        const ungroupedNode: TreeNode<NodeType, NodeContext> = {
            id: 'ungrouped',
            name: 'Ungrouped',
            suffix: `${visibleCount}/${tablesWithoutArea.length}`,
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
            children: createTableChildren(tablesWithVisibility),
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

    // Group tables by schema
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
        // Pre-compute visibility for all tables in this schema (single pass)
        const tablesWithVisibility = computeTableVisibility(
            schemaTables,
            filter,
            databaseType
        );
        const visibleCount = tablesWithVisibility.filter(
            (t) => t.visible
        ).length;
        const schemaVisible = visibleCount === schemaTables.length;

        const schemaNode: TreeNode<NodeType, NodeContext> = {
            id: `schema-${schemaName}`,
            name: schemaName,
            suffix: `${visibleCount}/${schemaTables.length}`,
            type: 'schema',
            isFolder: true,
            icon: Database,
            context: {
                name: schemaName,
                visible: schemaVisible,
            } satisfies SchemaContext,
            className: !schemaVisible ? 'opacity-50' : '',
            children: createTableChildren(tablesWithVisibility),
        };
        nodes.push(schemaNode);
    });

    return nodes;
};
