import { DBTable } from '@/lib/domain/db-table';
import { ChartDBContext } from '../chartdb-context/chartdb-context';
import { DBField } from '@/lib/domain/db-field';
import { DBIndex } from '@/lib/domain/db-index';
import { DBRelationship } from '@/lib/domain/db-relationship';

type Action = keyof ChartDBContext;

type RedoUndoActionBase<T extends Action, RD, UD> = {
    action: T;
    redoData: RD;
    undoData: UD;
};

type RedoUndoActionUpdateDiagramName = RedoUndoActionBase<
    'updateDiagramName',
    { name: string },
    { name: string }
>;

type RedoUndoActionUpdateTable = RedoUndoActionBase<
    'updateTable',
    { tableId: string; table: Partial<DBTable> },
    { tableId: string; table: Partial<DBTable> }
>;

type RedoUndoActionAddTable = RedoUndoActionBase<
    'addTable',
    { table: DBTable },
    { tableId: string }
>;

type RedoUndoActionRemoveTable = RedoUndoActionBase<
    'removeTable',
    { tableId: string },
    { table: DBTable }
>;

type RedoUndoActionUpdateTablesState = RedoUndoActionBase<
    'updateTablesState',
    { tables: DBTable[] },
    { tables: DBTable[] }
>;

type RedoUndoActionAddField = RedoUndoActionBase<
    'addField',
    { tableId: string; field: DBField },
    { tableId: string; fieldId: string }
>;

type RedoUndoActionRemoveField = RedoUndoActionBase<
    'removeField',
    { tableId: string; fieldId: string },
    { tableId: string; field: DBField }
>;

type RedoUndoActionUpdateField = RedoUndoActionBase<
    'updateField',
    { tableId: string; fieldId: string; field: Partial<DBField> },
    { tableId: string; fieldId: string; field: Partial<DBField> }
>;

type RedoUndoActionAddIndex = RedoUndoActionBase<
    'addIndex',
    { tableId: string; index: DBIndex },
    { tableId: string; indexId: string }
>;

type RedoUndoActionRemoveIndex = RedoUndoActionBase<
    'removeIndex',
    { tableId: string; indexId: string },
    { tableId: string; index: DBIndex }
>;

type RedoUndoActionUpdateIndex = RedoUndoActionBase<
    'updateIndex',
    { tableId: string; indexId: string; index: Partial<DBIndex> },
    { tableId: string; indexId: string; index: Partial<DBIndex> }
>;

type RedoUndoActionAddRelationship = RedoUndoActionBase<
    'addRelationship',
    { relationship: DBRelationship },
    { relationshipId: string }
>;

type RedoUndoActionAddRelationships = RedoUndoActionBase<
    'addRelationships',
    { relationships: DBRelationship[] },
    { relationshipIds: string[] }
>;

type RedoUndoActionRemoveRelationship = RedoUndoActionBase<
    'removeRelationship',
    { relationshipId: string },
    { relationship: DBRelationship }
>;

type RedoUndoActionUpdateRelationship = RedoUndoActionBase<
    'updateRelationship',
    { relationshipId: string; relationship: Partial<DBRelationship> },
    { relationshipId: string; relationship: Partial<DBRelationship> }
>;

type RedoUndoActionRemoveRelationships = RedoUndoActionBase<
    'removeRelationships',
    { relationshipsIds: string[] },
    { relationships: DBRelationship[] }
>;

export type RedoUndoAction =
    | RedoUndoActionAddTable
    | RedoUndoActionRemoveTable
    | RedoUndoActionUpdateTable
    | RedoUndoActionUpdateDiagramName
    | RedoUndoActionUpdateTablesState
    | RedoUndoActionAddField
    | RedoUndoActionRemoveField
    | RedoUndoActionUpdateField
    | RedoUndoActionAddIndex
    | RedoUndoActionRemoveIndex
    | RedoUndoActionUpdateIndex
    | RedoUndoActionAddRelationship
    | RedoUndoActionAddRelationships
    | RedoUndoActionRemoveRelationship
    | RedoUndoActionUpdateRelationship
    | RedoUndoActionRemoveRelationships;

export type RedoActionData<T extends Action> = Extract<
    RedoUndoAction,
    { action: T }
>['redoData'];

export type UndoActionData<T extends Action> = Extract<
    RedoUndoAction,
    { action: T }
>['undoData'];

export type RedoUndoActionHandlers = {
    [K in RedoUndoAction['action']]: (args: {
        redoData: RedoActionData<K>;
        undoData: UndoActionData<K>;
    }) => Promise<void>;
};
