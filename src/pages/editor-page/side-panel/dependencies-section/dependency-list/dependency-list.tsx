import React, { useCallback } from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { useLayout } from '@/hooks/use-layout';
import type { DBDependency } from '@/lib/domain/db-dependency';
import { DependencyListItem } from './dependency-list-item/dependency-list-item';

export interface DependencyListProps {
    dependencies: DBDependency[];
}

export const DependencyList: React.FC<DependencyListProps> = ({
    dependencies,
}) => {
    const { openDependencyFromSidebar, openedDependencyInSidebar } =
        useLayout();
    const lastOpenedDependency = React.useRef<string | null>(null);

    const refs = dependencies.reduce(
        (acc, dependency) => {
            acc[dependency.id] = React.createRef();
            return acc;
        },
        {} as Record<string, React.RefObject<HTMLDivElement>>
    );

    const scrollToDependency = useCallback(
        (id: string) =>
            refs[id]?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            }),
        [refs]
    );

    const handleScrollToDependency = useCallback(() => {
        if (
            openedDependencyInSidebar &&
            lastOpenedDependency.current !== openedDependencyInSidebar
        ) {
            lastOpenedDependency.current = openedDependencyInSidebar;
            scrollToDependency(openedDependencyInSidebar);
        }
    }, [scrollToDependency, openedDependencyInSidebar]);

    return (
        <Accordion
            type="single"
            collapsible
            className="flex w-full flex-col gap-1"
            value={openedDependencyInSidebar}
            onValueChange={openDependencyFromSidebar}
            onAnimationEnd={handleScrollToDependency}
        >
            {dependencies.map((dependency) => (
                <DependencyListItem
                    key={dependency.id}
                    dependency={dependency}
                    ref={refs[dependency.id]}
                />
            ))}
        </Accordion>
    );
};
