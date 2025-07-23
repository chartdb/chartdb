import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { Search, AlertCircle, Check, X, View, Table } from 'lucide-react';
import { Checkbox } from '@/components/checkbox/checkbox';
import type { DatabaseMetadata } from '@/lib/data/import-metadata/metadata-types/database-metadata';
import { schemaNameToDomainSchemaName } from '@/lib/domain/db-schema';
import { cn } from '@/lib/utils';
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import type { SelectedTable } from '@/lib/data/import-metadata/filter-metadata';
import { generateTableKey } from '@/lib/domain';
import { Spinner } from '@/components/spinner/spinner';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
} from '@/components/pagination/pagination';
import { MAX_TABLES_IN_DIAGRAM } from './constants';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTranslation } from 'react-i18next';

export interface SelectTablesProps {
    databaseMetadata?: DatabaseMetadata;
    onImport: ({
        selectedTables,
        databaseMetadata,
    }: {
        selectedTables?: SelectedTable[];
        databaseMetadata?: DatabaseMetadata;
    }) => Promise<void>;
    onBack: () => void;
    isLoading?: boolean;
}

const TABLES_PER_PAGE = 10;

interface TableInfo {
    key: string;
    schema?: string;
    tableName: string;
    fullName: string;
    type: 'table' | 'view';
}

