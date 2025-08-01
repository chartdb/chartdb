import React, {
    useMemo,
    useState,
    useCallback,
    useEffect,
    useRef,
} from 'react';
import {
    X,
    Search,
    Eye,
    EyeOff,
    Database,
    Table,
    Funnel,
    Layers,
} from 'lucide-react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { shouldShowTableSchemaBySchemaFilter } from '@/lib/domain/db-table';
import { databasesWithSchemas } from '@/lib/domain/db-schema';
import { defaultSchemas } from '@/lib/data/default-schemas';
import { useReactFlow } from '@xyflow/react';
import { TreeView } from '@/components/tree-view/tree-view';
import type { TreeNode } from '@/components/tree-view/tree';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/toggle/toggle-group';

export interface CanvasFilterProps {
    onClose: () => void;
}

type NodeType = 'schema' | 'table' | 'area';

type SchemaContext = { name: string };
type AreaContext = { id: string; name: string };
type TableContext = {
    tableSchema?: string | null;
    hidden: boolean;
};

type NodeContext = {
    schema: SchemaContext;
    area: AreaContext;
    table: TableContext;
};

type RelevantTableData = {
    id: string;
    name: string;
    schema?: string | null;
};

export const CanvasFilter: React.FC<CanvasFilterProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const {
        tables,
        databaseType,
        hiddenTableIds,
        addHiddenTableId,
        removeHiddenTableId,
        addHiddenTableIds,
        removeHiddenTableIds,
        filteredSchemas,
        areas,
    } = useChartDB();
    const { fitView, setNodes } = useReactFlow();
    const [searchQuery, setSearchQuery] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [groupBy, setGroupBy] = useState<'schema' | 'area'>('schema');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const supportsSchemas = useMemo(
        () => databasesWithSchemas.includes(databaseType),
        [databaseType]
    );
    const hasAreas = useMemo(() => areas.length > 0, [areas]);

    // Extract only the properties needed for tree data
    const relevantTableData = useMemo<RelevantTableData[]>(
        () =>
            tables.map((table) => ({
                id: table.id,
                name: table.name,
                schema: table.schema,
            })),
        [tables]
    );

    // Convert tables to tree nodes
    const treeData = useMemo(() => {
        if (groupBy === 'area' && hasAreas) {
            // Group tables by area
            const tablesByArea = new Map<string, RelevantTableData[]>();
            const tablesWithoutArea: RelevantTableData[] = [];

            // Create a map of area id to area
            const areaMap = areas.reduce(
                (acc, area) => {
                    acc[area.id] = area;
                    return acc;
                },
                {} as Record<string, (typeof areas)[0]>
            );

            // Create table lookup map for O(1) access
            const tableMap = new Map(tables.map((t) => [t.id, t]));

            // Include ALL tables, not just visible ones
            relevantTableData.forEach((table) => {
                const tableData = tableMap.get(table.id);

                // Tables should stay in their areas regardless of visibility
                if (
                    tableData?.parentAreaId &&
                    areaMap[tableData.parentAreaId]
                ) {
                    const areaId = tableData.parentAreaId;
                    if (!tablesByArea.has(areaId)) {
                        tablesByArea.set(areaId, []);
                    }
                    tablesByArea.get(areaId)!.push(table);
                } else {
                    tablesWithoutArea.push(table);
                }
            });

            // Sort tables within each area
            tablesByArea.forEach((tables) => {
                tables.sort((a, b) => a.name.localeCompare(b.name));
            });
            tablesWithoutArea.sort((a, b) => a.name.localeCompare(b.name));

            // Convert to tree nodes
            const nodes: TreeNode<NodeType, NodeContext>[] = [];

            // Sort all areas by order or name (including empty ones)
            const sortedAreas = areas.sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                return a.name.localeCompare(b.name);
            });

            sortedAreas.forEach((area) => {
                // Get all tables for this area from our mapping
                const areaTables = tablesByArea.get(area.id) || [];
                // Count all tables that belong to this area (including hidden ones)
                const totalTablesInArea = tables.filter(
                    (t) => t.parentAreaId === area.id
                ).length;

                // Always show the area if it has any tables
                if (totalTablesInArea > 0 || areaTables.length > 0) {
                    // Get ALL tables that belong to this area (not just the visible ones)
                    const allTablesInThisArea = tables.filter(
                        (t) => t.parentAreaId === area.id
                    );

                    // Check if all tables in this area are hidden
                    const allTablesInAreaHidden =
                        allTablesInThisArea.length > 0 &&
                        allTablesInThisArea.every((table) =>
                            hiddenTableIds?.includes(table.id)
                        );

                    const areaNode: TreeNode<NodeType, NodeContext> = {
                        id: `area-${area.id}`,
                        name: `${area.name} (${totalTablesInArea})`,
                        type: 'area',
                        isFolder: true,
                        icon: Layers,
                        context: { id: area.id, name: area.name },
                        className: allTablesInAreaHidden ? 'text-gray-400' : '',
                        children: areaTables.map(
                            (table): TreeNode<NodeType, NodeContext> => {
                                const tableHidden =
                                    hiddenTableIds?.includes(table.id) ?? false;
                                // If the parent area is hidden (all tables hidden), this table should appear gray too
                                const shouldAppearGray =
                                    tableHidden || allTablesInAreaHidden;
                                return {
                                    id: table.id,
                                    name: table.name,
                                    type: 'table',
                                    isFolder: false,
                                    icon: Table,
                                    context: {
                                        tableSchema: table.schema,
                                        hidden: tableHidden,
                                    },
                                    className: shouldAppearGray
                                        ? 'text-gray-400'
                                        : '',
                                };
                            }
                        ),
                    };
                    nodes.push(areaNode);
                }
            });

            // Add "No Area" group if there are tables without areas
            // Count all tables that don't belong to any area (including hidden ones)
            const totalTablesWithoutArea = tables.filter(
                (t) => !t.parentAreaId
            ).length;
            if (totalTablesWithoutArea > 0) {
                // Get ALL tables without area (not just the visible ones)
                const allTablesWithoutAreaList = tables.filter(
                    (t) => !t.parentAreaId
                );

                // Check if all tables without area are hidden
                const allTablesWithoutAreaHidden =
                    allTablesWithoutAreaList.length > 0 &&
                    allTablesWithoutAreaList.every((table) =>
                        hiddenTableIds?.includes(table.id)
                    );

                const noAreaNode: TreeNode<NodeType, NodeContext> = {
                    id: 'area-no-area',
                    name: `${t('canvas_filter.no_area')} (${totalTablesWithoutArea})`,
                    type: 'area',
                    isFolder: true,
                    icon: Layers,
                    context: {
                        id: 'no-area',
                        name: t('canvas_filter.no_area'),
                    },
                    className: allTablesWithoutAreaHidden
                        ? 'text-gray-400'
                        : '',
                    children: tablesWithoutArea.map(
                        (table): TreeNode<NodeType, NodeContext> => {
                            const tableHidden =
                                hiddenTableIds?.includes(table.id) ?? false;
                            // If the parent area is hidden (all tables hidden), this table should appear gray too
                            const shouldAppearGray =
                                tableHidden || allTablesWithoutAreaHidden;
                            return {
                                id: table.id,
                                name: table.name,
                                type: 'table',
                                isFolder: false,
                                icon: Table,
                                context: {
                                    tableSchema: table.schema,
                                    hidden: tableHidden,
                                },
                                className: shouldAppearGray
                                    ? 'text-gray-400'
                                    : '',
                            };
                        }
                    ),
                };
                nodes.push(noAreaNode);
            }

            return nodes;
        }

        // Default schema grouping
        // Group tables by schema
        const tablesBySchema = new Map<string, RelevantTableData[]>();

        relevantTableData.forEach((table) => {
            const schema =
                table.schema ?? defaultSchemas[databaseType] ?? 'default';
            if (!tablesBySchema.has(schema)) {
                tablesBySchema.set(schema, []);
            }
            tablesBySchema.get(schema)!.push(table);
        });

        // Sort tables within each schema
        tablesBySchema.forEach((tables) => {
            tables.sort((a, b) => a.name.localeCompare(b.name));
        });

        // Convert to tree nodes
        const nodes: TreeNode<NodeType, NodeContext>[] = [];

        tablesBySchema.forEach((schemaTables, schemaName) => {
            // Pre-calculate if all tables in this schema are hidden
            const allTablesHidden = schemaTables.every(
                (table) => hiddenTableIds?.includes(table.id) ?? false
            );

            const schemaNode: TreeNode<NodeType, NodeContext> = {
                id: `schema-${schemaName}`,
                name: `${schemaName} (${schemaTables.length})`,
                type: 'schema',
                isFolder: true,
                icon: Database,
                context: { name: schemaName },
                className: allTablesHidden ? 'text-gray-400' : '',
                children: schemaTables.map(
                    (table): TreeNode<NodeType, NodeContext> => {
                        const tableHidden =
                            hiddenTableIds?.includes(table.id) ?? false;
                        return {
                            id: table.id,
                            name: table.name,
                            type: 'table',
                            isFolder: false,
                            icon: Table,
                            context: {
                                tableSchema: table.schema,
                                hidden: tableHidden,
                            },
                            className: tableHidden ? 'opacity-50' : '',
                        };
                    }
                ),
            };
            nodes.push(schemaNode);
        });

        return nodes;
    }, [
        relevantTableData,
        databaseType,
        hiddenTableIds,
        groupBy,
        hasAreas,
        areas,
        tables,
        t,
    ]);

    // Initialize expanded state - collapse if multiple schemas, expand if single schema (when grouping changes)
    useEffect(() => {
        setExpanded((prevExpanded) => {
            const hasMultipleSchemas = treeData.length > 1;
            const newExpanded: Record<string, boolean> = {};

            treeData.forEach((node) => {
                // Preserve existing expanded state if it exists, otherwise set based on schema count
                if (node.id in prevExpanded) {
                    newExpanded[node.id] = prevExpanded[node.id];
                } else {
                    // If there are multiple schemas, start collapsed; otherwise expanded
                    newExpanded[node.id] = !hasMultipleSchemas;
                }
            });

            return newExpanded;
        });
    }, [groupBy, treeData]);

    // Filter tree data based on search query
    const filteredTreeData: TreeNode<NodeType, NodeContext>[] = useMemo(() => {
        if (!searchQuery.trim()) {
            return treeData;
        }

        const query = searchQuery.toLowerCase();
        const result: TreeNode<NodeType, NodeContext>[] = [];

        treeData.forEach((schemaNode) => {
            const filteredChildren = schemaNode.children?.filter((tableNode) =>
                tableNode.name.toLowerCase().includes(query)
            );

            if (filteredChildren && filteredChildren.length > 0) {
                result.push({
                    ...schemaNode,
                    children: filteredChildren,
                });
            }
        });

        return result;
    }, [treeData, searchQuery]);

    const toggleTableVisibility = useCallback(
        async (tableId: string, hidden: boolean) => {
            if (hidden) {
                await addHiddenTableId(tableId);
            } else {
                await removeHiddenTableId(tableId);
            }
        },
        [addHiddenTableId, removeHiddenTableId]
    );

    const focusOnTable = useCallback(
        (tableId: string) => {
            // Make sure the table is visible
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === tableId
                        ? {
                              ...node,
                              hidden: false,
                              selected: true,
                          }
                        : {
                              ...node,
                              selected: false,
                          }
                )
            );

            // Focus on the table
            setTimeout(() => {
                fitView({
                    duration: 500,
                    maxZoom: 1,
                    minZoom: 1,
                    nodes: [
                        {
                            id: tableId,
                        },
                    ],
                });
            }, 100);
        },
        [fitView, setNodes]
    );

    // Render component that's always visible (eye indicator)
    const renderActions = useCallback(
        (node: TreeNode<NodeType, NodeContext>) => {
            if (node.type === 'area') {
                const areaContext = node.context as AreaContext;
                const areaId = areaContext.id;

                // Find all tables that belong to this area (not just the visible ones)
                const allTablesInArea =
                    areaId === 'no-area'
                        ? tables.filter((table) => !table.parentAreaId)
                        : tables.filter(
                              (table) => table.parentAreaId === areaId
                          );

                // Check if all tables in this area are hidden - use current state
                const allHidden =
                    allTablesInArea.length > 0 &&
                    allTablesInArea.every((table) =>
                        hiddenTableIds?.includes(table.id)
                    );

                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 h-fit p-0"
                        disabled={allTablesInArea.length === 0}
                        onClick={async (e) => {
                            e.stopPropagation();
                            // Toggle all tables in this area using bulk operations
                            const tableIds = allTablesInArea.map(
                                (table) => table.id
                            );
                            if (allHidden) {
                                await removeHiddenTableIds(tableIds);
                            } else {
                                await addHiddenTableIds(tableIds);
                            }
                        }}
                    >
                        {allHidden ? (
                            <EyeOff className="size-3.5 text-muted-foreground" />
                        ) : (
                            <Eye className="size-3.5" />
                        )}
                    </Button>
                );
            }

            if (node.type === 'schema') {
                // Get all table IDs in this schema
                const schemaTableIds =
                    node.children?.map((child) => child.id) || [];

                // Check if all tables in this schema are hidden
                const allTablesHidden =
                    schemaTableIds.length > 0 &&
                    schemaTableIds.every((id) => hiddenTableIds?.includes(id));

                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 h-fit p-0"
                        disabled={schemaTableIds.length === 0}
                        onClick={async (e) => {
                            e.stopPropagation();

                            if (allTablesHidden) {
                                // Show all tables in this schema
                                await removeHiddenTableIds(schemaTableIds);
                            } else {
                                // Hide all tables in this schema
                                await addHiddenTableIds(schemaTableIds);
                            }
                        }}
                    >
                        {allTablesHidden ? (
                            <EyeOff className="size-3.5 text-muted-foreground" />
                        ) : (
                            <Eye className="size-3.5" />
                        )}
                    </Button>
                );
            }

            if (node.type === 'table') {
                const tableId = node.id;
                const tableContext = node.context as TableContext;
                const tableSchema = tableContext.tableSchema;

                // Always use the current state directly
                const isCurrentlyHidden =
                    hiddenTableIds?.includes(tableId) ?? false;

                const visibleBySchema = shouldShowTableSchemaBySchemaFilter({
                    tableSchema,
                    filteredSchemas,
                });

                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 h-fit p-0"
                        onClick={async (e) => {
                            e.stopPropagation();
                            // Simply toggle the table visibility using current state
                            await toggleTableVisibility(
                                tableId,
                                !isCurrentlyHidden
                            );
                        }}
                        disabled={groupBy === 'schema' && !visibleBySchema}
                    >
                        {isCurrentlyHidden ? (
                            <EyeOff className="size-3.5 text-muted-foreground" />
                        ) : (
                            <Eye className="size-3.5" />
                        )}
                    </Button>
                );
            }

            return null;
        },
        [
            toggleTableVisibility,
            filteredSchemas,
            hiddenTableIds,
            addHiddenTableIds,
            removeHiddenTableIds,
            tables,
            groupBy,
        ]
    );

    // Handle node click
    const handleNodeClick = useCallback(
        (node: TreeNode<NodeType, NodeContext>) => {
            if (node.type === 'schema' || node.type === 'area') {
                // Toggle schema/area expansion on single click
                setExpanded((prev) => ({
                    ...prev,
                    [node.id]: !prev[node.id],
                }));
            } else if (node.type === 'table') {
                const tableContext = node.context as TableContext;
                const tableSchema = tableContext.tableSchema;
                const visibleBySchema = shouldShowTableSchemaBySchemaFilter({
                    tableSchema,
                    filteredSchemas,
                });

                // Only focus if neither table is hidden nor filtered by schema
                if (!tableContext.hidden && visibleBySchema) {
                    focusOnTable(node.id);
                }
            }
        },
        [focusOnTable, filteredSchemas]
    );

    // Animate in on mount and focus search input
    useEffect(() => {
        setIsFilterVisible(true);
        // Focus the search input after a short delay to ensure the component is fully rendered
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 300);
    }, []);

    return (
        <div
            className={`absolute right-2 top-2 z-10 flex flex-col rounded-lg border bg-background/85 shadow-lg backdrop-blur-sm transition-all duration-300 md:right-4 md:top-4 ${
                isFilterVisible
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-full opacity-0'
            } size-[calc(100%-1rem)] max-w-sm md:h-[calc(100%-2rem)] md:w-80`}
        >
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-lg border-b px-2 py-1">
                <div className="flex items-center gap-2">
                    <Funnel className="size-3.5 text-muted-foreground md:size-4" />
                    <h2 className="text-sm font-medium">
                        {t('canvas_filter.title', 'Filter Tables')}
                    </h2>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    onClick={onClose}
                >
                    <X className="size-4" />
                </Button>
            </div>

            {/* Search */}
            <div className="border-b p-2">
                <div className="relative h-9">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={searchInputRef}
                        placeholder={t(
                            'canvas_filter.search_placeholder',
                            'Search tables...'
                        )}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-full pl-9"
                    />
                </div>
                {hasAreas && (
                    <div className="mt-2">
                        <ToggleGroup
                            type="single"
                            value={groupBy}
                            onValueChange={(value) => {
                                if (value)
                                    setGroupBy(value as 'schema' | 'area');
                            }}
                            className="w-full justify-start"
                        >
                            <ToggleGroupItem
                                value="schema"
                                aria-label={
                                    supportsSchemas
                                        ? 'Group by schema'
                                        : 'Default'
                                }
                                className="h-8 flex-1 gap-1.5 text-xs"
                            >
                                <Database className="size-3.5" />
                                {supportsSchemas
                                    ? t('canvas_filter.group_by_schema')
                                    : t('canvas_filter.default_grouping')}
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="area"
                                aria-label="Group by area"
                                className="h-8 flex-1 gap-1.5 text-xs"
                            >
                                <Layers className="size-3.5" />
                                {t('canvas_filter.group_by_area')}
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                )}
            </div>

            {/* Table Tree */}
            <ScrollArea className="flex-1 rounded-b-lg" type="auto">
                <TreeView
                    key={`tree-${groupBy}-${JSON.stringify(hiddenTableIds?.sort() || [])}`}
                    data={filteredTreeData}
                    onNodeClick={handleNodeClick}
                    renderActionsComponent={renderActions}
                    defaultFolderIcon={Database}
                    defaultIcon={Table}
                    expanded={expanded}
                    setExpanded={setExpanded}
                    className="py-2"
                />
            </ScrollArea>
        </div>
    );
};
