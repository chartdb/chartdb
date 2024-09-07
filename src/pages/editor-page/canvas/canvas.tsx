import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ReactFlow,
    useEdgesState,
    useNodesState,
    addEdge,
    Background,
    BackgroundVariant,
    MiniMap,
    Controls,
    NodePositionChange,
    NodeRemoveChange,
    useReactFlow,
    NodeDimensionChange,
    OnEdgesChange,
    OnNodesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import equal from 'fast-deep-equal';
import { MIN_TABLE_SIZE, TableNode, TableNodeType } from './table-node';
import { TableEdge, TableEdgeType } from './table-edge';
import { useChartDB } from '@/hooks/use-chartdb';
import { LEFT_HANDLE_ID_PREFIX, TARGET_ID_PREFIX } from './table-node-field';
import { Toolbar } from './toolbar/toolbar';
import { useToast } from '@/components/toast/use-toast';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/button/button';
import { useLayout } from '@/hooks/use-layout';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Badge } from '@/components/badge/badge';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';
import { DBTable } from '@/lib/domain/db-table';
import { useScrollAction } from '@/hooks/use-scroll-action';

type AddEdgeParams = Parameters<typeof addEdge<TableEdgeType>>[0];

const initialEdges: TableEdgeType[] = [];

const tableToTableNode = (table: DBTable): TableNodeType => ({
    id: table.id,
    type: 'table',
    position: { x: table.x, y: table.y },
    data: {
        table,
    },
    width: table.width ?? MIN_TABLE_SIZE,
});

export interface CanvasProps {
    initialTables: DBTable[];
}

export const Canvas: React.FC<CanvasProps> = ({ initialTables }) => {
    const { getEdge, getInternalNode, fitView } = useReactFlow();
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
    const { scrollAction } = useScrollAction();
    const { isMd: isDesktop } = useBreakpoint('md');
    const nodeTypes = useMemo(() => ({ table: TableNode }), []);
    const edgeTypes = useMemo(() => ({ 'table-edge': TableEdge }), []);
    const [isInitialLoadingNodes, setIsInitialLoadingNodes] = useState(true);

    const [nodes, setNodes, onNodesChange] = useNodesState<TableNodeType>(
        initialTables.map(tableToTableNode)
    );
    const [edges, setEdges, onEdgesChange] =
        useEdgesState<TableEdgeType>(initialEdges);

    useEffect(() => {
        setIsInitialLoadingNodes(true);
    }, [initialTables]);

    useEffect(() => {
        const initialNodes = initialTables.map(tableToTableNode);
        if (equal(initialNodes, nodes)) {
            setIsInitialLoadingNodes(false);
        }
    }, [initialTables, nodes]);

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
        setNodes(tables.map(tableToTableNode));
    }, [tables, setNodes]);

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

            const relationship = await createRelationship({
                sourceTableId,
                targetTableId,
                sourceFieldId,
                targetFieldId,
            });
            return setEdges((edges) =>
                addEdge<TableEdgeType>(
                    { ...params, data: { relationship }, id: relationship.id },
                    edges
                )
            );
        },
        [setEdges, createRelationship, getField, toast]
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

            const selectionChanges = changes.filter(
                (change) => change.type === 'select'
            );

            if (selectionChanges.length > 0) {
                setEdges((edges) =>
                    edges.map((edge) => {
                        const selected = selectionChanges.some(
                            (change) => change.id === edge.id && change.selected
                        );
                        edge.zIndex = selected ? 1 : 0;
                        edge.animated = selected;
                        return edge;
                    })
                );
            }

            return onEdgesChange(changes);
        },
        [getEdge, onEdgesChange, removeRelationships, setEdges]
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

            return onNodesChange(changes);
        },
        [onNodesChange, updateTablesState]
    );

    const isLoadingDOM =
        tables.length > 0 ? !getInternalNode(tables[0].id) : false;

    return (
        <div className="flex h-full">
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
        </div>
    );
};
