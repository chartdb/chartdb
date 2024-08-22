import React, { useCallback, useEffect, useMemo } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TableNode, TableNodeType } from './table-node';
import { TableEdge, TableEdgeType } from './table-edge';
import { useChartDB } from '@/hooks/use-chartdb';
import { LEFT_HANDLE_ID_PREFIX, TARGET_ID_PREFIX } from './table-node-field';
import { Toolbar } from './toolbar/toolbar';

type AddEdgeParams = Parameters<typeof addEdge<TableEdgeType>>[0];

const initialNodes: TableNodeType[] = [];
const initialEdges: TableEdgeType[] = [];

export interface CanvasProps {}

export const Canvas: React.FC<CanvasProps> = () => {
    const { getEdge } = useReactFlow();
    const {
        tables,
        relationships,
        createRelationship,
        updateTablesState,
        removeRelationships,
    } = useChartDB();
    const nodeTypes = useMemo(() => ({ table: TableNode }), []);
    const edgeTypes = useMemo(() => ({ 'table-edge': TableEdge }), []);

    const [nodes, setNodes, onNodesChange] =
        useNodesState<TableNodeType>(initialNodes);
    const [edges, setEdges, onEdgesChange] =
        useEdgesState<TableEdgeType>(initialEdges);

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
        setNodes(
            tables.map((table) => ({
                id: table.id,
                type: 'table',
                position: { x: table.x, y: table.y },
                data: {
                    table,
                },
                width: table.width ?? 224,
            }))
        );
    }, [tables, setNodes]);

    const onConnect = useCallback(
        async (params: AddEdgeParams) => {
            const relationship = await createRelationship({
                sourceTableId: params.source,
                targetTableId: params.target,
                sourceFieldId: params.sourceHandle?.split('_')?.pop() ?? '',
                targetFieldId: params.targetHandle?.split('_')?.pop() ?? '',
            });
            return setEdges((edges) =>
                addEdge<TableEdgeType>(
                    { ...params, data: { relationship }, id: relationship.id },
                    edges
                )
            );
        },
        [setEdges, createRelationship]
    );

    return (
        <div className="flex h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={(changes) => {
                    const positionChanges: NodePositionChange[] =
                        changes.filter(
                            (change) =>
                                change.type === 'position' && !change.dragging
                        ) as NodePositionChange[];
                    const removeChanges: NodeRemoveChange[] = changes.filter(
                        (change) => change.type === 'remove'
                    ) as NodeRemoveChange[];

                    const sizeChanges: NodeDimensionChange[] = changes.filter(
                        (change) =>
                            change.type === 'dimensions' && change.resizing
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
                                        (change) =>
                                            change.id === currentTable.id
                                    );
                                    const sizeChange = sizeChanges.find(
                                        (change) =>
                                            change.id === currentTable.id
                                    );
                                    if (positionChange || sizeChange) {
                                        return {
                                            id: currentTable.id,
                                            ...(positionChange
                                                ? {
                                                      x: positionChange.position
                                                          ?.x,
                                                      y: positionChange.position
                                                          ?.y,
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
                }}
                onEdgesChange={(changes) => {
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
                                    (change) =>
                                        change.id === edge.id && change.selected
                                );
                                edge.zIndex = selected ? 1 : 0;
                                edge.animated = selected;
                                return edge;
                            })
                        );
                    }

                    return onEdgesChange(changes);
                }}
                maxZoom={5}
                minZoom={0.1}
                onConnect={onConnect}
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
            >
                <Controls
                    position="bottom-center"
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
                        width: 100,
                        height: 100,
                    }}
                />
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={16}
                    size={1}
                    bgColor="#ffffff"
                />
            </ReactFlow>
        </div>
    );
};
