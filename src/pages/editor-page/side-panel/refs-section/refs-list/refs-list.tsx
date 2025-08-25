import React, { useCallback, useMemo } from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { useLayout } from '@/hooks/use-layout';
import type { Ref } from '../refs-section';
import { RelationshipListItem } from './relationship-list-item/relationship-list-item';
import { DependencyListItem } from './dependency-list-item/dependency-list-item';
import { Label } from '@/components/label/label';
import { useTranslation } from 'react-i18next';

export interface RefsListProps {
    refs: Ref[];
}

export const RefsList: React.FC<RefsListProps> = ({ refs }) => {
    const { openRefFromSidebar, openedRefInSidebar } = useLayout();
    const lastOpenedRef = React.useRef<string | null>(null);
    const { t } = useTranslation();

    const itemRefs = refs.reduce(
        (acc, ref) => {
            acc[ref.id] = React.createRef();
            return acc;
        },
        {} as Record<string, React.RefObject<HTMLDivElement>>
    );

    const scrollToRef = useCallback(
        (id: string) =>
            itemRefs[id]?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            }),
        [itemRefs]
    );

    const handleScrollToRef = useCallback(() => {
        if (
            openedRefInSidebar &&
            lastOpenedRef.current !== openedRefInSidebar
        ) {
            lastOpenedRef.current = openedRefInSidebar;
            scrollToRef(openedRefInSidebar);
        }
    }, [scrollToRef, openedRefInSidebar]);

    const numberOfRelationships = useMemo(
        () => refs.filter((ref) => ref.type === 'relationship').length,
        [refs]
    );

    const relationshipsTitle = React.useMemo(
        () =>
            `${numberOfRelationships} ${t(
                'side_panel.refs_section.relationships'
            )}`,
        [numberOfRelationships, t]
    );

    const numberOfDependencies = useMemo(
        () => refs.filter((ref) => ref.type === 'dependency').length,
        [refs]
    );

    const dependenciesTitle = React.useMemo(
        () =>
            `${numberOfDependencies} ${t(
                'side_panel.refs_section.dependencies'
            )}`,
        [numberOfDependencies, t]
    );

    return (
        <Accordion
            type="single"
            collapsible
            className="flex w-full flex-col gap-1"
            value={openedRefInSidebar}
            onValueChange={openRefFromSidebar}
            onAnimationEnd={handleScrollToRef}
        >
            {numberOfRelationships > 0 ? (
                <Label className="mt-2 px-2 text-xs font-medium text-muted-foreground">
                    {relationshipsTitle}
                </Label>
            ) : null}
            {refs
                .filter((ref) => ref.type === 'relationship')
                .map((ref) => (
                    <RelationshipListItem
                        key={ref.id}
                        relationship={ref.relationship!}
                        ref={itemRefs[ref.id]}
                    />
                ))}

            {numberOfDependencies > 0 ? (
                <Label className="mt-2 px-2 text-xs font-medium text-muted-foreground">
                    {dependenciesTitle}
                </Label>
            ) : null}
            {refs
                .filter((ref) => ref.type === 'dependency')
                .map((ref) => (
                    <DependencyListItem
                        key={ref.id}
                        dependency={ref.dependency!}
                        ref={itemRefs[ref.id]}
                    />
                ))}
        </Accordion>
    );
};
