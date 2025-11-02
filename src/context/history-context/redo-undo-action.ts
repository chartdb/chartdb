import type { DBTable } from '@/lib/domain/db-table';
import type { ChartDBContext } from '../chartdb-context/chartdb-context';
import type { DBField } from '@/lib/domain/db-field';
import type { DBIndex } from '@/lib/domain/db-index';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DBDependency } from '@/lib/domain/db-dependency';
import type { Area } from '@/lib/domain/area';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import type { Note } from '@/lib/domain/note';

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

type RedoUndoActionAddTables = RedoUndoActionBase<
    'addTables',
    { tables: DBTable[] },
    { tableIds: string[] }
>;

type RedoUndoActionRemoveTables = RedoUndoActionBase<
    'removeTables',
    { tableIds: string[] },
    {
        tables: DBTable[];
        relationships: DBRelationship[];
        dependencies: DBDependency[];
    }
>;

type RedoUndoActionUpdateTablesState = RedoUndoActionBase<
    'updateTablesState',
    { tables: DBTable[] },
    {
        tables: DBTable[];
        relationships: DBRelationship[];
        dependencies: DBDependency[];
    }
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

type RedoUndoActionAddRelationships = RedoUndoActionBase<
    'addRelationships',
    { relationships: DBRelationship[] },
    { relationshipIds: string[] }
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

type RedoUndoActionAddDependencies = RedoUndoActionBase<
    'addDependencies',
    { dependencies: DBDependency[] },
    { dependenciesIds: string[] }
>;

type RedoUndoActionUpdateDependency = RedoUndoActionBase<
    'updateDependency',
    { dependencyId: string; dependency: Partial<DBDependency> },
    { dependencyId: string; dependency: Partial<DBDependency> }
>;

type RedoUndoActionRemoveDependencies = RedoUndoActionBase<
    'removeDependencies',
    { dependenciesIds: string[] },
    { dependencies: DBDependency[] }
>;

type RedoUndoActionAddAreas = RedoUndoActionBase<
    'addAreas',
    { areas: Area[] },
    { areaIds: string[] }
>;

type RedoUndoActionUpdateArea = RedoUndoActionBase<
    'updateArea',
    { areaId: string; area: Partial<Area> },
    { areaId: string; area: Partial<Area> }
>;

type RedoUndoActionRemoveAreas = RedoUndoActionBase<
    'removeAreas',
    { areaIds: string[] },
    { areas: Area[] }
>;

type RedoUndoActionAddCustomTypes = RedoUndoActionBase<
    'addCustomTypes',
    { customTypes: DBCustomType[] },
    { customTypeIds: string[] }
>;

type RedoUndoActionUpdateCustomType = RedoUndoActionBase<
    'updateCustomType',
    { customTypeId: string; customType: Partial<DBCustomType> },
    { customTypeId: string; customType: Partial<DBCustomType> }
>;

type RedoUndoActionRemoveCustomTypes = RedoUndoActionBase<
    'removeCustomTypes',
    { customTypeIds: string[] },
    { customTypes: DBCustomType[] }
>;

type RedoUndoActionAddNotes = RedoUndoActionBase<
    'addNotes',
    { notes: Note[] },
    { noteIds: string[] }
>;

type RedoUndoActionUpdateNote = RedoUndoActionBase<
    'updateNote',
    { noteId: string; note: Partial<Note> },
    { noteId: string; note: Partial<Note> }
>;

type RedoUndoActionRemoveNotes = RedoUndoActionBase<
    'removeNotes',
    { noteIds: string[] },
    { notes: Note[] }
>;

export type RedoUndoAction =
    | RedoUndoActionAddTables
    | RedoUndoActionRemoveTables
    | RedoUndoActionUpdateTable
    | RedoUndoActionUpdateDiagramName
    | RedoUndoActionUpdateTablesState
    | RedoUndoActionAddField
    | RedoUndoActionRemoveField
    | RedoUndoActionUpdateField
    | RedoUndoActionAddIndex
    | RedoUndoActionRemoveIndex
    | RedoUndoActionUpdateIndex
    | RedoUndoActionAddRelationships
    | RedoUndoActionUpdateRelationship
    | RedoUndoActionRemoveRelationships
    | RedoUndoActionAddDependencies
    | RedoUndoActionUpdateDependency
    | RedoUndoActionRemoveDependencies
    | RedoUndoActionAddAreas
    | RedoUndoActionUpdateArea
    | RedoUndoActionRemoveAreas
    | RedoUndoActionAddCustomTypes
    | RedoUndoActionUpdateCustomType
    | RedoUndoActionRemoveCustomTypes
    | RedoUndoActionAddNotes
    | RedoUndoActionUpdateNote
    | RedoUndoActionRemoveNotes;

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
