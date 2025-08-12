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
    NodeTypes,
    EdgeTypes,
    NodeChange,
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
    useKeyPress,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import equal from 'fast-deep-equal';
import type { TableNodeType } from './table-node/table-node';
import { TableNode } from './table-node/table-node';
import type { RelationshipEdgeType } from './relationship-edge/relationship-edge';
import { RelationshipEdge } from './relationship-edge/relationship-edge';
import { useChartDB } from '@/hooks/use-chartdb';
import {
    LEFT_HANDLE_ID_PREFIX,
    TARGET_ID_PREFIX,
} from './table-node/table-node-field';
import { Toolbar } from './toolbar/toolbar';
import { useToast } from '@/components/toast/use-toast';
import {
    Pencil,
    LayoutGrid,
    AlertTriangle,
    Magnet,
    Highlighter,
} from 'lucide-react';
import { Button } from '@/components/button/button';
import { useLayout } from '@/hooks/use-layout';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Badge } from '@/components/badge/badge';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';
import type { DBTable } from '@/lib/domain/db-table';
import { MIN_TABLE_SIZE } from '@/lib/domain/db-table';
import { useLocalConfig } from '@/hooks/use-local-config';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/tooltip/tooltip';
import { MarkerDefinitions } from './marker-definitions';
import { CanvasContextMenu } from './canvas-context-menu';
import { areFieldTypesCompatible } from '@/lib/data/data-types/data-types';
import {
    calcTableHeight,
    findOverlappingTables,
    findTableOverlapping,
} from './canvas-utils';
import type { Graph } from '@/lib/graph';
import { removeVertex } from '@/lib/graph';
import type { ChartDBEvent } from '@/context/chartdb-context/chartdb-context';
import { cn, debounce, getOperatingSystem } from '@/lib/utils';
import type { DependencyEdgeType } from './dependency-edge/dependency-edge';
import { DependencyEdge } from './dependency-edge/dependency-edge';
import {
    BOTTOM_SOURCE_HANDLE_ID_PREFIX,
    TARGET_DEP_PREFIX,
    TOP_SOURCE_HANDLE_ID_PREFIX,
} from './table-node/table-node-dependency-indicator';
import { DatabaseType } from '@/lib/domain/database-type';
import { useAlert } from '@/context/alert-context/alert-context';
import { useCanvas } from '@/hooks/use-canvas';
import type { AreaNodeType } from './area-node/area-node';
import { AreaNode } from './area-node/area-node';
import type { Area } from '@/lib/domain/area';
import { updateTablesParentAreas, getTablesInArea } from './area-utils';
import { CanvasFilter } from './canvas-filter/canvas-filter';
import { useHotkeys } from 'react-hotkeys-hook';
import { ShowAllButton } from './show-all-button';
import { useIsLostInCanvas } from './hooks/use-is-lost-in-canvas';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';
import { useDiagramFilter } from '@/context/diagram-filter-context/use-diagram-filter';
import { filterTable } from '@/lib/domain/diagram-filter/filter';
import { defaultSchemas } from '@/lib/data/default-schemas';

const HIGHLIGHTED_EDGE_Z_INDEX = 1;
const DEFAULT_EDGE_Z_INDEX = 0;

export type EdgeType = RelationshipEdgeType | DependencyEdgeType;

export type NodeType = TableNodeType | AreaNodeType;

type AddEdgeParams = Parameters<typeof addEdge<EdgeType>>[0];

const edgeTypes: EdgeTypes = {
    'relationship-edge': RelationshipEdge,
    'dependency-edge': DependencyEdge,
};

const nodeTypes: NodeTypes = {
    table: TableNode,
    area: AreaNode,
};

const initialEdges: EdgeType[] = [];

const tableToTableNode = (
    table: DBTable,
    {
        filter,
        databaseType,
        filterLoading,
    }: {
        filter?: DiagramFilter;
        databaseType: DatabaseType;
        filterLoading: boolean;
    }
): TableNodeType => {
    // Always use absolute position for now
    const position = { x: table.x, y: table.y };

    return {
        id: table.id,
        type: 'table',
        position,
        data: {
            table,
            isOverlapping: false,
        },
        width: table.width ?? MIN_TABLE_SIZE,
        hidden:
            !filterTable({
                table: { id: table.id, schema: table.schema },
                filter,
                options: { defaultSchema: defaultSchemas[databaseType] },
            }) || filterLoading,
    };
};

