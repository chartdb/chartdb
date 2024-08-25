import React from 'react';
import { Plus, FileType2, FileKey2 } from 'lucide-react';
import { Button } from '@/components/button/button';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/accordion/accordion';
import { Separator } from '@/components/separator/separator';
import { DBTable } from '@/lib/domain/db-table';
import { DBField } from '@/lib/domain/db-field';
import { useChartDB } from '@/hooks/use-chartdb';
import { TableField } from './table-field/table-field';
import { TableIndex } from './table-index/table-index';
import { DBIndex } from '@/lib/domain/db-index';

type AccordionItemValue = 'fields' | 'indexes';

export interface TableListItemContentProps {
    table: DBTable;
}

export const TableListItemContent: React.FC<TableListItemContentProps> = ({
    table,
}) => {
    const {
        updateField,
        removeField,
        createField,
        createIndex,
        removeIndex,
        updateIndex,
    } = useChartDB();
    const { color } = table;
    const [selectedItems, setSelectedItems] = React.useState<
        AccordionItemValue[]
    >(['fields']);

    const createIndexHandler = () => {
        setSelectedItems((prev) => {
            if (prev.includes('indexes')) {
                return prev;
            }

            return [...prev, 'indexes'];
        });

        createIndex(table.id);
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
                value={selectedItems}
                onValueChange={(value) =>
                    setSelectedItems(value as AccordionItemValue[])
                }
            >
                <AccordionItem value="fields" className="border-y-0 mb-2">
                    <AccordionTrigger
                        iconPosition="right"
                        className="p-0 px-2 text-xs text-slate-600 flex flex-1 hover:bg-secondary py-1 group"
                        asChild
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            createField(table.id);
                                        }}
                                    >
                                        <Plus className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col pb-0 pt-1">
                        {table.fields.map((field) => (
                            <TableField
                                key={field.id}
                                field={field}
                                updateField={(attrs: Partial<DBField>) =>
                                    updateField(table.id, field.id, attrs)
                                }
                                removeField={() =>
                                    removeField(table.id, field.id)
                                }
                            />
                        ))}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="indexes" className="border-y-0">
                    <AccordionTrigger
                        iconPosition="right"
                        className="p-0 px-2 text-xs text-slate-600 flex flex-1 hover:bg-secondary py-1 group"
                        asChild
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            createIndexHandler();
                                        }}
                                    >
                                        <Plus className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0 pt-1">
                        {table.indexes.map((index) => (
                            <TableIndex
                                key={index.id}
                                index={index}
                                removeIndex={() =>
                                    removeIndex(table.id, index.id)
                                }
                                updateIndex={(attrs: Partial<DBIndex>) =>
                                    updateIndex(table.id, index.id, attrs)
                                }
                                fields={table.fields}
                            />
                        ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <Separator className="" />
            <div className="flex items-center justify-between flex-1">
                <div>
                    <Button
                        variant="outline"
                        className="text-xs h-8 p-2"
                        onClick={createIndexHandler}
                    >
                        <FileKey2 className="h-4" />
                        Add Index
                    </Button>
                </div>
                <div>
                    <Button
                        variant="outline"
                        className="text-xs h-8 p-2"
                        onClick={() => createField(table.id)}
                    >
                        <FileType2 className="h-4" />
                        Add Field
                    </Button>
                </div>
            </div>
        </div>
    );
};
