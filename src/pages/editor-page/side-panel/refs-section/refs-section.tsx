import React, { useCallback, useMemo } from 'react';
import { Button } from '@/components/button/button';
import { ListCollapse, Workflow } from 'lucide-react';
import { Input } from '@/components/input/input';
import { RefsList } from './refs-list/refs-list';
import { useChartDB } from '@/hooks/use-chartdb';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DBDependency } from '@/lib/domain/db-dependency';
import { useLayout } from '@/hooks/use-layout';
import { EmptyState } from '@/components/empty-state/empty-state';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useTranslation } from 'react-i18next';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useDialog } from '@/hooks/use-dialog';
import { useDiagramFilter } from '@/context/diagram-filter-context/use-diagram-filter';
import {
    filterRelationship,
    filterDependency,
} from '@/lib/domain/diagram-filter/filter';
import { defaultSchemas } from '@/lib/data/default-schemas';
import { useLocalConfig } from '@/hooks/use-local-config';

export type RefType = 'relationship' | 'dependency';

export interface Ref {
    id: string;
    type: RefType;
    relationship?: DBRelationship;
    dependency?: DBDependency;
}

export interface RefsSectionProps {}

export const RefsSection: React.FC<RefsSectionProps> = () => {
    const { relationships, dependencies, databaseType, getTable, readonly } =
        useChartDB();
    const { filter } = useDiagramFilter();
    const [filterText, setFilterText] = React.useState('');
    const { closeAllRefsInSidebar } = useLayout();
    const { t } = useTranslation();
    const { openCreateRelationshipDialog } = useDialog();
    const { showDBViews } = useLocalConfig();
    const filterInputRef = React.useRef<HTMLInputElement>(null);

    const allRefs = useMemo((): Ref[] => {
        const relationshipRefs: Ref[] = relationships.map(
            (rel) =>
                ({
                    id: rel.id,
                    type: 'relationship',
                    relationship: rel,
                }) satisfies Ref
        );

        const dependencyRefs: Ref[] = showDBViews
            ? dependencies.map(
                  (dep) =>
                      ({
                          id: dep.id,
                          type: 'dependency',
                          dependency: dep,
                      }) satisfies Ref
              )
            : [];

        return [...relationshipRefs, ...dependencyRefs];
    }, [relationships, dependencies, showDBViews]);

    const filteredRefs = useMemo(() => {
        const filterName = (ref: Ref): boolean => {
            if (!filterText?.trim?.()) {
                return true;
            }

            const searchText = filterText.toLowerCase();

            if (ref.type === 'relationship') {
                const relationship = ref.relationship!;
                return relationship.name.toLowerCase().includes(searchText);
            } else {
                const dependency = ref.dependency!;
                const tableName = getTable(dependency.tableId)?.name ?? '';
                const dependentTableName =
                    getTable(dependency.dependentTableId)?.name ?? '';

                return (
                    tableName.toLowerCase().includes(searchText) ||
                    dependentTableName.toLowerCase().includes(searchText)
                );
            }
        };

        const filterByDiagram = (ref: Ref): boolean => {
            if (ref.type === 'relationship') {
                const relationship = ref.relationship!;
                return filterRelationship({
                    tableA: {
                        id: relationship.sourceTableId,
                        schema: relationship.sourceSchema,
                    },
                    tableB: {
                        id: relationship.targetTableId,
                        schema: relationship.targetSchema,
                    },
                    filter,
                    options: {
                        defaultSchema: defaultSchemas[databaseType],
                    },
                });
            } else {
                const dependency = ref.dependency!;
                return filterDependency({
                    tableA: {
                        id: dependency.tableId,
                        schema: dependency.schema,
                    },
                    tableB: {
                        id: dependency.dependentTableId,
                        schema: dependency.dependentSchema,
                    },
                    filter,
                    options: {
                        defaultSchema: defaultSchemas[databaseType],
                    },
                });
            }
        };

        return allRefs
            .filter(filterByDiagram)
            .filter(filterName)
            .sort((a, b) => {
                // Sort relationships before dependencies
                if (a.type !== b.type) {
                    return a.type === 'relationship' ? -1 : 1;
                }

                // Within same type, sort by name
                if (a.type === 'relationship') {
                    const relA = a.relationship!;
                    const relB = b.relationship!;
                    return relA.name.localeCompare(relB.name);
                } else {
                    const depA = a.dependency!;
                    const depB = b.dependency!;
                    const tableA = getTable(depA.dependentTableId);
                    const tableAName = getTable(depA.tableId);
                    const tableB = getTable(depB.dependentTableId);
                    const tableBName = getTable(depB.tableId);
                    return `${tableA?.name}${tableAName?.name}`.localeCompare(
                        `${tableB?.name}${tableBName?.name}`
                    );
                }
            });
    }, [allRefs, filterText, filter, databaseType, getTable]);

    const handleCreateRelationship = useCallback(async () => {
        setFilterText('');
        openCreateRelationshipDialog();
    }, [openCreateRelationshipDialog, setFilterText]);

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
                                    onClick={closeAllRefsInSidebar}
                                >
                                    <ListCollapse className="size-4" />
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('side_panel.refs_section.collapse')}
                        </TooltipContent>
                    </Tooltip>
                </div>
                <div className="flex-1">
                    <Input
                        ref={filterInputRef}
                        type="text"
                        placeholder={t('side_panel.refs_section.filter')}
                        className="h-8 w-full focus-visible:ring-0"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
                {!readonly ? (
                    <Button
                        variant="secondary"
                        className="h-8 p-2 text-xs"
                        onClick={handleCreateRelationship}
                    >
                        <Workflow className="h-4" />
                        {t('side_panel.refs_section.add_relationship')}
                    </Button>
                ) : null}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <ScrollArea className="h-full">
                    {allRefs.length === 0 ? (
                        <EmptyState
                            title={t(
                                'side_panel.refs_section.empty_state.title'
                            )}
                            description={t(
                                'side_panel.refs_section.empty_state.description'
                            )}
                            className="mt-20"
                            secondaryAction={
                                !readonly
                                    ? {
                                          label: t(
                                              'side_panel.refs_section.add_relationship'
                                          ),
                                          onClick: handleCreateRelationship,
                                      }
                                    : undefined
                            }
                        />
                    ) : (
                        <RefsList refs={filteredRefs} />
                    )}
                </ScrollArea>
            </div>
        </section>
    );
};
