import React, { useCallback, useMemo } from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { TableListItem } from './table-list-item/table-list-item';
import type { DBTable } from '@/lib/domain/db-table';
import { useLayout } from '@/hooks/use-layout';
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useChartDB } from '@/hooks/use-chartdb.ts';

export interface TableListProps {
    tables: DBTable[];
}

export const TableList: React.FC<TableListProps> = ({ tables }) => {
    const { updateTablesState } = useChartDB();

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

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active?.id !== over?.id && !!over && !!active) {
            const oldIndex = tables.findIndex(
                (table) => table.id === active.id
            );
            const newIndex = tables.findIndex((table) => table.id === over.id);

            const orderingTables: DBTable[] = arrayMove<DBTable>(
                tables,
                oldIndex,
                newIndex
            );

            updateTablesState((currentTables: DBTable[]) =>
                currentTables.map((currentTable: DBTable) => {
                    let currentIndex: number = -1;

                    for (let i = 0; i < orderingTables.length; i++) {
                        const updatedTable: DBTable | undefined =
                            orderingTables[i];

                        if (
                            updatedTable &&
                            updatedTable.id === currentTable.id
                        ) {
                            currentIndex = i;
                        }
                    }

                    if (currentIndex != -1) {
                        currentTable.order = currentIndex;
                    }

                    return currentTable;
                })
            );
        }
    };

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
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={tables}
                    strategy={verticalListSortingStrategy}
                >
                    {tables
                        .sort((table1: DBTable, table2: DBTable) => {
                            return (table1.order ?? 0) - (table2.order ?? 0);
                        })
                        .map((table) => (
                            <TableListItem
                                key={table.id}
                                table={table}
                                ref={refs[table.id]}
                            />
                        ))}
                </SortableContext>
            </DndContext>
        </Accordion>
    );
};
