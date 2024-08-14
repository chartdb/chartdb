import React from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { RelationshipListItem } from './relationship-list-item/relationship-list-item';
import { DBRelationship } from '@/lib/domain/db-relationship';

export interface TableListProps {
    relationships: DBRelationship[];
}

export const RelationshipList: React.FC<TableListProps> = ({
    relationships,
}) => {
    return (
        <Accordion
            type="single"
            collapsible
            className="flex flex-col w-full gap-1"
        >
            {relationships.map((relationship) => (
                <RelationshipListItem
                    key={relationship.id}
                    relationship={relationship}
                />
            ))}
        </Accordion>
    );
};
