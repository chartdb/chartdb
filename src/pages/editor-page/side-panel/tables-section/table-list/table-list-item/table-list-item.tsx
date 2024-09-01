import React from 'react';
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/accordion/accordion';
import { TableListItemHeader } from './table-list-item-header/table-list-item-header';
import { TableListItemContent } from './table-list-item-content/table-list-item-content';
import { DBTable } from '@/lib/domain/db-table';

export interface TableListItemProps {
    table: DBTable;
}

export const TableListItem = React.forwardRef<
    React.ElementRef<typeof AccordionItem>,
    TableListItemProps
>(({ table }, ref) => {
    return (
        <AccordionItem value={table.id} className="rounded-md" ref={ref}>
            <AccordionTrigger
                className="w-full rounded-md border-l-[6px] px-2 py-0 hover:bg-accent hover:no-underline data-[state=open]:rounded-b-none"
                style={{
                    borderColor: table.color,
                }}
                asChild
            >
                <TableListItemHeader table={table} />
            </AccordionTrigger>
            <AccordionContent>
                <TableListItemContent table={table} />
            </AccordionContent>
        </AccordionItem>
    );
});

TableListItem.displayName = 'TableListItem';
