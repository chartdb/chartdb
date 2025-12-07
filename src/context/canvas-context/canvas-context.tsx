import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';
import type { Graph } from '@/lib/graph';
import { createGraph } from '@/lib/graph';
import { EventEmitter } from 'ahooks/lib/useEventEmitter';

export type CanvasEventType = 'pan_click';

export type CanvasEventBase<T extends CanvasEventType, D> = {
    action: T;
    data: D;
};

export type PanClickEvent = CanvasEventBase<
    'pan_click',
    {
        x: number;
        y: number;
    }
>;

export type CanvasEvent = PanClickEvent;

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
    openRelationshipPopover: (params: {
        relationshipId: string;
        position: { x: number; y: number };
    }) => void;
    closeRelationshipPopover: () => void;
    editRelationshipPopover: {
        relationshipId: string;
        position: { x: number; y: number };
    } | null;
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
    events: EventEmitter<CanvasEvent>;
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
    openRelationshipPopover: emptyFn,
    closeRelationshipPopover: emptyFn,
    editRelationshipPopover: null,
    tempFloatingEdge: null,
    setTempFloatingEdge: emptyFn,
    startFloatingEdgeCreation: emptyFn,
    endFloatingEdgeCreation: emptyFn,
    hoveringTableId: null,
    setHoveringTableId: emptyFn,
    showCreateRelationshipNode: emptyFn,
    hideCreateRelationshipNode: emptyFn,
    events: new EventEmitter(),
});
