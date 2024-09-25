import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    },
    width: table.width ?? MIN_TABLE_SIZE,
    hidden: !shouldShowTablesBySchemaFilter(table, filteredSchemas),
});

export interface CanvasProps {
    initialTables: DBTable[];
}

export const Canvas: React.FC<CanvasProps> = ({ initialTables }) => {
    const { getEdge, getInternalNode, fitView, getEdges } = useReactFlow();
    const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
    const [selectedRelationshipIds, setSelectedRelationshipIds] = useState<
        string[]
    >([]);
    const { filteredSchemas } = useChartDB();
    const { toast } = useToast();
    const { t } = useTranslation();
    const {
        tables,
        relationships,
        createRelationship,
        updateTablesState,
        removeRelationships,
        getField,
    } = useChartDB();
    const { showSidePanel } = useLayout();
    const { effectiveTheme } = useTheme();
    const { scrollAction } = useLocalConfig();
    const { showAlert } = useDialog();
    const { isMd: isDesktop } = useBreakpoint('md');
    const nodeTypes = useMemo(() => ({ table: TableNode }), []);
    const edgeTypes = useMemo(() => ({ 'table-edge': TableEdge }), []);
    const [isInitialLoadingNodes, setIsInitialLoadingNodes] = useState(true);
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
            tables.map((table) => tableToTableNode(table, filteredSchemas))
        );
    }, [tables, setNodes, filteredSchemas]);

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

            if (sourceField.type.id !== targetField.type.id) {
                toast({
                    title: 'Field types do not match',
                    variant: 'destructive',
                    description:
                        'Relationships can only be created between fields of the same type',
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
        [createRelationship, getField, toast]
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

    const onNodesChangeHandler: OnNodesChange<TableNodeType> = useCallback(
        (changes) => {
            changes.forEach((change) => {
                if (
                    change.type === 'dimensions' &&
                    'dimensions' in change &&
                    change.dimensions
                ) {
                    setNodes((nds) =>
                        nds.map((node) =>
                            node.id === change.id
                                ? {
                                      ...node,
                                      width: change.dimensions.width,
                                      height: change.dimensions.height,
                                  }
                                : node
                        )
                    );
                }
            });

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

            changes.forEach((change) => {
                if (
                    change.type === 'dimensions' &&
                    'dimensions' in change &&
                    change.dimensions
                ) {
                    setNodes((nds) =>
                        nds.map((node) =>
                            node.id === change.id
                                ? { ...node, ...change.dimensions }
                                : node
                        )
                    );
                }
            });

            return onNodesChange(changes);
        },
        [onNodesChange, updateTablesState, setNodes]
    );

    const isLoadingDOM =
        tables.length > 0 ? !getInternalNode(tables[0].id) : false;

    const reorderTables = useCallback(() => {
        const newTables = adjustTablePositions({
            relationships,
            tables: tables.filter((table) =>
                shouldShowTablesBySchemaFilter(table, filteredSchemas)
            ),
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
