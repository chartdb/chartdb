import React from 'react';
import { Eye, EyeOff, CircleDotDashed } from 'lucide-react';
import { Button } from '@/components/button/button';
import type { TreeNode } from '@/components/tree-view/tree';
import { schemaNameToSchemaId } from '@/lib/domain/db-schema';
import { useFocusOn } from '@/hooks/use-focus-on';
import type {
    AreaContext,
    NodeContext,
    NodeType,
    // RelevantTableData,
    SchemaContext,
    TableContext,
} from './types';
import type { FilterTableInfo } from '@/lib/domain/diagram-filter/diagram-filter';
import { cn } from '@/lib/utils';

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
    const { focusOnArea, focusOnTable } = useFocusOn();
    if (node.type === 'schema') {
        const context = node.context as SchemaContext;
        const schemaVisible = context.visible;
        const schemaName = context.name;
        const schemaId = schemaNameToSchemaId(schemaName);

        return (
            <Button
                variant="ghost"
                size="sm"
                className="h-fit w-6 p-0"
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
                    <EyeOff className="!size-3.5 text-muted-foreground" />
                ) : (
                    <Eye className="!size-3.5" />
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
            if (!isUngrouped) {
                focusOnArea(areaId);
            }
        };

        return (
            <div className="flex h-full items-center gap-0.5">
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        'flex h-fit w-6 items-center justify-center p-0 opacity-0 transition-opacity group-hover:opacity-100',
                        {
                            '!opacity-0': !areaVisible,
                        }
                    )}
                    onClick={handleZoomToArea}
                    disabled={!areaVisible}
                >
                    <CircleDotDashed className="!size-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex h-fit w-6 items-center justify-center p-0"
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
                        <EyeOff className="!size-3.5 text-muted-foreground" />
                    ) : (
                        <Eye className="!size-3.5" />
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
            focusOnTable(tableId);
        };

        return (
            <div className="flex h-full items-center gap-0.5">
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        'flex h-fit w-6 items-center justify-center p-0 opacity-0 transition-opacity group-hover:opacity-100',
                        {
                            '!opacity-0': !tableVisible,
                        }
                    )}
                    onClick={handleZoomToTable}
                    disabled={!tableVisible}
                >
                    <CircleDotDashed className="!size-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex w-6 items-center justify-center p-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleTableFilter(tableId);
                    }}
                >
                    {!tableVisible ? (
                        <EyeOff className="!size-3.5 text-muted-foreground" />
                    ) : (
                        <Eye className="!size-3.5" />
                    )}
                </Button>
            </div>
        );
    }

    return null;
};
