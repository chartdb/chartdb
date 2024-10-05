import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type {
    addEdge,
    NodePositionChange,
    NodeRemoveChange,
    NodeDimensionChange,
    OnEdgesChange,
    OnNodesChange,
} from '@xyflow/react';
import {
    ReactFlow,
    useEdgesState,
    useNodesState,
    Background,
    BackgroundVariant,
    MiniMap,
    Controls,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import equal from 'fast-deep-equal';
import type { TableNodeType } from './table-node/table-node';
import { MIN_TABLE_SIZE, TableNode } from './table-node/table-node';
import type { TableEdgeType } from './table-edge';
import { TableEdge } from './table-edge';
import { useChartDB } from '@/hooks/use-chartdb';
import {
    LEFT_HANDLE_ID_PREFIX,
    TARGET_ID_PREFIX,
} from './table-node/table-node-field';
import { Toolbar } from './toolbar/toolbar';
import { useToast } from '@/components/toast/use-toast';
import { Pencil, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/button/button';
import { useLayout } from '@/hooks/use-layout';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Badge } from '@/components/badge/badge';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';
import type { DBTable } from '@/lib/domain/db-table';
import {
    adjustTablePositions,
    shouldShowTablesBySchemaFilter,
} from '@/lib/domain/db-table';
import { useLocalConfig } from '@/hooks/use-local-config';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/tooltip/tooltip';
import { useDialog } from '@/hooks/use-dialog';
import { MarkerDefinitions } from './marker-definitions';
import { CanvasContextMenu } from './canvas-context-menu';
import { areFieldTypesCompatible } from '@/lib/data/data-types';
import {
    calcTableHeight,
    findOverlappingTables,
    findTableOverlapping,
} from './canvas-utils';
import type { Graph } from '@/lib/graph';
import { createGraph, removeVertex } from '@/lib/graph';
import type { ChartDBEvent } from '@/context/chartdb-context/chartdb-context';
import { debounce } from '@/lib/utils';

type AddEdgeParams = Parameters<typeof addEdge<TableEdgeType>>[0];

const initialEdges: TableEdgeType[] = [];

const tableToTableNode = (
    table: DBTable,
    filteredSchemas?: string[]
): TableNodeType => ({
    id: table.id,
    type: 'table',
    position: { x: table.x, y: table.y },
    data: {
        table,
        isOverlapping: false,
    },
    width: table.width ?? MIN_TABLE_SIZE,
    hidden: !shouldShowTablesBySchemaFilter(table, filteredSchemas),
});

export interface CanvasProps {
    initialTables: DBTable[];
}

export const Canvas: React.FC<CanvasProps> = ({ initialTables }) => {
    const { getEdge, getInternalNode, fitView, getEdges, getNode } =
        useReactFlow();
    const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
    const [selectedRelationshipIds, setSelectedRelationshipIds] = useState<
        string[]
    >([]);
    const { filteredSchemas, events } = useChartDB();
    const { toast } = useToast();
    const { t } = useTranslation();
    const {
        tables,
        relationships,
        createRelationship,
        updateTablesState,
        removeRelationships,
        getField,
        databaseType,
        diagramId,
    } = useChartDB();
    const { showSidePanel } = useLayout();
    const { effectiveTheme } = useTheme();
    const { scrollAction } = useLocalConfig();
    const { showAlert } = useDialog();
    const { isMd: isDesktop } = useBreakpoint('md');
    const nodeTypes = useMemo(() => ({ table: TableNode }), []);
    const edgeTypes = useMemo(() => ({ 'table-edge': TableEdge }), []);
    const [isInitialLoadingNodes, setIsInitialLoadingNodes] = useState(true);
    const [overlapGraph, setOverlapGraph] =
        useState<Graph<string>>(createGraph());

    const [nodes, setNodes, onNodesChange] = useNodesState<TableNodeType>(
        initialTables.map((table) => tableToTableNode(table, filteredSchemas))
    );
    const [edges, setEdges, onEdgesChange] =
        useEdgesState<TableEdgeType>(initialEdges);

    useEffect(() => {
        setIsInitialLoadingNodes(true);
    }, [initialTables]);

    useEffect(() => {
        const initialNodes = initialTables.map((table) =>
            tableToTableNode(table, filteredSchemas)
        );
        if (equal(initialNodes, nodes)) {
            setIsInitialLoadingNodes(false);
        }
    }, [initialTables, nodes, filteredSchemas]);

    useEffect(() => {
        if (!isInitialLoadingNodes) {
            setTimeout(() => fitView({ maxZoom: 1, duration: 0 }), 0);
        }
    }, [isInitialLoadingNodes, fitView]);

    useEffect(() => {
        const targetIndexes: Record<string, number> = relationships.reduce(
            (acc, relationship) => {
                acc[
                    `${relationship.targetTableId}${relationship.targetFieldId}`
                ] = 0;
                return acc;
            },
            {} as Record<string, number>
        );
        setEdges(
            relationships.map((relationship) => ({
                id: relationship.id,
                source: relationship.sourceTableId,
                target: relationship.targetTableId,
                sourceHandle: `${LEFT_HANDLE_ID_PREFIX}${relationship.sourceFieldId}`,
                targetHandle: `${TARGET_ID_PREFIX}${targetIndexes[`${relationship.targetTableId}${relationship.targetFieldId}`]++}_${relationship.targetFieldId}`,
                type: 'table-edge',
                data: { relationship },
            }))
        );
    }, [relationships, setEdges]);

    useEffect(() => {
        const selectedNodesIds = nodes
            .filter((node) => node.selected)
            .map((node) => node.id);

        if (equal(selectedNodesIds, selectedTableIds)) {
            return;
        }

        setSelectedTableIds(selectedNodesIds);
    }, [nodes, setSelectedTableIds, selectedTableIds]);

    useEffect(() => {
        const selectedEdgesIds = edges
            .filter((edge) => edge.selected)
            .map((edge) => edge.id);

        if (equal(selectedEdgesIds, selectedRelationshipIds)) {
            return;
        }

        setSelectedRelationshipIds(selectedEdgesIds);
    }, [edges, setSelectedRelationshipIds, selectedRelationshipIds]);

    useEffect(() => {
        const tablesSelectedEdges = getEdges()
            .filter(
                (edge) =>
                    selectedTableIds.includes(edge.source) ||
                    selectedTableIds.includes(edge.target)
            )
            .map((edge) => edge.id);

        const allSelectedEdges = [
            ...tablesSelectedEdges,
            ...selectedRelationshipIds,
        ];

        setEdges((edges) =>
            edges.map((edge) => {
                const selected = allSelectedEdges.includes(edge.id);

                return {
                    ...edge,
                    data: {
                        ...edge.data!,
                        highlighted: selected,
                    },
                    animated: selected,
                    zIndex: selected ? 1 : 0,
                };
            })
        );
    }, [selectedRelationshipIds, selectedTableIds, setEdges, getEdges]);

    useEffect(() => {
        setNodes(
            tables.map((table) => {
                const isOverlapping =
                    (overlapGraph.graph.get(table.id) ?? []).length > 0;
                const node = tableToTableNode(table, filteredSchemas);

                return {
                    ...node,
                    data: {
                        ...node.data,
                        isOverlapping,
                    },
                };
            })
        );
    }, [
        tables,
        setNodes,
        filteredSchemas,
        overlapGraph.lastUpdated,
        overlapGraph.graph,
    ]);

    const prevFilteredSchemas = useRef<string[] | undefined>(undefined);
    useEffect(() => {
        if (!equal(filteredSchemas, prevFilteredSchemas.current)) {
            debounce(() => {
                const overlappingTablesInDiagram = findOverlappingTables({
                    tables: tables.filter((table) =>
                        shouldShowTablesBySchemaFilter(table, filteredSchemas)
                    ),
                });
                setOverlapGraph(overlappingTablesInDiagram);
                fitView({
                    duration: 500,
                    padding: 0.1,
                    maxZoom: 0.8,
                });
            }, 500)();
            prevFilteredSchemas.current = filteredSchemas;
        }
    }, [filteredSchemas, fitView, tables]);

    const onConnectHandler = useCallback(
        async (params: AddEdgeParams) => {
            const sourceTableId = params.source;
            const targetTableId = params.target;
            const sourceFieldId = params.sourceHandle?.split('_')?.pop() ?? '';
            const targetFieldId = params.targetHandle?.split('_')?.pop() ?? '';
            const sourceField = getField(sourceTableId, sourceFieldId);
            const targetField = getField(targetTableId, targetFieldId);

            if (!sourceField || !targetField) {
                return;
            }

            if (
                !areFieldTypesCompatible(
                    sourceField.type,
                    targetField.type,
                    databaseType
                )
            ) {
                toast({
                    title: 'Field types are not compatible',
                    variant: 'destructive',
                    description:
                        'Relationships can only be created between compatible field types',
                });
                return;
            }

            createRelationship({
                sourceTableId,
                targetTableId,
                sourceFieldId,
                targetFieldId,
            });
            // return setEdges((edges) =>
            //     addEdge<TableEdgeType>(
            //         { ...params, data: { relationship }, id: relationship.id },
            //         edges
            //     )
            // );
        },
        [createRelationship, getField, toast, databaseType]
    );

    const onEdgesChangeHandler: OnEdgesChange<TableEdgeType> = useCallback(
        (changes) => {
            const removeChanges: NodeRemoveChange[] = changes.filter(
                (change) => change.type === 'remove'
            ) as NodeRemoveChange[];

            const relationshipsToRemove: string[] = removeChanges
                .map(
                    (change) =>
                        (getEdge(change.id) as TableEdgeType)?.data
                            ?.relationship?.id
                )
                .filter((id) => !!id) as string[];

            if (relationshipsToRemove.length > 0) {
                removeRelationships(relationshipsToRemove);
            }

            return onEdgesChange(changes);
        },
        [getEdge, onEdgesChange, removeRelationships]
    );

    const updateOverlappingGraphOnChanges = useCallback(
        ({
            positionChanges,
            sizeChanges,
        }: {
            positionChanges: NodePositionChange[];
            sizeChanges: NodeDimensionChange[];
        }) => {
            if (positionChanges.length > 0 || sizeChanges.length > 0) {
                let newOverlappingGraph: Graph<string> = overlapGraph;

                for (const change of positionChanges) {
                    newOverlappingGraph = findTableOverlapping(
                        { node: getNode(change.id) as TableNodeType },
                        { nodes },
                        newOverlappingGraph
                    );
                }

                for (const change of sizeChanges) {
                    newOverlappingGraph = findTableOverlapping(
                        { node: getNode(change.id) as TableNodeType },
                        { nodes },
                        newOverlappingGraph
                    );
                }

                setOverlapGraph(newOverlappingGraph);
            }
        },
        [nodes, overlapGraph, setOverlapGraph, getNode]
    );

    const updateOverlappingGraphOnChangesDebounced = debounce(
        updateOverlappingGraphOnChanges,
        200
    );

    const onNodesChangeHandler: OnNodesChange<TableNodeType> = useCallback(
        (changes) => {
            const positionChanges: NodePositionChange[] = changes.filter(
                (change) => change.type === 'position' && !change.dragging
            ) as NodePositionChange[];

            const removeChanges: NodeRemoveChange[] = changes.filter(
                (change) => change.type === 'remove'
            ) as NodeRemoveChange[];

            const sizeChanges: NodeDimensionChange[] = changes.filter(
                (change) => change.type === 'dimensions' && change.resizing
            ) as NodeDimensionChange[];

            if (
                positionChanges.length > 0 ||
                removeChanges.length > 0 ||
                sizeChanges.length > 0
            ) {
                updateTablesState((currentTables) =>
                    currentTables
                        .map((currentTable) => {
                            const positionChange = positionChanges.find(
                                (change) => change.id === currentTable.id
                            );
                            const sizeChange = sizeChanges.find(
                                (change) => change.id === currentTable.id
                            );
                            if (positionChange || sizeChange) {
                                return {
                                    id: currentTable.id,
                                    ...(positionChange
                                        ? {
                                              x: positionChange.position?.x,
                                              y: positionChange.position?.y,
                                          }
                                        : {}),
                                    ...(sizeChange
                                        ? {
                                              width:
                                                  sizeChange.dimensions
                                                      ?.width ??
                                                  currentTable.width,
                                          }
                                        : {}),
                                };
                            }
                            return currentTable;
                        })
                        .filter(
                            (table) =>
                                !removeChanges.some(
                                    (change) => change.id === table.id
                                )
                        )
                );
            }

            updateOverlappingGraphOnChangesDebounced({
                positionChanges,
                sizeChanges,
            });

            return onNodesChange(changes);
        },
        [
            onNodesChange,
            updateTablesState,
            updateOverlappingGraphOnChangesDebounced,
        ]
    );

    const lastDiagramId = useRef<string>('');

    useEffect(() => {
        if (
            lastDiagramId.current === diagramId ||
            nodes.length !== tables.length ||
            nodes.length === 0
        ) {
            return;
        }

        const nodesWithDimensions = nodes
            .map((node) => ({
                ...node,
                measured: {
                    width:
                        node.measured?.width ??
                        node.data.table.width ??
                        MIN_TABLE_SIZE,
                    height:
                        node.measured?.height ??
                        calcTableHeight(node.data.table.fields.length),
                },
            }))
            .filter((node) => node.hidden === false);

        lastDiagramId.current = diagramId;
        const overlappingTablesInDiagram = findOverlappingTables({
            nodes: nodesWithDimensions,
        });
        setOverlapGraph(overlappingTablesInDiagram);
    }, [diagramId, nodes, tables.length, setOverlapGraph]);

    const eventConsumer = useCallback(
        (event: ChartDBEvent) => {
            let newOverlappingGraph: Graph<string> = overlapGraph;
            if (event.action === 'add_tables') {
                for (const table of event.data.tables) {
                    newOverlappingGraph = findTableOverlapping(
                        { node: getNode(table.id) as TableNodeType },
                        { nodes },
                        overlapGraph
                    );
                }

                setOverlapGraph(newOverlappingGraph);
            } else if (event.action === 'remove_tables') {
                for (const tableId of event.data.tableIds) {
                    newOverlappingGraph = removeVertex(
                        newOverlappingGraph,
                        tableId
                    );
                }

                setOverlapGraph(newOverlappingGraph);
            } else if (
                event.action === 'update_table' &&
                event.data.table.width
            ) {
                const node = getNode(event.data.id) as TableNodeType;

                const measured = {
                    ...node.measured,
                    width: event.data.table.width,
                };

                newOverlappingGraph = findTableOverlapping(
                    {
                        node: {
                            ...node,
                            measured,
                        },
                    },
                    { nodes },
                    overlapGraph
                );
                setOverlapGraph(newOverlappingGraph);
            } else if (
                event.action === 'add_field' ||
                event.action === 'remove_field'
            ) {
                const node = getNode(event.data.tableId) as TableNodeType;

                const measured = {
                    ...(node.measured ?? {}),
                    height: calcTableHeight(event.data.fields.length),
                };

                newOverlappingGraph = findTableOverlapping(
                    {
                        node: {
                            ...node,
                            measured,
                        },
                    },
                    { nodes },
                    overlapGraph
                );
                setOverlapGraph(newOverlappingGraph);
            }
        },
        [overlapGraph, setOverlapGraph, getNode, nodes]
    );

    events.useSubscription(eventConsumer);

    const isLoadingDOM =
        tables.length > 0 ? !getInternalNode(tables[0].id) : false;

    const reorderTables = useCallback(() => {
        const newTables = adjustTablePositions({
            relationships,
            tables: tables.filter((table) =>
                shouldShowTablesBySchemaFilter(table, filteredSchemas)
            ),
            mode: 'all', // Use 'all' mode for manual reordering
        });

        updateTablesState((currentTables) =>
            currentTables.map((table) => {
                const newTable = newTables.find((t) => t.id === table.id);
                return {
                    id: table.id,
                    x: newTable?.x ?? table.x,
                    y: newTable?.y ?? table.y,
                };
            })
        );
    }, [filteredSchemas, relationships, tables, updateTablesState]);

    const showReorderConfirmation = useCallback(() => {
        showAlert({
            title: t('reorder_diagram_alert.title'),
            description: t('reorder_diagram_alert.description'),
            actionLabel: t('reorder_diagram_alert.reorder'),
            closeLabel: t('reorder_diagram_alert.cancel'),
            onAction: reorderTables,
        });
    }, [t, showAlert, reorderTables]);

    return (
        <CanvasContextMenu>
            <div className="relative flex h-full">
                <ReactFlow
                    colorMode={effectiveTheme}
                    className="canvas-cursor-default nodes-animated"
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChangeHandler}
                    onEdgesChange={onEdgesChangeHandler}
                    maxZoom={5}
                    minZoom={0.1}
                    onConnect={onConnectHandler}
                    proOptions={{
                        hideAttribution: true,
                    }}
                    fitView={false}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    defaultEdgeOptions={{
                        animated: false,
                        type: 'table-edge',
                    }}
                    panOnScroll={scrollAction === 'pan'}
                >
                    <Controls
                        position="top-left"
                        showZoom={false}
                        showFitView={false}
                        showInteractive={false}
                        className="!shadow-none"
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span>
                                    <Button
                                        variant="secondary"
                                        className="size-8 p-1 shadow-none"
                                        onClick={showReorderConfirmation}
                                    >
                                        <LayoutGrid className="size-4" />
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                {t('toolbar.reorder_diagram')}
                            </TooltipContent>
                        </Tooltip>
                    </Controls>
                    {isLoadingDOM ? (
                        <Controls
                            position="top-center"
                            orientation="horizontal"
                            showZoom={false}
                            showFitView={false}
                            showInteractive={false}
                            className="!shadow-none"
                        >
                            <Badge
                                variant="default"
                                className="bg-pink-600 text-white"
                            >
                                {t('loading_diagram')}
                            </Badge>
                        </Controls>
                    ) : null}

                    {!isDesktop ? (
                        <Controls
                            position="bottom-left"
                            orientation="horizontal"
                            showZoom={false}
                            showFitView={false}
                            showInteractive={false}
                            className="!shadow-none"
                        >
                            <Button
                                className="size-11 bg-pink-600 p-2 hover:bg-pink-500"
                                onClick={showSidePanel}
                            >
                                <Pencil />
                            </Button>
                        </Controls>
                    ) : null}
                    <Controls
                        position={isDesktop ? 'bottom-center' : 'top-center'}
                        orientation="horizontal"
                        showZoom={false}
                        showFitView={false}
                        showInteractive={false}
                        className="!shadow-none"
                    >
                        <Toolbar />
                    </Controls>
                    <MiniMap
                        style={{
                            width: isDesktop ? 100 : 60,
                            height: isDesktop ? 100 : 60,
                        }}
                    />
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={16}
                        size={1}
                    />
                </ReactFlow>
                <MarkerDefinitions />
            </div>
        </CanvasContextMenu>
    );
};
