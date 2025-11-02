import { createContext } from 'react';
import type { Diagram } from '@/lib/domain/diagram';
import { emptyFn } from '@/lib/utils';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DBTable } from '@/lib/domain/db-table';
import type { ChartDBConfig } from '@/lib/domain/config';
import type { DBDependency } from '@/lib/domain/db-dependency';
import type { Area } from '@/lib/domain/area';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';
import type { User, PublicUser } from '@/lib/domain/user';
import type { DiagramCollaborator } from '@/lib/domain/diagram-collaborator';
import type { AuditLogEntry } from '@/lib/domain/audit-log';
import type { DiagramVersion } from '@/lib/domain/diagram-version';
import type { DiagramActivity } from '@/lib/domain/diagram-activity';

export interface StorageContext {
    // Config operations
    getConfig: () => Promise<ChartDBConfig | undefined>;
    updateConfig: (config: Partial<ChartDBConfig>) => Promise<void>;

    // Diagram filter operations
    getDiagramFilter: (diagramId: string) => Promise<DiagramFilter | undefined>;
    updateDiagramFilter: (
        diagramId: string,
        filter: DiagramFilter
    ) => Promise<void>;
    deleteDiagramFilter: (diagramId: string) => Promise<void>;

    // Diagram operations
    addDiagram: (params: { diagram: Diagram }) => Promise<void>;
    listDiagrams: (options?: {
        includeTables?: boolean;
        includeRelationships?: boolean;
        includeDependencies?: boolean;
        includeAreas?: boolean;
        includeCustomTypes?: boolean;
    }) => Promise<Diagram[]>;
    getDiagram: (
        id: string,
        options?: {
            includeTables?: boolean;
            includeRelationships?: boolean;
            includeDependencies?: boolean;
            includeAreas?: boolean;
            includeCustomTypes?: boolean;
        }
    ) => Promise<Diagram | undefined>;
    updateDiagram: (params: {
        id: string;
        attributes: Partial<Diagram>;
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
        attributes: Partial<DBTable>;
    }) => Promise<void>;
    putTable: (params: { diagramId: string; table: DBTable }) => Promise<void>;
    deleteTable: (params: { diagramId: string; id: string }) => Promise<void>;
    listTables: (diagramId: string) => Promise<DBTable[]>;
    deleteDiagramTables: (diagramId: string) => Promise<void>;

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
        attributes: Partial<DBRelationship>;
    }) => Promise<void>;
    deleteRelationship: (params: {
        diagramId: string;
        id: string;
    }) => Promise<void>;
    listRelationships: (diagramId: string) => Promise<DBRelationship[]>;
    deleteDiagramRelationships: (diagramId: string) => Promise<void>;

    // Dependencies operations
    addDependency: (params: {
        diagramId: string;
        dependency: DBDependency;
    }) => Promise<void>;
    getDependency: (params: {
        diagramId: string;
        id: string;
    }) => Promise<DBDependency | undefined>;
    updateDependency: (params: {
        id: string;
        attributes: Partial<DBDependency>;
    }) => Promise<void>;
    deleteDependency: (params: {
        diagramId: string;
        id: string;
    }) => Promise<void>;
    listDependencies: (diagramId: string) => Promise<DBDependency[]>;
    deleteDiagramDependencies: (diagramId: string) => Promise<void>;

    // Area operations
    addArea: (params: { diagramId: string; area: Area }) => Promise<void>;
    getArea: (params: {
        diagramId: string;
        id: string;
    }) => Promise<Area | undefined>;
    updateArea: (params: {
        id: string;
        attributes: Partial<Area>;
    }) => Promise<void>;
    deleteArea: (params: { diagramId: string; id: string }) => Promise<void>;
    listAreas: (diagramId: string) => Promise<Area[]>;
    deleteDiagramAreas: (diagramId: string) => Promise<void>;

    // Custom type operations
    addCustomType: (params: {
        diagramId: string;
        customType: DBCustomType;
    }) => Promise<void>;
    getCustomType: (params: {
        diagramId: string;
        id: string;
    }) => Promise<DBCustomType | undefined>;
    updateCustomType: (params: {
        id: string;
        attributes: Partial<DBCustomType>;
    }) => Promise<void>;
    deleteCustomType: (params: {
        diagramId: string;
        id: string;
    }) => Promise<void>;
    listCustomTypes: (diagramId: string) => Promise<DBCustomType[]>;
    deleteDiagramCustomTypes: (diagramId: string) => Promise<void>;

    // User management
    ensureDefaultAdminUser: () => Promise<void>;
    createUser: (params: {
        username: string;
        displayName: string;
        role: User['role'];
        passwordHash: string;
        mustChangePassword?: boolean;
        active?: boolean;
    }) => Promise<User>;
    updateUser: (params: {
        id: string;
        attributes: Partial<
            Pick<
                User,
                | 'username'
                | 'displayName'
                | 'role'
                | 'mustChangePassword'
                | 'active'
            >
        >;
    }) => Promise<void>;
    setUserPassword: (params: {
        id: string;
        passwordHash: string;
        mustChangePassword?: boolean;
    }) => Promise<void>;
    getUserByUsername: (username: string) => Promise<User | undefined>;
    getUserById: (id: string) => Promise<User | undefined>;
    listUsers: () => Promise<PublicUser[]>;
    touchUserLogin: (id: string) => Promise<void>;

    // Diagram collaborators
    listDiagramCollaborators: (
        diagramId: string
    ) => Promise<DiagramCollaborator[]>;
    addDiagramCollaborator: (params: {
        collaborator: DiagramCollaborator;
    }) => Promise<void>;
    updateDiagramCollaborator: (params: {
        id: string;
        attributes: Partial<Pick<DiagramCollaborator, 'role' | 'canInvite'>>;
    }) => Promise<void>;
    removeDiagramCollaborator: (id: string) => Promise<void>;
    getDiagramCollaborator: (params: {
        diagramId: string;
        userId: string;
    }) => Promise<DiagramCollaborator | undefined>;

    // Diagram metadata
    updateDiagramVisibility: (params: {
        diagramId: string;
        visibility: 'private' | 'link_view' | 'link_edit';
        shareToken?: string;
        allowEditorsToInvite?: boolean;
    }) => Promise<void>;

    // Logs & versions
    addAuditLogEntry: (entry: AuditLogEntry) => Promise<void>;
    listAuditLogs: () => Promise<AuditLogEntry[]>;
    addDiagramVersion: (params: { version: DiagramVersion }) => Promise<void>;
    listDiagramVersions: (diagramId: string) => Promise<DiagramVersion[]>;
    addDiagramActivity: (activity: DiagramActivity) => Promise<void>;
    listDiagramActivity: (diagramId: string) => Promise<DiagramActivity[]>;
}

