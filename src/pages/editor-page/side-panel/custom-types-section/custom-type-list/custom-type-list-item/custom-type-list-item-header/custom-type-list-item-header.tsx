import React, { useCallback } from 'react';
import {
    GripVertical,
    Pencil,
    EllipsisVertical,
    Trash2,
    Check,
} from 'lucide-react';
import { ListItemHeaderButton } from '@/pages/editor-page/side-panel/list-item-header-button/list-item-header-button';
import { Input } from '@/components/input/input';
import { useChartDB } from '@/hooks/use-chartdb';
import { useClickAway, useKeyPressEvent } from 'react-use';
import { useSortable } from '@dnd-kit/sortable';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { useTranslation } from 'react-i18next';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import {
    customTypeKindToLabel,
    DBCustomTypeKind,
    type DBCustomType,
} from '@/lib/domain/db-custom-type';
import { Badge } from '@/components/badge/badge';

export interface CustomTypeListItemHeaderProps {
    customType: DBCustomType;
}

export const CustomTypeListItemHeader: React.FC<
    CustomTypeListItemHeaderProps
> = ({ customType }) => {
    const { updateCustomType, removeCustomType, schemas, filteredSchemas } =
        useChartDB();
    const { t } = useTranslation();
    const [editMode, setEditMode] = React.useState(false);
    const [customTypeName, setCustomTypeName] = React.useState(customType.name);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { listeners } = useSortable({ id: customType.id });

    const editCustomTypeName = useCallback(() => {
        if (!editMode) return;
        if (customTypeName.trim()) {
            updateCustomType(customType.id, { name: customTypeName.trim() });
        }

        setEditMode(false);
    }, [customTypeName, customType.id, updateCustomType, editMode]);

    const abortEdit = useCallback(() => {
        setEditMode(false);
        setCustomTypeName(customType.name);
    }, [customType.name]);

    useClickAway(inputRef, editCustomTypeName);
    useKeyPressEvent('Enter', editCustomTypeName);
    useKeyPressEvent('Escape', abortEdit);

    const enterEditMode = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditMode(true);
    };

    const deleteCustomTypeHandler = useCallback(() => {
        removeCustomType(customType.id);
    }, [customType.id, removeCustomType]);

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
                            'side_panel.custom_types_section.custom_type.custom_type_actions.title'
                        )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={deleteCustomTypeHandler}
                            className="flex justify-between !text-red-700"
                        >
                            {t(
                                'side_panel.custom_types_section.custom_type.custom_type_actions.delete_custom_type'
                            )}
                            <Trash2 className="size-3.5 text-red-700" />
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        [deleteCustomTypeHandler, t]
    );

    let schemaToDisplay;

    if (schemas.length > 1 && !!filteredSchemas && filteredSchemas.length > 1) {
        schemaToDisplay = customType.schema;
    }

    return (
        <div className="group flex h-11 flex-1 items-center justify-between gap-1 overflow-hidden">
            <div
                className="flex cursor-move items-center justify-center"
                {...listeners}
            >
                <GripVertical className="size-4 text-muted-foreground" />
            </div>
            <div className="flex min-w-0 flex-1 px-1">
                {editMode ? (
                    <Input
                        ref={inputRef}
                        autoFocus
                        type="text"
                        placeholder={customType.name}
                        value={customTypeName}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setCustomTypeName(e.target.value)}
                        className="h-7 w-full focus-visible:ring-0"
                    />
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                onDoubleClick={enterEditMode}
                                className="text-editable truncate px-2 py-0.5"
                            >
                                {customType.name}
                                <span className="text-xs text-muted-foreground">
                                    {schemaToDisplay
                                        ? ` (${schemaToDisplay})`
                                        : ''}
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('tool_tips.double_click_to_edit')}
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
            <div className="flex flex-row-reverse items-center">
                {!editMode ? (
                    <>
                        <div>{renderDropDownMenu()}</div>
                        {customType.kind === DBCustomTypeKind.enum ? (
                            <Badge
                                variant="outline"
                                className="h-fit bg-background px-2 text-xs md:group-hover:hidden"
                            >
                                {customTypeKindToLabel[customType.kind]}
                            </Badge>
                        ) : null}
                        <div className="flex flex-row-reverse md:hidden md:group-hover:flex">
                            <ListItemHeaderButton onClick={enterEditMode}>
                                <Pencil />
                            </ListItemHeaderButton>
                        </div>
                    </>
                ) : (
                    <ListItemHeaderButton onClick={editCustomTypeName}>
                        <Check />
                    </ListItemHeaderButton>
                )}
            </div>
        </div>
    );
};
