import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/components/context-menu/context-menu';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useChartDB } from '@/hooks/use-chartdb';
import { useLayout } from '@/hooks/use-layout';
import type { DBTable } from '@/lib/domain/db-table';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export interface TableNodeContextMenuProps {
    table: DBTable;
}

export const TableNodeContextMenu: React.FC<
    React.PropsWithChildren<TableNodeContextMenuProps>
> = ({ children, table }) => {
    // tableId is consciously extracted, to prevent relying on table object
    // reference inside callbacks to prevent leaks. We actually watch only tableId in them
    const tableId = table.id;

    const { removeTable, readonly, duplicateTable } = useChartDB();
    const { openTableFromSidebar } = useLayout();
    const { t } = useTranslation();
    const { isMd: isDesktop } = useBreakpoint('md');

    const editTableHandler = useCallback(() => {
        openTableFromSidebar(tableId);
    }, [openTableFromSidebar, tableId]);

    const removeTableHandler = useCallback(() => {
        removeTable(tableId);
    }, [removeTable, tableId]);

    const duplicateTableHandler = useCallback(() => {
        duplicateTable(tableId);
    }, [duplicateTable, tableId]);

    if (!isDesktop || readonly) {
        return <>{children}</>;
    }
    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={editTableHandler}>
                    {t('table_node_context_menu.edit_table')}
                </ContextMenuItem>
                <ContextMenuItem onClick={duplicateTableHandler}>
                    {t('table_node_context_menu.duplicate_table')}
                </ContextMenuItem>
                <ContextMenuItem
                    className="text-red-700"
                    onClick={removeTableHandler}
                >
                    {t('table_node_context_menu.delete_table')}
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
