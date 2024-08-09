import React from 'react';
import { TableList } from './table-list/table-list';
import { Button } from '@/components/button/button';
import { Table, ListCollapse } from 'lucide-react';
import { ScrollArea } from '@/components/scroll-area/scroll-area';

export interface TablesSectionProps {}

export const TablesSection: React.FC<TablesSectionProps> = () => {
    return (
        <section className="flex flex-col px-2 overflow-hidden flex-1">
            <div className="flex items-center py-1 justify-between">
                <div>
                    <Button variant="ghost" className="p-0 h-8 w-8">
                        <ListCollapse className="w-4 h-4" />
                    </Button>
                </div>
                <Button variant="secondary" className="text-xs h-8 p-2">
                    <Table className="h-4" />
                    Add Table
                </Button>
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <TableList />
                </ScrollArea>
            </div>
        </section>
    );
};
