import React from 'react';
import { Ellipsis, GripVertical, Trash2 } from 'lucide-react';
import { Input } from '@/components/input/input';
import { Combobox } from '@/components/combobox/combobox';
import { Button } from '@/components/button/button';
import { KeyRound } from 'lucide-react';
import { Separator } from '@/components/separator/separator';

import { DBField } from '@/lib/domain/db-field';
import { useChartDB } from '@/hooks/use-chartdb';
import { dataTypeMap } from '@/lib/data/data-types';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/popover/popover';
import { Label } from '@/components/label/label';
import { Checkbox } from '@/components/checkbox/checkbox';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/textarea/textarea';
import { TableFieldToggle } from './table-field-toggle';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface TableFieldProps {
    field: DBField;
    updateField: (attrs: Partial<DBField>) => void;
    removeField: () => void;
}

export const TableField: React.FC<TableFieldProps> = ({
    field,
    updateField,
    removeField,
}) => {
    const { databaseType } = useChartDB();
    const { t } = useTranslation();
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: field.id });

    const dataFieldOptions = dataTypeMap[databaseType].map((type) => ({
        label: type.name,
        value: type.id,
    }));

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            className="flex flex-1 touch-none flex-row justify-between p-1"
            ref={setNodeRef}
            style={style}
            {...attributes}
        >
            <div className="flex w-8/12 items-center justify-start gap-1 overflow-hidden">
                <div
                    className="flex w-4 shrink-0 cursor-move items-center justify-center"
                    {...listeners}
                >
                    <GripVertical className="size-3.5  text-muted-foreground" />
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="w-5/12">
                            <Input
                                className="h-8 w-full !truncate focus-visible:ring-0"
                                type="text"
                                placeholder={t(
                                    'side_panel.tables_section.table.field_name'
                                )}
                                value={field.name}
                                onChange={(e) =>
                                    updateField({
                                        name: e.target.value,
                                    })
                                }
                            />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>{field.name}</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger className="flex h-8 !w-5/12" asChild>
                        <span>
                            <Combobox
                                className="flex h-8 w-full"
                                mode="single"
                                options={dataFieldOptions}
                                placeholder={t(
                                    'side_panel.tables_section.table.field_type'
                                )}
                                selected={field.type.id}
                                onChange={(value) =>
                                    updateField({
                                        type: dataTypeMap[databaseType].find(
                                            (v) => v.id === value
                                        ),
                                    })
                                }
                                emptyText="No types found."
                            />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>{field.type.name}</TooltipContent>
                </Tooltip>
            </div>
            <div className="flex w-4/12 justify-end gap-1 overflow-hidden">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>
                            <TableFieldToggle
                                pressed={field.nullable}
                                onPressedChange={(value) =>
                                    updateField({
                                        nullable: value,
                                    })
                                }
                            >
                                N
                            </TableFieldToggle>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t('side_panel.tables_section.table.nullable')}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>
                            <TableFieldToggle
                                pressed={field.primaryKey}
                                onPressedChange={(value) =>
                                    updateField({
                                        unique: value,
                                        primaryKey: value,
                                    })
                                }
                            >
                                <KeyRound className="h-3.5" />
                            </TableFieldToggle>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t('side_panel.tables_section.table.primary_key')}
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
                                    'side_panel.tables_section.table.field_actions.title'
                                )}
                            </div>
                            <Separator orientation="horizontal" />
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="width"
                                        className="text-subtitle"
                                    >
                                        {t(
                                            'side_panel.tables_section.table.field_actions.unique'
                                        )}
                                    </Label>
                                    <Checkbox
                                        checked={field.unique}
                                        disabled={field.primaryKey}
                                        onCheckedChange={(value) =>
                                            updateField({
                                                unique: !!value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label
                                        htmlFor="width"
                                        className="text-subtitle"
                                    >
                                        {t(
                                            'side_panel.tables_section.table.field_actions.comments'
                                        )}
                                    </Label>
                                    <Textarea
                                        value={field.comments}
                                        onChange={(e) =>
                                            updateField({
                                                comments: e.target.value,
                                            })
                                        }
                                        placeholder={t(
                                            'side_panel.tables_section.table.field_actions.no_comments'
                                        )}
                                        className="w-full rounded-md bg-muted text-sm"
                                    />
                                </div>
                            </div>
                            <Separator orientation="horizontal" />
                            <Button
                                variant="outline"
                                className="flex gap-2 !text-red-700"
                                onClick={removeField}
                            >
                                <Trash2 className="size-3.5 text-red-700" />
                                {t(
                                    'side_panel.tables_section.table.field_actions.delete_field'
                                )}
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};
