import React, {
    useMemo,
    useState,
    useCallback,
    useEffect,
    useRef,
} from 'react';
import { X, Search, Database, Table, Funnel, Box } from 'lucide-react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { useReactFlow } from '@xyflow/react';
import { TreeView } from '@/components/tree-view/tree-view';
import type { TreeNode } from '@/components/tree-view/tree';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useDiagramFilter } from '@/context/diagram-filter-context/use-diagram-filter';
import { ToggleGroup, ToggleGroupItem } from '@/components/toggle/toggle-group';
import type {
    GroupingMode,
    NodeContext,
    NodeType,
    RelevantTableData,
    TableContext,
} from './types';
import { generateTreeDataByAreas, generateTreeDataBySchemas } from './utils';
import { FilterItemActions } from './filter-item-actions';
import { databasesWithSchemas } from '@/lib/domain';
import { getOperatingSystem } from '@/lib/utils';
import { useLocalConfig } from '@/hooks/use-local-config';
import { useDiff } from '@/context/diff-context/use-diff';

export interface CanvasFilterProps {
    onClose: () => void;
}

export const CanvasFilter: React.FC<CanvasFilterProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const { tables, databaseType, areas } = useChartDB();
    const { checkIfNewTable } = useDiff();
    const {
        filter,
        toggleSchemaFilter,
        toggleTableFilter,
        clearTableIdsFilter,
        setTableIdsFilterEmpty,
        addTablesToFilter,
        removeTablesFromFilter,
    } = useDiagramFilter();
    const { setNodes } = useReactFlow();
    const [searchQuery, setSearchQuery] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [groupingMode, setGroupingMode] = useState<GroupingMode>('schema');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { showDBViews } = useLocalConfig();

    // Extract only the properties needed for tree data
    const relevantTableData = useMemo<RelevantTableData[]>(
        () =>
            tables
                .filter((table) => (showDBViews ? true : !table.isView))
                .filter((table) => !checkIfNewTable({ tableId: table.id }))
                .map((table) => ({
                    id: table.id,
                    name: table.name,
                    schema: table.schema,
                    parentAreaId: table.parentAreaId,
                })),
        [tables, showDBViews, checkIfNewTable]
    );

    const databaseWithSchemas = useMemo(
        () => databasesWithSchemas.includes(databaseType),
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

    // Sync expanded state with tree data changes - only expand NEW nodes
    useEffect(() => {
        setExpanded((prev) => {
            const currentNodeIds = new Set(treeData.map((n) => n.id));
            let hasChanges = false;
            const newExpanded: Record<string, boolean> = { ...prev };

            // Add any new nodes with expanded=true (preserve existing state)
            treeData.forEach((node) => {
                if (!(node.id in prev)) {
                    newExpanded[node.id] = true;
                    hasChanges = true;
                }
            });

            // Remove nodes that no longer exist (cleanup)
            Object.keys(prev).forEach((id) => {
                if (!currentNodeIds.has(id)) {
                    delete newExpanded[id];
                    hasChanges = true;
                }
            });

            // Only update state if something actually changed (performance)
            return hasChanges ? newExpanded : prev;
        });
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

    // Render actions with proper memoization for performance
    const renderActions = useCallback(
        (node: TreeNode<NodeType, NodeContext>) => (
            <FilterItemActions
                node={node}
                databaseWithSchemas={databaseWithSchemas}
                toggleSchemaFilter={toggleSchemaFilter}
                toggleTableFilter={toggleTableFilter}
                clearTableIdsFilter={clearTableIdsFilter}
                setTableIdsFilterEmpty={setTableIdsFilterEmpty}
                addTablesToFilter={addTablesToFilter}
                removeTablesFromFilter={removeTablesFromFilter}
            />
        ),
        [
            databaseWithSchemas,
            toggleSchemaFilter,
            toggleTableFilter,
            clearTableIdsFilter,
            setTableIdsFilterEmpty,
            addTablesToFilter,
            removeTablesFromFilter,
        ]
    );

    const selectTable = useCallback(
        (tableId: string) => {
            // Make sure the table is visible, selected and trigger animation
            setNodes((nodes) =>
                nodes.map((node) => {
                    if (node.id === tableId) {
                        return {
                            ...node,
                            selected: true,
                            data: {
                                ...node.data,
                                highlightTable: true,
                            },
                        };
                    }

                    return {
                        ...node,
                        selected: false,
                        data: {
                            ...node.data,
                            highlightTable: false,
                        },
                    };
                })
            );

            // Remove the highlight flag after animation completes
            setTimeout(() => {
                setNodes((nodes) =>
                    nodes.map((node) => {
                        if (node.id === tableId) {
                            return {
                                ...node,
                                data: {
                                    ...node.data,
                                    highlightTable: false,
                                },
                            };
                        }

                        return node;
                    })
                );
            }, 600);
        },
        [setNodes]
    );

    // Handle node click
    const handleNodeClick = useCallback(
        (node: TreeNode<NodeType, NodeContext>) => {
            if (node.type === 'table') {
                const context = node.context as TableContext;
                const isTableVisible = context.visible;

                // Only select if table is visible
                if (isTableVisible) {
                    selectTable(node.id);
                }
            }
        },
        [selectTable]
    );

    // Animate in on mount and focus search input
    useEffect(() => {
        setIsFilterVisible(true);
        // Focus the search input after a short delay to ensure the component is fully rendered
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 300);
    }, []);

    const openFilterShortcut = useMemo(
        () => (getOperatingSystem() === 'mac' ? '⌘' : 'Ctrl+') + 'F',
        []
    );

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
                        {t('canvas_filter.title', 'Filter Tables')}{' '}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                        ({openFilterShortcut})
                    </span>
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
                    disableCache={true}
                />
            </ScrollArea>
        </div>
    );
};
