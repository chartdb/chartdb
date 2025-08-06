import React, { useCallback, useMemo, useState } from 'react';
import { TableList } from './table-list/table-list';
import { Button } from '@/components/button/button';
import { Table, List, X, Code } from 'lucide-react';
import { Input } from '@/components/input/input';
import type { DBTable } from '@/lib/domain/db-table';
import { useChartDB } from '@/hooks/use-chartdb';
import { useLayout } from '@/hooks/use-layout';
import { EmptyState } from '@/components/empty-state/empty-state';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useTranslation } from 'react-i18next';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useViewport } from '@xyflow/react';
import { useDialog } from '@/hooks/use-dialog';
import { TableDBML } from './table-dbml/table-dbml';
import { useHotkeys } from 'react-hotkeys-hook';
import { getOperatingSystem } from '@/lib/utils';
import type { DBSchema } from '@/lib/domain';
import { useDiagramFilter } from '@/context/diagram-filter-context/use-diagram-filter';
import { filterTable } from '@/lib/domain/diagram-filter/filter';
import { defaultSchemas } from '@/lib/data/default-schemas';

export interface TablesSectionProps {}

export const TablesSection: React.FC<TablesSectionProps> = () => {
    const { createTable, tables, databaseType } = useChartDB();
    const { filter, schemasDisplayed } = useDiagramFilter();
    const { openTableSchemaDialog } = useDialog();
    const viewport = useViewport();
    const { t } = useTranslation();
    const { openTableFromSidebar } = useLayout();
    const [filterText, setFilterText] = React.useState('');
    const [showDBML, setShowDBML] = useState(false);
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

        return tables.filter(filterTables).filter(filterTableName);
    }, [tables, filterText, filter, databaseType]);

    const createTableWithLocation = useCallback(
        async ({ schema }: { schema?: DBSchema }) => {
            const padding = 80;
            const centerX =
                -viewport.x / viewport.zoom + padding / viewport.zoom;
            const centerY =
                -viewport.y / viewport.zoom + padding / viewport.zoom;
            const table = await createTable({
                x: centerX,
                y: centerY,
                schema: schema?.name,
            });
            openTableFromSidebar(table.id);
        },
        [
            createTable,
            openTableFromSidebar,
            viewport.x,
            viewport.y,
            viewport.zoom,
        ]
    );

    const handleCreateTable = useCallback(async () => {
        setFilterText('');

        if (schemasDisplayed.length > 1) {
            openTableSchemaDialog({
                onConfirm: createTableWithLocation,
                schemas: schemasDisplayed,
            });
        } else {
            const schema =
                schemasDisplayed.length === 1 ? schemasDisplayed[0] : undefined;
            createTableWithLocation({ schema });
        }
    }, [
        createTableWithLocation,
        schemasDisplayed,
        openTableSchemaDialog,
        setFilterText,
    ]);

    const handleClearFilter = useCallback(() => {
        setFilterText('');
    }, []);

    const operatingSystem = useMemo(() => getOperatingSystem(), []);

    useHotkeys(
        operatingSystem === 'mac' ? 'meta+p' : 'ctrl+p',
        () => {
            setShowDBML((value) => !value);
        },
        {
            preventDefault: true,
        },
        [setShowDBML]
    );

    return (
        <section
            className="flex flex-1 flex-col overflow-hidden px-2"
            data-vaul-no-drag
        >
            <div className="flex items-center justify-between gap-4 py-1">
                <div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <Button
                                    variant="ghost"
                                    className="size-8 p-0"
                                    onClick={() =>
                                        setShowDBML((value) => !value)
                                    }
                                >
                                    {showDBML ? (
                                        <List className="size-4" />
                                    ) : (
                                        <Code className="size-4" />
                                    )}
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {showDBML
                                ? t('side_panel.tables_section.show_list')
                                : t('side_panel.tables_section.show_dbml')}
                            {operatingSystem === 'mac' ? ' (⌘P)' : ' (Ctrl+P)'}
                        </TooltipContent>
                    </Tooltip>
                </div>
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
                <Button
                    variant="secondary"
                    className="h-8 p-2 text-xs"
                    onClick={handleCreateTable}
                >
                    <Table className="h-4" />
                    {t('side_panel.tables_section.add_table')}
                </Button>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                {showDBML ? (
                    <TableDBML filteredTables={filteredTables} />
                ) : (
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
                )}
            </div>
        </section>
    );
};
