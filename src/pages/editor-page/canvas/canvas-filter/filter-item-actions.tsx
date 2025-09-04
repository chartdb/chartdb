import React from 'react';
import { Eye, EyeOff, CircleDotDashed } from 'lucide-react';
import { Button } from '@/components/button/button';
import type { TreeNode } from '@/components/tree-view/tree';
import { schemaNameToSchemaId } from '@/lib/domain/db-schema';
import { useReactFlow } from '@xyflow/react';
import type {
    AreaContext,
    NodeContext,
    NodeType,
    // RelevantTableData,
    SchemaContext,
    TableContext,
} from './types';
import type { FilterTableInfo } from '@/lib/domain/diagram-filter/diagram-filter';

interface FilterItemActionsProps {
    node: TreeNode<NodeType, NodeContext>;
    databaseWithSchemas: boolean;
    toggleSchemaFilter: (schemaId: string) => void;
    toggleTableFilter: (tableId: string) => void;
    clearTableIdsFilter: () => void;
    setTableIdsFilterEmpty: () => void;
    addTablesToFilter: (attrs: {
        tableIds?: string[];
        filterCallback?: (table: FilterTableInfo) => boolean;
    }) => void;
    removeTablesFromFilter: (attrs: {
        tableIds?: string[];
        filterCallback?: (table: FilterTableInfo) => boolean;
    }) => void;
}

export const FilterItemActions: React.FC<FilterItemActionsProps> = ({
    node,
    databaseWithSchemas,
    toggleSchemaFilter,
    toggleTableFilter,
    clearTableIdsFilter,
    setTableIdsFilterEmpty,
    addTablesToFilter,
    removeTablesFromFilter,
}) => {
    const { fitView, setNodes } = useReactFlow();
    if (node.type === 'schema') {
        const context = node.context as SchemaContext;
        const schemaVisible = context.visible;
        const schemaName = context.name;
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
        const isUngrouped = context.isUngrouped;
        const areaId = context.id;

        const handleZoomToArea = (e: React.MouseEvent) => {
            e.stopPropagation();

            // Get all table nodes in this area
            const tableNodes = isUngrouped
                ? document.querySelectorAll('[data-id]:not([data-area-id])')
                : document.querySelectorAll(`[data-area-id="${areaId}"]`);

            const nodeIds: string[] = [];
            tableNodes.forEach((node) => {
                const nodeId = node.getAttribute('data-id');
                if (nodeId) nodeIds.push(nodeId);
            });

            // Make sure the tables in the area are visible
            setNodes((nodes) =>
                nodes.map((node) => {
                    const shouldHighlight = isUngrouped
                        ? node.type === 'table' &&
                          !(node.data as { table?: { parentAreaId?: string } })
                              ?.table?.parentAreaId
                        : node.type === 'area'
                          ? node.id === areaId
                          : (node.data as { table?: { parentAreaId?: string } })
                                ?.table?.parentAreaId === areaId;

                    return {
                        ...node,
                        hidden: shouldHighlight ? false : node.hidden,
                        selected: false,
                    };
                })
            );

            // Focus on the area or its tables
            setTimeout(() => {
                if (!isUngrouped) {
                    // Zoom to the area node itself
                    fitView({
                        duration: 500,
                        maxZoom: 0.6,
                        minZoom: 0.3,
                        nodes: [{ id: areaId }],
                        padding: 0.2,
                    });
                } else {
                    // Zoom to all ungrouped tables
                    fitView({
                        duration: 500,
                        maxZoom: 0.6,
                        minZoom: 0.3,
                        padding: 0.2,
                    });
                }
            }, 100);
        };

        return (
            <div className="flex gap-0.5">
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 h-fit p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={handleZoomToArea}
                    disabled={!areaVisible}
                >
                    <CircleDotDashed className="size-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 h-fit p-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Toggle all tables in this area
                        if (areaVisible) {
                            // Hide all tables in this area
                            removeTablesFromFilter({
                                filterCallback: (table) =>
                                    (isUngrouped && !table.areaId) ||
                                    (!isUngrouped && table.areaId === areaId),
                            });
                        } else {
                            // Show all tables in this area
                            addTablesToFilter({
                                filterCallback: (table) =>
                                    (isUngrouped && !table.areaId) ||
                                    (!isUngrouped && table.areaId === areaId),
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
            </div>
        );
    }

    if (node.type === 'table') {
        const tableId = node.id;
        const context = node.context as TableContext;
        const tableVisible = context.visible;

        const handleZoomToTable = (e: React.MouseEvent) => {
            e.stopPropagation();

            // Make sure the table is visible and selected
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

            // Focus on the table with less zoom
            setTimeout(() => {
                fitView({
                    duration: 500,
                    maxZoom: 0.7,
                    minZoom: 0.5,
                    nodes: [
                        {
                            id: tableId,
                        },
                    ],
                    padding: 0.3,
                });
            }, 100);
        };

        return (
            <div className="flex gap-0.5">
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 h-fit p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={handleZoomToTable}
                    disabled={!tableVisible}
                >
                    <CircleDotDashed className="size-3.5" />
                </Button>
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
            </div>
        );
    }

    return null;
};
