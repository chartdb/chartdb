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

export interface Diagram {
    id: string;
    name: string;
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
    ownerId?: string;
    visibility?: 'private' | 'link_view' | 'link_edit';
    allowEditorsToInvite?: boolean;
    shareToken?: string;
    tables?: DBTable[];
    relationships?: DBRelationship[];
    dependencies?: DBDependency[];
    areas?: Area[];
    customTypes?: DBCustomType[];
    createdAt: Date;
    updatedAt: Date;
}

export const diagramSchema: z.ZodType<Diagram> = z.object({
    id: z.string(),
    name: z.string(),
    databaseType: z.nativeEnum(DatabaseType),
    databaseEdition: z.nativeEnum(DatabaseEdition).optional(),
    ownerId: z.string().optional(),
    visibility: z.enum(['private', 'link_view', 'link_edit']).optional(),
    allowEditorsToInvite: z.boolean().optional(),
    shareToken: z.string().optional(),
    tables: z.array(dbTableSchema).optional(),
    relationships: z.array(dbRelationshipSchema).optional(),
    dependencies: z.array(dbDependencySchema).optional(),
    areas: z.array(areaSchema).optional(),
    customTypes: z.array(dbCustomTypeSchema).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
