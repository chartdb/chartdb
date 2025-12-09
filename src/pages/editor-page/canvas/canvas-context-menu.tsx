import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/context-menu/context-menu';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useChartDB } from '@/hooks/use-chartdb';
import { useDialog } from '@/hooks/use-dialog';
import { useReactFlow } from '@xyflow/react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Workflow, Group, View, StickyNote, Import } from 'lucide-react';
import { useDiagramFilter } from '@/context/diagram-filter-context/use-diagram-filter';
import { useLocalConfig } from '@/hooks/use-local-config';
import { useCanvas } from '@/hooks/use-canvas';
import { defaultSchemas } from '@/lib/data/default-schemas';

export const CanvasContextMenu: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { createTable, readonly, createArea, databaseType, createNote } =
        useChartDB();
    const { schemasDisplayed } = useDiagramFilter();
    const { openCreateRelationshipDialog, openImportDatabaseDialog } =
        useDialog();
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

            // Auto-select schema with priority: default schema > first displayed schema > undefined
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

            // Auto-select schema with priority: default schema > first displayed schema > undefined
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

    const importSqlDbmlHandler = useCallback(() => {
        // Defer dialog opening to prevent Radix UI context menu/dialog portal conflicts
        queueMicrotask(() => {
            openImportDatabaseDialog({
                databaseType,
                importMethods: ['ddl', 'dbml'],
            });
        });
    }, [openImportDatabaseDialog, databaseType]);

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
                </ContextMenuItem>{' '}
                <ContextMenuSeparator />
                <ContextMenuItem
                    onClick={importSqlDbmlHandler}
                    className="flex justify-between gap-4"
                >
                    Import SQL/DBML
                    <Import className="size-3.5" />
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
