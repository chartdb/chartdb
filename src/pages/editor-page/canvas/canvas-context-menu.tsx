import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/components/context-menu/context-menu';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useChartDB } from '@/hooks/use-chartdb';
import { useDialog } from '@/hooks/use-dialog';
import { useReactFlow } from '@xyflow/react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Workflow, Group, View } from 'lucide-react';
import { useDiagramFilter } from '@/context/diagram-filter-context/use-diagram-filter';
import { useLocalConfig } from '@/hooks/use-local-config';
import { useCanvas } from '@/hooks/use-canvas';

export const CanvasContextMenu: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { createTable, readonly, createArea } = useChartDB();
    const { schemasDisplayed } = useDiagramFilter();
    const { openCreateRelationshipDialog, openTableSchemaDialog } = useDialog();
    const { screenToFlowPosition } = useReactFlow();
    const { t } = useTranslation();
    const { showDBViews } = useLocalConfig();
    const { setEditTableModeTable } = useCanvas();

    const { isMd: isDesktop } = useBreakpoint('md');

    const createTableHandler = useCallback(
        async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            if (schemasDisplayed.length > 1) {
                openTableSchemaDialog({
                    onConfirm: async ({ schema }) => {
                        const newTable = await createTable({
                            x: position.x,
                            y: position.y,
                            schema: schema.name,
                        });
                        // Automatically enter edit mode for the newly created table
                        setEditTableModeTable({ tableId: newTable.id });
                    },
                    schemas: schemasDisplayed,
                });
            } else {
                const schema =
                    schemasDisplayed?.length === 1
                        ? schemasDisplayed[0]?.name
                        : undefined;
                const newTable = await createTable({
                    x: position.x,
                    y: position.y,
                    schema,
                });
                // Automatically enter edit mode for the newly created table
                setEditTableModeTable({ tableId: newTable.id });
            }
        },
        [
            createTable,
            screenToFlowPosition,
            openTableSchemaDialog,
            schemasDisplayed,
            setEditTableModeTable,
        ]
    );

    const createViewHandler = useCallback(
        async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            if (schemasDisplayed.length > 1) {
                openTableSchemaDialog({
                    onConfirm: async ({ schema }) => {
                        const newView = await createTable({
                            x: position.x,
                            y: position.y,
                            schema: schema.name,
                            isView: true,
                        });
                        // Automatically enter edit mode for the newly created view
                        setEditTableModeTable({ tableId: newView.id });
                    },
                    schemas: schemasDisplayed,
                });
            } else {
                const schema =
                    schemasDisplayed?.length === 1
                        ? schemasDisplayed[0]?.name
                        : undefined;
                const newView = await createTable({
                    x: position.x,
                    y: position.y,
                    schema,
                    isView: true,
                });
                // Automatically enter edit mode for the newly created view
                setEditTableModeTable({ tableId: newView.id });
            }
        },
        [
            createTable,
            screenToFlowPosition,
            openTableSchemaDialog,
            schemasDisplayed,
            setEditTableModeTable,
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

    const createRelationshipHandler = useCallback(() => {
        openCreateRelationshipDialog();
    }, [openCreateRelationshipDialog]);

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
                <ContextMenuItem
                    onClick={createAreaHandler}
                    className="flex justify-between gap-4"
                >
                    {t('canvas_context_menu.new_area')}
                    <Group className="size-3.5" />
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
