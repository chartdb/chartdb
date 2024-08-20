import { DBTable } from '@/lib/domain/db-table';
import { DatabaseType } from '@/lib/domain/database-type';
import { ChartDBContext } from '../chartdb-context/chartdb-context';
import { DBField } from '@/lib/domain/db-field';
import { DBIndex } from '@/lib/domain/db-index';
import { DBRelationship } from '@/lib/domain/db-relationship';

type Action = keyof ChartDBContext;

type RedoUndoActionBase<T extends Action, D> = {
    action: T;
    data: D;
};

type RedoUndoActionUpdateDiagramId = RedoUndoActionBase<
    'updateDiagramId',
    { id: string }
>;

type RedoUndoActionUpdateDiagramName = RedoUndoActionBase<
    'updateDiagramName',
    { name: string }
>;

type RedoUndoActionUpdateDatabaseType = RedoUndoActionBase<
    'updateDatabaseType',
    { databaseType: DatabaseType }
>;

type RedoUndoActionUpdateTable = RedoUndoActionBase<
    'updateTable',
    { tableId: string; table: Partial<DBTable> }
>;

type RedoUndoActionAddTable = RedoUndoActionBase<
    'addTable',
    { tableId?: string; table?: DBTable }
>;

type RedoUndoActionRemoveTable = RedoUndoActionBase<
    'removeTable',
    { tableId?: string; table?: DBTable }
>;

type RedoUndoActionUpdateTablesState = RedoUndoActionBase<
    'updateTablesState',
    { tables: DBTable[] }
>;

type RedoUndoActionAddField = RedoUndoActionBase<
    'addField',
    { tableId: string; fieldId?: string; field?: DBField }
>;

type RedoUndoActionRemoveField = RedoUndoActionBase<
    'removeField',
    { tableId: string; fieldId?: string; field?: DBField }
>;

type RedoUndoActionUpdateField = RedoUndoActionBase<
    'updateField',
    { tableId: string; fieldId: string; field: Partial<DBField> }
>;

type RedoUndoActionAddIndex = RedoUndoActionBase<
    'addIndex',
    { tableId: string; indexId?: string; index?: DBIndex }
>;

type RedoUndoActionRemoveIndex = RedoUndoActionBase<
    'removeIndex',
    { tableId: string; indexId?: string; index?: DBIndex }
>;

type RedoUndoActionUpdateIndex = RedoUndoActionBase<
    'updateIndex',
    { tableId: string; indexId: string; index: Partial<DBIndex> }
>;

type RedoUndoActionAddRelationship = RedoUndoActionBase<
    'addRelationship',
    { relationshipId?: string; relationship?: DBRelationship }
>;

type RedoUndoActionRemoveRelationship = RedoUndoActionBase<
    'removeRelationship',
    { relationshipId?: string; relationship?: DBRelationship }
>;

type RedoUndoActionUpdateRelationship = RedoUndoActionBase<
    'updateRelationship',
    { relationshipId: string; relationship: Partial<DBRelationship> }
>;

type RedoUndoActionRemoveRelationships = RedoUndoActionBase<
    'removeRelationships',
    { relationshipsIds?: string[]; relationships?: DBRelationship[] }
>;

export type RedoUndoAction =
    | RedoUndoActionAddTable
    | RedoUndoActionRemoveTable
    | RedoUndoActionUpdateTable
    | RedoUndoActionUpdateDatabaseType
    | RedoUndoActionUpdateDiagramName
    | RedoUndoActionUpdateDiagramId
    | RedoUndoActionUpdateTablesState
    | RedoUndoActionAddField
    | RedoUndoActionRemoveField
    | RedoUndoActionUpdateField
    | RedoUndoActionAddIndex
    | RedoUndoActionRemoveIndex
    | RedoUndoActionUpdateIndex
    | RedoUndoActionAddRelationship
    | RedoUndoActionRemoveRelationship
    | RedoUndoActionUpdateRelationship
    | RedoUndoActionRemoveRelationships;

export type RedoUndoActionData<T extends Action> = Extract<
    RedoUndoAction,
    { action: T }
>['data'];

export type RedoUndoActionHandlers = {
    [K in Action]: (data: RedoUndoActionData<K>) => Promise<void>;
};
