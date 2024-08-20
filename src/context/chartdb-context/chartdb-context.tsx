import { createContext } from 'react';
import { DBTable } from '@/lib/domain/db-table';
import { emptyFn } from '@/lib/utils';
import { DatabaseType } from '@/lib/domain/database-type';
import { DBField } from '@/lib/domain/db-field';
import { DBIndex } from '@/lib/domain/db-index';
import { DBRelationship } from '@/lib/domain/db-relationship';
import { Diagram } from '@/lib/domain/diagram';

export interface ChartDBContext {
    diagramId: string;
    diagramName: string;
    databaseType: DatabaseType;
    tables: DBTable[];
    relationships: DBRelationship[];

    // General operations
    updateDiagramId: (id: string) => Promise<void>;
    updateDiagramName: (name: string) => Promise<void>;
    loadDiagram: (diagramId: string) => Promise<Diagram | undefined>;

    // Database type operations
    updateDatabaseType: (databaseType: DatabaseType) => Promise<void>;

    // Table operations
    createTable: () => Promise<DBTable>;
    addTable: (table: DBTable) => Promise<void>;
    getTable: (id: string) => DBTable | null;
    removeTable: (id: string) => Promise<void>;
    updateTable: (id: string, table: Partial<DBTable>) => Promise<void>;
    // updateTables: (tables: PartialExcept<DBTable, 'id'>[]) => Promise<void>;
    updateTablesState: (
        updateFn: (tables: DBTable[]) => PartialExcept<DBTable, 'id'>[]
    ) => Promise<void>;

    // Field operations
    getField: (tableId: string, fieldId: string) => DBField | null;
    updateField: (
        tableId: string,
        fieldId: string,
        field: Partial<DBField>
    ) => Promise<void>;
    removeField: (tableId: string, fieldId: string) => Promise<void>;
    createField: (tableId: string) => Promise<DBField>;
    addField: (tableId: string, field: DBField) => Promise<void>;

    // Index operations
    createIndex: (tableId: string) => Promise<DBIndex>;
    addIndex: (tableId: string, index: DBIndex) => Promise<void>;
    getIndex: (tableId: string, indexId: string) => DBIndex | null;
    removeIndex: (tableId: string, indexId: string) => Promise<void>;
    updateIndex: (
        tableId: string,
        indexId: string,
        index: Partial<DBIndex>
    ) => Promise<void>;

    // Relationship operations
    createRelationship: (params: {
        sourceTableId: string;
        targetTableId: string;
        sourceFieldId: string;
        targetFieldId: string;
    }) => Promise<DBRelationship>;
    addRelationship: (relationship: DBRelationship) => Promise<void>;
    getRelationship: (id: string) => DBRelationship | null;
    removeRelationship: (id: string) => Promise<void>;
    removeRelationships: (...ids: string[]) => Promise<void>;
    updateRelationship: (
        id: string,
        relationship: Partial<DBRelationship>
    ) => Promise<void>;
}

export const chartDBContext = createContext<ChartDBContext>({
    databaseType: DatabaseType.GENERIC,
    diagramName: '',
    diagramId: '',
    tables: [],
    relationships: [],

    // General operations
    updateDiagramId: emptyFn,
    updateDiagramName: emptyFn,
    loadDiagram: emptyFn,

    // Database type operations
    updateDatabaseType: emptyFn,

    // Table operations
    // updateTables: emptyFn,
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
