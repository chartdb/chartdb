import React, { useCallback } from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { RelationshipListItem } from './relationship-list-item/relationship-list-item';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import { useLayout } from '@/hooks/use-layout';

export interface RelationshipListProps {
    relationships: DBRelationship[];
}

export const RelationshipList: React.FC<RelationshipListProps> = ({
    relationships,
}) => {
    const { openRelationshipFromSidebar, openedRelationshipInSidebar } =
        useLayout();
    const lastOpenedRelationship = React.useRef<string | null>(null);

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
                block: 'start',
            }),
        [refs]
    );

    const handleScrollToRelationship = useCallback(() => {
        if (
            openedRelationshipInSidebar &&
            lastOpenedRelationship.current !== openedRelationshipInSidebar
        ) {
            lastOpenedRelationship.current = openedRelationshipInSidebar;
            scrollToRelationship(openedRelationshipInSidebar);
        }
    }, [scrollToRelationship, openedRelationshipInSidebar]);

    return (
        <Accordion
            type="single"
            collapsible
            className="flex w-full flex-col gap-1"
            value={openedRelationshipInSidebar}
            onValueChange={openRelationshipFromSidebar}
            onAnimationEnd={handleScrollToRelationship}
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
