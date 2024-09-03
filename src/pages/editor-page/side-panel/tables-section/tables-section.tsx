import React, { useMemo } from 'react';
import { TableList } from './table-list/table-list';
import { Button } from '@/components/button/button';
import { Table, ListCollapse } from 'lucide-react';
import { Input } from '@/components/input/input';

import { DBTable } from '@/lib/domain/db-table';
import { useChartDB } from '@/hooks/use-chartdb';
import { useLayout } from '@/hooks/use-layout';
import { EmptyState } from '@/components/empty-state/empty-state';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useTranslation } from 'react-i18next';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from '@/components/tooltip/tooltip';

export interface TablesSectionProps {}

export const TablesSection: React.FC<TablesSectionProps> = () => {
    const { createTable, tables } = useChartDB();
    const { t } = useTranslation();
    const { closeAllTablesInSidebar } = useLayout();
    const [filterText, setFilterText] = React.useState('');

    const filteredTables = useMemo(() => {
        const filter: (table: DBTable) => boolean = (table) =>
            !filterText?.trim?.() ||
            table.name.toLowerCase().includes(filterText.toLowerCase());

        return tables.filter(filter);
    }, [tables, filterText]);

    return (
        <TooltipProvider>
            <section className="flex flex-1 flex-col overflow-hidden px-2">
                <div className="flex items-center justify-between gap-4 py-1">
                    <div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="size-8 p-0"
                                    onClick={closeAllTablesInSidebar}
                                >
                                    <ListCollapse className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Collapse</TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder={t('side_panel.tables_section.filter')}
                            className="h-8 w-full focus-visible:ring-0"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="secondary"
                        className="h-8 p-2 text-xs"
                        onClick={createTable}
                    >
                        <Table className="h-4" />
                        {t('side_panel.tables_section.add_table')}
                    </Button>
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                    <ScrollArea className="h-full">
                        {tables.length === 0 ? (
                            <EmptyState
                                title={t(
                                    'side_panel.tables_section.empty_state.title'
                                )}
                                description={t(
                                    'side_panel.tables_section.empty_state.description'
                                )}
                                className="mt-20"
                            />
                        ) : (
                            <TableList tables={filteredTables} />
                        )}
                    </ScrollArea>
                </div>
            </section>
        </TooltipProvider>
    );
};
