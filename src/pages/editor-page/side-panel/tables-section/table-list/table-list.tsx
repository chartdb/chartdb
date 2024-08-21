import React from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { TableListItem } from './table-list-item/table-list-item';
import { DBTable } from '@/lib/domain/db-table';
import { useLayout } from '@/hooks/use-layout';

export interface TableListProps {
    tables: DBTable[];
}

export const TableList: React.FC<TableListProps> = ({ tables }) => {
    const { openTableFromSidebar, openedTableInSidebar } = useLayout();
    return (
        <Accordion
            type="single"
            collapsible
            className="flex flex-col w-full gap-1"
            value={openedTableInSidebar}
            onValueChange={openTableFromSidebar}
        >
            {tables.map((table) => (
                <TableListItem key={table.id} table={table} />
            ))}
        </Accordion>
    );
};
