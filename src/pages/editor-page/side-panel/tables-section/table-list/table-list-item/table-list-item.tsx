import React from 'react';
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/accordion/accordion';
import { randomHSLA } from '@/lib/utils';
import { TableListItemHeader } from './table-list-item-header/table-list-item-header';
import { TableListItemContent } from './table-list-item-content/table-list-item-content';

export interface TableListItemProps {}

export const TableListItem: React.FC<TableListItemProps> = () => {
    const tableColor = randomHSLA();
    return (
        <AccordionItem value="item-1">
            <AccordionTrigger
                className="hover:no-underline hover:bg-accent rounded-md px-2 border-l-[6px] py-0 data-[state=open]:rounded-b-none"
                style={{
                    borderColor: tableColor,
                }}
            >
                <TableListItemHeader />
            </AccordionTrigger>
            <AccordionContent>
                <TableListItemContent tableColor={tableColor} />
            </AccordionContent>
        </AccordionItem>
    );
};
