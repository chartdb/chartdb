import { createContext } from 'react';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import type { DBField } from '@/lib/domain/db-field';
import type { DataType } from '@/lib/data/data-types/data-types';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DiffMap } from '@/lib/domain/diff/diff';

export type DiffEventType = 'diff_calculated';

export type DiffEventBase<T extends DiffEventType, D> = {
    action: T;
    data: D;
};

export type DiffCalculatedData = {
    tablesAdded: DBTable[];
    fieldsAdded: Map<string, DBField[]>;
    relationshipsAdded: DBRelationship[];
};

export type DiffCalculatedEvent = DiffEventBase<
    'diff_calculated',
    DiffCalculatedData
>;

export type DiffEvent = DiffCalculatedEvent;

export interface DiffContext {
    newDiagram: Diagram | null;
    originalDiagram: Diagram | null;
    diffMap: DiffMap;
    hasDiff: boolean;

    calculateDiff: ({
        diagram,
        newDiagram,
    }: {
        diagram: Diagram;
        newDiagram: Diagram;
    }) => void;

    // table diff
    checkIfTableHasChange: ({ tableId }: { tableId: string }) => boolean;
    checkIfNewTable: ({ tableId }: { tableId: string }) => boolean;
    checkIfTableRemoved: ({ tableId }: { tableId: string }) => boolean;
    getTableNewName: ({ tableId }: { tableId: string }) => string | null;
    getTableNewColor: ({ tableId }: { tableId: string }) => string | null;

    // field diff
    checkIfFieldHasChange: ({
        tableId,
        fieldId,
    }: {
        tableId: string;
        fieldId: string;
    }) => boolean;
    checkIfFieldRemoved: ({ fieldId }: { fieldId: string }) => boolean;
    checkIfNewField: ({ fieldId }: { fieldId: string }) => boolean;
    getFieldNewName: ({ fieldId }: { fieldId: string }) => string | null;
    getFieldNewType: ({ fieldId }: { fieldId: string }) => DataType | null;

    // relationship diff
    checkIfNewRelationship: ({
        relationshipId,
    }: {
        relationshipId: string;
    }) => boolean;
    checkIfRelationshipRemoved: ({
        relationshipId,
    }: {
        relationshipId: string;
    }) => boolean;

    events: EventEmitter<DiffEvent>;
}

export const diffContext = createContext<DiffContext | undefined>(undefined);
