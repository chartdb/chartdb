import React, {
    type ReactNode,
    useCallback,
    useState,
    useEffect,
    useRef,
} from 'react';
import { canvasContext } from './canvas-context';
import { useChartDB } from '@/hooks/use-chartdb';
import { adjustTablePositions } from '@/lib/domain/db-table';
import { useReactFlow } from '@xyflow/react';
import { findOverlappingTables } from '@/pages/editor-page/canvas/canvas-utils';
import type { Graph } from '@/lib/graph';
import { createGraph } from '@/lib/graph';
import { useDiagramFilter } from '../diagram-filter-context/use-diagram-filter';
import { filterTable } from '@/lib/domain/diagram-filter/filter';
import { defaultSchemas } from '@/lib/data/default-schemas';

interface CanvasProviderProps {
    children: ReactNode;
}

export const CanvasProvider = ({ children }: CanvasProviderProps) => {
    const {
        tables,
        relationships,
        updateTablesState,
        databaseType,
        areas,
        diagramId,
    } = useChartDB();
    const {
        filter,
        hasActiveFilter,
        loading: filterLoading,
    } = useDiagramFilter();
    const { fitView } = useReactFlow();
    const [overlapGraph, setOverlapGraph] =
        useState<Graph<string>>(createGraph());

    const [showFilter, setShowFilter] = useState(false);
    const diagramIdActiveFilterRef = useRef<string>();

    useEffect(() => {
        if (filterLoading) {
            return;
        }

        if (diagramIdActiveFilterRef.current === diagramId) {
            return;
        }

        diagramIdActiveFilterRef.current = diagramId;

        if (hasActiveFilter) {
            setShowFilter(true);
        }
    }, [hasActiveFilter, filterLoading, diagramId]);

    const reorderTables = useCallback(
        (
            options: { updateHistory?: boolean } = {
                updateHistory: true,
            }
        ) => {
            const newTables = adjustTablePositions({
                relationships,
                tables: tables.filter((table) =>
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
                ),
                areas,
                mode: 'all',
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
        [
            filter,
            relationships,
            tables,
            updateTablesState,
            fitView,
            databaseType,
            areas,
        ]
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
