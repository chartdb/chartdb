import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    AlertCircle,
    Database,
    Check,
    X,
    Eye,
} from 'lucide-react';
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

export interface SelectTablesProps {
    databaseMetadata: DatabaseMetadata;
    onConfirm: (selectedTables: string[]) => void;
    onBack: () => void;
}

const MAX_TABLES = 350;
const TABLES_PER_PAGE = 10;

interface TableInfo {
    key: string;
    schema: string;
    tableName: string;
    fullName: string;
    type: 'table' | 'view';
}

export const SelectTables: React.FC<SelectTablesProps> = ({
    databaseMetadata,
    onConfirm,
    onBack,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showTables, setShowTables] = useState(true);
    const [showViews, setShowViews] = useState(false);

    // Prepare all tables and views with their metadata
    const allTables = useMemo(() => {
        const tables: TableInfo[] = [];

        // Add regular tables
        databaseMetadata.tables.forEach((table) => {
            const schema =
                schemaNameToDomainSchemaName(table.schema) || 'default';
            const tableName = table.table;
            const key = `table:${schema}.${tableName}`;

            tables.push({
                key,
                schema,
                tableName,
                fullName:
                    schema === 'default' ? tableName : `${schema}.${tableName}`,
                type: 'table',
            });
        });

        // Add views
        databaseMetadata.views?.forEach((view) => {
            const schema =
                schemaNameToDomainSchemaName(view.schema) || 'default';
            const viewName = view.view_name || ''; // Use view_name property

            // Skip if view name is empty
            if (!viewName) {
                return;
            }

            const key = `view:${schema}.${viewName}`;

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
    }, [databaseMetadata.tables, databaseMetadata.views]);

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
        if (tables.length < 150) {
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
                    table.schema.toLowerCase().includes(searchLower) ||
                    table.fullName.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [allTables, searchTerm, showTables, showViews]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredTables.length / TABLES_PER_PAGE);
    const paginatedTables = useMemo(() => {
        const startIndex = (currentPage - 1) * TABLES_PER_PAGE;
        const endIndex = startIndex + TABLES_PER_PAGE;
        return filteredTables.slice(startIndex, endIndex);
    }, [filteredTables, currentPage]);

    // Get currently visible selected tables
    const visibleSelectedTables = useMemo(() => {
        return paginatedTables.filter((table) => selectedTables.has(table.key));
    }, [paginatedTables, selectedTables]);

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleTableToggle = (tableKey: string) => {
        const newSelected = new Set(selectedTables);

        if (newSelected.has(tableKey)) {
            newSelected.delete(tableKey);
        } else if (selectedTables.size < MAX_TABLES) {
            newSelected.add(tableKey);
        }

        setSelectedTables(newSelected);
    };

    const handleTogglePageSelection = () => {
        const newSelected = new Set(selectedTables);

        if (allVisibleSelected) {
            // Deselect all on current page
            for (const table of paginatedTables) {
                newSelected.delete(table.key);
            }
        } else {
            // Select all on current page
            for (const table of paginatedTables) {
                if (newSelected.size >= MAX_TABLES) break;
                newSelected.add(table.key);
            }
        }

        setSelectedTables(newSelected);
    };

    const handleSelectAllFiltered = () => {
        const newSelected = new Set(selectedTables);

        for (const table of filteredTables) {
            if (newSelected.size >= MAX_TABLES) break;
            newSelected.add(table.key);
        }

        setSelectedTables(newSelected);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleClearSelection = () => {
        setSelectedTables(new Set());
    };

    const handleConfirm = () => {
        const tablesToImport = Array.from(selectedTables);
        onConfirm(tablesToImport);
    };

    const canAddMore = selectedTables.size < MAX_TABLES;
    const hasSearchResults = filteredTables.length > 0;
    const allVisibleSelected =
        visibleSelectedTables.length === paginatedTables.length &&
        paginatedTables.length > 0;
    const canSelectAllFiltered =
        filteredTables.length > 0 &&
        filteredTables.some((table) => !selectedTables.has(table.key)) &&
        canAddMore;

    return (
        <>
            <DialogHeader>
                <DialogTitle>Select Tables to Import</DialogTitle>
                <DialogDescription>
                    Your database contains {tableCount} table
                    {tableCount !== 1 ? 's' : ''}
                    {viewCount > 0 &&
                        ` and ${viewCount} view${viewCount !== 1 ? 's' : ''}`}
                    . Select which to import (maximum {MAX_TABLES}).
                </DialogDescription>
            </DialogHeader>
            <DialogInternalContent>
                <div className="flex h-full flex-col space-y-4">
                    {/* Warning/Info Banner */}
                    <div
                        className={cn(
                            'flex items-center gap-2 rounded-lg p-3 text-sm',
                            allTables.length > MAX_TABLES
                                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                                : 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                        )}
                    >
                        <AlertCircle className="size-4 shrink-0" />
                        <span>
                            {allTables.length > MAX_TABLES
                                ? `Due to performance limitations, you can import a maximum of ${MAX_TABLES} tables.`
                                : 'All tables can be imported.'}
                        </span>
                    </div>

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

                    {/* Selection Status and Actions - All in one line */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Left side: selection count -> checkboxes -> results found */}
                        <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">
                                {selectedTables.size} / {MAX_TABLES} tables
                                selected
                            </span>

                            <div className="flex items-center gap-3 border-x px-4">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <Checkbox
                                        checked={showTables}
                                        onCheckedChange={(checked) => {
                                            // Prevent unchecking if it's the only one checked
                                            if (!checked && !showViews) return;
                                            setShowTables(!!checked);
                                        }}
                                    />
                                    <Database className="size-4 text-muted-foreground" />
                                    <span>tables</span>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <Checkbox
                                        checked={showViews}
                                        onCheckedChange={(checked) => {
                                            // Prevent unchecking if it's the only one checked
                                            if (!checked && !showTables) return;
                                            setShowViews(!!checked);
                                        }}
                                    />
                                    <Eye className="size-4 text-muted-foreground" />
                                    <span>views</span>
                                </label>
                            </div>

                            <span className="text-muted-foreground">
                                {filteredTables.length}{' '}
                                {filteredTables.length === 1
                                    ? 'result'
                                    : 'results'}{' '}
                                found
                            </span>
                        </div>

                        {/* Right side: action buttons */}
                        <div className="flex items-center gap-2">
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
                                                        MAX_TABLES -
                                                        selectedTables.size;
                                                    if (
                                                        unselectedCount >
                                                        remainingCapacity
                                                    ) {
                                                        return `Can only select ${remainingCapacity} more tables (350 max limit)`;
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
                                                        MAX_TABLES -
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
                <div className="flex min-h-[400px] flex-1 flex-col">
                    {hasSearchResults ? (
                        <>
                            <div className="min-h-[400px] flex-1 py-4">
                                <div className="space-y-1">
                                    {paginatedTables.map((table) => {
                                        const isSelected = selectedTables.has(
                                            table.key
                                        );
                                        const isDisabled =
                                            !isSelected &&
                                            selectedTables.size >= MAX_TABLES;

                                        return (
                                            <label
                                                key={table.key}
                                                className={cn(
                                                    'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                                                    isDisabled &&
                                                        'cursor-not-allowed opacity-50',
                                                    isSelected
                                                        ? 'bg-primary/10 hover:bg-primary/15'
                                                        : 'hover:bg-accent'
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
                                                    <Eye className="size-4 text-muted-foreground" />
                                                ) : (
                                                    <Database className="size-4 text-muted-foreground" />
                                                )}
                                                <span className="flex-1">
                                                    {table.schema !==
                                                        'default' && (
                                                        <span className="text-muted-foreground">
                                                            {table.schema}.
                                                        </span>
                                                    )}
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
                                                    <Check className="size-4 text-primary" />
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-sm text-muted-foreground">
                                {searchTerm
                                    ? 'No tables found matching your search.'
                                    : 'Start typing to search for tables...'}
                            </p>
                        </div>
                    )}
                </div>
            </DialogInternalContent>
            <DialogFooter className="flex items-center justify-between">
                <Button variant="ghost" onClick={onBack} className="gap-1">
                    <ChevronLeft className="size-4" />
                    Back
                </Button>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>

                    <span className="px-3 text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>

                <Button
                    onClick={handleConfirm}
                    disabled={selectedTables.size === 0}
                    className="bg-pink-500 text-white hover:bg-pink-600"
                >
                    Import {selectedTables.size} Tables
                </Button>
            </DialogFooter>
        </>
    );
};
