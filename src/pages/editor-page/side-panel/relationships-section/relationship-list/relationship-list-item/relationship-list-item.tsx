import React from 'react';
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/accordion/accordion';
import { RelationshipListItemHeader } from './relationship-list-item-header/relationship-list-item-header';
import { RelationshipListItemContent } from './relationship-list-item-content/relationship-list-item-content';
import { DBRelationship } from '@/lib/domain/db-relationship';

export interface RelationshipListItemProps {
    relationship: DBRelationship;
}

export const RelationshipListItem = React.forwardRef<
    React.ElementRef<typeof AccordionItem>,
    RelationshipListItemProps
>(({ relationship }, ref) => {
    return (
        <AccordionItem value={relationship.id} className="rounded-md" ref={ref}>
            <AccordionTrigger
                asChild
                className="hover:no-underline hover:bg-accent rounded-md px-2 py-0 data-[state=open]:rounded-b-none w-full"
            >
                <RelationshipListItemHeader relationship={relationship} />
            </AccordionTrigger>
            <AccordionContent className="pb-0 p-1">
                <RelationshipListItemContent relationship={relationship} />
            </AccordionContent>
        </AccordionItem>
    );
});

RelationshipListItem.displayName = 'RelationshipListItem';
