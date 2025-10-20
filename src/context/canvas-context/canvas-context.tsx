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
    setShowFilter: React.Dispatch<React.SetStateAction<boolean>>;
    showFilter: boolean;
    editTableModeTable: {
        tableId: string;
        fieldId?: string;
    } | null;
    setEditTableModeTable: React.Dispatch<
        React.SetStateAction<{
            tableId: string;
            fieldId?: string;
        } | null>
    >;
    tempFloatingEdge: {
        sourceNodeId: string;
        targetNodeId?: string;
    } | null;
    setTempFloatingEdge: React.Dispatch<
        React.SetStateAction<{
            sourceNodeId: string;
            targetNodeId?: string;
        } | null>
    >;
    startFloatingEdgeCreation: ({
        sourceNodeId,
    }: {
        sourceNodeId: string;
    }) => void;
    endFloatingEdgeCreation: () => void;
    hoveringTableId: string | null;
    setHoveringTableId: React.Dispatch<React.SetStateAction<string | null>>;
    showCreateRelationshipNode: (params: {
        sourceTableId: string;
        targetTableId: string;
        x: number;
        y: number;
    }) => void;
    hideCreateRelationshipNode: () => void;
}

export const canvasContext = createContext<CanvasContext>({
    reorderTables: emptyFn,
    fitView: emptyFn,
    setOverlapGraph: emptyFn,
    overlapGraph: createGraph(),
    setShowFilter: emptyFn,
    showFilter: false,
    editTableModeTable: null,
    setEditTableModeTable: emptyFn,
    tempFloatingEdge: null,
    setTempFloatingEdge: emptyFn,
    startFloatingEdgeCreation: emptyFn,
    endFloatingEdgeCreation: emptyFn,
    hoveringTableId: null,
    setHoveringTableId: emptyFn,
    showCreateRelationshipNode: emptyFn,
    hideCreateRelationshipNode: emptyFn,
});
