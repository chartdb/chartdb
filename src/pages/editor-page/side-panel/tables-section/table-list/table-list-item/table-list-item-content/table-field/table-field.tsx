import React from 'react';
import { Ellipsis, Trash2 } from 'lucide-react';
import { Input } from '@/components/input/input';
import { Combobox } from '@/components/combobox/combobox';
import { Button } from '@/components/button/button';
import { KeyRound } from 'lucide-react';
import { Separator } from '@/components/separator/separator';

import { DBField } from '@/lib/domain/db-field';
import { useChartDB } from '@/hooks/use-chartdb';
import { dataTypeMap } from '@/lib/data/data-types';
import { Toggle } from '@/components/toggle/toggle';
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

    const dataFieldOptions = dataTypeMap[databaseType].map((type) => ({
        label: type.name,
        value: type.id,
    }));

    return (
        <div className="flex flex-1 flex-row justify-between p-1">
            <div className="flex w-8/12 justify-start gap-1 overflow-hidden">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="w-7/12">
                            <Input
                                className="h-8 w-full !truncate focus-visible:ring-0"
                                type="text"
                                placeholder="Name"
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
                                placeholder="Type"
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
                            <Toggle
                                variant="default"
                                className="h-8 w-[32px] p-2 text-xs text-slate-500 hover:bg-primary-foreground hover:text-slate-700"
                                pressed={field.nullable}
                                onPressedChange={(value) =>
                                    updateField({
                                        nullable: value,
                                    })
                                }
                            >
                                N
                            </Toggle>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>Nullable?</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>
                            <Toggle
                                variant="default"
                                className="h-8 w-[32px] p-2 text-slate-500 hover:bg-primary-foreground hover:text-slate-700"
                                pressed={field.primaryKey}
                                onPressedChange={(value) =>
                                    updateField({
                                        unique: value,
                                        primaryKey: value,
                                    })
                                }
                            >
                                <KeyRound className="h-3.5" />
                            </Toggle>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>Primary Key</TooltipContent>
                </Tooltip>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-[32px] p-2 text-slate-500 hover:bg-primary-foreground hover:text-slate-700"
                        >
                            <Ellipsis className="size-3.5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52">
                        <div className="flex flex-col gap-2">
                            <div className="text-sm font-semibold">
                                Field Attributes
                            </div>
                            <Separator orientation="horizontal" />
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="width"
                                    className="text-gray-700"
                                >
                                    Unique
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
                            <Separator orientation="horizontal" />
                            <Button
                                variant="outline"
                                className="flex gap-2 !text-red-700"
                                onClick={removeField}
                            >
                                <Trash2 className="size-3.5 text-red-700" />
                                Delete field
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};