const areaToAreaNode = (
    area: Area,
    {
        tables,
        filter,
        databaseType,
        filterLoading,
    }: {
        tables: DBTable[];
        filter?: DiagramFilter;
        databaseType: DatabaseType;
        filterLoading: boolean;
    }
): AreaNodeType => {
    // Get all tables in this area
    const tablesInArea = tables.filter((t) => t.parentAreaId === area.id);

    // Check if at least one table in the area is visible
    const hasVisibleTable =
        tablesInArea.length === 0 ||
        tablesInArea.some((table) =>
            filterTable({
                table: { id: table.id, schema: table.schema },
                filter,
                options: {
                    defaultSchema: defaultSchemas[databaseType],
                },
            })
        );

    return {
        id: area.id,
        type: 'area',
        position: { x: area.x, y: area.y },
        data: { area },
        width: area.width,
        height: area.height,
        zIndex: -10,
        hidden: !hasVisibleTable || filterLoading,
    };
};

export interface CanvasProps {
    initialTables: DBTable[];
}

export const Canvas: React.FC<CanvasProps> = ({ initialTables }) => {
    const { getEdge, getInternalNode, getNode } = useReactFlow();
    const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
    const [selectedRelationshipIds, setSelectedRelationshipIds] = useState<
        string[]
    >([]);
    const { toast } = useToast();
    const { t } = useTranslation();
    const { isLostInCanvas } = useIsLostInCanvas();
    const {
        tables,
        areas,
        relationships,
        createRelationship,
        createDependency,
        updateTablesState,
        removeRelationships,
        removeDependencies,
        getField,
        databaseType,
        events,
        dependencies,
        readonly,
        removeArea,
        updateArea,
        highlightedCustomType,
        highlightCustomTypeId,
    } = useChartDB();
    const { showSidePanel } = useLayout();
    const { effectiveTheme } = useTheme();
    const { scrollAction, showDependenciesOnCanvas, showMiniMapOnCanvas } =
        useLocalConfig();
    const { showAlert } = useAlert();
    const { isMd: isDesktop } = useBreakpoint('md');
    const [highlightOverlappingTables, setHighlightOverlappingTables] =
        useState(false);
    const {
        reorderTables,
        fitView,
        setOverlapGraph,
        overlapGraph,
        showFilter,
        setShowFilter,
    } = useCanvas();
    const { filter, loading: filterLoading } = useDiagramFilter();

    const [isInitialLoadingNodes, setIsInitialLoadingNodes] = useState(true);

    const [nodes, setNodes, onNodesChange] = useNodesState<NodeType>(
        initialTables.map((table) =>
            tableToTableNode(table, { filter, databaseType, filterLoading })
        )
    );
    const [edges, setEdges, onEdgesChange] =
        useEdgesState<EdgeType>(initialEdges);

    const [snapToGridEnabled, setSnapToGridEnabled] = useState(false);

    useEffect(() => {
        setIsInitialLoadingNodes(true);
    }, [initialTables]);

    useEffect(() => {
        const initialNodes = initialTables.map((table) =>
            tableToTableNode(table, { filter, databaseType, filterLoading })
        );
        if (equal(initialNodes, nodes)) {
            setIsInitialLoadingNodes(false);
        }
    }, [initialTables, nodes, filter, databaseType, filterLoading]);

    useEffect(() => {
        if (!isInitialLoadingNodes) {
            debounce(() => {
                fitView({
                    duration: 200,
                    padding: 0.1,
                    maxZoom: 0.8,
                });
            }, 500)();
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

        const targetDepIndexes: Record<string, number> = dependencies.reduce(
            (acc, dep) => {
                acc[dep.tableId] = 0;
                return acc;
            },
            {} as Record<string, number>
        );

        setEdges([
            ...relationships.map(
                (relationship): RelationshipEdgeType => ({
                    id: relationship.id,
                    source: relationship.sourceTableId,
                    target: relationship.targetTableId,
                    sourceHandle: `${LEFT_HANDLE_ID_PREFIX}${relationship.sourceFieldId}`,
                    targetHandle: `${TARGET_ID_PREFIX}${targetIndexes[`${relationship.targetTableId}${relationship.targetFieldId}`]++}_${relationship.targetFieldId}`,
                    type: 'relationship-edge',
                    data: { relationship },
                })
            ),
            ...dependencies.map(
                (dep): DependencyEdgeType => ({
                    id: dep.id,
                    source: dep.dependentTableId,
                    target: dep.tableId,
                    sourceHandle: `${TOP_SOURCE_HANDLE_ID_PREFIX}${dep.dependentTableId}`,
                    targetHandle: `${TARGET_DEP_PREFIX}${targetDepIndexes[dep.tableId]++}_${dep.tableId}`,
                    type: 'dependency-edge',
                    data: { dependency: dep },
                    hidden:
                        !showDependenciesOnCanvas &&
                        databaseType !== DatabaseType.CLICKHOUSE,
                })
            ),
        ]);
    }, [
        relationships,
        dependencies,
        setEdges,
        showDependenciesOnCanvas,
        databaseType,
    ]);

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
        const selectedTableIdsSet = new Set(selectedTableIds);
        const selectedRelationshipIdsSet = new Set(selectedRelationshipIds);

        setEdges((prevEdges) => {
            // Check if any edge needs updating
            let hasChanges = false;

            const newEdges = prevEdges.map((edge): EdgeType => {
                const shouldBeHighlighted =
                    selectedRelationshipIdsSet.has(edge.id) ||
                    selectedTableIdsSet.has(edge.source) ||
                    selectedTableIdsSet.has(edge.target);

                const currentHighlighted = edge.data?.highlighted ?? false;
                const currentAnimated = edge.animated ?? false;
                const currentZIndex = edge.zIndex ?? 0;

                // Skip if no changes needed
                if (
                    currentHighlighted === shouldBeHighlighted &&
                    currentAnimated === shouldBeHighlighted &&
                    currentZIndex ===
                        (shouldBeHighlighted
                            ? HIGHLIGHTED_EDGE_Z_INDEX
                            : DEFAULT_EDGE_Z_INDEX)
                ) {
                    return edge;
                }

                hasChanges = true;

                if (edge.type === 'dependency-edge') {
                    const dependencyEdge = edge as DependencyEdgeType;
                    return {
                        ...dependencyEdge,
                        data: {
                            ...dependencyEdge.data!,
                            highlighted: shouldBeHighlighted,
                        },
                        animated: shouldBeHighlighted,
                        zIndex: shouldBeHighlighted
                            ? HIGHLIGHTED_EDGE_Z_INDEX
                            : DEFAULT_EDGE_Z_INDEX,
                    };
                } else {
                    const relationshipEdge = edge as RelationshipEdgeType;
                    return {
                        ...relationshipEdge,
                        data: {
                            ...relationshipEdge.data!,
                            highlighted: shouldBeHighlighted,
                        },
                        animated: shouldBeHighlighted,
                        zIndex: shouldBeHighlighted
                            ? HIGHLIGHTED_EDGE_Z_INDEX
                            : DEFAULT_EDGE_Z_INDEX,
                    };
                }
            });

            return hasChanges ? newEdges : prevEdges;
        });
    }, [selectedRelationshipIds, selectedTableIds, setEdges]);

    useEffect(() => {
        setNodes((prevNodes) => {
            const newNodes = [
                ...tables.map((table) => {
                    const isOverlapping =
                        (overlapGraph.graph.get(table.id) ?? []).length > 0;
                    const node = tableToTableNode(table, {
                        filter,
                        databaseType,
                        filterLoading,
                    });

                    // Check if table uses the highlighted custom type
                    let hasHighlightedCustomType = false;
                    if (highlightedCustomType) {
                        hasHighlightedCustomType = table.fields.some(
                            (field) =>
                                field.type.name === highlightedCustomType.name
                        );
                    }

                    return {
                        ...node,
                        data: {
                            ...node.data,
                            isOverlapping,
                            highlightOverlappingTables,
                            hasHighlightedCustomType,
                        },
                    };
                }),
                ...areas.map((area) =>
                    areaToAreaNode(area, {
                        tables,
                        filter,
                        databaseType,
                        filterLoading,
                    })
                ),
            ];

            // Check if nodes actually changed
            if (equal(prevNodes, newNodes)) {
                return prevNodes;
            }

            return newNodes;
        });
    }, [
        tables,
        areas,
        setNodes,
        filter,
        databaseType,
        overlapGraph.lastUpdated,
        overlapGraph.graph,
        highlightOverlappingTables,
        highlightedCustomType,
        filterLoading,
    ]);

    const prevFilter = useRef<DiagramFilter | undefined>(undefined);
    useEffect(() => {
        if (!equal(filter, prevFilter.current)) {
            debounce(() => {
                const overlappingTablesInDiagram = findOverlappingTables({
                    tables: tables.filter((table) =>
                        filterTable({
                            table: {
                                id: table.id,
                                schema: table.schema,
                            },
                            filter,
                            options: {
                                defaultSchema: defaultSchemas[databaseType],
                            },
                        })
                    ),
                });
                setOverlapGraph(overlappingTablesInDiagram);
                fitView({
                    duration: 500,
                    padding: 0.1,
                    maxZoom: 0.8,
                });
            }, 500)();
            prevFilter.current = filter;
        }
    }, [filter, fitView, tables, setOverlapGraph, databaseType]);

    useEffect(() => {
        const checkParentAreas = debounce(() => {
            const visibleTables = nodes
                .filter((node) => node.type === 'table' && !node.hidden)
                .map((node) => (node as TableNodeType).data.table);
            const visibleAreas = nodes
                .filter((node) => node.type === 'area' && !node.hidden)
                .map((node) => (node as AreaNodeType).data.area);

            const updatedTables = updateTablesParentAreas(
                visibleTables,
                visibleAreas
            );
            const needsUpdate: Array<{
                id: string;
                parentAreaId: string | null;
            }> = [];

            updatedTables.forEach((newTable, index) => {
                const oldTable = visibleTables[index];
                if (
                    oldTable &&
                    (!!newTable.parentAreaId || !!oldTable.parentAreaId) &&
                    newTable.parentAreaId !== oldTable.parentAreaId
                ) {
                    needsUpdate.push({
                        id: newTable.id,
                        parentAreaId: newTable.parentAreaId || null,
                    });
                }
            });

            if (needsUpdate.length > 0) {
                updateTablesState(
                    (currentTables) =>
                        currentTables.map((table) => {
                            const update = needsUpdate.find(
                                (u) => u.id === table.id
                            );
                            if (update) {
                                return {
                                    id: table.id,
                                    parentAreaId: update.parentAreaId,
                                };
                            }
                            return table;
                        }),
                    { updateHistory: false }
                );
            }
        }, 300);

        checkParentAreas();
    }, [nodes, updateTablesState]);

    const onConnectHandler = useCallback(
        async (params: AddEdgeParams) => {
            if (
                params.sourceHandle?.startsWith?.(
                    TOP_SOURCE_HANDLE_ID_PREFIX
                ) ||
                params.sourceHandle?.startsWith?.(
                    BOTTOM_SOURCE_HANDLE_ID_PREFIX
                )
            ) {
                const tableId = params.target;
                const dependentTableId = params.source;

                createDependency({
                    tableId,
                    dependentTableId,
                });

                return;
            }

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
        },
        [createRelationship, createDependency, getField, toast, databaseType]
    );

    const onEdgesChangeHandler: OnEdgesChange<EdgeType> = useCallback(
        (changes) => {
            let changesToApply = changes;

            if (readonly) {
                changesToApply = changesToApply.filter(
                    (change) => change.type !== 'remove'
                );
            }

            const removeChanges: NodeRemoveChange[] = changesToApply.filter(
                (change) => change.type === 'remove'
            ) as NodeRemoveChange[];

            const edgesToRemove = removeChanges
                .map((change) => getEdge(change.id) as EdgeType | undefined)
                .filter((edge) => !!edge);

            const relationshipsToRemove: string[] = (
                edgesToRemove.filter(
                    (edge) => edge?.type === 'relationship-edge'
                ) as RelationshipEdgeType[]
            ).map((edge) => edge?.data?.relationship?.id as string);

            const dependenciesToRemove: string[] = (
                edgesToRemove.filter(
                    (edge) => edge?.type === 'dependency-edge'
                ) as DependencyEdgeType[]
            ).map((edge) => edge?.data?.dependency?.id as string);

            if (relationshipsToRemove.length > 0) {
                removeRelationships(relationshipsToRemove);
            }

            if (dependenciesToRemove.length > 0) {
                removeDependencies(dependenciesToRemove);
            }

            return onEdgesChange(changesToApply);
        },
        [
            getEdge,
            onEdgesChange,
            removeRelationships,
            removeDependencies,
            readonly,
        ]
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
                    const node = getNode(change.id) as NodeType;
                    if (!node) {
                        continue;
                    }

                    if (node.type !== 'table') {
                        continue;
                    }

                    newOverlappingGraph = findTableOverlapping(
                        { node: node as TableNodeType },
                        {
                            nodes: nodes.filter(
                                (node) => !node.hidden && node.type === 'table'
                            ) as TableNodeType[],
                        },
                        newOverlappingGraph
                    );
                }

                for (const change of sizeChanges) {
                    const node = getNode(change.id) as NodeType;
                    if (!node) {
                        continue;
                    }

                    if (node.type !== 'table') {
                        continue;
                    }

                    newOverlappingGraph = findTableOverlapping(
                        { node: node as TableNodeType },
                        {
                            nodes: nodes.filter(
                                (node) => !node.hidden && node.type === 'table'
                            ) as TableNodeType[],
                        },
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

    const findRelevantNodesChanges = useCallback(
        (changes: NodeChange<NodeType>[], type: NodeType['type']) => {
            const relevantChanges = changes.filter((change) => {
                if (
                    (change.type === 'position' &&
                        !change.dragging &&
                        change.position?.x !== undefined &&
                        change.position?.y !== undefined &&
                        !isNaN(change.position.x) &&
                        !isNaN(change.position.y)) ||
                    (change.type === 'dimensions' && change.resizing) ||
                    change.type === 'remove'
                ) {
                    const node = getNode(change.id);
                    if (!node) {
                        return false;
                    }

                    if (node.type !== type) {
                        return false;
                    }

                    return true;
                }

                return false;
            });

            const positionChanges: NodePositionChange[] =
                relevantChanges.filter(
                    (change) =>
                        change.type === 'position' &&
                        !change.dragging &&
                        change.position?.x !== undefined &&
                        change.position?.y !== undefined &&
                        !isNaN(change.position.x) &&
                        !isNaN(change.position.y)
                ) as NodePositionChange[];

            const removeChanges: NodeRemoveChange[] = relevantChanges.filter(
                (change) => change.type === 'remove'
            ) as NodeRemoveChange[];

            const sizeChanges: NodeDimensionChange[] = relevantChanges.filter(
                (change) => change.type === 'dimensions' && change.resizing
            ) as NodeDimensionChange[];

            return {
                positionChanges,
                removeChanges,
                sizeChanges,
            };
        },
        [getNode]
    );

    const onNodesChangeHandler: OnNodesChange<NodeType> = useCallback(
        (changes) => {
            let changesToApply = changes;

            if (readonly) {
                changesToApply = changesToApply.filter(
                    (change) => change.type !== 'remove'
                );
            }

            // Handle area drag changes - add child table movements for visual feedback only
            const areaDragChanges = changesToApply.filter((change) => {
                if (change.type === 'position') {
                    const node = getNode(change.id);
                    return node?.type === 'area' && change.dragging;
                }
                return false;
            }) as NodePositionChange[];

            // Add visual position changes for child tables during area dragging
            if (areaDragChanges.length > 0) {
                const additionalChanges: NodePositionChange[] = [];

                areaDragChanges.forEach((areaChange) => {
                    const currentArea = areas.find(
                        (a) => a.id === areaChange.id
                    );
                    if (currentArea && areaChange.position) {
                        const deltaX = areaChange.position.x - currentArea.x;
                        const deltaY = areaChange.position.y - currentArea.y;

                        // Find child tables and create visual position changes
                        const childTables = tables.filter(
                            (table) => table.parentAreaId === areaChange.id
                        );

                        childTables.forEach((table) => {
                            additionalChanges.push({
                                id: table.id,
                                type: 'position',
                                position: {
                                    x: table.x + deltaX,
                                    y: table.y + deltaY,
                                },
                                dragging: true,
                            });
                        });
                    }
                });

                // Add visual changes to React Flow
                changesToApply = [...changesToApply, ...additionalChanges];
            }

            // Handle table changes - only update storage when NOT dragging
            const { positionChanges, removeChanges, sizeChanges } =
                findRelevantNodesChanges(changesToApply, 'table');

            if (
                positionChanges.length > 0 ||
                removeChanges.length > 0 ||
                sizeChanges.length > 0
            ) {
                updateTablesState((currentTables) => {
                    // First update positions
                    const updatedTables = currentTables
                        .map((currentTable) => {
                            const positionChange = positionChanges.find(
                                (change) => change.id === currentTable.id
                            );
                            const sizeChange = sizeChanges.find(
                                (change) => change.id === currentTable.id
                            );
                            if (positionChange || sizeChange) {
                                const x = positionChange?.position?.x;
                                const y = positionChange?.position?.y;

                                return {
                                    ...currentTable,
                                    ...(positionChange &&
                                    x !== undefined &&
                                    y !== undefined &&
                                    !isNaN(x) &&
                                    !isNaN(y)
                                        ? {
                                              x,
                                              y,
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
                        );

                    return updatedTables;
                });
            }

            updateOverlappingGraphOnChangesDebounced({
                positionChanges,
                sizeChanges,
            });

            // Handle area changes
            const {
                positionChanges: areaPositionChanges,
                removeChanges: areaRemoveChanges,
                sizeChanges: areaSizeChanges,
            } = findRelevantNodesChanges(changesToApply, 'area');

            if (
                areaPositionChanges.length > 0 ||
                areaRemoveChanges.length > 0 ||
                areaSizeChanges.length > 0
            ) {
                const areasUpdates: Record<string, Partial<Area>> = {};
                // Handle area position changes and move child tables (only when drag ends)
                areaPositionChanges.forEach((change) => {
                    if (change.type === 'position' && change.position) {
                        areasUpdates[change.id] = {
                            ...areasUpdates[change.id],
                            x: change.position.x,
                            y: change.position.y,
                        };

                        if (areaSizeChanges.length !== 0) {
                            // If there are size changes, we don't need to move child tables
                            return;
                        }
                        const currentArea = areas.find(
                            (a) => a.id === change.id
                        );
                        if (currentArea) {
                            const deltaX = change.position.x - currentArea.x;
                            const deltaY = change.position.y - currentArea.y;

                            const childTables = getTablesInArea(
                                change.id,
                                tables
                            );

                            // Update child table positions in storage
                            if (childTables.length > 0) {
                                updateTablesState((currentTables) =>
                                    currentTables.map((table) => {
                                        if (table.parentAreaId === change.id) {
                                            return {
                                                id: table.id,
                                                x: table.x + deltaX,
                                                y: table.y + deltaY,
                                            };
                                        }
                                        return table;
                                    })
                                );
                            }
                        }
                    }
                });

                // Handle area size changes
                areaSizeChanges.forEach((change) => {
                    if (change.type === 'dimensions' && change.dimensions) {
                        areasUpdates[change.id] = {
                            ...areasUpdates[change.id],
                            width: change.dimensions.width,
                            height: change.dimensions.height,
                        };
                    }
                });

                areaRemoveChanges.forEach((change) => {
                    updateTablesState((currentTables) =>
                        currentTables.map((table) => {
                            if (table.parentAreaId === change.id) {
                                return {
                                    ...table,
                                    parentAreaId: null,
                                };
                            }
                            return table;
                        })
                    );
                    removeArea(change.id);

                    delete areasUpdates[change.id];
                });

                // Apply area updates to storage
                if (Object.keys(areasUpdates).length > 0) {
                    for (const [id, updates] of Object.entries(areasUpdates)) {
                        updateArea(id, updates);
                    }
                }
            }

            return onNodesChange(changesToApply);
        },
        [
            onNodesChange,
            updateTablesState,
            updateOverlappingGraphOnChangesDebounced,
            findRelevantNodesChanges,
            updateArea,
            removeArea,
            readonly,
            tables,
            areas,
            getNode,
        ]
    );

    const eventConsumer = useCallback(
        (event: ChartDBEvent) => {
            let newOverlappingGraph: Graph<string> = overlapGraph;
            if (event.action === 'add_tables') {
                for (const table of event.data.tables) {
                    newOverlappingGraph = findTableOverlapping(
                        { node: getNode(table.id) as TableNodeType },
                        {
                            nodes: nodes.filter(
                                (node) => !node.hidden && node.type === 'table'
                            ) as TableNodeType[],
                        },
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
                    {
                        nodes: nodes.filter(
                            (node) => !node.hidden && node.type === 'table'
                        ) as TableNodeType[],
                    },
                    overlapGraph
                );
                setOverlapGraph(newOverlappingGraph);

                setTimeout(() => {
                    setNodes((prevNodes) =>
                        prevNodes.map((n) => {
                            if (n.id === event.data.id) {
                                return {
                                    ...n,
                                    measured,
                                };
                            }

                            return n;
                        })
                    );
                }, 0);
            } else if (
                event.action === 'add_field' ||
                event.action === 'remove_field'
            ) {
                const node = getNode(event.data.tableId) as TableNodeType;

                const measured = {
                    ...(node.measured ?? {}),
                    height: calcTableHeight({
                        ...node.data.table,
                        fields: event.data.fields,
                    }),
                };

                newOverlappingGraph = findTableOverlapping(
                    {
                        node: {
                            ...node,
                            measured,
                        },
                    },
                    {
                        nodes: nodes.filter(
                            (node) => !node.hidden && node.type === 'table'
                        ) as TableNodeType[],
                    },
                    overlapGraph
                );
                setOverlapGraph(newOverlappingGraph);
            } else if (event.action === 'load_diagram') {
                const diagramTables = event.data.diagram.tables ?? [];
                const overlappingTablesInDiagram = findOverlappingTables({
                    tables: diagramTables.filter((table) =>
                        filterTable({
                            table: {
                                id: table.id,
                                schema: table.schema,
                            },
                            filter,
                            options: {
                                defaultSchema: defaultSchemas[databaseType],
                            },
                        })
                    ),
                });
                setOverlapGraph(overlappingTablesInDiagram);
            }
        },
        [
            overlapGraph,
            setOverlapGraph,
            getNode,
            nodes,
            filter,
            setNodes,
            databaseType,
        ]
    );

    events.useSubscription(eventConsumer);

    const isLoadingDOM =
        tables.length > 0 ? !getInternalNode(tables[0].id) : false;

    const showReorderConfirmation = useCallback(() => {
        showAlert({
            title: t('reorder_diagram_alert.title'),
            description: t('reorder_diagram_alert.description'),
            actionLabel: t('reorder_diagram_alert.reorder'),
            closeLabel: t('reorder_diagram_alert.cancel'),
            onAction: reorderTables,
        });
    }, [t, showAlert, reorderTables]);

    const hasOverlappingTables = useMemo(
        () =>
            Array.from(overlapGraph.graph).some(
                ([, value]) => value.length > 0
            ),
        [overlapGraph]
    );

    const pulseOverlappingTables = useCallback(() => {
        setHighlightOverlappingTables(true);
        setTimeout(() => setHighlightOverlappingTables(false), 600);
    }, []);

    const shiftPressed = useKeyPress('Shift');
    const operatingSystem = getOperatingSystem();

    useHotkeys(
        operatingSystem === 'mac' ? 'meta+f' : 'ctrl+f',
        () => {
            setShowFilter((prev) => !prev);
        },
        {
            preventDefault: true,
            enableOnFormTags: true,
        },
        []
    );

    return (
        <CanvasContextMenu>
            <div className="relative flex h-full" id="canvas">
                <ReactFlow
                    onlyRenderVisibleElements
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
                        type: 'relationship-edge',
                    }}
                    panOnScroll={scrollAction === 'pan'}
                    snapToGrid={shiftPressed || snapToGridEnabled}
                    snapGrid={[20, 20]}
                >
                    <Controls
                        position="top-left"
                        showZoom={false}
                        showFitView={false}
                        showInteractive={false}
                        className="!shadow-none"
                    >
                        <div className="flex flex-col items-center gap-2 md:flex-row">
                            {!readonly ? (
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Button
                                                    variant="secondary"
                                                    className="size-8 p-1 shadow-none"
                                                    onClick={
                                                        showReorderConfirmation
                                                    }
                                                >
                                                    <LayoutGrid className="size-4" />
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {t('toolbar.reorder_diagram')}
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Button
                                                    variant="secondary"
                                                    className={cn(
                                                        'size-8 p-1 shadow-none',
                                                        snapToGridEnabled ||
                                                            shiftPressed
                                                            ? 'bg-pink-600 text-white hover:bg-pink-500 dark:hover:bg-pink-700 hover:text-white'
                                                            : ''
                                                    )}
                                                    onClick={() =>
                                                        setSnapToGridEnabled(
                                                            (prev) => !prev
                                                        )
                                                    }
                                                >
                                                    <Magnet className="size-4" />
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {t('snap_to_grid_tooltip', {
                                                key:
                                                    operatingSystem === 'mac'
                                                        ? '⇧'
                                                        : 'Shift',
                                            })}
                                        </TooltipContent>
                                    </Tooltip>
                                    {highlightedCustomType ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span>
                                                    <Button
                                                        variant="secondary"
                                                        className="size-8 border border-yellow-400 bg-yellow-200 p-1 shadow-none hover:bg-yellow-300 dark:border-yellow-700 dark:bg-yellow-800 dark:hover:bg-yellow-700"
                                                        onClick={() =>
                                                            highlightCustomTypeId(
                                                                undefined
                                                            )
                                                        }
                                                    >
                                                        <Highlighter className="size-4" />
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {t(
                                                    'toolbar.custom_type_highlight_tooltip',
                                                    {
                                                        typeName:
                                                            highlightedCustomType.name,
                                                    }
                                                )}
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : null}
                                </>
                            ) : null}

                            <div
                                className={`transition-opacity duration-300 ease-in-out ${
                                    hasOverlappingTables
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                }`}
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span>
                                            <Button
                                                variant="default"
                                                className="size-8 p-1 shadow-none"
                                                onClick={pulseOverlappingTables}
                                            >
                                                <AlertTriangle className="size-4 text-white" />
                                            </Button>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {t(
                                            'toolbar.highlight_overlapping_tables'
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
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

                    {!isDesktop && !readonly ? (
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
                    {isLostInCanvas ? (
                        <Controls
                            position={
                                isDesktop ? 'bottom-center' : 'top-center'
                            }
                            orientation="horizontal"
                            showZoom={false}
                            showFitView={false}
                            showInteractive={false}
                            className="!shadow-none"
                            style={{
                                [isDesktop ? 'bottom' : 'top']: isDesktop
                                    ? '70px'
                                    : '70px',
                            }}
                        >
                            <ShowAllButton />
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
                        <Toolbar readonly={readonly} />
                    </Controls>
                    {showMiniMapOnCanvas && (
                        <MiniMap
                            style={{
                                width: isDesktop ? 100 : 60,
                                height: isDesktop ? 100 : 60,
                            }}
                        />
                    )}
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={16}
                        size={1}
                    />
                    {showFilter ? (
                        <CanvasFilter onClose={() => setShowFilter(false)} />
                    ) : null}
                </ReactFlow>
                <MarkerDefinitions />
            </div>
        </CanvasContextMenu>
    );
};
