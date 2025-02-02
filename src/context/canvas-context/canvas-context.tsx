import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';
import type { Graph } from '@/lib/graph';
import { createGraph } from '@/lib/graph';

export interface CanvasContext {
    reorderTables: (options?: { updateHistory?: boolean }) => void;
    fitView: (options?: {
        duration?: number;
        padding?: number;
        maxZoom?: number;
    }) => void;
    setOverlapGraph: (graph: Graph<string>) => void;
    overlapGraph: Graph<string>;
}

export const canvasContext = createContext<CanvasContext>({
    reorderTables: emptyFn,
    fitView: emptyFn,
    setOverlapGraph: emptyFn,
    overlapGraph: createGraph(),
});
