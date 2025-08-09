import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/button/button';
import type { TreeNode } from '@/components/tree-view/tree';
import { schemaNameToSchemaId } from '@/lib/domain/db-schema';
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

        return (
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
        );
    }

    if (node.type === 'table') {
        const tableId = node.id;
        const context = node.context as TableContext;
        const tableVisible = context.visible;

        return (
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
        );
    }

    return null;
};
