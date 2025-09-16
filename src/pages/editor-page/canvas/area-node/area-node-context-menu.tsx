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

export interface AreaNodeContextMenuProps {
    area: Area;
    onEditName?: () => void;
}

export const AreaNodeContextMenu: React.FC<
    React.PropsWithChildren<AreaNodeContextMenuProps>
> = ({ children, area, onEditName }) => {
    const { removeArea, readonly } = useChartDB();
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
                {onEditName ? (
                    <ContextMenuItem
                        onClick={onEditName}
                        className="flex justify-between gap-3"
                    >
                        <span>Edit Area Name</span>
                        <Pencil className="size-3.5" />
                    </ContextMenuItem>
                ) : null}
                <ContextMenuItem
                    onClick={removeAreaHandler}
                    className="flex justify-between gap-3"
                >
                    <span>Delete Area</span>
                    <Trash2 className="size-3.5 text-red-700" />
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
