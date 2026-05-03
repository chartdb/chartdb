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
import { useDialog } from '@/hooks/use-dialog';
import { useReactFlow, useStore } from '@xyflow/react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Table,
    Workflow,
    Group,
    View,
    StickyNote,
    Import,
    LayoutGrid,
    Plus,
    SquareArrowOutUpRight,
} from 'lucide-react';
import { useDiagramFilter } from '@/context/diagram-filter-context/use-diagram-filter';
import { useLocalConfig } from '@/hooks/use-local-config';
import { useCanvas } from '@/hooks/use-canvas';
import { defaultSchemas } from '@/lib/data/default-schemas';
import { useAlert } from '@/context/alert-context/alert-context';
import { arrangeTablesForArea } from '@/lib/utils/area-utils';

export const CanvasContextMenu: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const {
        createTable,
        readonly,
        createArea,
        databaseType,
        createNote,
        areas,
        tables,
        relationships,
        updateArea,
        updateTablesState,
    } = useChartDB();
    const { schemasDisplayed } = useDiagramFilter();
    const { openCreateRelationshipDialog, openImportDatabaseDialog } =
        useDialog();
    const { screenToFlowPosition, getNodes } = useReactFlow();
    const { t } = useTranslation();
    const { showDBViews } = useLocalConfig();
    const { setEditTableModeTable, reorderTables } = useCanvas();
    const { showAlert } = useAlert();

    const { isMd: isDesktop } = useBreakpoint('md');

    // Reactively detect selected tables
    const selectedTableIds = useStore((state) =>
        state.nodes
            .filter((n) => n.type === 'table' && n.selected && !n.hidden)
            .map((n) => n.id)
    );
    const hasSelectedTables = selectedTableIds.length > 0;

    const createTableHandler = useCallback(
        async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            let schema: string | undefined = undefined;
            if (schemasDisplayed.length > 0) {
                const defaultSchemaName = defaultSchemas[databaseType];
                const defaultSchemaInList = schemasDisplayed.find(
                    (s) => s.name === defaultSchemaName
                );
                schema = defaultSchemaInList
                    ? defaultSchemaInList.name
                    : schemasDisplayed[0]?.name;
            }

            const newTable = await createTable({
                x: position.x,
                y: position.y,
                schema,
            });

            if (newTable) {
                setEditTableModeTable({ tableId: newTable.id });
            }
        },
        [
            createTable,
            screenToFlowPosition,
            schemasDisplayed,
            setEditTableModeTable,
            databaseType,
        ]
    );

    const createViewHandler = useCallback(
        async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            let schema: string | undefined = undefined;
            if (schemasDisplayed.length > 0) {
                const defaultSchemaName = defaultSchemas[databaseType];
                const defaultSchemaInList = schemasDisplayed.find(
                    (s) => s.name === defaultSchemaName
                );
                schema = defaultSchemaInList
                    ? defaultSchemaInList.name
                    : schemasDisplayed[0]?.name;
            }

            const newView = await createTable({
                x: position.x,
                y: position.y,
                schema,
                isView: true,
            });

            if (newView) {
                setEditTableModeTable({ tableId: newView.id });
            }
        },
        [
            createTable,
            screenToFlowPosition,
            schemasDisplayed,
            setEditTableModeTable,
            databaseType,
        ]
    );

    const createAreaHandler = useCallback(
        (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            createArea({
                x: position.x,
                y: position.y,
            });
        },
        [createArea, screenToFlowPosition]
    );

    const createNoteHandler = useCallback(
        (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            createNote({
                x: position.x,
                y: position.y,
            });
        },
        [createNote, screenToFlowPosition]
    );

    const createRelationshipHandler = useCallback(() => {
        openCreateRelationshipDialog();
    }, [openCreateRelationshipDialog]);

    const autoArrangeHandler = useCallback(() => {
        showAlert({
            title: t('reorder_diagram_alert.title'),
            description: t('reorder_diagram_alert.description'),
            actionLabel: t('reorder_diagram_alert.reorder'),
            closeLabel: t('reorder_diagram_alert.cancel'),
            onAction: reorderTables,
        });
    }, [t, showAlert, reorderTables]);

    const importSqlDbmlHandler = useCallback(() => {
        queueMicrotask(() => {
            openImportDatabaseDialog({
                databaseType,
                importMethods: ['ddl', 'dbml'],
            });
        });
    }, [openImportDatabaseDialog, databaseType]);

    // Arrange selected tables into an area
    const moveSelectedToArea = useCallback(
        (
            areaId: string,
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

            const tableIdSet = new Set(selectedTableIds);
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
        [
            selectedTableIds,
            updateTablesState,
            updateArea,
            tables,
            relationships,
            areas,
            getNodes,
        ]
    );

    const createAreaForSelectedHandler = useCallback(async () => {
        const canvasNodes = getNodes();
        const firstSelected = canvasNodes.find((n) =>
            selectedTableIds.includes(n.id)
        );

        const newArea = await createArea({
            x: (firstSelected?.position.x ?? 0) - 30,
            y: (firstSelected?.position.y ?? 0) - 50,
        });

        moveSelectedToArea(newArea.id, {
            x: newArea.x,
            y: newArea.y,
            width: newArea.width,
            height: newArea.height,
        });
    }, [selectedTableIds, createArea, getNodes, moveSelectedToArea]);

    if (!isDesktop) {
        return <>{children}</>;
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger disabled={readonly}>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem
                    onClick={createTableHandler}
                    className="flex justify-between gap-4"
                >
                    {t('canvas_context_menu.new_table')}
                    <Table className="size-3.5" />
                </ContextMenuItem>
                {showDBViews ? (
                    <ContextMenuItem
                        onClick={createViewHandler}
                        className="flex justify-between gap-4"
                    >
                        {t('canvas_context_menu.new_view')}
                        <View className="size-3.5" />
                    </ContextMenuItem>
                ) : null}
                <ContextMenuItem
                    onClick={createRelationshipHandler}
                    className="flex justify-between gap-4"
                >
                    {t('canvas_context_menu.new_relationship')}
                    <Workflow className="size-3.5" />
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    onClick={createAreaHandler}
                    className="flex justify-between gap-4"
                >
                    {t('canvas_context_menu.new_area')}
                    <Group className="size-3.5" />
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={createNoteHandler}
                    className="flex justify-between gap-4"
                >
                    {t('canvas_context_menu.new_note')}
                    <StickyNote className="size-3.5" />
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    onClick={importSqlDbmlHandler}
                    className="flex justify-between gap-4"
                >
                    Import SQL/DBML
                    <Import className="size-3.5" />
                </ContextMenuItem>
                {hasSelectedTables && (
                    <>
                        <ContextMenuSeparator />
                        <ContextMenuSub>
                            <ContextMenuSubTrigger className="flex items-center gap-3">
                                <span>
                                    {`${t('table_node_context_menu.move_to_area')} (${selectedTableIds.length})`}
                                </span>
                                <SquareArrowOutUpRight className="ml-auto size-3.5" />
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                                <ContextMenuItem
                                    onClick={createAreaForSelectedHandler}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="size-3.5" />
                                    <span>
                                        {t('canvas_context_menu.new_area')}
                                    </span>
                                </ContextMenuItem>
                                {areas.length > 0 && <ContextMenuSeparator />}
                                {areas.map((area) => (
                                    <ContextMenuItem
                                        key={area.id}
                                        onClick={() =>
                                            moveSelectedToArea(area.id)
                                        }
                                        className="flex items-center gap-2"
                                    >
                                        <div
                                            className="size-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: area.color,
                                            }}
                                        />
                                        <span>{area.name}</span>
                                    </ContextMenuItem>
                                ))}
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                    </>
                )}
                <ContextMenuSeparator />
                <ContextMenuItem
                    onClick={autoArrangeHandler}
                    className="flex justify-between gap-4"
                >
                    {t('toolbar.reorder_diagram')}
                    <LayoutGrid className="size-3.5" />
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
