import { createContext } from 'react';
import type { DBTable } from '@/lib/domain/db-table';
import { emptyFn } from '@/lib/utils';
import { DatabaseType } from '@/lib/domain/database-type';
import type { DBField } from '@/lib/domain/db-field';
import type { DBIndex } from '@/lib/domain/db-index';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { Diagram } from '@/lib/domain/diagram';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import type { DBSchema } from '@/lib/domain/db-schema';
import type { DBDependency } from '@/lib/domain/db-dependency';
import { EventEmitter } from 'ahooks/lib/useEventEmitter';
import type { Area } from '@/lib/domain/area';
import type { DBCustomType } from '@/lib/domain/db-custom-type';

export type ChartDBEventType =
    | 'add_tables'
    | 'update_table'
    | 'remove_tables'
    | 'add_field'
    | 'remove_field'
    | 'load_diagram';

export type ChartDBEventBase<T extends ChartDBEventType, D> = {
    action: T;
    data: D;
};

export type CreateTableEvent = ChartDBEventBase<
    'add_tables',
    { tables: DBTable[] }
>;

export type UpdateTableEvent = ChartDBEventBase<
    'update_table',
    { id: string; table: Partial<DBTable> }
>;

export type RemoveTableEvent = ChartDBEventBase<
    'remove_tables',
    { tableIds: string[] }
>;

export type AddFieldEvent = ChartDBEventBase<
    'add_field',
    { tableId: string; field: DBField; fields: DBField[] }
>;

export type RemoveFieldEvent = ChartDBEventBase<
    'remove_field',
    { tableId: string; fieldId: string; fields: DBField[] }
>;

export type LoadDiagramEvent = ChartDBEventBase<
    'load_diagram',
    { diagram: Diagram }
>;

export type ChartDBEvent =
    | CreateTableEvent
    | UpdateTableEvent
    | RemoveTableEvent
    | AddFieldEvent
    | RemoveFieldEvent
    | LoadDiagramEvent;

export interface ChartDBContext {
    diagramId: string;
    diagramName: string;
    databaseType: DatabaseType;
    tables: DBTable[];
    schemas: DBSchema[];
    relationships: DBRelationship[];
    dependencies: DBDependency[];
    areas: Area[];
    customTypes: DBCustomType[];
    currentDiagram: Diagram;
    events: EventEmitter<ChartDBEvent>;
    readonly?: boolean;

    filteredSchemas?: string[];
    filterSchemas: (schemaIds: string[]) => void;

