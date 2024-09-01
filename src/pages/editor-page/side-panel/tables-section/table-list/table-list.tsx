import React, { useCallback, useEffect } from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { TableListItem } from './table-list-item/table-list-item';
import { DBTable } from '@/lib/domain/db-table';
import { useLayout } from '@/hooks/use-layout';

export interface TableListProps {
    tables: DBTable[];
}

export const TableList: React.FC<TableListProps> = ({ tables }) => {
    const { openTableFromSidebar, openedTableInSidebar } = useLayout();
    const refs = tables.reduce(
        (acc, table) => {
            acc[table.id] = React.createRef();
            return acc;
        },
        {} as Record<string, React.RefObject<HTMLDivElement>>
    );

    const scrollToTable = useCallback(
        (id: string) =>
            refs[id]?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            }),
        [refs]
    );

    useEffect(() => {
        if (openedTableInSidebar) {
            scrollToTable(openedTableInSidebar);
        }
    }, [openedTableInSidebar, scrollToTable]);

    return (
        <Accordion
            type="single"
            collapsible
            className="flex w-full flex-col gap-1"
            value={openedTableInSidebar}
            onValueChange={openTableFromSidebar}
        >
            {tables.map((table) => (
                <TableListItem
                    key={table.id}
                    table={table}
                    ref={refs[table.id]}
                />
            ))}
        </Accordion>
    );
};
