import { createContext } from 'react';
import { Diagram } from '@/lib/domain/diagram';
import { emptyFn } from '@/lib/utils';
import { DBRelationship } from '@/lib/domain/db-relationship';
import { DBTable } from '@/lib/domain/db-table';
import { ChartDBConfig } from '@/lib/domain/config';

export interface DataContext {
    // Config operations
    getConfig: () => Promise<ChartDBConfig | undefined>;
    updateConfig: (config: Partial<ChartDBConfig>) => Promise<void>;

    // Diagram operations
    addDiagram: (params: { diagram: Diagram }) => Promise<void>;
    listDiagrams: () => Promise<Diagram[]>;
    getDiagram: (
        id: string,
        options?: {
            includeTables?: boolean;
            includeRelationships?: boolean;
        }
    ) => Promise<Diagram | undefined>;
    updateDiagram: (params: {
        id: string;
        diagram: Partial<Diagram>;
    }) => Promise<void>;
    deleteDiagram: (id: string) => Promise<void>;

    // Table operations
    addTable: (params: { diagramId: string; table: DBTable }) => Promise<void>;
    getTable: (params: {
        diagramId: string;
        id: string;
    }) => Promise<DBTable | undefined>;
    updateTable: (params: {
        id: string;
        table: Partial<DBTable>;
    }) => Promise<void>;
    deleteTable: (params: { diagramId: string; id: string }) => Promise<void>;
    listTables: (diagramId: string) => Promise<DBTable[]>;

    // Relationships operations
    addRelationship: (params: {
        diagramId: string;
        relationship: DBRelationship;
    }) => Promise<void>;
    getRelationship: (params: {
        diagramId: string;
        id: string;
    }) => Promise<DBRelationship | undefined>;
    updateRelationship: (params: {
        id: string;
        relationship: Partial<DBRelationship>;
    }) => Promise<void>;
    deleteRelationship: (params: {
        diagramId: string;
        id: string;
    }) => Promise<void>;
    listRelationships: (diagramId: string) => Promise<DBRelationship[]>;
}

export const dataContext = createContext<DataContext>({
    getConfig: emptyFn,
    updateConfig: emptyFn,

    addDiagram: emptyFn,
    listDiagrams: emptyFn,
    getDiagram: emptyFn,
    updateDiagram: emptyFn,
    deleteDiagram: emptyFn,

    addTable: emptyFn,
    getTable: emptyFn,
    updateTable: emptyFn,
    deleteTable: emptyFn,
    listTables: emptyFn,

    addRelationship: emptyFn,
    getRelationship: emptyFn,
    updateRelationship: emptyFn,
    deleteRelationship: emptyFn,
    listRelationships: emptyFn,
});
