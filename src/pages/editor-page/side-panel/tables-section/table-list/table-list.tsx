import React from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { TableListItem } from './table-list-item/table-list-item';
import { DBTable } from '@/lib/domain/db-table';

export interface TableListProps {
    tables: DBTable[];
}

export const TableList: React.FC<TableListProps> = ({ tables }) => {
    return (
        <Accordion
            type="single"
            collapsible
            className="flex flex-col w-full gap-1"
        >
            {tables.map((table) => (
                <TableListItem key={table.id} table={table} />
            ))}
        </Accordion>
    );
};
