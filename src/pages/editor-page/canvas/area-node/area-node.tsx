import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
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
import {
    Check,
    GripVertical,
    Pencil,
    SquareMinus,
    SquarePlus,
} from 'lucide-react';
import { Button } from '@/components/button/button';
import { useLayout } from '@/hooks/use-layout';
import { AreaNodeContextMenu } from './area-node-context-menu';
import { useCanvas } from '@/hooks/use-canvas';
import { useDiff } from '@/context/diff-context/use-diff';
import { AreaNodeStatus } from './area-node-status/area-node-status';

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
        const { openAreaFromSidebar, selectSidebarSection, selectVisualsTab } =
            useLayout();

        const focused = !!selected && !dragging;

        const { checkIfNewArea, checkIfAreaRemoved } = useDiff();

        const [diffState, setDiffState] = useState<{
            isDiffNewArea: boolean;
            isDiffAreaRemoved: boolean;
        }>({
            isDiffNewArea: false,
            isDiffAreaRemoved: false,
        });

        const hasMountedRef = useRef(false);

        useEffect(() => {
            const calculateDiff = () => {
                setDiffState({
                    isDiffNewArea: checkIfNewArea({ areaId: area.id }),
                    isDiffAreaRemoved: checkIfAreaRemoved({ areaId: area.id }),
                });
            };

            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                requestAnimationFrame(calculateDiff);
            } else {
                calculateDiff();
            }
        }, [checkIfNewArea, checkIfAreaRemoved, area.id]);

        const { isDiffNewArea, isDiffAreaRemoved } = diffState;

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
            selectSidebarSection('visuals');
            selectVisualsTab('areas');
            openAreaFromSidebar(area.id);
        }, [
            selectSidebarSection,
            openAreaFromSidebar,
            area.id,
            selectVisualsTab,
        ]);

        useClickAway(inputRef, editAreaName);
        useKeyPressEvent('Enter', editAreaName);
        useKeyPressEvent('Escape', abortEdit);

        const { setEditTableModeTable } = useCanvas();

        const enterEditMode = (e: React.MouseEvent) => {
            e.stopPropagation();
            setEditMode(true);
        };

        const containerClassName = useMemo(
            () =>
                cn(
                    'relative flex h-full flex-col rounded-md border-2 shadow-sm',
                    selected ? 'border-pink-600' : 'border-transparent',
                    isDiffNewArea
                        ? 'outline outline-[3px] outline-green-500 dark:outline-green-900 outline-offset-[5px]'
                        : '',
                    isDiffAreaRemoved
                        ? 'outline outline-[3px] outline-red-500 dark:outline-red-900 outline-offset-[5px]'
                        : ''
                ),
            [selected, isDiffNewArea, isDiffAreaRemoved]
        );

        return (
            <AreaNodeContextMenu
                area={area}
                onEditName={() => setEditMode(true)}
            >
                <div
                    className={containerClassName}
                    style={{
                        backgroundColor: `${area.color}15`,
                        borderColor: selected ? undefined : area.color,
                    }}
                    onClick={(e) => {
                        setEditTableModeTable(null);
                        if (e.detail === 2) {
                            openAreaInEditor();
                        }
                    }}
                >
                    <AreaNodeStatus
                        status={
                            isDiffNewArea
                                ? 'new'
                                : isDiffAreaRemoved
                                  ? 'removed'
                                  : 'none'
                        }
                    />
                    {!readonly ? (
                        <NodeResizer
                            isVisible={focused}
                            lineClassName="!border-4 !border-transparent"
                            handleClassName="!h-[10px] !w-[10px] !rounded-full !bg-pink-600"
                            minHeight={100}
                            minWidth={100}
                        />
                    ) : null}
                    <div className="group flex h-8 items-center justify-between rounded-t-md px-2">
                        <div className="flex w-full items-center gap-1">
                            {isDiffNewArea ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <SquarePlus
                                            className="size-3.5 shrink-0 text-green-600"
                                            strokeWidth={2.5}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>New Area</TooltipContent>
                                </Tooltip>
                            ) : isDiffAreaRemoved ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <SquareMinus
                                            className="size-3.5 shrink-0 text-red-600"
                                            strokeWidth={2.5}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Area Removed
                                    </TooltipContent>
                                </Tooltip>
                            ) : (
                                <GripVertical className="size-3.5 shrink-0 text-slate-700 opacity-60 dark:text-slate-300" />
                            )}

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
                            ) : isDiffNewArea ? (
                                <div
                                    className={cn(
                                        'flex h-5 items-center truncate rounded-sm bg-green-200 px-2 py-0.5 text-sm font-normal text-green-900 dark:bg-green-800 dark:text-green-200'
                                    )}
                                >
                                    {area.name}
                                </div>
                            ) : isDiffAreaRemoved ? (
                                <div
                                    className={cn(
                                        'flex h-5 items-center truncate rounded-sm bg-red-200 px-2 py-0.5 text-sm font-normal text-red-900 dark:bg-red-800 dark:text-red-200'
                                    )}
                                >
                                    {area.name}
                                </div>
                            ) : !readonly ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="text-editable truncate px-1 py-0.5 text-base font-semibold text-slate-700 dark:text-slate-300"
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
                            {!editMode &&
                                !readonly &&
                                !isDiffNewArea &&
                                !isDiffAreaRemoved && (
                                    <Button
                                        variant="ghost"
                                        className="ml-auto size-5 p-0 opacity-0 transition-opacity hover:bg-white/20 group-hover:opacity-100"
                                        onClick={enterEditMode}
                                    >
                                        <Pencil className="size-3 text-slate-700 dark:text-slate-300" />
                                    </Button>
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
