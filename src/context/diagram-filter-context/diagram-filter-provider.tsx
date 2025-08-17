import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { DiagramFilterContext } from './diagram-filter-context';
import { diagramFilterContext } from './diagram-filter-context';
import type {
    DiagramFilter,
    FilterTableInfo,
} from '@/lib/domain/diagram-filter/diagram-filter';
import {
    reduceFilter,
    spreadFilterTables,
} from '@/lib/domain/diagram-filter/diagram-filter';
import { useStorage } from '@/hooks/use-storage';
import { useChartDB } from '@/hooks/use-chartdb';
import { filterTable } from '@/lib/domain/diagram-filter/filter';
import { databasesWithSchemas, schemaNameToSchemaId } from '@/lib/domain';
import { defaultSchemas } from '@/lib/data/default-schemas';
import type { ChartDBEvent } from '../chartdb-context/chartdb-context';

export const DiagramFilterProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { diagramId, tables, schemas, databaseType, events } = useChartDB();
    const { getDiagramFilter, updateDiagramFilter } = useStorage();
    const [filter, setFilter] = useState<DiagramFilter>({});
    const [loading, setLoading] = useState<boolean>(true);

    const allSchemasIds = useMemo(() => {
        return schemas.map((schema) => schema.id);
    }, [schemas]);

    const allTables: FilterTableInfo[] = useMemo(() => {
        return tables.map(
            (table) =>
                ({
                    id: table.id,
                    schemaId: table.schema
                        ? schemaNameToSchemaId(table.schema)
                        : defaultSchemas[databaseType],
                    schema: table.schema ?? defaultSchemas[databaseType],
                    areaId: table.parentAreaId ?? undefined,
                }) satisfies FilterTableInfo
        );
    }, [tables, databaseType]);

    const diagramIdOfLoadedFilter = useRef<string | null>(null);

    useEffect(() => {
        if (diagramId && diagramId === diagramIdOfLoadedFilter.current) {
            updateDiagramFilter(diagramId, filter);
        }
    }, [diagramId, filter, updateDiagramFilter]);

    // Reset filter when diagram changes
    useEffect(() => {
        if (diagramIdOfLoadedFilter.current === diagramId) {
            // If the diagramId hasn't changed, do not reset the filter
            return;
        }

        setLoading(true);

        const loadFilterFromStorage = async (diagramId: string) => {
            if (diagramId) {
                const storedFilter = await getDiagramFilter(diagramId);

                let filterToSet = storedFilter;

                if (!filterToSet) {
                    // If no filter is stored, set default based on database type
                    filterToSet =
                        schemas.length > 1
                            ? { schemaIds: [schemas[0].id] }
                            : {};
                }

                setFilter(filterToSet);
            }

            setLoading(false);
        };

        setFilter({});

        if (diagramId) {
            loadFilterFromStorage(diagramId);
            diagramIdOfLoadedFilter.current = diagramId;
        }
    }, [diagramId, getDiagramFilter, schemas]);

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

    const setTableIdsEmpty: DiagramFilterContext['setTableIdsFilterEmpty'] =
        useCallback(() => {
            setFilter(
                (prev) =>
                    ({
                        ...prev,
                        tableIds: [],
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

                    // Check if schema is currently visible
                    const isSchemaVisible = !allTables.some(
                        (table) =>
                            table.schemaId === schemaId &&
                            filterTable({
                                table: {
                                    id: table.id,
                                    schema: table.schema,
                                },
                                filter: prev,
                                options: {
                                    defaultSchema: defaultSchemas[databaseType],
                                },
                            }) === false
                    );

                    let newSchemaIds: string[] | undefined;
                    let newTableIds: string[] | undefined = prev.tableIds;

                    if (isSchemaVisible) {
                        // Schema is visible, make it not visible
                        if (!currentSchemaIds) {
                            // All schemas are visible, create filter with all except this one
                            newSchemaIds = allSchemasIds.filter(
                                (id) => id !== schemaId
                            );
                        } else {
                            // Remove this schema from the filter
                            newSchemaIds = currentSchemaIds.filter(
                                (id) => id !== schemaId
                            );
                        }

                        // Remove tables from this schema from tableIds if present
                        if (prev.tableIds) {
                            const schemaTableIds = allTables
                                .filter((table) => table.schemaId === schemaId)
                                .map((table) => table.id);
                            newTableIds = prev.tableIds.filter(
                                (id) => !schemaTableIds.includes(id)
                            );
                        }
                    } else {
                        // Schema is not visible, make it visible
                        newSchemaIds = [
                            ...new Set([...(currentSchemaIds || []), schemaId]),
                        ];

                        // Add tables from this schema to tableIds if tableIds is defined
                        if (prev.tableIds) {
                            const schemaTableIds = allTables
                                .filter((table) => table.schemaId === schemaId)
                                .map((table) => table.id);
                            newTableIds = [
                                ...new Set([
                                    ...prev.tableIds,
                                    ...schemaTableIds,
                                ]),
                            ];
                        }
                    }

                    // Use reduceFilter to optimize and handle edge cases
                    return reduceFilter(
                        {
                            schemaIds: newSchemaIds,
                            tableIds: newTableIds,
                        },
                        allTables satisfies FilterTableInfo[],
                        {
                            databaseWithSchemas:
                                databasesWithSchemas.includes(databaseType),
                        }
                    );
                });
            },
            [allSchemasIds, allTables, databaseType]
        );

    const toggleTableFilterForNoSchema = useCallback(
        (tableId: string) => {
            setFilter((prev) => {
                const currentTableIds = prev.tableIds;

                // Check if table is currently visible
                const isTableVisible = filterTable({
                    table: { id: tableId, schema: undefined },
                    filter: prev,
                    options: { defaultSchema: undefined },
                });

                let newTableIds: string[] | undefined;

                if (isTableVisible) {
                    // Table is visible, make it not visible
                    if (!currentTableIds) {
                        // All tables are visible, create filter with all except this one
                        newTableIds = allTables
                            .filter((t) => t.id !== tableId)
                            .map((t) => t.id);
                    } else {
                        // Remove this table from the filter
                        newTableIds = currentTableIds.filter(
                            (id) => id !== tableId
                        );
                    }
                } else {
                    // Table is not visible, make it visible
                    newTableIds = [
                        ...new Set([...(currentTableIds || []), tableId]),
                    ];
                }

                // Use reduceFilter to optimize and handle edge cases
                return reduceFilter(
                    {
                        schemaIds: undefined,
                        tableIds: newTableIds,
                    },
                    allTables satisfies FilterTableInfo[],
                    {
                        databaseWithSchemas:
                            databasesWithSchemas.includes(databaseType),
                    }
                );
            });
        },
        [allTables, databaseType]
    );

    const toggleTableFilter: DiagramFilterContext['toggleTableFilter'] =
        useCallback(
            (tableId: string) => {
                if (!databasesWithSchemas.includes(databaseType)) {
                    // No schemas, toggle table filter without schema context
                    toggleTableFilterForNoSchema(tableId);
                    return;
                }

                setFilter((prev) => {
                    // Find the table in the tables list
                    const tableInfo = allTables.find((t) => t.id === tableId);

                    if (!tableInfo) {
                        return prev;
                    }

                    // Check if table is currently visible using filterTable
                    const isTableVisible = filterTable({
                        table: {
                            id: tableInfo.id,
                            schema: tableInfo.schema,
                        },
                        filter: prev,
                        options: {
                            defaultSchema: defaultSchemas[databaseType],
                        },
                    });

                    let newSchemaIds = prev.schemaIds;
                    let newTableIds = prev.tableIds;

                    if (isTableVisible) {
                        // Table is visible, make it not visible

                        // If the table is visible due to its schema being in schemaIds
                        if (
                            tableInfo?.schemaId &&
                            prev.schemaIds?.includes(tableInfo.schemaId)
                        ) {
                            // Remove the schema from schemaIds and add all other tables from that schema to tableIds
                            newSchemaIds = prev.schemaIds.filter(
                                (id) => id !== tableInfo.schemaId
                            );

                            // Get all other tables from this schema (except the one being toggled)
                            const otherTablesFromSchema = allTables
                                .filter(
                                    (t) =>
                                        t.schemaId === tableInfo.schemaId &&
                                        t.id !== tableId
                                )
                                .map((t) => t.id);

                            // Add these tables to tableIds
                            newTableIds = [
                                ...(prev.tableIds || []),
                                ...otherTablesFromSchema,
                            ];
                        } else if (prev.tableIds?.includes(tableId)) {
                            // Table is visible because it's in tableIds, remove it
                            newTableIds = prev.tableIds.filter(
                                (id) => id !== tableId
                            );
                        } else if (!prev.tableIds && !prev.schemaIds) {
                            // No filters = all visible, create filter with all tables except this one
                            newTableIds = allTables
                                .filter((t) => t.id !== tableId)
                                .map((t) => t.id);
                        }
                    } else {
                        // Table is not visible, make it visible by adding to tableIds
                        newTableIds = [...(prev.tableIds || []), tableId];
                    }

                    // Use reduceFilter to optimize and handle edge cases
                    return reduceFilter(
                        {
                            schemaIds: newSchemaIds,
                            tableIds: newTableIds,
                        },
                        allTables satisfies FilterTableInfo[],
                        {
                            databaseWithSchemas:
                                databasesWithSchemas.includes(databaseType),
                        }
                    );
                });
            },
            [allTables, databaseType, toggleTableFilterForNoSchema]
        );

    const addSchemaToFilter: DiagramFilterContext['addSchemaToFilter'] =
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

    const schemasDisplayed: DiagramFilterContext['schemasDisplayed'] =
        useMemo(() => {
            if (!hasActiveFilter) {
                return schemas;
            }

            const displayedSchemaIds = new Set<string>();
            for (const table of allTables) {
                if (
                    filterTable({
                        table: {
                            id: table.id,
                            schema: table.schema,
                        },
                        filter,
                        options: {
                            defaultSchema: defaultSchemas[databaseType],
                        },
                    })
                ) {
                    if (table.schemaId) {
                        displayedSchemaIds.add(table.schemaId);
                    }
                }
            }

            return schemas.filter((schema) =>
                displayedSchemaIds.has(schema.id)
            );
        }, [hasActiveFilter, schemas, allTables, filter, databaseType]);

    const addTablesToFilter: DiagramFilterContext['addTablesToFilter'] =
        useCallback(
            ({ tableIds, filterCallback }) => {
                setFilter((prev) => {
                    let tableIdsToAdd: string[];

                    if (tableIds) {
                        // If tableIds are provided, use them directly
                        tableIdsToAdd = tableIds;
                    } else if (filterCallback) {
                        // If filterCallback is provided, filter tables based on it
                        tableIdsToAdd = allTables
                            .filter(filterCallback)
                            .map((table) => table.id);
                    } else {
                        // If neither is provided, do nothing
                        return prev;
                    }

                    const filterByTableIds = spreadFilterTables(
                        prev,
                        allTables satisfies FilterTableInfo[]
                    );

                    const currentTableIds = filterByTableIds.tableIds || [];
                    const newTableIds = [
                        ...new Set([...currentTableIds, ...tableIdsToAdd]),
                    ];

                    return reduceFilter(
                        {
                            ...filterByTableIds,
                            tableIds: newTableIds,
                        },
                        allTables satisfies FilterTableInfo[],
                        {
                            databaseWithSchemas:
                                databasesWithSchemas.includes(databaseType),
                        }
                    );
                });
            },
            [allTables, databaseType]
        );

    const removeTablesFromFilter: DiagramFilterContext['removeTablesFromFilter'] =
        useCallback(
            ({ tableIds, filterCallback }) => {
                setFilter((prev) => {
                    let tableIdsToRemovoe: string[];

                    if (tableIds) {
                        // If tableIds are provided, use them directly
                        tableIdsToRemovoe = tableIds;
                    } else if (filterCallback) {
                        // If filterCallback is provided, filter tables based on it
                        tableIdsToRemovoe = allTables
                            .filter(filterCallback)
                            .map((table) => table.id);
                    } else {
                        // If neither is provided, do nothing
                        return prev;
                    }

                    const filterByTableIds = spreadFilterTables(
                        prev,
                        allTables satisfies FilterTableInfo[]
                    );

                    const currentTableIds = filterByTableIds.tableIds || [];
                    const newTableIds = currentTableIds.filter(
                        (id) => !tableIdsToRemovoe.includes(id)
                    );

                    return reduceFilter(
                        {
                            ...filterByTableIds,
                            tableIds: newTableIds,
                        },
                        allTables satisfies FilterTableInfo[],
                        {
                            databaseWithSchemas:
                                databasesWithSchemas.includes(databaseType),
                        }
                    );
                });
            },
            [allTables, databaseType]
        );

    const eventConsumer = useCallback(
        (event: ChartDBEvent) => {
            if (!hasActiveFilter) {
                return;
            }

            if (event.action === 'add_tables') {
                addTablesToFilter({
                    tableIds: event.data.tables.map((table) => table.id),
                });
            }
        },
        [hasActiveFilter, addTablesToFilter]
    );

    events.useSubscription(eventConsumer);

    const value: DiagramFilterContext = {
        loading,
        filter,
        clearSchemaIdsFilter: clearSchemaIds,
        setTableIdsFilterEmpty: setTableIdsEmpty,
        clearTableIdsFilter: clearTableIds,
        resetFilter,
        toggleSchemaFilter,
        toggleTableFilter,
        addSchemaToFilter,
        hasActiveFilter,
        schemasDisplayed,
        addTablesToFilter,
        removeTablesFromFilter,
    };

    return (
        <diagramFilterContext.Provider value={value}>
            {children}
        </diagramFilterContext.Provider>
    );
};