    // General operations
    updateDiagramId: (id: string) => Promise<void>;
    updateDiagramName: (
        name: string,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    loadDiagram: (diagramId: string) => Promise<Diagram | undefined>;
    loadDiagramFromData: (diagram: Diagram) => void;
    updateDiagramUpdatedAt: () => Promise<void>;
    clearDiagramData: () => Promise<void>;
    deleteDiagram: () => Promise<void>;

    // Database type operations
    updateDatabaseType: (databaseType: DatabaseType) => Promise<void>;
    updateDatabaseEdition: (databaseEdition?: DatabaseEdition) => Promise<void>;

    // Table operations
    createTable: (
        attributes?: Partial<Omit<DBTable, 'id'>>
    ) => Promise<DBTable>;
    addTable: (
        table: DBTable,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    addTables: (
        tables: DBTable[],
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    getTable: (id: string) => DBTable | null;
    removeTable: (
        id: string,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    removeTables: (
        ids: string[],
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    updateTable: (
        id: string,
        table: Partial<DBTable>,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    updateTablesState: (
        updateFn: (tables: DBTable[]) => PartialExcept<DBTable, 'id'>[],
        options?: { updateHistory: boolean; forceOverride?: boolean }
    ) => Promise<void>;

    // Field operations
    getField: (tableId: string, fieldId: string) => DBField | null;
    updateField: (
        tableId: string,
        fieldId: string,
        field: Partial<DBField>,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    removeField: (
        tableId: string,
        fieldId: string,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    createField: (tableId: string) => Promise<DBField>;
    addField: (
        tableId: string,
        field: DBField,
        options?: { updateHistory: boolean }
    ) => Promise<void>;

    // Index operations
    createIndex: (tableId: string) => Promise<DBIndex>;
    addIndex: (
        tableId: string,
        index: DBIndex,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    getIndex: (tableId: string, indexId: string) => DBIndex | null;
    removeIndex: (
        tableId: string,
        indexId: string,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    updateIndex: (
        tableId: string,
        indexId: string,
        index: Partial<DBIndex>,
        options?: { updateHistory: boolean }
    ) => Promise<void>;

    // Relationship operations
    createRelationship: (params: {
        sourceTableId: string;
        targetTableId: string;
        sourceFieldId: string;
        targetFieldId: string;
    }) => Promise<DBRelationship>;
    addRelationship: (
        relationship: DBRelationship,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    addRelationships: (
        relationships: DBRelationship[],
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    getRelationship: (id: string) => DBRelationship | null;
    removeRelationship: (
        id: string,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    removeRelationships: (
        ids: string[],
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    updateRelationship: (
        id: string,
        relationship: Partial<DBRelationship>,
        options?: { updateHistory: boolean }
    ) => Promise<void>;

    // Dependency operations
    createDependency: (params: {
        tableId: string;
        dependentTableId: string;
    }) => Promise<DBDependency>;
    addDependency: (
        dependency: DBDependency,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    addDependencies: (
        dependencies: DBDependency[],
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    getDependency: (id: string) => DBDependency | null;
    removeDependency: (
        id: string,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    removeDependencies: (
        ids: string[],
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    updateDependency: (
        id: string,
        dependency: Partial<DBDependency>,
        options?: { updateHistory: boolean }
    ) => Promise<void>;

    // Area operations
    createArea: (attributes?: Partial<Omit<Area, 'id'>>) => Promise<Area>;
    addArea: (
        area: Area,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    addAreas: (
        areas: Area[],
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    getArea: (id: string) => Area | null;
    removeArea: (
        id: string,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    removeAreas: (
        ids: string[],
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    updateArea: (
        id: string,
        area: Partial<Area>,
        options?: { updateHistory: boolean }
    ) => Promise<void>;

    // Custom type operations
    createCustomType: (
        attributes?: Partial<Omit<DBCustomType, 'id'>>
    ) => Promise<DBCustomType>;
    addCustomType: (
        customType: DBCustomType,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    addCustomTypes: (
        customTypes: DBCustomType[],
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    getCustomType: (id: string) => DBCustomType | null;
    removeCustomType: (
        id: string,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    removeCustomTypes: (
        ids: string[],
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    updateCustomType: (
        id: string,
        customType: Partial<DBCustomType>,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
}

export const chartDBContext = createContext<ChartDBContext>({
    databaseType: DatabaseType.GENERIC,
    diagramName: '',
    diagramId: '',
    tables: [],
    relationships: [],
    dependencies: [],
    areas: [],
    customTypes: [],
    schemas: [],
    filteredSchemas: [],
    filterSchemas: emptyFn,
    currentDiagram: {
        id: '',
        name: '',
        databaseType: DatabaseType.GENERIC,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    events: new EventEmitter(),

    // General operations
    updateDiagramId: emptyFn,
    updateDiagramName: emptyFn,
    updateDiagramUpdatedAt: emptyFn,
    loadDiagram: emptyFn,
    loadDiagramFromData: emptyFn,
    clearDiagramData: emptyFn,
    deleteDiagram: emptyFn,

    // Database type operations
    updateDatabaseType: emptyFn,
    updateDatabaseEdition: emptyFn,

    // Table operations
    createTable: emptyFn,
    getTable: emptyFn,
    addTable: emptyFn,
    addTables: emptyFn,
    removeTable: emptyFn,
    removeTables: emptyFn,
    updateTable: emptyFn,
    updateTablesState: emptyFn,

    // Field operations
    updateField: emptyFn,
    removeField: emptyFn,
    createField: emptyFn,
    addField: emptyFn,
    getField: emptyFn,

    // Index operations
    createIndex: emptyFn,
    addIndex: emptyFn,
    getIndex: emptyFn,
    removeIndex: emptyFn,
    updateIndex: emptyFn,

    // Relationship operations
    createRelationship: emptyFn,
    addRelationship: emptyFn,
    getRelationship: emptyFn,
    removeRelationship: emptyFn,
    updateRelationship: emptyFn,
    removeRelationships: emptyFn,
    addRelationships: emptyFn,

    // Dependency operations
    createDependency: emptyFn,
    addDependency: emptyFn,
    getDependency: emptyFn,
    removeDependency: emptyFn,
    removeDependencies: emptyFn,
    addDependencies: emptyFn,
    updateDependency: emptyFn,

    // Area operations
    createArea: emptyFn,
    addArea: emptyFn,
    addAreas: emptyFn,
    getArea: emptyFn,
    removeArea: emptyFn,
    removeAreas: emptyFn,
    updateArea: emptyFn,

    // Custom type operations
    createCustomType: emptyFn,
    addCustomType: emptyFn,
    addCustomTypes: emptyFn,
    getCustomType: emptyFn,
    removeCustomType: emptyFn,
    removeCustomTypes: emptyFn,
    updateCustomType: emptyFn,
});
