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
import { Table, Workflow, Group } from 'lucide-react';

export const CanvasContextMenu: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { createTable, filteredSchemas, schemas, readonly, createArea } =
        useChartDB();
    const { openCreateRelationshipDialog, openTableSchemaDialog } = useDialog();
    const { screenToFlowPosition } = useReactFlow();
    const { t } = useTranslation();

    const { isMd: isDesktop } = useBreakpoint('md');

    const createTableHandler = useCallback(
        (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            if ((filteredSchemas?.length ?? 0) > 1) {
                openTableSchemaDialog({
                    onConfirm: (schema) =>
                        createTable({
                            x: position.x,
                            y: position.y,
                            schema,
                        }),
                    schemas: schemas.filter((schema) =>
                        filteredSchemas?.includes(schema.id)
                    ),
                });
            } else {
                const schema =
                    filteredSchemas?.length === 1
                        ? schemas.find((s) => s.id === filteredSchemas[0])?.name
                        : undefined;
                createTable({
                    x: position.x,
                    y: position.y,
                    schema,
                });
            }
        },
        [
            createTable,
            screenToFlowPosition,
            openTableSchemaDialog,
            schemas,
            filteredSchemas,
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

    if (!isDesktop || readonly) {
        return <>{children}</>;
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem
                    onClick={createTableHandler}
                    className="flex justify-between gap-4"
                >
                    {t('canvas_context_menu.new_table')}
                    <Table className="size-3.5" />
                </ContextMenuItem>
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
