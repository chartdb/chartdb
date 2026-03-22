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
            customTypes: [
                {
                    id: 'public.audio_format',
                    schemaName: 'public',
                    name: 'audio_format',
                    kind: 'enum',
                    values: ['mp3', 'wav'],
                    sync: { sourceId: 'public.audio_format' },
                },
            ],
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
                            id: 'public.users.audio_format',
                            name: 'audio_format',
                            dataType: 'audio_format',
                            customTypeId: 'public.audio_format',
                            nullable: true,
                            sync: {
                                sourceId: 'public.users.audio_format',
                            },
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
        expect(diagram.customTypes?.[0].name).toBe('audio_format');
        expect(diagram.customTypes?.[0].id).not.toBe('public.audio_format');
        expect(diagram.customTypes?.[0].syncMetadata?.sourceId).toBe(
            'public.audio_format'
        );
        expect(diagram.tables?.[0].syncMetadata?.sourceId).toBe('public.users');
        expect(diagram.tables?.[0].fields[0].syncMetadata?.sourceId).toBe(
            'public.users.id'
        );
        expect(diagram.tables?.[0].fields[1].type.name).toBe('audio_format');
    });

    it('creates a canonical target schema from the editor model', () => {
        const diagram = canonicalSchemaToDiagram({
            canonicalSchema: {
                engine: 'postgresql',
                databaseName: 'demo',
                defaultSchemaName: 'public',
                schemaNames: ['public'],
                customTypes: [
                    {
                        id: 'public.audio_format',
                        schemaName: 'public',
                        name: 'audio_format',
                        kind: 'enum',
                        values: ['mp3', 'wav'],
                        sync: { sourceId: 'public.audio_format' },
                    },
                ],
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
                            {
                                id: 'public.users.audio_format',
                                name: 'audio_format',
                                dataType: 'audio_format',
                                customTypeId: 'public.audio_format',
                                nullable: true,
                                sync: {
                                    sourceId: 'public.users.audio_format',
                                },
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
        expect(canonical.customTypes[0]?.name).toBe('audio_format');
        expect(canonical.customTypes[0]?.sync?.sourceId).toBe(
            'public.audio_format'
        );
        expect(canonical.tables[0].columns[2].customTypeId).toBe(
            'public.audio_format'
        );
    });

    it('preserves foreign key direction during canonical roundtrip', () => {
        const canonical: CanonicalSchema = {
            engine: 'postgresql',
            databaseName: 'demo',
            defaultSchemaName: 'public',
            schemaNames: ['public'],
            customTypes: [],
            tables: [
                {
                    id: 'public.surahs',
                    schemaName: 'public',
                    name: 'surahs',
                    kind: 'table',
                    columns: [
                        {
                            id: 'public.surahs.id',
                            name: 'id',
                            dataType: 'integer',
                            nullable: false,
                            sync: { sourceId: 'public.surahs.id' },
                        },
                    ],
                    primaryKey: {
                        id: 'public.surahs_pkey',
                        name: 'surahs_pkey',
                        columnIds: ['public.surahs.id'],
                    },
                    uniqueConstraints: [],
                    indexes: [],
                    foreignKeys: [],
                    checkConstraints: [],
                    sync: { sourceId: 'public.surahs' },
                },
                {
                    id: 'public.ayahs',
                    schemaName: 'public',
                    name: 'ayahs',
                    kind: 'table',
                    columns: [
                        {
                            id: 'public.ayahs.id',
                            name: 'id',
                            dataType: 'integer',
                            nullable: false,
                            sync: { sourceId: 'public.ayahs.id' },
                        },
                        {
                            id: 'public.ayahs.surah_id',
                            name: 'surah_id',
                            dataType: 'integer',
                            nullable: false,
                            sync: { sourceId: 'public.ayahs.surah_id' },
                        },
                    ],
                    primaryKey: {
                        id: 'public.ayahs_pkey',
                        name: 'ayahs_pkey',
                        columnIds: ['public.ayahs.id'],
                    },
                    uniqueConstraints: [],
                    indexes: [],
                    foreignKeys: [
                        {
                            id: 'public.ayahs_surah_id_fkey',
                            name: 'ayahs_surah_id_fkey',
                            columnIds: ['public.ayahs.surah_id'],
                            referencedSchemaName: 'public',
                            referencedTableName: 'surahs',
                            referencedColumnNames: ['id'],
                            sync: {
                                sourceId: 'public.ayahs_surah_id_fkey',
                            },
                        },
                    ],
                    checkConstraints: [],
                    sync: { sourceId: 'public.ayahs' },
                },
            ],
        };

        const diagram = canonicalSchemaToDiagram({
            canonicalSchema: canonical,
        });
        const canonicalRoundtrip = diagramToCanonicalSchema(diagram);
        const ayahsTable = canonicalRoundtrip.tables.find(
            (table) => table.name === 'ayahs'
        );

        expect(ayahsTable?.foreignKeys).toHaveLength(1);
        expect(ayahsTable?.foreignKeys[0].columnIds).toEqual([
            'public.ayahs.surah_id',
        ]);
        expect(ayahsTable?.foreignKeys[0].referencedTableName).toBe('surahs');
        expect(ayahsTable?.foreignKeys[0].referencedColumnNames).toEqual([
            'id',
        ]);
    });

    it('creates foreign keys on the many side for editor relationships', () => {
        const diagram = canonicalSchemaToDiagram({
            canonicalSchema: {
                engine: 'postgresql',
                databaseName: 'demo',
                defaultSchemaName: 'public',
                schemaNames: ['public'],
                customTypes: [],
                tables: [
                    {
                        id: 'public.surahs',
                        schemaName: 'public',
                        name: 'surahs',
                        kind: 'table',
                        columns: [
                            {
                                id: 'public.surahs.id',
                                name: 'id',
                                dataType: 'integer',
                                nullable: false,
                                sync: { sourceId: 'public.surahs.id' },
                            },
                        ],
                        primaryKey: {
                            id: 'public.surahs_pkey',
                            name: 'surahs_pkey',
                            columnIds: ['public.surahs.id'],
                        },
                        uniqueConstraints: [],
                        indexes: [],
                        foreignKeys: [],
                        checkConstraints: [],
                        sync: { sourceId: 'public.surahs' },
                    },
                    {
                        id: 'public.ayahs',
                        schemaName: 'public',
                        name: 'ayahs',
                        kind: 'table',
                        columns: [
                            {
                                id: 'public.ayahs.id',
                                name: 'id',
                                dataType: 'integer',
                                nullable: false,
                                sync: { sourceId: 'public.ayahs.id' },
                            },
                            {
                                id: 'public.ayahs.surah_id',
                                name: 'surah_id',
                                dataType: 'integer',
                                nullable: false,
                                sync: { sourceId: 'public.ayahs.surah_id' },
                            },
                        ],
                        primaryKey: {
                            id: 'public.ayahs_pkey',
                            name: 'ayahs_pkey',
                            columnIds: ['public.ayahs.id'],
                        },
                        uniqueConstraints: [],
                        indexes: [],
                        foreignKeys: [],
                        checkConstraints: [],
                        sync: { sourceId: 'public.ayahs' },
                    },
                ],
            },
        });

        expect(diagram.tables).toBeDefined();
        const surahsTable = diagram.tables![0];
        const ayahsTable = diagram.tables![1];
        const canonical = diagramToCanonicalSchema({
            ...diagram,
            relationships: [
                {
                    id: 'rel-1',
                    name: 'surahs_id_fk',
                    sourceSchema: surahsTable.schema,
                    sourceTableId: surahsTable.id,
                    targetSchema: ayahsTable.schema,
                    targetTableId: ayahsTable.id,
                    sourceFieldId: surahsTable.fields[0].id,
                    targetFieldId: ayahsTable.fields[1].id,
                    sourceCardinality: 'one',
                    targetCardinality: 'many',
                    createdAt: Date.now(),
                },
            ],
        });

        const ayahsCanonical = canonical.tables.find(
            (table) => table.name === 'ayahs'
        );
        const surahsCanonical = canonical.tables.find(
            (table) => table.name === 'surahs'
        );

        expect(ayahsCanonical?.foreignKeys).toHaveLength(1);
        expect(ayahsCanonical?.foreignKeys[0].columnIds).toEqual([
            'public.ayahs.surah_id',
        ]);
        expect(ayahsCanonical?.foreignKeys[0].referencedTableName).toBe(
            'surahs'
        );
        expect(surahsCanonical?.foreignKeys).toHaveLength(0);
    });
});
