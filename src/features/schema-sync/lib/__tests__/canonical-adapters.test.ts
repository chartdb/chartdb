import { describe, expect, it } from 'vitest';
import {
    canonicalSchemaToDiagram,
    diagramToCanonicalSchema,
} from '../canonical-adapters';
import type { CanonicalSchema } from '@chartdb/schema-sync-core';
import { DatabaseType } from '@/lib/domain/database-type';

describe('canonical adapters', () => {
    it('preserves sync metadata during import to diagram', () => {
        const canonical: CanonicalSchema = {
            engine: 'postgresql',
            databaseName: 'demo',
            defaultSchemaName: 'public',
            schemaNames: ['public'],
            tables: [
                {
                    id: 'public.users',
                    schemaName: 'public',
                    name: 'users',
                    kind: 'table',
                    sync: { sourceId: 'public.users' },
                    columns: [
                        {
                            id: 'public.users.id',
                            name: 'id',
                            dataType: 'uuid',
                            nullable: false,
                            sync: { sourceId: 'public.users.id' },
                        },
                    ],
                    primaryKey: {
                        id: 'public.users.users_pkey',
                        name: 'users_pkey',
                        columnIds: ['public.users.id'],
                    },
                    uniqueConstraints: [],
                    indexes: [],
                    foreignKeys: [],
                    checkConstraints: [],
                },
            ],
        };

        const diagram = canonicalSchemaToDiagram({
            canonicalSchema: canonical,
        });

        expect(diagram.databaseType).toBe(DatabaseType.POSTGRESQL);
        expect(diagram.schemaSync).toBeUndefined();
        expect(diagram.tables?.[0].syncMetadata?.sourceId).toBe('public.users');
        expect(diagram.tables?.[0].fields[0].syncMetadata?.sourceId).toBe(
            'public.users.id'
        );
    });

    it('creates a canonical target schema from the editor model', () => {
        const diagram = canonicalSchemaToDiagram({
            canonicalSchema: {
                engine: 'postgresql',
                databaseName: 'demo',
                defaultSchemaName: 'public',
                schemaNames: ['public'],
                tables: [
                    {
                        id: 'public.users',
                        schemaName: 'public',
                        name: 'users',
                        kind: 'table',
                        sync: { sourceId: 'public.users' },
                        columns: [
                            {
                                id: 'public.users.id',
                                name: 'id',
                                dataType: 'uuid',
                                nullable: false,
                                sync: { sourceId: 'public.users.id' },
                            },
                            {
                                id: 'public.users.email',
                                name: 'email',
                                dataType: 'text',
                                nullable: false,
                                sync: { sourceId: 'public.users.email' },
                            },
                        ],
                        primaryKey: {
                            id: 'public.users.users_pkey',
                            name: 'users_pkey',
                            columnIds: ['public.users.id'],
                        },
                        uniqueConstraints: [],
                        indexes: [],
                        foreignKeys: [],
                        checkConstraints: [],
                    },
                ],
            },
        });

        const canonical = diagramToCanonicalSchema(diagram);
        expect(canonical.tables[0].sync?.sourceId).toBe('public.users');
        expect(canonical.tables[0].columns[0].sync?.sourceId).toBe(
            'public.users.id'
        );
        expect(canonical.tables[0].schemaName).toBe('public');
    });
});
