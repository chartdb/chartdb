import React, { useCallback, useMemo, useState } from 'react';
import { TableList } from './table-list/table-list';
import { Button } from '@/components/button/button';
import { Table, List, X, Code, Settings } from 'lucide-react';
import { Input } from '@/components/input/input';
import type { DBTable } from '@/lib/domain/db-table';
import { shouldShowTablesBySchemaFilter } from '@/lib/domain/db-table';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/popover/popover';
import { Checkbox } from '@/components/checkbox/checkbox';
import { Label } from '@/components/label/label';
import { Separator } from '@/components/separator/separator';

export interface TablesSectionProps {}

interface SearchOptions {
    searchInFields: boolean; // whether to search field names
    searchInTypes: boolean; // whether to search field types
    searchInComments: boolean; // whether to search comments
    caseSensitive: boolean; // whether to be case sensitive
}

const getMatchCounts = (
    tables: DBTable[],
    searchText: string,
    options: SearchOptions
) => {
    if (!searchText.trim()) {
        return { fields: 0, types: 0, comments: 0 };
    }

    const searchValue = options.caseSensitive
        ? searchText
        : searchText.toLowerCase();
    const counts = { fields: 0, types: 0, comments: 0 };

    tables.forEach((table) => {
        table.fields.forEach((field) => {
            if (options.searchInFields) {
                const fieldName = options.caseSensitive
                    ? field.name
                    : field.name.toLowerCase();
                if (fieldName.includes(searchValue)) {
                    counts.fields++;
                }
            }
            if (options.searchInTypes) {
                const typeName = options.caseSensitive
                    ? field.type.name
                    : field.type.name.toLowerCase();
                if (typeName.includes(searchValue)) {
                    counts.types++;
                }
            }
            if (options.searchInComments && field.comments) {
                const comment = options.caseSensitive
                    ? field.comments
                    : field.comments.toLowerCase();
                if (comment.includes(searchValue)) {
                    counts.comments++;
                }
            }
        });
    });

    return counts;
};

