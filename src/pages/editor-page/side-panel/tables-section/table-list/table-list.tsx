import React, { useCallback, useState } from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { TableListItem } from './table-list-item/table-list-item';
import type { DBTable } from '@/lib/domain/db-table';
// import { useLayout } from '@/hooks/use-layout';
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useChartDB } from '@/hooks/use-chartdb.ts';

export interface TableListProps {
    tables: DBTable[];
    searchText?: string;
    searchOptions?: {
        searchInFields: boolean;
        searchInTypes: boolean;
        searchInComments: boolean;
        caseSensitive: boolean;
    };
}

export const TableList: React.FC<TableListProps> = ({
    tables,
    searchText,
    searchOptions,
}) => {
    const { updateTable } = useChartDB();
    // const { openTableFromSidebar } = useLayout();
    const [expandedTables, setExpandedTables] = useState<Set<string>>(
        new Set()
    );
    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (active?.id !== over?.id && !!over && !!active) {
                const oldIndex = tables.findIndex(
                    (table) => table.id === active.id
                );
                const newIndex = tables.findIndex(
                    (table) => table.id === over.id
                );

                updateTable(tables[oldIndex].id, {
                    order: newIndex,
                });
            }
        },
        [tables, updateTable]
    );

    const handleMatchFound = useCallback(
        (tableId: string, hasMatch: boolean) => {
            setExpandedTables((prev) => {
                const next = new Set(prev);
                if (hasMatch) {
                    next.add(tableId);
                }
                return next;
            });
        },
        []
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={tables}
                strategy={verticalListSortingStrategy}
            >
                <Accordion
                    type="multiple"
                    value={Array.from(expandedTables)}
                    onValueChange={(value) => setExpandedTables(new Set(value))}
                >
                    {tables.map((table) => (
                        <TableListItem
                            key={table.id}
                            table={table}
                            searchText={searchText}
                            searchOptions={searchOptions}
                            onMatchFound={handleMatchFound}
                        />
                    ))}
                </Accordion>
            </SortableContext>
        </DndContext>
    );
};
