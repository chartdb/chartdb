import React from 'react';
import { Button } from '@/components/button/button';
import { ListCollapse } from 'lucide-react';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { Input } from '@/components/input/input';
import { RelationshipList } from './relationship-list/relationship-list';

export interface RelationshipsSectionProps {}

export const RelationshipsSection: React.FC<RelationshipsSectionProps> = () => {
    return (
        <section className="flex flex-col px-2 overflow-hidden flex-1">
            <div className="flex items-center py-1 justify-between gap-4">
                <div>
                    <Button variant="ghost" className="p-0 h-8 w-8">
                        <ListCollapse className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex-1">
                    <Input
                        type="text"
                        placeholder="Filter"
                        className="h-8 focus-visible:ring-0 w-full"
                    />
                </div>
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <RelationshipList />
                </ScrollArea>
            </div>
        </section>
    );
};