export const TablesSection: React.FC<TablesSectionProps> = () => {
    const { createTable, tables, filteredSchemas, schemas } = useChartDB();
    const { openTableSchemaDialog } = useDialog();
    const viewport = useViewport();
    const { t } = useTranslation();
    const { openTableFromSidebar } = useLayout();
    const [filterText, setFilterText] = React.useState('');
    const [showDBML, setShowDBML] = useState(false);
    const filterInputRef = React.useRef<HTMLInputElement>(null);
    const [searchOptions, setSearchOptions] = useState<SearchOptions>({
        searchInFields: false,
        searchInTypes: false,
        searchInComments: false,
        caseSensitive: false,
    });

    const filteredTables = useMemo<DBTable[]>(() => {
        const searchText = searchOptions.caseSensitive
            ? filterText
            : filterText.toLowerCase();
        const filterTable: (table: DBTable) => boolean = (table) => {
            if (!filterText?.trim?.()) return true;
            const matches: boolean[] = [];
            // match table name
            const tableName = searchOptions.caseSensitive
                ? table.name
                : table.name.toLowerCase();
            matches.push(tableName.includes(searchText));
            // match field names
            if (searchOptions.searchInFields) {
                matches.push(
                    table.fields.some((field) =>
                        (searchOptions.caseSensitive
                            ? field.name
                            : field.name.toLowerCase()
                        ).includes(searchText)
                    )
                );
            }
            // match field types
            if (searchOptions.searchInTypes) {
                matches.push(
                    table.fields.some((field) =>
                        (searchOptions.caseSensitive
                            ? field.type.name
                            : field.type.name.toLowerCase()
                        ).includes(searchText)
                    )
                );
            }
            // match comments
            if (searchOptions.searchInComments) {
                matches.push(
                    table.fields.some(
                        (field) =>
                            field.comments &&
                            (searchOptions.caseSensitive
                                ? field.comments
                                : field.comments.toLowerCase()
                            ).includes(searchText)
                    )
                );
            }
            return matches.some((match) => match);
        };

        const filterSchema: (table: DBTable) => boolean = (table) =>
            shouldShowTablesBySchemaFilter(table, filteredSchemas as string[]);

        return tables.filter(filterSchema).filter(filterTable);
    }, [tables, filterText, filteredSchemas, searchOptions]);

    const createTableWithLocation = useCallback(
        async (schema?: string) => {
            const padding = 80;
            const centerX =
                -viewport.x / viewport.zoom + padding / viewport.zoom;
            const centerY =
                -viewport.y / viewport.zoom + padding / viewport.zoom;
            const table = await createTable({
                x: centerX,
                y: centerY,
                schema,
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

        if ((filteredSchemas?.length ?? 0) > 1) {
            openTableSchemaDialog({
                onConfirm: createTableWithLocation,
                schemas: schemas.filter((schema) =>
                    filteredSchemas?.includes(schema.id)
                ),
            });
        } else {
            const schema =
                filteredSchemas?.length === 1
                    ? schemas.find((s) => s.id === filteredSchemas[0])?.name
                    : undefined;
            createTableWithLocation(schema);
        }
    }, [
        createTableWithLocation,
        filteredSchemas,
        openTableSchemaDialog,
        schemas,
        setFilterText,
    ]);

    const handleClearFilter = useCallback(() => {
        setFilterText('');
    }, []);

    const operatingSystem = useMemo(() => getOperatingSystem(), []);

    useHotkeys(
        operatingSystem === 'mac' ? 'meta+f' : 'ctrl+f',
        () => {
            filterInputRef.current?.focus();
        },
        {
            preventDefault: true,
        },
        [filterInputRef]
    );

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

    const matchCounts = useMemo(
        () => getMatchCounts(filteredTables, filterText, searchOptions),
        [filteredTables, filterText, searchOptions]
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
                <div className="flex items-center gap-2">
                    <Input
                        ref={filterInputRef}
                        type="text"
                        placeholder={t('side_panel.tables_section.filter')}
                        className="h-8 w-full focus-visible:ring-0"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                            >
                                <Settings className="size-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Search Scope</Label>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={
                                                    searchOptions.searchInFields
                                                }
                                                onCheckedChange={(checked) =>
                                                    setSearchOptions(
                                                        (prev) => ({
                                                            ...prev,
                                                            searchInFields:
                                                                !!checked,
                                                        })
                                                    )
                                                }
                                            />
                                            <Label>Field Names</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={
                                                    searchOptions.searchInTypes
                                                }
                                                onCheckedChange={(checked) =>
                                                    setSearchOptions(
                                                        (prev) => ({
                                                            ...prev,
                                                            searchInTypes:
                                                                !!checked,
                                                        })
                                                    )
                                                }
                                            />
                                            <Label>Field Types</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={
                                                    searchOptions.searchInComments
                                                }
                                                onCheckedChange={(checked) =>
                                                    setSearchOptions(
                                                        (prev) => ({
                                                            ...prev,
                                                            searchInComments:
                                                                !!checked,
                                                        })
                                                    )
                                                }
                                            />
                                            <Label>Comments</Label>
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label>Search Options</Label>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={
                                                searchOptions.caseSensitive
                                            }
                                            onCheckedChange={(checked) =>
                                                setSearchOptions((prev) => ({
                                                    ...prev,
                                                    caseSensitive: !!checked,
                                                }))
                                            }
                                        />
                                        <Label>Case Sensitive</Label>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
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
                            <>
                                <div className="px-2 py-1 text-sm text-muted-foreground">
                                    Found {filteredTables.length}
                                    matching tables
                                    {filterText && (
                                        <>
                                            {searchOptions.searchInFields &&
                                                matchCounts.fields > 0 && (
                                                    <span>
                                                        , {matchCounts.fields}
                                                        matching field names
                                                    </span>
                                                )}
                                            {searchOptions.searchInTypes &&
                                                matchCounts.types > 0 && (
                                                    <span>
                                                        , {matchCounts.types}
                                                        matching field types
                                                    </span>
                                                )}
                                            {searchOptions.searchInComments &&
                                                matchCounts.comments > 0 && (
                                                    <span>
                                                        , {matchCounts.comments}
                                                        matching comments
                                                    </span>
                                                )}
                                        </>
                                    )}
                                </div>
                                <TableList
                                    tables={filteredTables}
                                    searchText={filterText}
                                    searchOptions={searchOptions}
                                />
                            </>
                        )}
                    </ScrollArea>
                )}
            </div>
        </section>
    );
};
