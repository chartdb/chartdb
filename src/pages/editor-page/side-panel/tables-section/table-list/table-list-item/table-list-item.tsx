import React from 'react';
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/accordion/accordion';
import { TableListItemHeader } from './table-list-item-header/table-list-item-header';
import { TableListItemContent } from './table-list-item-content/table-list-item-content';
import type { DBTable } from '@/lib/domain/db-table';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface TableListItemProps {
    table: DBTable;
}

export const TableListItem = React.forwardRef<
    React.ElementRef<typeof AccordionItem>,
    TableListItemProps
>(({ table }, ref) => {
    const { attributes, setNodeRef, transform, transition } = useSortable({
        id: table.id,
    });
    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <AccordionItem value={table.id} className="border-none" ref={ref}>
            <div
                className="w-full rounded-md border-b"
                ref={setNodeRef}
                style={style}
                {...attributes}
            >
                <AccordionTrigger
                    className="w-full rounded-md border-l-[6px] px-2 py-0 hover:bg-accent hover:no-underline data-[state=open]:rounded-b-none"
                    style={{
                        borderColor: table.color,
                    }}
                    asChild
                >
                    <TableListItemHeader table={table} />
                </AccordionTrigger>
                <AccordionContent>
                    <TableListItemContent table={table} />
                </AccordionContent>
            </div>
        </AccordionItem>
    );
});

TableListItem.displayName = 'TableListItem';
