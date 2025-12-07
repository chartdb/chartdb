import React, {
    type ReactNode,
    useCallback,
    useState,
    useEffect,
    useRef,
} from 'react';
import type { CanvasContext, CanvasEvent } from './canvas-context';
import { canvasContext } from './canvas-context';
import { useChartDB } from '@/hooks/use-chartdb';
import { adjustTablePositions } from '@/lib/domain/db-table';
import { useReactFlow } from '@xyflow/react';
import { findOverlappingTables } from '@/pages/editor-page/canvas/canvas-utils';
import type { Graph } from '@/lib/graph';
import { createGraph } from '@/lib/graph';
import { useDiagramFilter } from '../diagram-filter-context/use-diagram-filter';
import { filterTable } from '@/lib/domain/diagram-filter/filter';
import { defaultSchemas } from '@/lib/data/default-schemas';
import {
    CREATE_RELATIONSHIP_NODE_ID,
    type CreateRelationshipNodeType,
} from '@/pages/editor-page/canvas/create-relationship-node/create-relationship-node';
import { useEventEmitter } from 'ahooks';
import { useLocalConfig } from '@/hooks/use-local-config';

interface CanvasProviderProps {
    children: ReactNode;
}

export const CanvasProvider = ({ children }: CanvasProviderProps) => {
    const {
        tables,
        relationships,
        updateTablesState,
        databaseType,
        areas,
        diagramId,
    } = useChartDB();
    const { filter, loading: filterLoading } = useDiagramFilter();
    const { showDBViews } = useLocalConfig();
    const { fitView, screenToFlowPosition, setNodes } = useReactFlow();
    const [overlapGraph, setOverlapGraph] =
        useState<Graph<string>>(createGraph());
    const [editTableModeTable, setEditTableModeTable] = useState<{
        tableId: string;
        fieldId?: string;
    } | null>(null);

    const [editRelationshipPopover, setEditRelationshipPopover] = useState<{
        relationshipId: string;
        position: { x: number; y: number };
    } | null>(null);

    const events = useEventEmitter<CanvasEvent>();

    const [showFilter, setShowFilter] = useState(false);

    const [tempFloatingEdge, setTempFloatingEdge] =
        useState<CanvasContext['tempFloatingEdge']>(null);

    const [hoveringTableId, setHoveringTableId] = useState<string | null>(null);

    const diagramIdActiveFilterRef = useRef<string>();

    useEffect(() => {
        if (filterLoading) {
            return;
        }

        if (diagramIdActiveFilterRef.current === diagramId) {
            return;
        }

        diagramIdActiveFilterRef.current = diagramId;

        setShowFilter(true);
    }, [filterLoading, diagramId]);

    const reorderTables = useCallback(
        (
            options: { updateHistory?: boolean } = {
                updateHistory: true,
            }
        ) => {
            const newTables = adjustTablePositions({
                relationships,
                tables: tables.filter(
                    (table) =>
                        filterTable({
                            table: {
                                id: table.id,
                                schema: table.schema,
                            },
                            filter,
                            options: {
                                defaultSchema: defaultSchemas[databaseType],
                            },
                        }) && (showDBViews ? true : !table.isView)
                ),
                areas,
                mode: 'all',
            });

            const updatedOverlapGraph = findOverlappingTables({
                tables: newTables,
            });

            updateTablesState(
                (currentTables) =>
                    currentTables.map((table) => {
                        const newTable = newTables.find(
                            (t) => t.id === table.id
                        );
                        return {
                            id: table.id,
                            x: newTable?.x ?? table.x,
                            y: newTable?.y ?? table.y,
                        };
                    }),
                {
                    updateHistory: options.updateHistory ?? true,
                    forceOverride: false,
                }
            );

            setOverlapGraph(updatedOverlapGraph);

            setTimeout(() => {
                fitView({
                    duration: 500,
                    padding: 0.2,
                    maxZoom: 0.8,
                });
            }, 500);
        },
        [
            filter,
            relationships,
            tables,
            updateTablesState,
            fitView,
            databaseType,
            areas,
            showDBViews,
        ]
    );

    const startFloatingEdgeCreation: CanvasContext['startFloatingEdgeCreation'] =
        useCallback(({ sourceNodeId }) => {
            setShowFilter(false);
            setTempFloatingEdge({
                sourceNodeId,
            });
        }, []);

    const endFloatingEdgeCreation: CanvasContext['endFloatingEdgeCreation'] =
        useCallback(() => {
            setTempFloatingEdge(null);
        }, []);

    const hideCreateRelationshipNode: CanvasContext['hideCreateRelationshipNode'] =
        useCallback(() => {
            setNodes((nds) =>
                nds.filter((n) => n.id !== CREATE_RELATIONSHIP_NODE_ID)
            );
            endFloatingEdgeCreation();
        }, [setNodes, endFloatingEdgeCreation]);

    const openRelationshipPopover: CanvasContext['openRelationshipPopover'] =
        useCallback(({ relationshipId, position }) => {
            setEditRelationshipPopover({ relationshipId, position });
        }, []);

    const closeRelationshipPopover: CanvasContext['closeRelationshipPopover'] =
        useCallback(() => {
            setEditRelationshipPopover(null);
        }, []);

    const showCreateRelationshipNode: CanvasContext['showCreateRelationshipNode'] =
        useCallback(
            ({ sourceTableId, targetTableId, x, y }) => {
                setTempFloatingEdge((edge) =>
                    edge
                        ? {
                              ...edge,
                              targetNodeId: targetTableId,
                          }
                        : null
                );
                const cursorPos = screenToFlowPosition({
                    x,
                    y,
                });

                const newNode: CreateRelationshipNodeType = {
                    id: CREATE_RELATIONSHIP_NODE_ID,
                    type: 'create-relationship',
                    position: cursorPos,
                    data: {
                        sourceTableId,
                        targetTableId,
                    },
                    draggable: true,
                    selectable: false,
                    zIndex: 1000,
                };

                setNodes((nds) => {
                    const nodesWithoutOldCreateRelationshipNode = nds.filter(
                        (n) => n.id !== CREATE_RELATIONSHIP_NODE_ID
                    );
                    return [...nodesWithoutOldCreateRelationshipNode, newNode];
                });
            },
            [screenToFlowPosition, setNodes]
        );

    return (
        <canvasContext.Provider
            value={{
                reorderTables,
                fitView,
                setOverlapGraph,
                overlapGraph,
                setShowFilter,
                showFilter,
                editTableModeTable,
                setEditTableModeTable,
                openRelationshipPopover,
                closeRelationshipPopover,
                editRelationshipPopover,
                tempFloatingEdge: tempFloatingEdge,
                setTempFloatingEdge: setTempFloatingEdge,
                startFloatingEdgeCreation: startFloatingEdgeCreation,
                endFloatingEdgeCreation: endFloatingEdgeCreation,
                hoveringTableId,
                setHoveringTableId,
                showCreateRelationshipNode,
                hideCreateRelationshipNode,
                events,
            }}
        >
            {children}
        </canvasContext.Provider>
    );
};
