import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/components/context-menu/context-menu';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useChartDB } from '@/hooks/use-chartdb';
import type { Area } from '@/lib/domain/area';
import { Pencil, Trash2 } from 'lucide-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export interface AreaNodeContextMenuProps {
    area: Area;
    onEditName?: () => void;
}

export const AreaNodeContextMenu: React.FC<
    React.PropsWithChildren<AreaNodeContextMenuProps>
> = ({ children, area, onEditName }) => {
    const { removeArea, readonly } = useChartDB();
    const { t } = useTranslation();
    const { isMd: isDesktop } = useBreakpoint('md');

    const removeAreaHandler = useCallback(() => {
        removeArea(area.id);
    }, [removeArea, area.id]);

    if (!isDesktop || readonly) {
        return <>{children}</>;
    }
    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent>
                {onEditName && (
                    <ContextMenuItem
                        onClick={onEditName}
                        className="flex justify-between gap-3"
                    >
                        <span>
                            {t('area_node_context_menu.edit_area_name')}
                        </span>
                        <Pencil className="size-3.5" />
                    </ContextMenuItem>
                )}
                <ContextMenuItem
                    onClick={removeAreaHandler}
                    className="flex justify-between gap-3"
                >
                    <span>{t('area_node_context_menu.delete_area')}</span>
                    <Trash2 className="size-3.5 text-red-700" />
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
