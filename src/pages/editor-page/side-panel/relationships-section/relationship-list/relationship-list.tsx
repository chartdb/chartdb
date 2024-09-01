import React, { useCallback, useEffect } from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { RelationshipListItem } from './relationship-list-item/relationship-list-item';
import { DBRelationship } from '@/lib/domain/db-relationship';
import { useLayout } from '@/hooks/use-layout';

export interface TableListProps {
    relationships: DBRelationship[];
}

export const RelationshipList: React.FC<TableListProps> = ({
    relationships,
}) => {
    const { openRelationshipFromSidebar, openedRelationshipInSidebar } =
        useLayout();

    const refs = relationships.reduce(
        (acc, relationship) => {
            acc[relationship.id] = React.createRef();
            return acc;
        },
        {} as Record<string, React.RefObject<HTMLDivElement>>
    );

    const scrollToRelationship = useCallback(
        (id: string) =>
            refs[id]?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            }),
        [refs]
    );

    useEffect(() => {
        if (openedRelationshipInSidebar) {
            scrollToRelationship(openedRelationshipInSidebar);
        }
    }, [openedRelationshipInSidebar, scrollToRelationship]);
    return (
        <Accordion
            type="single"
            collapsible
            className="flex w-full flex-col gap-1"
            value={openedRelationshipInSidebar}
            onValueChange={openRelationshipFromSidebar}
        >
            {relationships.map((relationship) => (
                <RelationshipListItem
                    key={relationship.id}
                    relationship={relationship}
                    ref={refs[relationship.id]}
                />
            ))}
        </Accordion>
    );
};
