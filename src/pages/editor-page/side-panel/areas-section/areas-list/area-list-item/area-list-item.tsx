import React, { useCallback } from 'react';
import {
    GripVertical,
    Pencil,
    Check,
    Trash2,
    EllipsisVertical,
    CircleDotDashed,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Area } from '@/lib/domain/area';
import { Input } from '@/components/input/input';
import { useChartDB } from '@/hooks/use-chartdb';
import { useClickAway, useKeyPressEvent } from 'react-use';
import { useTranslation } from 'react-i18next';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { ColorPicker } from '@/components/color-picker/color-picker';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { ListItemHeaderButton } from '@/pages/editor-page/side-panel/list-item-header-button/list-item-header-button';
import { mergeRefs } from '@/lib/utils';
import { useReactFlow } from '@xyflow/react';
import { useLayout } from '@/hooks/use-layout';
import { useBreakpoint } from '@/hooks/use-breakpoint';

export interface AreaListItemProps {
    area: Area;
}

export const AreaListItem = React.forwardRef<HTMLDivElement, AreaListItemProps>(
    ({ area }, forwardedRef) => {
        const { updateArea, removeArea } = useChartDB();
        const { t } = useTranslation();
        const { fitView, setNodes } = useReactFlow();
        const { hideSidePanel } = useLayout();
        const { isMd: isDesktop } = useBreakpoint('md');
        const [editMode, setEditMode] = React.useState(false);
        const [areaName, setAreaName] = React.useState(area.name);
        const inputRef = React.useRef<HTMLInputElement>(null);

        const { attributes, listeners, setNodeRef, transform, transition } =
            useSortable({
                id: area.id,
            });

        // Merge the forwarded ref with the sortable ref
        const combinedRef = mergeRefs<HTMLDivElement>(forwardedRef, setNodeRef);

        const style = {
            transform: CSS.Translate.toString(transform),
            transition,
        };

        const saveAreaName = useCallback(() => {
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

        const enterEditMode = useCallback((e: React.MouseEvent) => {
            e.stopPropagation();
            setEditMode(true);
        }, []);

        const handleDelete = useCallback(() => {
            removeArea(area.id);
        }, [area.id, removeArea]);

        const handleColorChange = useCallback(
            (color: string) => {
                updateArea(area.id, { color });
            },
            [area.id, updateArea]
        );

        const focusOnArea = useCallback(
            (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                event.stopPropagation();
                setNodes((nodes) =>
                    nodes.map((node) =>
                        node.id == area.id
                            ? {
                                  ...node,
                                  selected: true,
                              }
                            : {
                                  ...node,
                                  selected: false,
                              }
                    )
                );
                fitView({
                    duration: 500,
                    maxZoom: 1,
                    minZoom: 1,
                    nodes: [
                        {
                            id: area.id,
                        },
                    ],
                });

                if (!isDesktop) {
                    hideSidePanel();
                }
            },
            [fitView, area.id, setNodes, hideSidePanel, isDesktop]
        );

        useClickAway(inputRef, saveAreaName);
        useKeyPressEvent('Enter', saveAreaName);
        useKeyPressEvent('Escape', abortEdit);

        const renderDropDownMenu = useCallback(
            () => (
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <ListItemHeaderButton>
                            <EllipsisVertical />
                        </ListItemHeaderButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-fit min-w-40">
                        <DropdownMenuLabel>
                            {t(
                                'side_panel.areas_section.area.area_actions.title'
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                className="flex justify-between gap-4"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    enterEditMode(e);
                                }}
                            >
                                {t(
                                    'side_panel.areas_section.area.area_actions.edit_name'
                                )}
                                <Pencil className="size-3.5" />
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onClick={handleDelete}
                                className="flex justify-between !text-red-700"
                            >
                                {t(
                                    'side_panel.areas_section.area.area_actions.delete_area'
                                )}
                                <Trash2 className="size-3.5 text-red-700" />
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            [enterEditMode, handleDelete, t]
        );

        return (
            <div
                className="w-full rounded-md border border-border hover:bg-accent/5"
                ref={combinedRef}
                style={{
                    ...style,
                    borderLeftWidth: '6px',
                    borderLeftColor: area.color,
                }}
                {...attributes}
            >
                <div className="group flex h-11 items-center justify-between gap-1 overflow-hidden p-2">
                    <div
                        className="flex cursor-move items-center justify-center"
                        {...listeners}
                    >
                        <GripVertical className="size-4 text-muted-foreground" />
                    </div>

                    <div className="flex min-w-0 flex-1">
                        {editMode ? (
                            <Input
                                ref={inputRef}
                                autoFocus
                                type="text"
                                placeholder={area.name}
                                value={areaName}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setAreaName(e.target.value)}
                                className="h-7 w-full focus-visible:ring-0"
                            />
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        onDoubleClick={enterEditMode}
                                        className="text-editable truncate px-2 py-0.5 text-sm font-medium"
                                    >
                                        {area.name}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {t('tool_tips.double_click_to_edit')}
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {!editMode ? (
                            <div className="flex flex-row-reverse items-center gap-1">
                                {renderDropDownMenu()}
                                <ColorPicker
                                    color={area.color}
                                    onChange={handleColorChange}
                                />
                                <div className="hidden md:group-hover:flex">
                                    <ListItemHeaderButton onClick={focusOnArea}>
                                        <CircleDotDashed />
                                    </ListItemHeaderButton>
                                </div>
                            </div>
                        ) : (
                            <ListItemHeaderButton onClick={saveAreaName}>
                                <Check />
                            </ListItemHeaderButton>
                        )}
                    </div>
                </div>
            </div>
        );
    }
);

AreaListItem.displayName = 'AreaListItem';
