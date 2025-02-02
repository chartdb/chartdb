import React, { type ReactNode, useCallback, useState } from 'react';
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
    const { tables, relationships, updateTablesState, filteredSchemas } =
        useChartDB();
    const { fitView } = useReactFlow();
    const [overlapGraph, setOverlapGraph] =
        useState<Graph<string>>(createGraph());

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
            }}
        >
            {children}
        </canvasContext.Provider>
    );
};
