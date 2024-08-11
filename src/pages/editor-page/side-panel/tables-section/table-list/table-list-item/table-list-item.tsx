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

export const TableListItem: React.FC<TableListItemProps> = ({ table }) => {
    const { id, color } = table;
    return (
        <AccordionItem value={id} className="rounded-md">
            <AccordionTrigger
                className="hover:no-underline hover:bg-accent rounded-md px-2 border-l-[6px] py-0 data-[state=open]:rounded-b-none"
                style={{
                    borderColor: color,
                }}
            >
                <TableListItemHeader table={table} />
            </AccordionTrigger>
            <AccordionContent>
                <TableListItemContent table={table} />
            </AccordionContent>
        </AccordionItem>
    );
};