export const storageInitialValue: StorageContext = {
    getConfig: emptyFn,
    updateConfig: emptyFn,

    getDiagramFilter: emptyFn,
    updateDiagramFilter: emptyFn,
    deleteDiagramFilter: emptyFn,

    addDiagram: emptyFn,
    listDiagrams: emptyFn,
    getDiagram: emptyFn,
    updateDiagram: emptyFn,
    deleteDiagram: emptyFn,

    addTable: emptyFn,
    getTable: emptyFn,
    updateTable: emptyFn,
    putTable: emptyFn,
    deleteTable: emptyFn,
    listTables: emptyFn,
    deleteDiagramTables: emptyFn,

    addRelationship: emptyFn,
    getRelationship: emptyFn,
    updateRelationship: emptyFn,
    deleteRelationship: emptyFn,
    listRelationships: emptyFn,
    deleteDiagramRelationships: emptyFn,

    addDependency: emptyFn,
    getDependency: emptyFn,
    updateDependency: emptyFn,
    deleteDependency: emptyFn,
    listDependencies: emptyFn,
    deleteDiagramDependencies: emptyFn,

    addArea: emptyFn,
    getArea: emptyFn,
    updateArea: emptyFn,
    deleteArea: emptyFn,
    listAreas: emptyFn,
    deleteDiagramAreas: emptyFn,

    // Custom type operations
    addCustomType: emptyFn,
    getCustomType: emptyFn,
    updateCustomType: emptyFn,
    deleteCustomType: emptyFn,
    listCustomTypes: emptyFn,
    deleteDiagramCustomTypes: emptyFn,

    ensureDefaultAdminUser: emptyFn,
    createUser: emptyFn,
    updateUser: emptyFn,
    setUserPassword: emptyFn,
    getUserByUsername: emptyFn,
    getUserById: emptyFn,
    listUsers: emptyFn,
    touchUserLogin: emptyFn,

    listDiagramCollaborators: emptyFn,
    addDiagramCollaborator: emptyFn,
    updateDiagramCollaborator: emptyFn,
    removeDiagramCollaborator: emptyFn,
    getDiagramCollaborator: emptyFn,

    updateDiagramVisibility: emptyFn,

    addAuditLogEntry: emptyFn,
    listAuditLogs: emptyFn,
    addDiagramVersion: emptyFn,
    listDiagramVersions: emptyFn,
    addDiagramActivity: emptyFn,
    listDiagramActivity: emptyFn,
};

export const storageContext =
    createContext<StorageContext>(storageInitialValue);
