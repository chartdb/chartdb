import { createContext } from 'react';
import type { DiffMap } from './types';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';

export type DiffEventType = 'diff_calculated';

export type DiffEventBase<T extends DiffEventType, D> = {
    action: T;
    data: D;
};

export type DiffCalculatedEvent = DiffEventBase<
    'diff_calculated',
    {
        tablesAdded: DBTable[];
    }
>;

export type DiffEvent = DiffCalculatedEvent;

export interface DiffContext {
    newDiagram: Diagram | null;
    addedTables?: DBTable[];
    diffMap: DiffMap;
    calculateDiff: ({
        diagram,
        newDiagram,
    }: {
        diagram: Diagram;
        newDiagram: Diagram;
    }) => void;
    hasDiff: boolean;
    tablesChanged: Map<string, boolean>;
    getTableNewName: ({ tableId }: { tableId: string }) => string | null;
    checkIfTableHasChange: ({ tableId }: { tableId: string }) => boolean;

    events: EventEmitter<DiffEvent>;
}

export const diffContext = createContext<DiffContext | undefined>(undefined);
