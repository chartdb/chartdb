import React, {
    useMemo,
    useState,
    useCallback,
    useEffect,
    useRef,
} from 'react';
import { X, Search, Eye, EyeOff, Database, Table, Funnel } from 'lucide-react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { shouldShowTableSchemaBySchemaFilter } from '@/lib/domain/db-table';
import { schemaNameToSchemaId } from '@/lib/domain/db-schema';
import { defaultSchemas } from '@/lib/data/default-schemas';
import { useReactFlow } from '@xyflow/react';
import { TreeView } from '@/components/tree-view/tree-view';
import type { TreeNode } from '@/components/tree-view/tree';
import { ScrollArea } from '@/components/scroll-area/scroll-area';

export interface CanvasFilterProps {
    onClose: () => void;
}

type NodeType = 'schema' | 'table';

type SchemaContext = { name: string };
type TableContext = {
    tableSchema?: string | null;
    hidden: boolean;
};

type NodeContext = {
    schema: SchemaContext;
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
        filteredSchemas,
        filterSchemas,
    } = useChartDB();
    const { fitView, setNodes } = useReactFlow();
    const [searchQuery, setSearchQuery] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

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
            const schemaId = schemaNameToSchemaId(schemaName);
            const schemaHidden = filteredSchemas
                ? !filteredSchemas.includes(schemaId)
                : false;
            const schemaNode: TreeNode<NodeType, NodeContext> = {
                id: `schema-${schemaName}`,
                name: `${schemaName} (${schemaTables.length})`,
                type: 'schema',
                isFolder: true,
                icon: Database,
                context: { name: schemaName },
                className: schemaHidden ? 'opacity-50' : '',
                children: schemaTables.map(
                    (table): TreeNode<NodeType, NodeContext> => {
                        const tableHidden =
                            hiddenTableIds?.includes(table.id) ?? false;
                        const visibleBySchema =
                            shouldShowTableSchemaBySchemaFilter({
                                tableSchema: table.schema,
                                filteredSchemas,
                            });
                        const hidden = tableHidden || !visibleBySchema;

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
                            className: hidden ? 'opacity-50' : '',
                        };
                    }
                ),
            };
            nodes.push(schemaNode);
        });

        return nodes;
    }, [relevantTableData, databaseType, hiddenTableIds, filteredSchemas]);

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
    const renderActions = useCallback(
        (node: TreeNode<NodeType, NodeContext>) => {
            if (node.type === 'schema') {
                const schemaContext = node.context as SchemaContext;
                const schemaId = schemaNameToSchemaId(schemaContext.name);
                const schemaHidden = filteredSchemas
                    ? !filteredSchemas.includes(schemaId)
                    : false;

                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 h-fit p-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            // unhide all tables in this schema
                            node.children?.forEach((child) => {
                                if (
                                    child.type === 'table' &&
                                    hiddenTableIds?.includes(child.id)
                                ) {
                                    removeHiddenTableId(child.id);
                                }
                            });
                            if (schemaHidden) {
                                filterSchemas([
                                    ...(filteredSchemas ?? []),
                                    schemaId,
                                ]);
                            } else {
                                filterSchemas(
                                    filteredSchemas?.filter(
                                        (s) => s !== schemaId
                                    ) ?? []
                                );
                            }
                        }}
                    >
                        {schemaHidden ? (
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
                const hidden = tableContext.hidden;
                const tableSchema = tableContext.tableSchema;

                const visibleBySchema = shouldShowTableSchemaBySchemaFilter({
                    tableSchema,
                    filteredSchemas,
                });

                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 h-fit p-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!visibleBySchema && tableSchema) {
                                // Unhide schema and hide all other tables
                                const schemaId =
                                    schemaNameToSchemaId(tableSchema);
                                filterSchemas([
                                    ...(filteredSchemas ?? []),
                                    schemaId,
                                ]);
                                const schemaNode = treeData.find(
                                    (s) =>
                                        (s.context as SchemaContext).name ===
                                        tableSchema
                                );
                                if (schemaNode) {
                                    schemaNode.children?.forEach((child) => {
                                        if (
                                            child.id !== tableId &&
                                            !hiddenTableIds?.includes(child.id)
                                        ) {
                                            addHiddenTableId(child.id);
                                        }
                                    });
                                }
                            } else {
                                toggleTableVisibility(tableId, !hidden);
                            }
                        }}
                    >
                        {hidden || !visibleBySchema ? (
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
            filterSchemas,
            treeData,
            hiddenTableIds,
            addHiddenTableId,
            removeHiddenTableId,
        ]
    );

    // Handle node click
    const handleNodeClick = useCallback(
        (node: TreeNode<NodeType, NodeContext>) => {
            if (node.type === 'table') {
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
            </div>

            {/* Table Tree */}
            <ScrollArea className="flex-1 rounded-b-lg" type="auto">
                <TreeView
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
