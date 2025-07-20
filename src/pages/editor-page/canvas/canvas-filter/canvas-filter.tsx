import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { X, Search, Eye, EyeOff, Database, Table, Funnel } from 'lucide-react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import type { DBTable } from '@/lib/domain/db-table';
import { defaultSchemas } from '@/lib/data/default-schemas';
import { useReactFlow } from '@xyflow/react';
import { TreeView } from '@/components/tree-view/tree-view';
import type { TreeNode } from '@/components/tree-view/tree';

export interface CanvasFilterProps {
    onClose: () => void;
}

type NodeType = 'schema' | 'table';

type SchemaContext = { name: string };
type TableContext = { table: DBTable; hidden: boolean };

type NodeContext = {
    schema: SchemaContext;
    table: TableContext;
};

export const CanvasFilter: React.FC<CanvasFilterProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const {
        tables,
        databaseType,
        hiddenTableIds,
        addHiddenTableId,
        removeHiddenTableId,
    } = useChartDB();
    const { fitView, setNodes } = useReactFlow();
    const [searchQuery, setSearchQuery] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [isVisible, setIsVisible] = useState(false);

    // Extract only the properties needed for tree data
    const relevantTableData = useMemo(
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
        // Group tables by schema
        const tablesBySchema = new Map<
            string,
            (typeof relevantTableData)[0][]
        >();

        relevantTableData.forEach((table) => {
            const schema =
                table.schema || defaultSchemas[databaseType] || 'default';
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
            const schemaNode: TreeNode<NodeType, NodeContext> = {
                id: `schema-${schemaName}`,
                name: `${schemaName} (${schemaTables.length})`,
                type: 'schema',
                isFolder: true,
                icon: Database,
                context: { name: schemaName },
                children: schemaTables.map(
                    (table): TreeNode<NodeType, NodeContext> => {
                        const hidden =
                            hiddenTableIds?.includes(table.id) ?? false;
                        // Find the full table object when needed
                        const fullTable = tables.find(
                            (t) => t.id === table.id
                        )!;

                        return {
                            id: table.id,
                            name: table.name,
                            type: 'table',
                            isFolder: false,
                            icon: Table,
                            context: {
                                table: fullTable,
                                hidden,
                            },
                            className: hidden ? 'opacity-50' : '',
                        };
                    }
                ),
            };
            nodes.push(schemaNode);
        });

        return nodes;
    }, [relevantTableData, databaseType, hiddenTableIds, tables]);

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
    const renderAlwaysVisibleActions = useCallback(
        (node: TreeNode<NodeType, NodeContext>) => {
            if (node.type !== 'table') return null;

            const tableId = node.id;
            const tableContext = node.context as TableContext;
            const hidden = tableContext.hidden;

            return (
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleTableVisibility(tableId, !hidden);
                    }}
                >
                    {hidden ? (
                        <EyeOff className="size-3.5 text-muted-foreground" />
                    ) : (
                        <Eye className="size-3.5" />
                    )}
                </Button>
            );
        },
        [toggleTableVisibility]
    );

    // Handle node click
    const handleNodeClick = useCallback(
        (node: TreeNode<NodeType, NodeContext>) => {
            if (node.type === 'table') {
                const tableContext = node.context as TableContext;
                if (!tableContext.hidden) {
                    focusOnTable(node.id);
                }
            }
        },
        [focusOnTable]
    );

    // Animate in on mount
    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div
            className={`absolute right-2 top-2 z-10 flex flex-col rounded-lg border bg-background/85 shadow-lg backdrop-blur-sm transition-all duration-300 md:right-4 md:top-4 ${
                isVisible
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

            {/* Table Tree */}
            <div className="flex-1 overflow-y-auto rounded-b-lg">
                <TreeView
                    data={filteredTreeData}
                    onNodeClick={handleNodeClick}
                    renderActionsComponent={renderAlwaysVisibleActions}
                    defaultFolderIcon={Database}
                    defaultIcon={Table}
                    expanded={expanded}
                    setExpanded={setExpanded}
                    className="py-2"
                />
            </div>
        </div>
    );
};
