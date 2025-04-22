import React, { useCallback, useState } from 'react';
import type { NodeProps, Node } from '@xyflow/react';
import { NodeResizer } from '@xyflow/react';
import type { Area } from '@/lib/domain/area';
import { useChartDB } from '@/hooks/use-chartdb';
import { Input } from '@/components/input/input';
import { useClickAway, useKeyPressEvent } from 'react-use';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Check, GripVertical } from 'lucide-react';
import { Button } from '@/components/button/button';
import { useLayout } from '@/hooks/use-layout';

export type AreaNodeType = Node<
    {
        area: Area;
    },
    'area'
>;

export const AreaNode: React.FC<NodeProps<AreaNodeType>> = React.memo(
    ({ selected, dragging, data: { area } }) => {
        const { updateArea, readonly } = useChartDB();
        const { t } = useTranslation();
        const [editMode, setEditMode] = useState(false);
        const [areaName, setAreaName] = useState(area.name);
        const inputRef = React.useRef<HTMLInputElement>(null);
        const { openAreaFromSidebar, selectSidebarSection } = useLayout();

        const focused = !!selected && !dragging;

        const editAreaName = useCallback(() => {
            if (!editMode) return;
            if (areaName.trim()) {
                updateArea(area.id, { name: areaName.trim() });
            }
            setEditMode(false);
        }, [areaName, area.id, updateArea, editMode]);

        const abortEdit = useCallback(() => {
            setEditMode(false);
            setAreaName(area.name);
        }, [area.name]);

        const openAreaInEditor = useCallback(() => {
            selectSidebarSection('areas');
            openAreaFromSidebar(area.id);
        }, [selectSidebarSection, openAreaFromSidebar, area.id]);

        useClickAway(inputRef, editAreaName);
        useKeyPressEvent('Enter', editAreaName);
        useKeyPressEvent('Escape', abortEdit);

        const enterEditMode = (e: React.MouseEvent) => {
            e.stopPropagation();
            setEditMode(true);
        };

        return (
            <div
                className={cn(
                    'flex h-full flex-col rounded-md border-2 shadow-sm',
                    selected ? 'border-pink-600' : 'border-transparent'
                )}
                style={{
                    backgroundColor: `${area.color}15`,
                    borderColor: selected ? undefined : area.color,
                }}
                onClick={(e) => {
                    if (e.detail === 2) {
                        openAreaInEditor();
                    }
                }}
            >
                <NodeResizer
                    isVisible={focused}
                    lineClassName="!border-4 !border-transparent"
                    handleClassName="!h-3 !w-3 !rounded-full !bg-pink-600"
                />
                <div className="group flex h-8 items-center justify-between rounded-t-md px-2">
                    <div className="flex w-full items-center gap-1">
                        <GripVertical className="size-4 text-slate-700 opacity-60 dark:text-slate-300" />

                        {editMode && !readonly ? (
                            <div className="flex w-full items-center">
                                <Input
                                    ref={inputRef}
                                    autoFocus
                                    type="text"
                                    placeholder={area.name}
                                    value={areaName}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                        setAreaName(e.target.value)
                                    }
                                    className="h-6 bg-white/70 focus-visible:ring-0 dark:bg-slate-900/70"
                                />
                                <Button
                                    variant="ghost"
                                    className="ml-1 size-6 p-0 hover:bg-white/20"
                                    onClick={editAreaName}
                                >
                                    <Check className="size-3.5 text-slate-700 dark:text-slate-300" />
                                </Button>
                            </div>
                        ) : !readonly ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className="text-editable max-w-[200px] cursor-text truncate px-1 py-0.5 text-base font-semibold text-slate-700 dark:text-slate-300"
                                        onDoubleClick={enterEditMode}
                                    >
                                        {area.name}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {t('tool_tips.double_click_to_edit')}
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <div className="truncate px-1 py-0.5 text-base font-semibold text-slate-700 dark:text-slate-300">
                                {area.name}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1" />
            </div>
        );
    }
);

AreaNode.displayName = 'AreaNode';
