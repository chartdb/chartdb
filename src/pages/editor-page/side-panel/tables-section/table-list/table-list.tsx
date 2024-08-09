import React from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { TableListItem } from './table-list-item/table-list-item';

export interface TableListProps {}

export const TableList: React.FC<TableListProps> = () => {
    return (
        <Accordion
            type="single"
            collapsible
            className="flex flex-col w-full gap-1"
        >
            <TableListItem />
        </Accordion>
    );
};
