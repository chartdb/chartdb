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
    Box,
} from 'lucide-react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { schemaNameToSchemaId } from '@/lib/domain/db-schema';
import { defaultSchemas } from '@/lib/data/default-schemas';
import { useReactFlow } from '@xyflow/react';
import { TreeView } from '@/components/tree-view/tree-view';
import type { TreeNode } from '@/components/tree-view/tree';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { filterTable } from '@/lib/domain/diagram-filter/filter';
import { useDiagramFilter } from '@/context/diagram-filter-context/use-diagram-filter';
import { ToggleGroup, ToggleGroupItem } from '@/components/toggle/toggle-group';
import type {
    AreaContext,
    GroupingMode,
    NodeContext,
    NodeType,
    RelevantTableData,
    SchemaContext,
    TableContext,
} from './types';
import { generateTreeDataByAreas, generateTreeDataBySchemas } from './utils';

export interface CanvasFilterProps {
    onClose: () => void;
}

export const CanvasFilter: React.FC<CanvasFilterProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const { tables, databaseType, areas } = useChartDB();
    const {
        filter,
        toggleSchemaFilter,
        toggleTableFilter,
        clearTableIdsFilter,
        setTableIdsFilterEmpty,
    } = useDiagramFilter();
    const { fitView, setNodes } = useReactFlow();
    const [searchQuery, setSearchQuery] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [groupingMode, setGroupingMode] = useState<GroupingMode>('schema');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Extract only the properties needed for tree data
    const relevantTableData = useMemo<RelevantTableData[]>(
        () =>
            tables.map((table) => ({
                id: table.id,
                name: table.name,
                schema: table.schema,
                parentAreaId: table.parentAreaId,
            })),
        [tables]
    );

    const databaseWithSchemas = useMemo(
        () => !!defaultSchemas[databaseType],
        [databaseType]
    );

    // Convert tables to tree nodes
    const treeData = useMemo(() => {
        if (groupingMode === 'area') {
            return generateTreeDataByAreas({
                areas,
                databaseType,
                filter,
                relevantTableData,
            });
        } else {
            return generateTreeDataBySchemas({
                relevantTableData,
                databaseWithSchemas,
                databaseType,
                filter,
            });
        }
    }, [
        relevantTableData,
        databaseType,
        filter,
        databaseWithSchemas,
        groupingMode,
        areas,
    ]);

    // Initialize expanded state with all schemas expanded
    useMemo(() => {
        const initialExpanded: Record<string, boolean> = {};
        treeData.forEach((node) => {
            initialExpanded[node.id] = true;
        });
        setExpanded(initialExpanded);
    }, [treeData]);

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
            if (node.type === 'schema') {
                const context = node.context as SchemaContext;
                const schemaVisible = context.visible;
                const schemaName = context.name;
                if (!schemaName) return null;

                const schemaId = schemaNameToSchemaId(schemaName);

                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 h-fit p-0"
                        onClick={(e) => {
                            e.stopPropagation();

                            if (databaseWithSchemas) {
                                toggleSchemaFilter(schemaId);
                            } else {
                                // Toggle visibility of all tables in this schema
                                if (schemaVisible) {
                                    setTableIdsFilterEmpty();
                                } else {
                                    clearTableIdsFilter();
                                }
                            }
                        }}
                    >
                        {!schemaVisible ? (
                            <EyeOff className="size-3.5 text-muted-foreground" />
                        ) : (
                            <Eye className="size-3.5" />
                        )}
                    </Button>
                );
            }

            if (node.type === 'area') {
                const context = node.context as AreaContext;
                const areaVisible = context.visible;
                const areaId = context.id;
                if (!areaId) return null;

                // Get all tables in this area
                const areaTables =
                    areaId === 'ungrouped'
                        ? tables.filter((t) => !t.parentAreaId)
                        : tables.filter((t) => t.parentAreaId === areaId);
                const tableIds = areaTables.map((t) => t.id);

                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 h-fit p-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Toggle all tables in this area
                            if (areaVisible) {
                                // Hide all tables in this area
                                tableIds.forEach((id) => {
                                    const isVisible = filterTable({
                                        table: {
                                            id,
                                            schema: tables.find(
                                                (t) => t.id === id
                                            )?.schema,
                                        },
                                        filter,
                                        options: {
                                            defaultSchema:
                                                defaultSchemas[databaseType],
                                        },
                                    });
                                    if (isVisible) {
                                        toggleTableFilter(id);
                                    }
                                });
                            } else {
                                // Show all tables in this area
                                tableIds.forEach((id) => {
                                    const isVisible = filterTable({
                                        table: {
                                            id,
                                            schema: tables.find(
                                                (t) => t.id === id
                                            )?.schema,
                                        },
                                        filter,
                                        options: {
                                            defaultSchema:
                                                defaultSchemas[databaseType],
                                        },
                                    });
                                    if (!isVisible) {
                                        toggleTableFilter(id);
                                    }
                                });
                            }
                        }}
                    >
                        {!areaVisible ? (
                            <EyeOff className="size-3.5 text-muted-foreground" />
                        ) : (
                            <Eye className="size-3.5" />
                        )}
                    </Button>
                );
            }

            if (node.type === 'table') {
                const tableId = node.id;
                const context = node.context as TableContext;
                const tableVisible = context.visible;

                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 h-fit p-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleTableFilter(tableId);
                        }}
                    >
                        {!tableVisible ? (
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
            toggleSchemaFilter,
            toggleTableFilter,
            clearTableIdsFilter,
            setTableIdsFilterEmpty,
            databaseWithSchemas,
            tables,
            filter,
            databaseType,
        ]
    );

    // Handle node click
    const handleNodeClick = useCallback(
        (node: TreeNode<NodeType, NodeContext>) => {
            if (node.type === 'table') {
                const context = node.context as TableContext;
                const isTableVisible = context.visible;

                // Only focus if table is visible
                if (isTableVisible) {
                    focusOnTable(node.id);
                }
            }
        },
        [focusOnTable]
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
            </div>

            {/* Grouping Toggle */}
            <div className="border-b p-2">
                <ToggleGroup
                    type="single"
                    value={groupingMode}
                    onValueChange={(value) => {
                        if (value) setGroupingMode(value as GroupingMode);
                    }}
                    className="w-full"
                >
                    <ToggleGroupItem value="schema" className="flex-1 text-xs">
                        <Database className="mr-1.5 size-3.5" />
                        {t('canvas_filter.group_by_schema', 'Group by Schema')}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="area" className="flex-1 text-xs">
                        <Box className="mr-1.5 size-3.5" />
                        {t('canvas_filter.group_by_area', 'Group by Area')}
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            {/* Table Tree */}
            <ScrollArea className="flex-1 rounded-b-lg" type="auto">
                <TreeView
                    data={filteredTreeData}
                    onNodeClick={handleNodeClick}
                    renderActionsComponent={renderActions}
                    defaultFolderIcon={groupingMode === 'area' ? Box : Database}
                    defaultIcon={Table}
                    expanded={expanded}
                    setExpanded={setExpanded}
                    className="py-2"
                />
            </ScrollArea>
        </div>
    );
};
