import { createContext } from 'react';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import type { DBField } from '@/lib/domain/db-field';
import type { DataType } from '@/lib/data/data-types/data-types';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { Area } from '@/lib/domain/area';
import type { DiffMap } from '@/lib/domain/diff/diff';

export type DiffEventType = 'diff_calculated';

export type DiffEventBase<T extends DiffEventType, D> = {
    action: T;
    data: D;
};

export type DiffCalculatedData = {
    tablesToAdd: DBTable[];
    fieldsToAdd: Map<string, DBField[]>;
    relationshipsToAdd: DBRelationship[];
    areasToAdd: Area[];
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
    isSummaryOnly: boolean;

    calculateDiff: ({
        diagram,
        newDiagram,
        options,
    }: {
        diagram: Diagram;
        newDiagram: Diagram;
        options?: {
            summaryOnly?: boolean;
        };
    }) => { foundDiff: boolean };
    resetDiff: () => void;

    // table diff
    checkIfTableHasChange: ({ tableId }: { tableId: string }) => boolean;
    checkIfNewTable: ({ tableId }: { tableId: string }) => boolean;
    checkIfTableRemoved: ({ tableId }: { tableId: string }) => boolean;
    getTableNewName: ({ tableId }: { tableId: string }) => {
        old: string;
        new: string;
    } | null;
    getTableNewColor: ({ tableId }: { tableId: string }) => {
        old: string;
        new: string;
    } | null;

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
    getFieldNewName: ({
        fieldId,
    }: {
        fieldId: string;
    }) => { old: string; new: string } | null;
    getFieldNewType: ({
        fieldId,
    }: {
        fieldId: string;
    }) => { old: DataType; new: DataType } | null;
    getFieldNewPrimaryKey: ({
        fieldId,
    }: {
        fieldId: string;
    }) => { old: boolean; new: boolean } | null;
    getFieldNewNullable: ({
        fieldId,
    }: {
        fieldId: string;
    }) => { old: boolean; new: boolean } | null;
    getFieldNewCharacterMaximumLength: ({
        fieldId,
    }: {
        fieldId: string;
    }) => { old: string; new: string } | null;
    getFieldNewScale: ({
        fieldId,
    }: {
        fieldId: string;
    }) => { old: number; new: number } | null;
    getFieldNewPrecision: ({
        fieldId,
    }: {
        fieldId: string;
    }) => { old: number; new: number } | null;
    getFieldNewIsArray: ({
        fieldId,
    }: {
        fieldId: string;
    }) => { old: boolean; new: boolean } | null;

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

    // area diff
    checkIfNewArea: ({ areaId }: { areaId: string }) => boolean;
    checkIfAreaRemoved: ({ areaId }: { areaId: string }) => boolean;

    events: EventEmitter<DiffEvent>;
}

export const diffContext = createContext<DiffContext | undefined>(undefined);
