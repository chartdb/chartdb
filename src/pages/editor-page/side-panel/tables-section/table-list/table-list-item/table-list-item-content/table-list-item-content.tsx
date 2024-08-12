import React from 'react';
import { Ellipsis, Trash2, Plus, FileType2, FileKey2 } from 'lucide-react';
import { Input } from '@/components/input/input';
import { Combobox } from '@/components/combobox/combobox';
import { Button } from '@/components/button/button';
import { KeyRound } from 'lucide-react';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/accordion/accordion';
import { Separator } from '@/components/separator/separator';
import { DBTable } from '@/lib/domain/db-table';
import { DBField, FieldType } from '@/lib/domain/db-field';
import { useChartDB } from '@/hooks/use-chartdb';
import { dataTypeMap } from '@/lib/data/data-types';
import { Toggle } from '@/components/toggle/toggle';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';

export interface TableListItemContentProps {
    table: DBTable;
}

export const TableListItemContent: React.FC<TableListItemContentProps> = ({
    table,
}) => {
    const { databaseType, updateField } = useChartDB();
    const { color } = table;

    const dataFieldOptions = dataTypeMap[databaseType].map((type) => ({
        label: type,
        value: type,
    }));

    const RenderField = ({ field }: { field: DBField }) => {
        return (
            <div className="flex flex-row p-1 justify-between flex-1">
                <div className="flex basis-8/12 gap-1">
                    <Input
                        className="h-8 focus-visible:ring-0 basis-8/12"
                        type="text"
                        placeholder="Name"
                        value={field.name}
                        onChange={(e) =>
                            updateField(table.id, field.id, {
                                name: e.target.value,
                            })
                        }
                    />
                    <Combobox
                        className="flex h-8 basis-4/12"
                        mode="single"
                        options={dataFieldOptions}
                        placeholder="Type"
                        selected={field.type}
                        onChange={(value) =>
                            updateField(table.id, field.id, {
                                type: value as FieldType,
                            })
                        }
                        emptyText="No types found."
                    />
                </div>
                <div className="flex gap-1">
                    <Tooltip>
                        <TooltipTrigger>
                            <Toggle
                                variant="default"
                                className="hover:bg-primary-foreground p-2 w-[32px] text-slate-500 hover:text-slate-700 text-xs h-8"
                                pressed={field.nullable}
                                onPressedChange={(value) =>
                                    updateField(table.id, field.id, {
                                        nullable: value,
                                    })
                                }
                            >
                                N
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>Nullable?</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger>
                            <Toggle
                                variant="default"
                                className="hover:bg-primary-foreground p-2 w-[32px] text-slate-500 hover:text-slate-700 h-8"
                                pressed={field.primaryKey}
                                onPressedChange={(value) =>
                                    updateField(table.id, field.id, {
                                        primaryKey: value,
                                    })
                                }
                            >
                                <KeyRound className="h-3.5" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>Primary Key</TooltipContent>
                    </Tooltip>
                    <Button
                        variant="ghost"
                        className="hover:bg-primary-foreground p-2 w-[32px] text-slate-500 hover:text-slate-700 h-8"
                    >
                        <Ellipsis className="h-3.5" />
                    </Button>
                </div>
            </div>
        );
    };

    const renderIndex = () => {
        return (
            <div className="flex flex-row p-1 justify-between flex-1 gap-2">
                <Combobox
                    className="flex h-8 flex-1"
                    mode="multiple"
                    options={[
                        {
                            label: 'name',
                            value: 'name',
                        },
                        {
                            label: 'address',
                            value: 'address',
                        },
                    ]}
                    placeholder="Select fields"
                    selected={['name', 'address']}
                    onChange={(value) => console.log(value)}
                    emptyText="No types found."
                />
                <div className="flex">
                    <Button
                        variant="ghost"
                        className="hover:bg-primary-foreground p-2 w-[32px] text-slate-500 hover:text-slate-700 h-8"
                    >
                        <Ellipsis className="h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        className="hover:bg-primary-foreground p-2 w-8 text-slate-500 hover:text-slate-700 h-8"
                    >
                        <Trash2 className="h-3.5 w-3.5 text-red-700" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div
            className="border-l-[6px] rounded-b-md px-1 flex flex-col gap-1"
            style={{
                borderColor: color,
            }}
        >
            <Accordion
                type="multiple"
                className="w-full"
                defaultValue={['fields']}
            >
                <AccordionItem value="fields" className="border-y-0 mb-2">
                    <AccordionTrigger
                        iconPosition="right"
                        className="p-0 px-2 text-xs text-slate-600 flex flex-1 hover:bg-secondary py-1 group"
                    >
                        <div className="flex items-center justify-between flex-1">
                            <div className="flex flex-row items-center gap-1">
                                <FileType2 className="h-4 w-4" />
                                Fields
                            </div>
                            <div className="flex flex-row-reverse">
                                <div className="hidden group-hover:flex flex-row-reverse">
                                    <Button
                                        variant="ghost"
                                        className="hover:bg-primary-foreground p-0 h-4 w-4  text-slate-500 hover:text-slate-700 text-xs"
                                    >
                                        <Plus className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0 pt-1">
                        {table.fields.map((field) => (
                            <RenderField field={field} key={field.id} />
                        ))}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="indexes" className="border-y-0">
                    <AccordionTrigger
                        iconPosition="right"
                        className="p-0 px-2 text-xs text-slate-600 flex flex-1 hover:bg-secondary py-1 group"
                    >
                        <div className="flex items-center justify-between flex-1">
                            <div className="flex flex-row items-center gap-1">
                                <FileKey2 className="h-4 w-4" />
                                Indexes
                            </div>
                            <div className="flex flex-row-reverse">
                                <div className="hidden group-hover:flex flex-row-reverse">
                                    <Button
                                        variant="ghost"
                                        className="hover:bg-primary-foreground p-0 h-4 w-4  text-slate-500 hover:text-slate-700 text-xs"
                                    >
                                        <Plus className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0 pt-1">
                        {renderIndex()}
                        {renderIndex()}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <Separator className="" />
            <div className="flex items-center justify-between flex-1">
                <div>
                    <Button variant="outline" className="text-xs h-8 p-2">
                        <FileKey2 className="h-4" />
                        Add Index
                    </Button>
                </div>
                <div>
                    <Button variant="outline" className="text-xs h-8 p-2">
                        <FileType2 className="h-4" />
                        Add Field
                    </Button>
                </div>
            </div>
        </div>
    );
};
