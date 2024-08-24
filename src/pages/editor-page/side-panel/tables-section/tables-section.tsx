import React, { useMemo } from 'react';
import { TableList } from './table-list/table-list';
import { Button } from '@/components/button/button';
import { Table, ListCollapse } from 'lucide-react';
import { Input } from '@/components/input/input';

import { DBTable } from '@/lib/domain/db-table';
import { useChartDB } from '@/hooks/use-chartdb';
import { useLayout } from '@/hooks/use-layout';
import { EmptyState } from '@/components/empty-state/empty-state';

export interface TablesSectionProps {}

export const TablesSection: React.FC<TablesSectionProps> = () => {
    const { createTable, tables } = useChartDB();
    const { closeAllTablesInSidebar } = useLayout();
    const [filterText, setFilterText] = React.useState('');

    const filteredTables = useMemo(() => {
        const filter: (table: DBTable) => boolean = (table) =>
            !filterText?.trim?.() ||
            table.name.toLowerCase().includes(filterText.toLowerCase());

        return tables.filter(filter);
    }, [tables, filterText]);

    return (
        <section className="flex flex-col px-2 overflow-hidden flex-1">
            <div className="flex items-center py-1 justify-between gap-4">
                <div>
                    <Button
                        variant="ghost"
                        className="p-0 h-8 w-8"
                        onClick={closeAllTablesInSidebar}
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
                <Button
                    variant="secondary"
                    className="text-xs h-8 p-2"
                    onClick={createTable}
                >
                    <Table className="h-4" />
                    Add Table
                </Button>
            </div>
            <div className="flex flex-col flex-1 overflow-scroll">
                {/* <ScrollArea className="h-full !max-w-full"> */}
                {tables.length === 0 ? (
                    <EmptyState
                        title="No tables"
                        description="Create a table to get started"
                        className="mt-20"
                    />
                ) : (
                    <TableList tables={filteredTables} />
                )}
                {/* </ScrollArea> */}
            </div>
        </section>
    );
};
