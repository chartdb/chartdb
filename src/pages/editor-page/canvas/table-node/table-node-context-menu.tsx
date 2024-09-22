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
    const { removeTable } = useChartDB();
    const { openTableFromSidebar } = useLayout();
    const { t } = useTranslation();
    const { isMd: isDesktop } = useBreakpoint('md');

    const editTableHandler = useCallback(() => {
        openTableFromSidebar(table.id);
    }, [openTableFromSidebar, table.id]);

    const removeTableHandler = useCallback(() => {
        removeTable(table.id);
    }, [removeTable, table.id]);

    if (!isDesktop) {
        return <>{children}</>;
    }
    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={editTableHandler}>
                    {t('table_node_context_menu.edit_table')}
                </ContextMenuItem>
                <ContextMenuItem onClick={removeTableHandler}>
                    {t('table_node_context_menu.delete_table')}
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
