import React, { useCallback, useMemo } from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { TableListItem } from './table-list-item/table-list-item';
import type { DBTable } from '@/lib/domain/db-table';
import { useLayout } from '@/hooks/use-layout';

export interface TableListProps {
    tables: DBTable[];
}

export const TableList: React.FC<TableListProps> = ({ tables }) => {
    const { openTableFromSidebar, openedTableInSidebar } = useLayout();
    const lastOpenedTable = React.useRef<string | null>(null);
    const refs = useMemo(
        () =>
            tables.reduce(
                (acc, table) => {
                    acc[table.id] = React.createRef();
                    return acc;
                },
                {} as Record<string, React.RefObject<HTMLDivElement>>
            ),
        [tables]
    );

    const scrollToTable = useCallback(
        (id: string) =>
            refs[id]?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            }),
        [refs]
    );

    const handleScrollToTable = useCallback(() => {
        if (
            openedTableInSidebar &&
            lastOpenedTable.current !== openedTableInSidebar
        ) {
            lastOpenedTable.current = openedTableInSidebar;
            scrollToTable(openedTableInSidebar);
        }
    }, [scrollToTable, openedTableInSidebar]);

    return (
        <Accordion
            type="single"
            collapsible
            className="flex w-full flex-col gap-1"
            value={openedTableInSidebar}
            onValueChange={openTableFromSidebar}
            onAnimationEnd={handleScrollToTable}
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
