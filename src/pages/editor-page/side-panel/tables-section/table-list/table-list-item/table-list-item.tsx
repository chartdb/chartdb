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
import type { Transform } from '@dnd-kit/utilities';

export interface TableListItemProps {
    table: DBTable;
}

const collectTransform = (transform: Transform | null): string => {
    if (transform == null) {
        return '';
    }

    const defaultScaleX: string = 'scaleX(1)';
    const defaultScaleY: string = 'scaleY(1)';

    return `translate3d(${transform.x}px, ${transform.y}px, 0px) ${defaultScaleX} ${defaultScaleY}`;
};

export const TableListItem = React.forwardRef<
    React.ElementRef<typeof AccordionItem>,
    TableListItemProps
>(({ table }, ref) => {
    const { attributes, setNodeRef, transform, transition } = useSortable({
        id: table.id,
    });
    const style = {
        transform: collectTransform(transform),
        transition,
    };

    return (
        <AccordionItem value={table.id} className="rounded-md" ref={ref}>
            <div
                className="w-full"
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
