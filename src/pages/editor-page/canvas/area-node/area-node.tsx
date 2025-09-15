import React, { useCallback, useState, useEffect } from 'react';
import { useEditClickOutside } from '@/hooks/use-click-outside';
import type { NodeProps, Node } from '@xyflow/react';
import { NodeResizer } from '@xyflow/react';
import type { Area } from '@/lib/domain/area';
import { useChartDB } from '@/hooks/use-chartdb';
import { Input } from '@/components/input/input';
import { useKeyPressEvent } from 'react-use';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Check, GripVertical, Pencil } from 'lucide-react';
import { Button } from '@/components/button/button';
import { useLayout } from '@/hooks/use-layout';
import { AreaNodeContextMenu } from './area-node-context-menu';

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
            if (areaName.trim()) {
                updateArea(area.id, { name: areaName.trim() });
            }
            setEditMode(false);
        }, [areaName, area.id, updateArea]);

        const abortEdit = useCallback(() => {
            setEditMode(false);
            setAreaName(area.name);
        }, [area.name]);

        const openAreaInEditor = useCallback(() => {
            selectSidebarSection('areas');
            openAreaFromSidebar(area.id);
        }, [selectSidebarSection, openAreaFromSidebar, area.id]);

        // Handle click outside to save and exit edit mode
        useEditClickOutside(inputRef, editMode, editAreaName);

        useKeyPressEvent('Enter', editAreaName);
        useKeyPressEvent('Escape', abortEdit);

        const enterEditMode = useCallback(
            (e?: React.MouseEvent) => {
                e?.stopPropagation();
                setAreaName(area.name); // Reset to current name
                setEditMode(true);
            },
            [area.name]
        );

        useEffect(() => {
            if (editMode) {
                // Small delay to ensure the input is rendered
                const timeoutId = setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                        inputRef.current.select();
                    }
                }, 50); // Slightly longer delay to ensure DOM is ready

                return () => clearTimeout(timeoutId);
            }
        }, [editMode]);

        return (
            <AreaNodeContextMenu area={area} onEditName={enterEditMode}>
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
                    {!readonly ? (
                        <NodeResizer
                            isVisible={focused}
                            lineClassName="!border-4 !border-transparent"
                            handleClassName="!h-[18px] !w-[18px] !rounded-full !bg-pink-600"
                            minHeight={100}
                            minWidth={100}
                        />
                    ) : null}
                    <div className="group flex h-8 items-center justify-between rounded-t-md px-2">
                        <div className="flex w-full items-center gap-1">
                            <GripVertical className="size-4 shrink-0 text-slate-700 opacity-60 dark:text-slate-300" />

                            {editMode && !readonly ? (
                                <div className="flex min-w-0 flex-1 items-center">
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
                                        style={{
                                            width: `${Math.max(
                                                areaName.length * 8 + 20,
                                                80
                                            )}px`,
                                            maxWidth: '100%',
                                        }}
                                    />
                                    <Button
                                        variant="ghost"
                                        className="ml-1 size-6 shrink-0 p-0 hover:bg-white/20"
                                        onClick={editAreaName}
                                    >
                                        <Check className="size-3.5 text-slate-700 dark:text-slate-300" />
                                    </Button>
                                </div>
                            ) : !readonly ? (
                                <div className="flex min-w-0 flex-1 items-center">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="text-editable cursor-text truncate px-1 py-0.5 text-base font-semibold text-slate-700 dark:text-slate-300"
                                                onDoubleClick={enterEditMode}
                                            >
                                                {area.name}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {t(
                                                'tool_tips.double_click_to_edit'
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                    <Button
                                        variant="ghost"
                                        className="ml-1 size-5 shrink-0 p-0 opacity-0 transition-opacity hover:bg-white/20 group-hover:opacity-100"
                                        onClick={enterEditMode}
                                    >
                                        <Pencil className="size-3 text-slate-700 dark:text-slate-300" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="truncate px-1 py-0.5 text-base font-semibold text-slate-700 dark:text-slate-300">
                                    {area.name}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1" />
                </div>
            </AreaNodeContextMenu>
        );
    }
);

AreaNode.displayName = 'AreaNode';
