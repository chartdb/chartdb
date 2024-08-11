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

export interface TableListItemContentProps {
    table: DBTable;
}

export const TableListItemContent: React.FC<TableListItemContentProps> = ({
    table,
}) => {
    const { color } = table;
    const renderField = () => {
        return (
            <div className="flex flex-row p-1 justify-between flex-1">
                <div className="flex basis-8/12 gap-1">
                    <Input
                        type="text"
                        placeholder="Name"
                        className="h-8 focus-visible:ring-0 basis-8/12"
                    />
                    <Combobox
                        className="flex h-8 basis-4/12"
                        mode="single"
                        options={[
                            {
                                label: 'small_int',
                                value: 'smallint',
                            },
                            {
                                label: 'json',
                                value: 'json',
                            },
                            {
                                label: 'jsonb',
                                value: 'jsonb',
                            },
                            {
                                label: 'varchar',
                                value: 'varchar',
                            },
                        ]}
                        placeholder="Type"
                        selected={''}
                        onChange={(value) => console.log(value)}
                        emptyText="No types found."
                    />
                </div>
                <div className="flex">
                    <Button
                        variant="ghost"
                        className="hover:bg-primary-foreground p-2 w-[32px] text-slate-500 hover:text-slate-700 text-xs h-8"
                    >
                        N
                    </Button>
                    <Button
                        variant="ghost"
                        className="hover:bg-primary-foreground p-2 w-[32px] text-slate-500 hover:text-slate-700 h-8"
                    >
                        <KeyRound className="h-3.5" />
                    </Button>
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
                        {renderField()}
                        {renderField()}
                        {renderField()}
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
