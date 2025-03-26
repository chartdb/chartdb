import type { DataType } from '@/lib/data/data-types/data-types';

export type TableDiffAttribute = 'name' | 'comments';

export interface TableDiff {
    object: 'table';
    type: 'added' | 'removed' | 'changed';
    tableId: string;
    attribute?: TableDiffAttribute;
    oldValue?: string;
    newValue?: string;
}

export interface RelationshipDiff {
    object: 'relationship';
    type: 'added' | 'removed';
    relationshipId: string;
}

export type FieldDiffAttribute =
    | 'name'
    | 'type'
    | 'primaryKey'
    | 'unique'
    | 'nullable'
    | 'comments';

export interface FieldDiff {
    object: 'field';
    type: 'added' | 'removed' | 'changed';
    fieldId: string;
    tableId: string;
    attribute?: FieldDiffAttribute;
    oldValue?: string | boolean | DataType;
    newValue?: string | boolean | DataType;
}

export interface IndexDiff {
    object: 'index';
    type: 'added' | 'removed';
    indexId: string;
    tableId: string;
}

export type ChartDBDiff = TableDiff | FieldDiff | IndexDiff | RelationshipDiff;

export type DiffMap = Map<string, ChartDBDiff>;

export type DiffObject =
    | TableDiff['object']
    | FieldDiff['object']
    | IndexDiff['object']
    | RelationshipDiff['object'];
