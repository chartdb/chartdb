import React from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { TableListItem } from './table-list-item/table-list-item';

export interface TableListProps {}

export const TableList: React.FC<TableListProps> = () => {
    return (
        <div className="flex flex-col">
            <Accordion type="single" collapsible className="w-full">
                <TableListItem />
            </Accordion>
        </div>
    );
};
