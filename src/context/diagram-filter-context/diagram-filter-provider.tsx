import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { DiagramFilterContext } from './diagram-filter-context';
import { diagramFilterContext } from './diagram-filter-context';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';
import { useStorage } from '@/hooks/use-storage';
import { useChartDB } from '@/hooks/use-chartdb';
import { filterSchema } from '@/lib/domain/diagram-filter/filter';
import { schemaNameToSchemaId } from '@/lib/domain';

export const DiagramFilterProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { diagramId, tables, schemas } = useChartDB();
    const { getDiagramFilter, updateDiagramFilter } = useStorage();
    const [filter, setFilter] = useState<DiagramFilter>({});

    const allSchemasIds = useMemo(() => {
        return schemas.map((schema) => schema.id);
    }, [schemas]);

    const allTables = useMemo(() => {
        return tables.map((table) => ({
            id: table.id,
            schemaId: table.schema ? schemaNameToSchemaId(table.schema) : null,
        }));
    }, [tables]);

    useEffect(() => {
        if (diagramId) {
            updateDiagramFilter(diagramId, filter);
        }
    }, [diagramId, filter, updateDiagramFilter]);

    // Reset filter when diagram changes
    useEffect(() => {
        const loadFilterFromStorage = async (diagramId: string) => {
            if (diagramId) {
                const storedFilter = await getDiagramFilter(diagramId);
                setFilter(storedFilter ?? {});
            }
        };

        setFilter({});
        if (diagramId) {
            loadFilterFromStorage(diagramId);
        }
    }, [diagramId, getDiagramFilter]);

    // Schema methods
    const addSchemaIds: DiagramFilterContext['addSchemaIdsFilter'] =
        useCallback((...ids: string[]) => {
            setFilter(
                (prev) =>
                    ({
                        ...prev,
                        schemaIds: [
                            ...new Set([...(prev.schemaIds || []), ...ids]),
                        ],
                    }) satisfies DiagramFilter
            );
        }, []);

    const removeSchemaIds: DiagramFilterContext['removeSchemaIdsFilter'] =
        useCallback((...ids: string[]) => {
            setFilter(
                (prev) =>
                    ({
                        ...prev,
                        schemaIds: prev.schemaIds?.filter(
                            (id) => !ids.includes(id)
                        ),
                    }) satisfies DiagramFilter
            );
        }, []);

    const clearSchemaIds: DiagramFilterContext['clearSchemaIdsFilter'] =
        useCallback(() => {
            setFilter(
                (prev) =>
                    ({
                        ...prev,
                        schemaIds: undefined,
                    }) satisfies DiagramFilter
            );
        }, []);

    // Table methods
    const addTableIds: DiagramFilterContext['addTableIdsFilter'] = useCallback(
        (...ids: string[]) => {
            setFilter(
                (prev) =>
                    ({
                        ...prev,
                        tableIds: [
                            ...new Set([...(prev.tableIds || []), ...ids]),
                        ],
                    }) satisfies DiagramFilter
            );
        },
        []
    );

    const removeTableIds: DiagramFilterContext['removeTableIdsFilter'] =
        useCallback((...ids: string[]) => {
            setFilter(
                (prev) =>
                    ({
                        ...prev,
                        tableIds: prev.tableIds?.filter(
                            (id) => !ids.includes(id)
                        ),
                    }) satisfies DiagramFilter
            );
        }, []);

    const clearTableIds: DiagramFilterContext['clearTableIdsFilter'] =
        useCallback(() => {
            setFilter(
                (prev) =>
                    ({
                        ...prev,
                        tableIds: undefined,
                    }) satisfies DiagramFilter
            );
        }, []);

    // Reset filter
    const resetFilter: DiagramFilterContext['resetFilter'] = useCallback(() => {
        setFilter({});
    }, []);

    const toggleSchemaFilter: DiagramFilterContext['toggleSchemaFilter'] =
        useCallback(
            (schemaId: string) => {
                setFilter((prev) => {
                    const currentSchemaIds = prev.schemaIds;

                    // Check if schema is currently visible using filterSchema
                    const isSchemaVisible = filterSchema({
                        schemaId,
                        schemaIdsFilter: currentSchemaIds,
                    });

                    if (isSchemaVisible) {
                        // Schema is visible, make it not visible
                        if (!currentSchemaIds) {
                            // All schemas are visible, create filter with all except this one
                            const newSchemaIds = allSchemasIds.filter(
                                (id) => id !== schemaId
                            );

                            // Also handle tables - remove tables from this schema
                            const schemaTableIds = allTables
                                .filter((table) => table.schemaId === schemaId)
                                .map((table) => table.id);

                            let newTableIds = prev.tableIds;
                            if (prev.tableIds) {
                                // Remove schema tables from the filter
                                newTableIds = prev.tableIds.filter(
                                    (id) => !schemaTableIds.includes(id)
                                );
                                // If no tables remain in filter, set to undefined
                                if (newTableIds.length === 0) {
                                    newTableIds = undefined;
                                }
                            }

                            return {
                                ...prev,
                                schemaIds: newSchemaIds,
                                tableIds: newTableIds,
                            } satisfies DiagramFilter;
                        } else {
                            // Remove this schema from the filter
                            const newSchemaIds = currentSchemaIds.filter(
                                (id) => id !== schemaId
                            );

                            // Also handle tables - remove tables from this schema
                            const schemaTableIds = allTables
                                .filter((table) => table.schemaId === schemaId)
                                .map((table) => table.id);

                            let newTableIds = prev.tableIds;
                            if (prev.tableIds) {
                                // Remove schema tables from the filter
                                newTableIds = prev.tableIds.filter(
                                    (id) => !schemaTableIds.includes(id)
                                );
                                // If no tables remain in filter, set to undefined
                                if (newTableIds.length === 0) {
                                    newTableIds = undefined;
                                }
                            }

                            return {
                                ...prev,
                                schemaIds:
                                    newSchemaIds.length === 0
                                        ? undefined
                                        : newSchemaIds,
                                tableIds: newTableIds,
                            } satisfies DiagramFilter;
                        }
                    } else {
                        // Schema is not visible, make it visible
                        const newSchemaIds = [
                            ...new Set([...(currentSchemaIds || []), schemaId]),
                        ];

                        // Check if all schemas are now visible
                        if (newSchemaIds.length === allSchemasIds.length) {
                            // All schemas are visible, set to undefined

                            // Also handle tables - add tables from this schema if tableIds is defined
                            let newTableIds = prev.tableIds;
                            if (prev.tableIds) {
                                const schemaTableIds = allTables
                                    .filter(
                                        (table) => table.schemaId === schemaId
                                    )
                                    .map((table) => table.id);
                                newTableIds = [
                                    ...new Set([
                                        ...prev.tableIds,
                                        ...schemaTableIds,
                                    ]),
                                ];

                                // If all tables are now in the filter, set to undefined
                                if (newTableIds.length === allTables.length) {
                                    newTableIds = undefined;
                                }
                            }

                            return {
                                ...prev,
                                schemaIds: undefined,
                                tableIds: newTableIds,
                            } satisfies DiagramFilter;
                        } else {
                            // Also handle tables - add tables from this schema if tableIds is defined
                            let newTableIds = prev.tableIds;
                            if (prev.tableIds) {
                                const schemaTableIds = allTables
                                    .filter(
                                        (table) => table.schemaId === schemaId
                                    )
                                    .map((table) => table.id);
                                newTableIds = [
                                    ...new Set([
                                        ...prev.tableIds,
                                        ...schemaTableIds,
                                    ]),
                                ];

                                // If all tables are now in the filter, set to undefined
                                if (newTableIds.length === allTables.length) {
                                    newTableIds = undefined;
                                }
                            }

                            return {
                                ...prev,
                                schemaIds: newSchemaIds,
                                tableIds: newTableIds,
                            } satisfies DiagramFilter;
                        }
                    }
                });

                // Return visibility state after toggle
                return filterSchema({
                    schemaId,
                    schemaIdsFilter: filter.schemaIds,
                });
            },
            [allSchemasIds, allTables, filter]
        );

    const toggleTableFilter: DiagramFilterContext['toggleTableFilter'] =
        useCallback(
            (tableId: string) => {
                setFilter((prev) => {
                    const currentTableIds = prev.tableIds;
                    const table = allTables.find((t) => t.id === tableId);

                    // Check if table is currently visible according to user's requirements:
                    // - visible if tableIds is undefined OR contains the table ID
                    // - AND if schemaIds is defined and doesn't contain the table's schema, it's NOT visible
                    let isTableVisible =
                        !currentTableIds || currentTableIds.includes(tableId);

                    // If table has a schema and schemaIds filter is defined, check schema visibility
                    if (isTableVisible && table?.schemaId && prev.schemaIds) {
                        isTableVisible = filterSchema({
                            schemaId: table.schemaId,
                            schemaIdsFilter: prev.schemaIds,
                        });
                    }

                    if (isTableVisible) {
                        // Table is visible, make it not visible
                        if (!currentTableIds) {
                            // All tables are visible, create filter with all except this one
                            const newTableIds = allTables
                                .filter((table) => table.id !== tableId)
                                .map((table) => table.id);
                            return {
                                ...prev,
                                tableIds: newTableIds,
                            } satisfies DiagramFilter;
                        } else {
                            // Remove this table from the filter
                            const newTableIds = currentTableIds.filter(
                                (id) => id !== tableId
                            );
                            return {
                                ...prev,
                                tableIds:
                                    newTableIds.length === 0
                                        ? undefined
                                        : newTableIds,
                            } satisfies DiagramFilter;
                        }
                    } else {
                        // Table is not visible, make it visible
                        const newTableIds = currentTableIds
                            ? [...currentTableIds, tableId]
                            : [tableId];

                        // Check if all tables are now visible
                        if (newTableIds.length === allTables.length) {
                            return {
                                ...prev,
                                tableIds: undefined,
                            } satisfies DiagramFilter;
                        } else {
                            return {
                                ...prev,
                                tableIds: newTableIds,
                            } satisfies DiagramFilter;
                        }
                    }
                });

                // Return visibility state after toggle
                const currentFilter = filter;
                const currentTableIds = currentFilter.tableIds;
                const table = allTables.find((t) => t.id === tableId);

                let isVisible =
                    !currentTableIds || currentTableIds.includes(tableId);
                if (isVisible && table?.schemaId && currentFilter.schemaIds) {
                    isVisible = filterSchema({
                        schemaId: table.schemaId,
                        schemaIdsFilter: currentFilter.schemaIds,
                    });
                }

                return isVisible;
            },
            [allTables, filter]
        );

    const addSchemaIfFiltered: DiagramFilterContext['addSchemaIfFiltered'] =
        useCallback(
            (schemaId: string) => {
                setFilter((prev) => {
                    const currentSchemaIds = prev.schemaIds;
                    if (!currentSchemaIds) {
                        // No schemas are filtered
                        return prev;
                    }

                    // If schema is already filtered, do nothing
                    if (currentSchemaIds.includes(schemaId)) {
                        return prev;
                    }

                    // Add schema to the filter
                    const newSchemaIds = [...currentSchemaIds, schemaId];

                    if (newSchemaIds.length === allSchemasIds.length) {
                        // All schemas are now filtered, set to undefined
                        return {
                            ...prev,
                            schemaIds: undefined,
                        } satisfies DiagramFilter;
                    }
                    return {
                        ...prev,
                        schemaIds: newSchemaIds,
                    } satisfies DiagramFilter;
                });
            },
            [allSchemasIds.length]
        );

    const hasActiveFilter: boolean = useMemo(() => {
        return !!filter.schemaIds || !!filter.tableIds;
    }, [filter]);

    const value: DiagramFilterContext = {
        filter,
        schemaIdsFilter: filter.schemaIds,
        addSchemaIdsFilter: addSchemaIds,
        removeSchemaIdsFilter: removeSchemaIds,
        clearSchemaIdsFilter: clearSchemaIds,
        tableIdsFilter: filter.tableIds,
        addTableIdsFilter: addTableIds,
        removeTableIdsFilter: removeTableIds,
        clearTableIdsFilter: clearTableIds,
        resetFilter,
        toggleSchemaFilter,
        toggleTableFilter,
        addSchemaIfFiltered,
        hasActiveFilter,
    };

    return (
        <diagramFilterContext.Provider value={value}>
            {children}
        </diagramFilterContext.Provider>
    );
};
