import React from 'react';
import { Ellipsis, Trash2 } from 'lucide-react';
import { Button } from '@/components/button/button';
import type { DBIndex } from '@/lib/domain/db-index';
import type { DBField } from '@/lib/domain/db-field';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/popover/popover';
import { Separator } from '@/components/separator/separator';
import { Checkbox } from '@/components/checkbox/checkbox';
import { Label } from '@/components/label/label';
import { Input } from '@/components/input/input';
import { useTranslation } from 'react-i18next';
import { SelectBox } from '@/components/select-box/select-box';
import { TableIndexToggle } from './table-index-toggle';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';

export interface TableIndexProps {
    index: DBIndex;
    updateIndex: (attrs: Partial<DBIndex>) => void;
    removeIndex: () => void;
    fields: DBField[];
}

export const TableIndex: React.FC<TableIndexProps> = ({
    fields,
    index,
    updateIndex,
    removeIndex,
}) => {
    const { t } = useTranslation();
    const fieldOptions = fields.map((field) => ({
        label: field.name,
        value: field.id,
    }));
    const updateIndexFields = (fieldIds: string | string[]) => {
        const ids = Array.isArray(fieldIds) ? fieldIds : [fieldIds];
        updateIndex({ fieldIds: ids });
    };
    return (
        <div className="flex flex-1 flex-row justify-between gap-2 p-1">
            <SelectBox
                className="flex h-8 min-h-8 min-w-0 flex-1"
                multiple
                oneLine
                options={fieldOptions}
                placeholder={t(
                    'side_panel.tables_section.table.index_select_fields'
                )}
                value={index.fieldIds}
                onChange={updateIndexFields}
                emptyPlaceholder={t(
                    'side_panel.tables_section.table.no_types_found'
                )}
                keepOrder
            />
            <div className="flex shrink-0 gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>
                            <TableIndexToggle
                                pressed={index.unique}
                                onPressedChange={(value) =>
                                    updateIndex({
                                        unique: !!value,
                                    })
                                }
                            >
                                U
                            </TableIndexToggle>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t(
                            'side_panel.tables_section.table.index_actions.unique'
                        )}
                    </TooltipContent>
                </Tooltip>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-[32px] p-2 text-slate-500 hover:bg-primary-foreground hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <Ellipsis className="size-3.5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52">
                        <div className="flex flex-col gap-2">
                            <div className="text-sm font-semibold">
                                {t(
                                    'side_panel.tables_section.table.index_actions.title'
                                )}
                            </div>
                            <Separator orientation="horizontal" />
                            <div className="flex flex-col gap-2">
                                <Label
                                    htmlFor="width"
                                    className="text-subtitle"
                                >
                                    {t(
                                        'side_panel.tables_section.table.index_actions.name'
                                    )}
                                </Label>
                                <Input
                                    value={index.name}
                                    onChange={(value) =>
                                        updateIndex({
                                            name: value.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                                <Label
                                    htmlFor="width"
                                    className="text-subtitle"
                                >
                                    {t(
                                        'side_panel.tables_section.table.index_actions.unique'
                                    )}
                                </Label>
                                <Checkbox
                                    checked={index.unique}
                                    onCheckedChange={(value) =>
                                        updateIndex({
                                            unique: !!value,
                                        })
                                    }
                                />
                            </div>
                            <Separator orientation="horizontal" />
                            <Button
                                variant="outline"
                                className="flex gap-2 !text-red-700"
                                onClick={removeIndex}
                            >
                                <Trash2 className="size-3.5 text-red-700" />
                                {t(
                                    'side_panel.tables_section.table.index_actions.delete_index'
                                )}
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};
