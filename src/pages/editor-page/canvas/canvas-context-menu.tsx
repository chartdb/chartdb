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

export const CanvasContextMenu: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { createTable, filteredSchemas, schemas, readonly } = useChartDB();
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
                <ContextMenuItem onClick={createTableHandler}>
                    {t('canvas_context_menu.new_table')}
                </ContextMenuItem>
                <ContextMenuItem onClick={createRelationshipHandler}>
                    {t('canvas_context_menu.new_relationship')}
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