export const SelectTables: React.FC<SelectTablesProps> = ({
    databaseMetadata,
    onImport,
    onBack,
    isLoading = false,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showTables, setShowTables] = useState(true);
    const [showViews, setShowViews] = useState(false);
    const { t } = useTranslation();
    const [isImporting, setIsImporting] = useState(false);

    // Prepare all tables and views with their metadata
    const allTables = useMemo(() => {
        const tables: TableInfo[] = [];

        // Add regular tables
        databaseMetadata?.tables.forEach((table) => {
            const schema = schemaNameToDomainSchemaName(table.schema);
            const tableName = table.table;

            const key = `table:${generateTableKey({ tableName, schemaName: schema })}`;

            tables.push({
                key,
                schema,
                tableName,
                fullName: schema ? `${schema}.${tableName}` : tableName,
                type: 'table',
            });
        });

        // Add views
        databaseMetadata?.views?.forEach((view) => {
            const schema = schemaNameToDomainSchemaName(view.schema);
            const viewName = view.view_name;

            if (!viewName) {
                return;
            }

            const key = `view:${generateTableKey({
                tableName: viewName,
                schemaName: schema,
            })}`;

            tables.push({
                key,
                schema,
                tableName: viewName,
                fullName:
                    schema === 'default' ? viewName : `${schema}.${viewName}`,
                type: 'view',
            });
        });

        return tables.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [databaseMetadata?.tables, databaseMetadata?.views]);

    // Count tables and views separately
    const tableCount = useMemo(
        () => allTables.filter((t) => t.type === 'table').length,
        [allTables]
    );
    const viewCount = useMemo(
        () => allTables.filter((t) => t.type === 'view').length,
        [allTables]
    );

    // Initialize selectedTables with all tables (not views) if less than 100 tables
    const [selectedTables, setSelectedTables] = useState<Set<string>>(() => {
        const tables = allTables.filter((t) => t.type === 'table');
        if (tables.length < MAX_TABLES_IN_DIAGRAM) {
            return new Set(tables.map((t) => t.key));
        }
        return new Set();
    });

    // Filter tables based on search term and type filters
    const filteredTables = useMemo(() => {
        let filtered = allTables;

        // Filter by type
        filtered = filtered.filter((table) => {
            if (table.type === 'table' && !showTables) return false;
            if (table.type === 'view' && !showViews) return false;
            return true;
        });

        // Filter by search term
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (table) =>
                    table.tableName.toLowerCase().includes(searchLower) ||
                    table.schema?.toLowerCase().includes(searchLower) ||
                    table.fullName.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [allTables, searchTerm, showTables, showViews]);

    // Calculate pagination
    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(filteredTables.length / TABLES_PER_PAGE)),
        [filteredTables.length]
    );

    const paginatedTables = useMemo(() => {
        const startIndex = (currentPage - 1) * TABLES_PER_PAGE;
        const endIndex = startIndex + TABLES_PER_PAGE;
        return filteredTables.slice(startIndex, endIndex);
    }, [filteredTables, currentPage]);

    // Get currently visible selected tables
    const visibleSelectedTables = useMemo(() => {
        return paginatedTables.filter((table) => selectedTables.has(table.key));
    }, [paginatedTables, selectedTables]);

    const canAddMore = useMemo(
        () => selectedTables.size < MAX_TABLES_IN_DIAGRAM,
        [selectedTables.size]
    );
    const hasSearchResults = useMemo(
        () => filteredTables.length > 0,
        [filteredTables.length]
    );
    const allVisibleSelected = useMemo(
        () =>
            visibleSelectedTables.length === paginatedTables.length &&
            paginatedTables.length > 0,
        [visibleSelectedTables.length, paginatedTables.length]
    );
    const canSelectAllFiltered = useMemo(
        () =>
            filteredTables.length > 0 &&
            filteredTables.some((table) => !selectedTables.has(table.key)) &&
            canAddMore,
        [filteredTables, selectedTables, canAddMore]
    );

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleTableToggle = useCallback(
        (tableKey: string) => {
            const newSelected = new Set(selectedTables);

            if (newSelected.has(tableKey)) {
                newSelected.delete(tableKey);
            } else if (selectedTables.size < MAX_TABLES_IN_DIAGRAM) {
                newSelected.add(tableKey);
            }

            setSelectedTables(newSelected);
        },
        [selectedTables]
    );

    const handleTogglePageSelection = useCallback(() => {
        const newSelected = new Set(selectedTables);

        if (allVisibleSelected) {
            // Deselect all on current page
            for (const table of paginatedTables) {
                newSelected.delete(table.key);
            }
        } else {
            // Select all on current page
            for (const table of paginatedTables) {
                if (newSelected.size >= MAX_TABLES_IN_DIAGRAM) break;
                newSelected.add(table.key);
            }
        }

        setSelectedTables(newSelected);
    }, [allVisibleSelected, paginatedTables, selectedTables]);

    const handleSelectAllFiltered = useCallback(() => {
        const newSelected = new Set(selectedTables);

        for (const table of filteredTables) {
            if (newSelected.size >= MAX_TABLES_IN_DIAGRAM) break;
            newSelected.add(table.key);
        }

        setSelectedTables(newSelected);
    }, [filteredTables, selectedTables]);

    const handleNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    }, [currentPage, totalPages]);

    const handlePrevPage = useCallback(() => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    }, [currentPage]);

    const handleClearSelection = useCallback(() => {
        setSelectedTables(new Set());
    }, []);

    const handleConfirm = useCallback(async () => {
        if (isImporting) {
            return;
        }

        setIsImporting(true);

        try {
            const selectedTableObjects: SelectedTable[] = Array.from(
                selectedTables
            )
                .map((key): SelectedTable | null => {
                    const table = allTables.find((t) => t.key === key);
                    if (!table) return null;

                    return {
                        schema: table.schema,
                        table: table.tableName,
                        type: table.type,
                    } satisfies SelectedTable;
                })
                .filter((t): t is SelectedTable => t !== null);

            await onImport({
                selectedTables: selectedTableObjects,
                databaseMetadata,
            });
        } finally {
            setIsImporting(false);
        }
    }, [selectedTables, allTables, onImport, databaseMetadata, isImporting]);

    const { isMd: isDesktop } = useBreakpoint('md');

    const renderPagination = useCallback(
        () => (
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={handlePrevPage}
                            className={cn(
                                'cursor-pointer',
                                currentPage === 1 &&
                                    'pointer-events-none opacity-50'
                            )}
                        />
                    </PaginationItem>
                    <PaginationItem>
                        <span className="px-3 text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </span>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext
                            onClick={handleNextPage}
                            className={cn(
                                'cursor-pointer',
                                (currentPage >= totalPages ||
                                    filteredTables.length === 0) &&
                                    'pointer-events-none opacity-50'
                            )}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        ),
        [
            currentPage,
            totalPages,
            handlePrevPage,
            handleNextPage,
            filteredTables.length,
        ]
    );

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center">
                    <Spinner className="mb-4" />
                    <p className="text-sm text-muted-foreground">
                        Parsing database metadata...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Select Tables to Import</DialogTitle>
                <DialogDescription>
                    {tableCount} {tableCount === 1 ? 'table' : 'tables'}
                    {viewCount > 0 && (
                        <>
                            {' and '}
                            {viewCount} {viewCount === 1 ? 'view' : 'views'}
                        </>
                    )}
                    {' found. '}
                    {allTables.length > MAX_TABLES_IN_DIAGRAM
                        ? `Select up to ${MAX_TABLES_IN_DIAGRAM} to import.`
                        : 'Choose which ones to import.'}
                </DialogDescription>
            </DialogHeader>
            <DialogInternalContent>
                <div className="flex h-full flex-col space-y-4">
                    {/* Warning/Info Banner */}
                    {allTables.length > MAX_TABLES_IN_DIAGRAM ? (
                        <div
                            className={cn(
                                'flex items-center gap-2 rounded-lg p-3 text-sm',
                                'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                            )}
                        >
                            <AlertCircle className="size-4 shrink-0" />
                            <span>
                                Due to performance limitations, you can import a
                                maximum of {MAX_TABLES_IN_DIAGRAM} tables.
                            </span>
                        </div>
                    ) : null}
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search tables..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-9"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    {/* Selection Status and Actions - Responsive layout */}
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        {/* Left side: selection count -> checkboxes -> results found */}
                        <div className="flex flex-col items-center gap-3 text-sm sm:flex-row sm:items-center sm:gap-4">
                            <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-4">
                                <span className="text-center font-medium">
                                    {selectedTables.size} /{' '}
                                    {Math.min(
                                        MAX_TABLES_IN_DIAGRAM,
                                        allTables.length
                                    )}{' '}
                                    items selected
                                </span>
                            </div>

                            <div className="flex items-center gap-3 sm:border-x sm:px-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={showTables}
                                        onCheckedChange={(checked) => {
                                            // Prevent unchecking if it's the only one checked
                                            if (!checked && !showViews) return;
                                            setShowTables(!!checked);
                                        }}
                                    />
                                    <Table
                                        className="size-4"
                                        strokeWidth={1.5}
                                    />
                                    <span>tables</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={showViews}
                                        onCheckedChange={(checked) => {
                                            // Prevent unchecking if it's the only one checked
                                            if (!checked && !showTables) return;
                                            setShowViews(!!checked);
                                        }}
                                    />
                                    <View
                                        className="size-4"
                                        strokeWidth={1.5}
                                    />
                                    <span>views</span>
                                </div>
                            </div>

                            <span className="hidden text-muted-foreground sm:inline">
                                {filteredTables.length}{' '}
                                {filteredTables.length === 1
                                    ? 'result'
                                    : 'results'}{' '}
                                found
                            </span>
                        </div>

                        {/* Right side: action buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {hasSearchResults && (
                                <>
                                    {/* Show page selection button when not searching and no selection */}
                                    {!searchTerm &&
                                        selectedTables.size === 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={
                                                    handleTogglePageSelection
                                                }
                                                disabled={
                                                    paginatedTables.length === 0
                                                }
                                            >
                                                {allVisibleSelected
                                                    ? 'Deselect'
                                                    : 'Select'}{' '}
                                                page
                                            </Button>
                                        )}
                                    {/* Show Select all button when there are unselected tables */}
                                    {canSelectAllFiltered &&
                                        selectedTables.size === 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={
                                                    handleSelectAllFiltered
                                                }
                                                disabled={!canSelectAllFiltered}
                                                title={(() => {
                                                    const unselectedCount =
                                                        filteredTables.filter(
                                                            (table) =>
                                                                !selectedTables.has(
                                                                    table.key
                                                                )
                                                        ).length;
                                                    const remainingCapacity =
                                                        MAX_TABLES_IN_DIAGRAM -
                                                        selectedTables.size;
                                                    if (
                                                        unselectedCount >
                                                        remainingCapacity
                                                    ) {
                                                        return `Can only select ${remainingCapacity} more tables (${MAX_TABLES_IN_DIAGRAM} max limit)`;
                                                    }
                                                    return undefined;
                                                })()}
                                            >
                                                {(() => {
                                                    const unselectedCount =
                                                        filteredTables.filter(
                                                            (table) =>
                                                                !selectedTables.has(
                                                                    table.key
                                                                )
                                                        ).length;
                                                    const remainingCapacity =
                                                        MAX_TABLES_IN_DIAGRAM -
                                                        selectedTables.size;
                                                    if (
                                                        unselectedCount >
                                                        remainingCapacity
                                                    ) {
                                                        return `Select ${remainingCapacity} of ${unselectedCount}`;
                                                    }
                                                    return `Select all ${unselectedCount}`;
                                                })()}
                                            </Button>
                                        )}
                                </>
                            )}
                            {selectedTables.size > 0 && (
                                <>
                                    {/* Show page selection/deselection button when user has selections */}
                                    {paginatedTables.length > 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleTogglePageSelection}
                                        >
                                            {allVisibleSelected
                                                ? 'Deselect'
                                                : 'Select'}{' '}
                                            page
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClearSelection}
                                    >
                                        Clear selection
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table List */}
                <div className="flex min-h-[428px] flex-1 flex-col">
                    {hasSearchResults ? (
                        <>
                            <div className="flex-1 py-4">
                                <div className="space-y-1">
                                    {paginatedTables.map((table) => {
                                        const isSelected = selectedTables.has(
                                            table.key
                                        );
                                        const isDisabled =
                                            !isSelected &&
                                            selectedTables.size >=
                                                MAX_TABLES_IN_DIAGRAM;

                                        return (
                                            <div
                                                key={table.key}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                                                    {
                                                        'cursor-not-allowed':
                                                            isDisabled,

                                                        'bg-muted hover:bg-muted/80':
                                                            isSelected,
                                                        'hover:bg-accent':
                                                            !isSelected &&
                                                            !isDisabled,
                                                    }
                                                )}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    disabled={isDisabled}
                                                    onCheckedChange={() =>
                                                        handleTableToggle(
                                                            table.key
                                                        )
                                                    }
                                                />
                                                {table.type === 'view' ? (
                                                    <View
                                                        className="size-4"
                                                        strokeWidth={1.5}
                                                    />
                                                ) : (
                                                    <Table
                                                        className="size-4"
                                                        strokeWidth={1.5}
                                                    />
                                                )}
                                                <span className="flex-1">
                                                    {table.schema ? (
                                                        <span className="text-muted-foreground">
                                                            {table.schema}.
                                                        </span>
                                                    ) : null}
                                                    <span className="font-medium">
                                                        {table.tableName}
                                                    </span>
                                                    {table.type === 'view' && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            (view)
                                                        </span>
                                                    )}
                                                </span>
                                                {isSelected && (
                                                    <Check className="size-4 text-pink-600" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center py-4">
                            <p className="text-sm text-muted-foreground">
                                {searchTerm
                                    ? 'No tables found matching your search.'
                                    : 'Start typing to search for tables...'}
                            </p>
                        </div>
                    )}
                </div>
                {isDesktop ? renderPagination() : null}
            </DialogInternalContent>
            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2 md:justify-between md:gap-0">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onBack}
                    disabled={isImporting}
                >
                    {t('new_diagram_dialog.back')}
                </Button>

                <Button
                    onClick={handleConfirm}
                    disabled={selectedTables.size === 0 || isImporting}
                    className="bg-pink-500 text-white hover:bg-pink-600"
                >
                    {isImporting ? (
                        <>
                            <Spinner className="mr-2 size-4 text-white" />
                            Importing...
                        </>
                    ) : (
                        `Import ${selectedTables.size} Tables`
                    )}
                </Button>

                {!isDesktop ? renderPagination() : null}
            </DialogFooter>
        </>
    );
};
