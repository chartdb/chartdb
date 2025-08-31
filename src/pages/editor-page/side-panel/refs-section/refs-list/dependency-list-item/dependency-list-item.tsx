import React from 'react';
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/accordion/accordion';
import { DependencyListItemHeader } from './dependency-list-item-header/dependency-list-item-header';
import { DependencyListItemContent } from './dependency-list-item-content/dependency-list-item-content';
import type { DBDependency } from '@/lib/domain/db-dependency';

export interface DependencyListItemProps {
    dependency: DBDependency;
}

export const DependencyListItem = React.forwardRef<
    React.ElementRef<typeof AccordionItem>,
    DependencyListItemProps
>(({ dependency }, ref) => {
    return (
        <AccordionItem value={dependency.id} className="rounded-md" ref={ref}>
            <AccordionTrigger
                asChild
                className="w-full rounded-md px-2 py-0 hover:bg-accent hover:no-underline data-[state=open]:rounded-b-none"
            >
                <DependencyListItemHeader dependency={dependency} />
            </AccordionTrigger>
            <AccordionContent className="p-1 pb-0">
                <DependencyListItemContent dependency={dependency} />
            </AccordionContent>
        </AccordionItem>
    );
});

DependencyListItem.displayName = 'DependencyListItem';
