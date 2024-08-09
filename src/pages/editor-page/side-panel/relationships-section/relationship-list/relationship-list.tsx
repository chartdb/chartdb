import React from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { RelationshipListItem } from './relationship-list-item/relationship-list-item';

export interface TableListProps {}

export const RelationshipList: React.FC<TableListProps> = () => {
    return (
        <Accordion
            type="single"
            collapsible
            className="flex flex-col w-full gap-1"
        >
            <RelationshipListItem />
        </Accordion>
    );
};
