import { createContext } from 'react';
import { DBTable } from '@/lib/domain/db-table';
import { emptyFn } from '@/lib/utils';
import { DatabaseType } from '@/lib/domain/database-type';
import { DBField } from '@/lib/domain/db-field';
import { DBIndex } from '@/lib/domain/db-index';
import { DBRelationship } from '@/lib/domain/db-relationship';

export interface ChartDBContext {
    diagramId: string;
    diagramName: string;
    databaseType: DatabaseType;
    tables: DBTable[];
    relationships: DBRelationship[];

    // General operations
    updateDiagramId: (id: string) => void;
    updateDiagramName: (name: string) => void;

    // Database type operations
    updateDatabaseType: (databaseType: DatabaseType) => void;

    // Table operations
    createTable: () => DBTable;
    addTable: (table: DBTable) => void;
    getTable: (id: string) => DBTable | null;
    removeTable: (id: string) => void;
    updateTable: (id: string, table: Partial<DBTable>) => void;
    updateTables: (tables: PartialExcept<DBTable, 'id'>[]) => void;
    updateTablesState: (
        updateFn: (tables: DBTable[]) => PartialExcept<DBTable, 'id'>[]
    ) => void;

    // Field operations
    getField: (tableId: string, fieldId: string) => DBField | null;
    updateField: (
        tableId: string,
        fieldId: string,
        field: Partial<DBField>
    ) => void;
    removeField: (tableId: string, fieldId: string) => void;
    createField: (tableId: string) => DBField;
    addField: (tableId: string, field: DBField) => void;

    // Index operations
    createIndex: (tableId: string) => DBIndex;
    addIndex: (tableId: string, index: DBIndex) => void;
    getIndex: (tableId: string, indexId: string) => DBIndex | null;
    removeIndex: (tableId: string, indexId: string) => void;
    updateIndex: (
        tableId: string,
        indexId: string,
        index: Partial<DBIndex>
    ) => void;

    // Relationship operations
    createRelationship: (params: {
        sourceTableId: string;
        targetTableId: string;
        sourceFieldId: string;
        targetFieldId: string;
    }) => DBRelationship;
    addRelationship: (relationship: DBRelationship) => void;
    getRelationship: (id: string) => DBRelationship | null;
    removeRelationship: (id: string) => void;
    removeRelationships: (...ids: string[]) => void;
    updateRelationship: (
        id: string,
        relationship: Partial<DBRelationship>
    ) => void;
}

export const chartDBContext = createContext<ChartDBContext>({
    databaseType: DatabaseType.GENERIC,
    diagramName: 'New Diagram',
    diagramId: '',
    tables: [],
    relationships: [],

    // General operations
    updateDiagramId: emptyFn,
    updateDiagramName: emptyFn,

    // Database type operations
    updateDatabaseType: emptyFn,

    // Table operations
    updateTables: emptyFn,
    createTable: emptyFn,
    getTable: emptyFn,
    addTable: emptyFn,
    removeTable: emptyFn,
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
});
