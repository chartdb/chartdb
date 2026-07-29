import { z } from 'zod';
import { DatabaseEdition } from './database-edition';
import { DatabaseType } from './database-type';
import type { DBDependency } from './db-dependency';
import { dbDependencySchema } from './db-dependency';
import type { DBRelationship } from './db-relationship';
import { dbRelationshipSchema } from './db-relationship';
import type { DBTable } from './db-table';
import { dbTableSchema } from './db-table';
import { areaSchema, type Area } from './area';
import type { DBCustomType } from './db-custom-type';
import { dbCustomTypeSchema } from './db-custom-type';
import type { Note } from './note';
import { noteSchema } from './note';

// Where a diagram's data lives. "local" is the existing IndexedDB-only
// behavior, private to this browser. "cloud" means it's stored in Firestore,
// where it's part of one shared pool every user (via Firebase Auth, anonymous
// or otherwise) can see and edit - there's no per-diagram ownership or invite
// list. See src/context/storage-context and firestore.rules.
export type DiagramStorageMode = 'local' | 'cloud';

export interface Diagram {
    id: string;
    name: string;
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
    tables?: DBTable[];
    relationships?: DBRelationship[];
    dependencies?: DBDependency[];
    areas?: Area[];
    customTypes?: DBCustomType[];
    notes?: Note[];
    createdAt: Date;
    updatedAt: Date;

    // Only meaningful when the diagram is stored in Firestore; undefined for
    // local-only diagrams.
    storageMode?: DiagramStorageMode;
}

export const diagramSchema: z.ZodType<Diagram> = z.object({
    id: z.string(),
    name: z.string(),
    databaseType: z.nativeEnum(DatabaseType),
    databaseEdition: z.nativeEnum(DatabaseEdition).optional(),
    tables: z.array(dbTableSchema).optional(),
    relationships: z.array(dbRelationshipSchema).optional(),
    dependencies: z.array(dbDependencySchema).optional(),
    areas: z.array(areaSchema).optional(),
    customTypes: z.array(dbCustomTypeSchema).optional(),
    notes: z.array(noteSchema).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    storageMode: z.union([z.literal('local'), z.literal('cloud')]).optional(),
});
