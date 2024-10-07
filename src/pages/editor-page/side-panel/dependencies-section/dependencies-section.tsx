import React, { useMemo } from 'react';
import { Button } from '@/components/button/button';
import { ListCollapse } from 'lucide-react';
import { Input } from '@/components/input/input';
import { DependencyList } from './dependency-list/dependency-list';
import { useChartDB } from '@/hooks/use-chartdb';
import { EmptyState } from '@/components/empty-state/empty-state';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useTranslation } from 'react-i18next';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import type { DBDependency } from '@/lib/domain/db-dependency';
import { shouldShowDependencyBySchemaFilter } from '@/lib/domain/db-dependency';
import { useLayout } from '@/hooks/use-layout';

export interface DependenciesSectionProps {}

export const DependenciesSection: React.FC<DependenciesSectionProps> = () => {
    const { dependencies, filteredSchemas, getTable } = useChartDB();
    const [filterText, setFilterText] = React.useState('');
    const { closeAllDependenciesInSidebar } = useLayout();
    const { t } = useTranslation();

    const filteredDependencies = useMemo(() => {
        const filterName: (dependency: DBDependency) => boolean = (
            dependency
        ) => {
            if (!filterText?.trim?.()) {
                return true;
            }

            const tableName = getTable(dependency.tableId)?.name ?? '';
            const dependentTableName =
                getTable(dependency.dependentTableId)?.name ?? '';

            return (
                tableName.toLowerCase().includes(filterText.toLowerCase()) ||
                dependentTableName
                    .toLowerCase()
                    .includes(filterText.toLowerCase())
            );
        };

        const filterSchema: (dependency: DBDependency) => boolean = (
            dependency
        ) => shouldShowDependencyBySchemaFilter(dependency, filteredSchemas);

        return dependencies
            .filter(filterSchema)
            .filter(filterName)
            .sort((a, b) => {
                const dependentTableA = getTable(a.dependentTableId);
                const tableA = getTable(a.tableId);
                const dependentTableB = getTable(b.dependentTableId);
                const tableB = getTable(b.tableId);
                return `${dependentTableA?.name}${tableA?.name}`.localeCompare(
                    `${dependentTableB?.name}${tableB?.name}`
                );
            });
    }, [dependencies, filterText, filteredSchemas, getTable]);

    return (
        <section className="flex flex-1 flex-col overflow-hidden px-2">
            <div className="flex items-center justify-between gap-4 py-1">
                <div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <Button
                                    variant="ghost"
                                    className="size-8 p-0"
                                    onClick={closeAllDependenciesInSidebar}
                                >
                                    <ListCollapse className="size-4" />
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('side_panel.dependencies_section.collapse')}
                        </TooltipContent>
                    </Tooltip>
                </div>
                <div className="flex-1">
                    <Input
                        type="text"
                        placeholder={t(
                            'side_panel.dependencies_section.filter'
                        )}
                        className="h-8 w-full focus-visible:ring-0"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <ScrollArea className="h-full">
                    {dependencies.length === 0 ? (
                        <EmptyState
                            title={t(
                                'side_panel.dependencies_section.empty_state.title'
                            )}
                            description={t(
                                'side_panel.dependencies_section.empty_state.description'
                            )}
                            className="mt-20"
                        />
                    ) : (
                        <DependencyList dependencies={filteredDependencies} />
                    )}
                </ScrollArea>
            </div>
        </section>
    );
};
