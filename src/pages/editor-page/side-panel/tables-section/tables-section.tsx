import React, { useCallback, useMemo } from 'react';
import { TableList } from './table-list/table-list';
import { Button } from '@/components/button/button';
import { Table, View, X } from 'lucide-react';
import { Input } from '@/components/input/input';
import type { DBTable } from '@/lib/domain/db-table';
import { useChartDB } from '@/hooks/use-chartdb';
import { useLayout } from '@/hooks/use-layout';
import { EmptyState } from '@/components/empty-state/empty-state';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useTranslation } from 'react-i18next';
import { useViewport } from '@xyflow/react';
import { useDialog } from '@/hooks/use-dialog';
import type { DBSchema } from '@/lib/domain';
import { useDiagramFilter } from '@/context/diagram-filter-context/use-diagram-filter';
import { filterTable } from '@/lib/domain/diagram-filter/filter';
import { defaultSchemas } from '@/lib/data/default-schemas';
import { ButtonWithAlternatives } from '@/components/button/button-with-alternatives';
import { useLocalConfig } from '@/hooks/use-local-config';

export interface TablesSectionProps {}

export const TablesSection: React.FC<TablesSectionProps> = () => {
    const { createTable, tables, databaseType, readonly } = useChartDB();
    const { filter, schemasDisplayed } = useDiagramFilter();
    const { openTableSchemaDialog } = useDialog();
    const viewport = useViewport();
    const { t } = useTranslation();
    const { openTableFromSidebar } = useLayout();
    const [filterText, setFilterText] = React.useState('');
    const { showDBViews } = useLocalConfig();
    const filterInputRef = React.useRef<HTMLInputElement>(null);

    const filteredTables = useMemo(() => {
        const filterTableName: (table: DBTable) => boolean = (table) =>
            !filterText?.trim?.() ||
            table.name.toLowerCase().includes(filterText.toLowerCase());

        const filterTables: (table: DBTable) => boolean = (table) =>
            filterTable({
                table: {
                    id: table.id,
                    schema: table.schema,
                },
                filter,
                options: {
                    defaultSchema: defaultSchemas[databaseType],
                },
            });

        const filterViews: (table: DBTable) => boolean = (table) =>
            showDBViews ? true : !table.isView;

        return tables
            .filter(filterTables)
            .filter(filterTableName)
            .filter(filterViews);
    }, [tables, filterText, filter, databaseType, showDBViews]);

    const getCenterLocation = useCallback(() => {
        const padding = 80;
        const centerX = -viewport.x / viewport.zoom + padding / viewport.zoom;
        const centerY = -viewport.y / viewport.zoom + padding / viewport.zoom;

        return { centerX, centerY };
    }, [viewport.x, viewport.y, viewport.zoom]);

    const createTableWithLocation = useCallback(
        async ({ schema }: { schema?: DBSchema }) => {
            const { centerX, centerY } = getCenterLocation();
            const table = await createTable({
                x: centerX,
                y: centerY,
                schema: schema?.name,
            });
            openTableFromSidebar(table.id);
        },
        [createTable, openTableFromSidebar, getCenterLocation]
    );

    const createViewWithLocation = useCallback(
        async ({ schema }: { schema?: DBSchema }) => {
            const { centerX, centerY } = getCenterLocation();
            const table = await createTable({
                x: centerX,
                y: centerY,
                schema: schema?.name,
                isView: true,
            });
            openTableFromSidebar(table.id);
        },
        [createTable, openTableFromSidebar, getCenterLocation]
    );

    const handleCreateTable = useCallback(
        async ({ view }: { view?: boolean }) => {
            setFilterText('');

            if (schemasDisplayed.length > 1) {
                openTableSchemaDialog({
                    onConfirm: view
                        ? createViewWithLocation
                        : createTableWithLocation,
                    schemas: schemasDisplayed,
                });
            } else {
                const schema =
                    schemasDisplayed.length === 1
                        ? schemasDisplayed[0]
                        : undefined;

                if (view) {
                    createViewWithLocation({ schema });
                } else {
                    createTableWithLocation({ schema });
                }
            }
        },
        [
            createViewWithLocation,
            createTableWithLocation,
            schemasDisplayed,
            openTableSchemaDialog,
            setFilterText,
        ]
    );

    const handleClearFilter = useCallback(() => {
        setFilterText('');
    }, []);

    return (
        <section
            className="flex flex-1 flex-col overflow-hidden px-2"
            data-vaul-no-drag
        >
            <div className="flex items-center justify-between gap-4 py-1">
                <div className="flex-1">
                    <Input
                        ref={filterInputRef}
                        type="text"
                        placeholder={t('side_panel.tables_section.filter')}
                        className="h-8 w-full focus-visible:ring-0"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
                {!readonly ? (
                    <ButtonWithAlternatives
                        variant="secondary"
                        className="h-8 p-2 text-xs"
                        onClick={() => handleCreateTable({ view: false })}
                        dropdownTriggerClassName="px-1"
                        chevronDownIconClassName="!size-3.5"
                        alternatives={
                            showDBViews
                                ? [
                                      {
                                          label: t(
                                              'side_panel.tables_section.add_view'
                                          ),
                                          onClick: () =>
                                              handleCreateTable({ view: true }),
                                          icon: <View className="size-4" />,
                                          className: 'text-xs',
                                      },
                                  ]
                                : []
                        }
                    >
                        <Table className="h-4" />
                        {t('side_panel.tables_section.add_table')}
                    </ButtonWithAlternatives>
                ) : null}
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
                            secondaryAction={
                                !readonly
                                    ? {
                                          label: t(
                                              'side_panel.tables_section.add_table'
                                          ),
                                          onClick: () =>
                                              handleCreateTable({
                                                  view: false,
                                              }),
                                      }
                                    : undefined
                            }
                        />
                    ) : filterText && filteredTables.length === 0 ? (
                        <div className="mt-10 flex flex-col items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                                {t('side_panel.tables_section.no_results')}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearFilter}
                                className="gap-1"
                            >
                                <X className="size-3.5" />
                                {t('side_panel.tables_section.clear')}
                            </Button>
                        </div>
                    ) : (
                        <TableList tables={filteredTables} />
                    )}
                </ScrollArea>
            </div>
        </section>
    );
};
