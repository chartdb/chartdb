import React, {
    type ReactNode,
    useCallback,
    useState,
    useMemo,
    useEffect,
    useRef,
} from 'react';
import { canvasContext } from './canvas-context';
import { useChartDB } from '@/hooks/use-chartdb';
import {
    adjustTablePositions,
    shouldShowTablesBySchemaFilter,
} from '@/lib/domain/db-table';
import { useReactFlow } from '@xyflow/react';
import { findOverlappingTables } from '@/pages/editor-page/canvas/canvas-utils';
import type { Graph } from '@/lib/graph';
import { createGraph } from '@/lib/graph';

interface CanvasProviderProps {
    children: ReactNode;
}

export const CanvasProvider = ({ children }: CanvasProviderProps) => {
    const {
        tables,
        relationships,
        updateTablesState,
        filteredSchemas,
        hiddenTableIds,
        schemas,
    } = useChartDB();
    const { fitView } = useReactFlow();
    const [overlapGraph, setOverlapGraph] =
        useState<Graph<string>>(createGraph());

    // Check if there are any filtered items to determine initial showFilter state
    const hasFilteredItems = useMemo(() => {
        const hasHiddenTables = (hiddenTableIds ?? []).length > 0;
        const hasSchemasFilter =
            filteredSchemas &&
            schemas.length > 0 &&
            filteredSchemas.length < schemas.length;
        return hasHiddenTables || hasSchemasFilter;
    }, [filteredSchemas, hiddenTableIds, schemas]);

    const [showFilter, setShowFilter] = useState(false);
    const hasInitialized = useRef(false);

    // Only auto-show filter on initial load if there are filtered items
    // Wait for data to be defined (not just empty arrays) before initializing
    useEffect(() => {
        const dataLoaded =
            filteredSchemas !== undefined && hiddenTableIds !== undefined;

        if (!hasInitialized.current && dataLoaded) {
            // Add 2 seconds delay to ensure all data is fully loaded
            const timer = setTimeout(() => {
                if (hasFilteredItems) {
                    setShowFilter(true);
                }
                hasInitialized.current = true;
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [hasFilteredItems, filteredSchemas, hiddenTableIds]);

    const reorderTables = useCallback(
        (
            options: { updateHistory?: boolean } = {
                updateHistory: true,
            }
        ) => {
            const newTables = adjustTablePositions({
                relationships,
                tables: tables.filter((table) =>
                    shouldShowTablesBySchemaFilter(table, filteredSchemas)
                ),
                mode: 'all', // Use 'all' mode for manual reordering
            });

            const updatedOverlapGraph = findOverlappingTables({
                tables: newTables,
            });

            updateTablesState(
                (currentTables) =>
                    currentTables.map((table) => {
                        const newTable = newTables.find(
                            (t) => t.id === table.id
                        );
                        return {
                            id: table.id,
                            x: newTable?.x ?? table.x,
                            y: newTable?.y ?? table.y,
                        };
                    }),
                {
                    updateHistory: options.updateHistory ?? true,
                    forceOverride: false,
                }
            );

            setOverlapGraph(updatedOverlapGraph);

            setTimeout(() => {
                fitView({
                    duration: 500,
                    padding: 0.2,
                    maxZoom: 0.8,
                });
            }, 500);
        },
        [filteredSchemas, relationships, tables, updateTablesState, fitView]
    );

    return (
        <canvasContext.Provider
            value={{
                reorderTables,
                fitView,
                setOverlapGraph,
                overlapGraph,
                setShowFilter,
                showFilter,
            }}
        >
            {children}
        </canvasContext.Provider>
    );
};
