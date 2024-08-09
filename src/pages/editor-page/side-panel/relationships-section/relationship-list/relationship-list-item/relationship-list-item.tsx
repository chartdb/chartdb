import React from 'react';
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/accordion/accordion';
import { RelationshipListItemHeader } from './relationship-list-item-header/relationship-list-item-header';
import { RelationshipListItemContent } from './relationship-list-item-content/relationship-list-item-content';

export interface RelationshipListItemProps {}

export const RelationshipListItem: React.FC<RelationshipListItemProps> = () => {
    return (
        <AccordionItem value="item-1" className="rounded-md">
            <AccordionTrigger className="hover:no-underline hover:bg-accent rounded-md px-2 py-0 data-[state=open]:rounded-b-none">
                <RelationshipListItemHeader />
            </AccordionTrigger>
            <AccordionContent className="pb-0">
                <RelationshipListItemContent />
            </AccordionContent>
        </AccordionItem>
    );
};
