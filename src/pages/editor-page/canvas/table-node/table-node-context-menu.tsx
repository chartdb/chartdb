import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from '@/components/context-menu/context-menu';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useChartDB } from '@/hooks/use-chartdb';
import { useLayout } from '@/hooks/use-layout';
import { cloneTable } from '@/lib/clone';
import type { DBTable } from '@/lib/domain/db-table';
import { arrangeTablesForArea } from '@/lib/utils/area-utils';
import {
    Check,
    Copy,
    Pencil,
    Plus,
    SquareArrowOutUpRight,
    Trash2,
    Workflow,
} from 'lucide-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCanvas } from '@/hooks/use-canvas';
import { useReactFlow, useStore } from '@xyflow/react';

export interface TableNodeContextMenuProps {
    table: DBTable;
}

export const TableNodeContextMenu: React.FC<
    React.PropsWithChildren<TableNodeContextMenuProps>
> = ({ children, table }) => {
    const {
        removeTable,
        readonly,
        createTable,
        createArea,
        areas,
        tables,
        relationships,
        updateArea,
        updateTablesState,
    } = useChartDB();
    const { closeAllTablesInSidebar } = useLayout();
    const { t } = useTranslation();
    const { isMd: isDesktop } = useBreakpoint('md');
    const { setEditTableModeTable, startFloatingEdgeCreation } = useCanvas();
    const { getNodes } = useReactFlow();

    // Reactively detect multi-selection
    const selectedTableIds = useStore((state) =>
        state.nodes
            .filter((n) => n.type === 'table' && n.selected && !n.hidden)
            .map((n) => n.id)
    );
    const isMultiSelect =
        selectedTableIds.length > 1 && selectedTableIds.includes(table.id);

    const duplicateTableHandler: React.MouseEventHandler<HTMLDivElement> =
        useCallback(
            (e) => {
                e.stopPropagation();
                const clonedTable = cloneTable(table);
                clonedTable.name = `${clonedTable.name}_copy`;
                clonedTable.x += 30;
                clonedTable.y += 50;
                createTable(clonedTable);
            },
            [createTable, table]
        );

    const editTableHandler: React.MouseEventHandler<HTMLDivElement> =
        useCallback(
            (e) => {
                e.stopPropagation();
                if (readonly) return;
                closeAllTablesInSidebar();
                setEditTableModeTable({ tableId: table.id });
            },
            [table.id, setEditTableModeTable, closeAllTablesInSidebar, readonly]
        );

    const removeTableHandler: React.MouseEventHandler<HTMLDivElement> =
        useCallback(
            (e) => {
                e.stopPropagation();
                removeTable(table.id);
            },
            [removeTable, table.id]
        );

    const addRelationshipHandler: React.MouseEventHandler<HTMLDivElement> =
        useCallback(
            (e) => {
                e.stopPropagation();
                startFloatingEdgeCreation({ sourceNodeId: table.id });
            },
            [startFloatingEdgeCreation, table.id]
        );

    // Arrange tables into an area and apply positions
    const moveToArea = useCallback(
        (
            areaId: string,
            tableIds: string[],
            overrideRect?: {
                x: number;
                y: number;
                width: number;
                height: number;
            }
        ) => {
            let areaRect = overrideRect;
            if (!areaRect) {
                const canvasNodes = getNodes();
                const areaNode = canvasNodes.find(
                    (n) => n.id === areaId && n.type === 'area'
                );
                const areaData = areas.find((a) => a.id === areaId)!;
                areaRect = {
                    x: areaNode?.position.x ?? areaData.x,
                    y: areaNode?.position.y ?? areaData.y,
                    width: areaNode?.measured?.width ?? areaData.width,
                    height: areaNode?.measured?.height ?? areaData.height,
                };
            }

            const tableIdSet = new Set(tableIds);
            const existingAreaTables = tables.filter(
                (t) => t.parentAreaId === areaId && !tableIdSet.has(t.id)
            );
            const movingTables = tables.filter((t) => tableIdSet.has(t.id));
            const allAreaTables = [...existingAreaTables, ...movingTables];

            const { positions, requiredWidth, requiredHeight } =
                arrangeTablesForArea(allAreaTables, relationships, areaRect);

            if (
                requiredWidth > areaRect.width ||
                requiredHeight > areaRect.height
            ) {
                updateArea(areaId, {
                    width: Math.max(areaRect.width, requiredWidth),
                    height: Math.max(areaRect.height, requiredHeight),
                });
            }

            updateTablesState(
                (currentTables) =>
                    currentTables.map((t) => {
                        const pos = positions.find((p) => p.id === t.id);
                        if (!pos) return t;
                        return {
                            ...t,
                            parentAreaId: areaId,
                            x: pos.x,
                            y: pos.y,
                        };
                    }),
                { updateHistory: true }
            );
        },
        [tables, relationships, areas, getNodes, updateArea, updateTablesState]
    );

    const moveToAreaHandler = useCallback(
        (areaId: string | null) => {
            const tableIds = isMultiSelect ? selectedTableIds : [table.id];

            if (areaId === null) {
                updateTablesState(
                    (currentTables) =>
                        currentTables.map((t) =>
                            tableIds.includes(t.id)
                                ? { ...t, parentAreaId: null }
                                : t
                        ),
                    { updateHistory: true }
                );
                return;
            }

            moveToArea(areaId, tableIds);
        },
        [
            isMultiSelect,
            selectedTableIds,
            table.id,
            moveToArea,
            updateTablesState,
        ]
    );

    const createAreaHandler = useCallback(async () => {
        const canvasNodes = getNodes();
        const node = canvasNodes.find((n) => n.id === table.id);
        const newArea = await createArea({
            x: (node?.position.x ?? table.x) - 30,
            y: (node?.position.y ?? table.y) - 50,
        });

        const tableIds = isMultiSelect ? selectedTableIds : [table.id];
        moveToArea(newArea.id, tableIds, {
            x: newArea.x,
            y: newArea.y,
            width: newArea.width,
            height: newArea.height,
        });
    }, [
        isMultiSelect,
        selectedTableIds,
        table,
        createArea,
        getNodes,
        moveToArea,
    ]);

    if (!isDesktop || readonly) {
        return <>{children}</>;
    }
    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem
                    onClick={editTableHandler}
                    className="flex justify-between gap-3"
                >
                    <span>{t('table_node_context_menu.edit_table')}</span>
                    <Pencil className="size-3.5" />
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={duplicateTableHandler}
                    className="flex justify-between gap-3"
                >
                    <span>{t('table_node_context_menu.duplicate_table')}</span>
                    <Copy className="size-3.5" />
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={addRelationshipHandler}
                    className="flex justify-between gap-3"
                >
                    <span>{t('table_node_context_menu.add_relationship')}</span>
                    <Workflow className="size-3.5" />
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuSub>
                    <ContextMenuSubTrigger className="flex items-center gap-3">
                        <span>
                            {isMultiSelect
                                ? `${t('table_node_context_menu.move_to_area')} (${selectedTableIds.length})`
                                : t('table_node_context_menu.move_to_area')}
                        </span>
                        <SquareArrowOutUpRight className="ml-auto size-3.5" />
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                        <ContextMenuItem
                            onClick={createAreaHandler}
                            className="flex items-center gap-2"
                        >
                            <Plus className="size-3.5" />
                            <span>{t('canvas_context_menu.new_area')}</span>
                        </ContextMenuItem>
                        {areas.length > 0 && <ContextMenuSeparator />}
                        {areas.map((area) => (
                            <ContextMenuItem
                                key={area.id}
                                onClick={() => moveToAreaHandler(area.id)}
                                className="flex items-center gap-2"
                            >
                                <div
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{
                                        backgroundColor: area.color,
                                    }}
                                />
                                <span>{area.name}</span>
                                {!isMultiSelect &&
                                    table.parentAreaId === area.id && (
                                        <Check className="ml-auto size-3.5" />
                                    )}
                            </ContextMenuItem>
                        ))}
                        {areas.length > 0 && (
                            <>
                                <ContextMenuSeparator />
                                <ContextMenuItem
                                    onClick={() => moveToAreaHandler(null)}
                                    disabled={
                                        !isMultiSelect && !table.parentAreaId
                                    }
                                    className="flex items-center gap-2"
                                >
                                    <span>
                                        {t('table_node_context_menu.no_area')}
                                    </span>
                                    {!isMultiSelect && !table.parentAreaId && (
                                        <Check className="ml-auto size-3.5" />
                                    )}
                                </ContextMenuItem>
                            </>
                        )}
                    </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
                <ContextMenuItem
                    onClick={removeTableHandler}
                    className="flex justify-between gap-3"
                >
                    <span>{t('table_node_context_menu.delete_table')}</span>
                    <Trash2 className="size-3.5 text-red-700" />
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
