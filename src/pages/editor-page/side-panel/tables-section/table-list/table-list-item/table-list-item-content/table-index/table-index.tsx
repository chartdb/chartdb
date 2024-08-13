import React from 'react';
import { Ellipsis, Trash2 } from 'lucide-react';
import { Combobox } from '@/components/combobox/combobox';
import { Button } from '@/components/button/button';
import { DBIndex } from '@/lib/domain/db-index';
import { DBField } from '@/lib/domain/db-field';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/popover/popover';
import { Separator } from '@/components/separator/separator';
import { Checkbox } from '@/components/checkbox/checkbox';
import { Label } from '@/components/label/label';
import { Input } from '@/components/input/input';

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
    const fieldOptions = fields.map((field) => ({
        label: field.name,
        value: field.id,
    }));
    const updateIndexFields = (fieldIds: string | string[]) => {
        const ids = Array.isArray(fieldIds) ? fieldIds : [fieldIds];
        updateIndex({ fieldIds: ids });
    };
    return (
        <div className="flex flex-row p-1 justify-between flex-1 gap-2">
            <Combobox
                className="flex h-8 flex-1"
                popoverClassName="w-48"
                mode="multiple"
                options={fieldOptions}
                placeholder="Select fields"
                selected={index.fieldIds}
                onChange={updateIndexFields}
                emptyText="No types found."
            />
            <div className="flex">
                <Popover>
                    <PopoverTrigger>
                        <Button
                            variant="ghost"
                            className="hover:bg-primary-foreground p-2 w-[32px] text-slate-500 hover:text-slate-700 h-8"
                        >
                            <Ellipsis className="h-3.5 w-3.5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52">
                        <div className="flex gap-2 flex-col">
                            <div className="text-sm font-semibold">
                                Index Attributes
                            </div>
                            <Separator orientation="horizontal" />
                            <div className="flex flex-col gap-2">
                                <Label
                                    htmlFor="width"
                                    className="text-gray-700"
                                >
                                    Name
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
                            <div className="flex justify-between items-center mt-2">
                                <Label
                                    htmlFor="width"
                                    className="text-gray-700"
                                >
                                    Unique
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
                                className="flex !text-red-700 gap-2"
                                onClick={removeIndex}
                            >
                                <Trash2 className="text-red-700 w-3.5 h-3.5" />
                                Delete index
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};
