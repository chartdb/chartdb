import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/components/context-menu/context-menu';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useChartDB } from '@/hooks/use-chartdb';
import { useLayout } from '@/hooks/use-layout';
import { cloneTable } from '@/lib/clone';
import type { DBTable } from '@/lib/domain/db-table';
import { Copy, Pencil, Trash2, Workflow } from 'lucide-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDialog } from '@/hooks/use-dialog';

export interface TableNodeContextMenuProps {
    table: DBTable;
}

export const TableNodeContextMenu: React.FC<
    React.PropsWithChildren<TableNodeContextMenuProps>
> = ({ children, table }) => {
    const { removeTable, readonly, createTable } = useChartDB();
    const { openTableFromSidebar } = useLayout();
    const { t } = useTranslation();
    const { isMd: isDesktop } = useBreakpoint('md');
    const { openCreateRelationshipDialog } = useDialog();

    const duplicateTableHandler = useCallback(() => {
        const clonedTable = cloneTable(table);

        clonedTable.name = `${clonedTable.name}_copy`;
        clonedTable.x += 30;
        clonedTable.y += 50;

        createTable(clonedTable);
    }, [createTable, table]);

    const editTableHandler = useCallback(() => {
        openTableFromSidebar(table.id);
    }, [openTableFromSidebar, table.id]);

    const removeTableHandler = useCallback(() => {
        removeTable(table.id);
    }, [removeTable, table.id]);

    const addRelationshipHandler = useCallback(() => {
        openCreateRelationshipDialog({
            sourceTableId: table.id,
        });
    }, [openCreateRelationshipDialog, table.id]);

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
