import React, { useMemo } from 'react';
import { Button } from '@/components/button/button';
import { ListCollapse } from 'lucide-react';
import { Input } from '@/components/input/input';
import { RelationshipList } from './relationship-list/relationship-list';
import { useChartDB } from '@/hooks/use-chartdb';
import { DBRelationship } from '@/lib/domain/db-relationship';
import { useLayout } from '@/hooks/use-layout';
import { EmptyState } from '@/components/empty-state/empty-state';
import { ScrollArea } from '@/components/scroll-area/scroll-area';

export interface RelationshipsSectionProps {}

export const RelationshipsSection: React.FC<RelationshipsSectionProps> = () => {
    const { relationships } = useChartDB();
    const [filterText, setFilterText] = React.useState('');
    const { closeAllRelationshipsInSidebar } = useLayout();

    const filteredRelationships = useMemo(() => {
        const filter: (relationship: DBRelationship) => boolean = (
            relationship
        ) =>
            !filterText?.trim?.() ||
            relationship.name.toLowerCase().includes(filterText.toLowerCase());

        return relationships.filter(filter);
    }, [relationships, filterText]);

    return (
        <section className="flex flex-col px-2 overflow-hidden flex-1">
            <div className="flex items-center py-1 justify-between gap-4">
                <div>
                    <Button
                        variant="ghost"
                        className="p-0 h-8 w-8"
                        onClick={closeAllRelationshipsInSidebar}
                    >
                        <ListCollapse className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex-1">
                    <Input
                        type="text"
                        placeholder="Filter"
                        className="h-8 focus-visible:ring-0 w-full"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    {relationships.length === 0 ? (
                        <EmptyState
                            title="No relationships"
                            description="Create a relationship to connect tables"
                            className="mt-20"
                        />
                    ) : (
                        <RelationshipList
                            relationships={filteredRelationships}
                        />
                    )}
                </ScrollArea>
            </div>
        </section>
    );
};
