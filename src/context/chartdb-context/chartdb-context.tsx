import { createContext } from 'react';
import { DBTable } from '@/lib/domain/db-table';
import { emptyFn } from '@/lib/utils';
import { DatabaseType } from '@/lib/domain/database-type';
import { DBField } from '@/lib/domain/db-field';
import { DBIndex } from '@/lib/domain/db-index';
import { DBRelationship } from '@/lib/domain/db-relationship';
import { Diagram } from '@/lib/domain/diagram';
import { DatabaseEdition } from '@/lib/domain/database-edition';

export interface ChartDBContext {
    diagramId: string;
    diagramName: string;
    databaseType: DatabaseType;
    tables: DBTable[];
    relationships: DBRelationship[];
    currentDiagram: Diagram;

    // General operations
    updateDiagramId: (id: string) => Promise<void>;
    updateDiagramName: (
        name: string,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    loadDiagram: (diagramId: string) => Promise<Diagram | undefined>;
    updateDiagramUpdatedAt: () => Promise<void>;
    clearDiagramData: () => Promise<void>;
    deleteDiagram: () => Promise<void>;

    // Database type operations
    updateDatabaseType: (databaseType: DatabaseType) => Promise<void>;
    updateDatabaseEdition: (databaseEdition?: DatabaseEdition) => Promise<void>;

    // Table operations
    createTable: () => Promise<DBTable>;
    addTable: (
        table: DBTable,
        options?: { updateHistory: boolean }
    ) => Promise<void>;
    getTable: (id: string) => DBTable | null;
    removeTable: (
        id: string,
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
}

export const chartDBContext = createContext<ChartDBContext>({
    databaseType: DatabaseType.GENERIC,
    diagramName: '',
    diagramId: '',
    tables: [],
    relationships: [],
    currentDiagram: {
        id: '',
        name: '',
        databaseType: DatabaseType.GENERIC,
        createdAt: new Date(),
        updatedAt: new Date(),
    },

    // General operations
    updateDiagramId: emptyFn,
    updateDiagramName: emptyFn,
    updateDiagramUpdatedAt: emptyFn,
    loadDiagram: emptyFn,
    clearDiagramData: emptyFn,
    deleteDiagram: emptyFn,

    // Database type operations
    updateDatabaseType: emptyFn,
    updateDatabaseEdition: emptyFn,

    // Table operations
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
    addRelationships: emptyFn,
});
