import React, { useCallback, useMemo } from 'react';
import { Button } from '@/components/button/button';
import { ListCollapse, Workflow } from 'lucide-react';
import { Input } from '@/components/input/input';
import { RelationshipList } from './relationship-list/relationship-list';
import { useChartDB } from '@/hooks/use-chartdb';
import type { DBRelationship } from '@/lib/domain/db-relationship';
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
import { filterRelationship } from '@/lib/domain/diagram-filter/filter';
import { defaultSchemas } from '@/lib/data/default-schemas';

export interface RelationshipsSectionProps {}

export const RelationshipsSection: React.FC<RelationshipsSectionProps> = () => {
    const { relationships, databaseType } = useChartDB();
    const { filter } = useDiagramFilter();
    const [filterText, setFilterText] = React.useState('');
    const { closeAllRelationshipsInSidebar } = useLayout();
    const { t } = useTranslation();
    const { openCreateRelationshipDialog } = useDialog();
    const filterInputRef = React.useRef<HTMLInputElement>(null);

    const filteredRelationships = useMemo(() => {
        const filterName: (relationship: DBRelationship) => boolean = (
            relationship
        ) =>
            !filterText?.trim?.() ||
            relationship.name.toLowerCase().includes(filterText.toLowerCase());

        const filterRelationships: (relationship: DBRelationship) => boolean = (
            relationship
        ) =>
            filterRelationship({
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

        return relationships.filter(filterRelationships).filter(filterName);
    }, [relationships, filterText, filter, databaseType]);

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
                                    onClick={closeAllRelationshipsInSidebar}
                                >
                                    <ListCollapse className="size-4" />
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('side_panel.relationships_section.collapse')}
                        </TooltipContent>
                    </Tooltip>
                </div>
                <div className="flex-1">
                    <Input
                        ref={filterInputRef}
                        type="text"
                        placeholder={t(
                            'side_panel.relationships_section.filter'
                        )}
                        className="h-8 w-full focus-visible:ring-0"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
                <Button
                    variant="secondary"
                    className="h-8 p-2 text-xs"
                    onClick={handleCreateRelationship}
                >
                    <Workflow className="h-4" />
                    {t('side_panel.relationships_section.add_relationship')}
                </Button>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <ScrollArea className="h-full">
                    {relationships.length === 0 ? (
                        <EmptyState
                            title={t(
                                'side_panel.relationships_section.empty_state.title'
                            )}
                            description={t(
                                'side_panel.relationships_section.empty_state.description'
                            )}
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
