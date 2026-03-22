import { describe, expect, it } from 'vitest';
import { createChangePlan } from '../diff.js';
import { hashCanonicalSchema } from '../hash.js';
import type { CanonicalSchema } from '../types.js';

const baseline: CanonicalSchema = {
    engine: 'postgresql',
    databaseName: 'app',
    defaultSchemaName: 'public',
    schemaNames: ['public'],
    customTypes: [],
    tables: [
        {
            id: 'users',
            schemaName: 'public',
            name: 'users',
            kind: 'table',
            sync: { sourceId: 'users' },
            columns: [
                {
                    id: 'users.id',
                    name: 'id',
                    dataType: 'uuid',
                    nullable: false,
                    defaultValue: 'gen_random_uuid()',
                    isPrimaryKey: true,
                },
                {
                    id: 'users.email',
                    name: 'email',
                    dataType: 'text',
                    nullable: false,
                },
            ],
            primaryKey: {
                id: 'users_pkey',
                name: 'users_pkey',
                columnIds: ['users.id'],
            },
            uniqueConstraints: [],
            indexes: [],
            foreignKeys: [],
            checkConstraints: [],
        },
    ],
};

describe('schema sync core', () => {
    it('detects add column and type changes', () => {
        const plan = createChangePlan({
            id: 'plan-1',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline,
            target: {
                ...baseline,
                tables: [
                    {
                        ...baseline.tables[0],
                        columns: [
                            baseline.tables[0].columns[0],
                            {
                                ...baseline.tables[0].columns[1],
                                dataType: 'varchar(255)',
                            },
                            {
                                id: 'users.name',
                                name: 'name',
                                dataType: 'text',
                                nullable: true,
                            },
                        ],
                    },
                ],
            },
        });

        expect(
            plan.changes.some((change) => change.kind === 'add_column')
        ).toBe(true);
        expect(
            plan.changes.some((change) => change.kind === 'alter_column_type')
        ).toBe(true);
    });

    it('flags destructive drops and possible rename ambiguity', () => {
        const plan = createChangePlan({
            id: 'plan-2',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline,
            target: {
                ...baseline,
                tables: [
                    {
                        ...baseline.tables[0],
                        id: 'customers-new',
                        name: 'customers',
                        sync: undefined,
                        columns: [
                            {
                                ...baseline.tables[0].columns[0],
                                id: 'customers.id',
                            },
                            {
                                ...baseline.tables[0].columns[1],
                                id: 'customers.email',
                            },
                        ],
                    },
                ],
            },
        });

        expect(
            plan.warnings.some(
                (warning) => warning.code === 'possible_table_rename'
            )
        ).toBe(true);
        expect(
            plan.summary.destructiveChanges + plan.summary.warningChanges
        ).toBeGreaterThan(0);
    });

    it('ignores volatile fingerprint metadata when hashing schemas', () => {
        const firstHash = hashCanonicalSchema({
            ...baseline,
            importedAt: '2026-03-22T10:00:00.000Z',
            fingerprint: 'fingerprint-a',
        });
        const secondHash = hashCanonicalSchema({
            ...baseline,
            importedAt: '2026-03-22T10:05:00.000Z',
            fingerprint: 'fingerprint-b',
        });

        expect(firstHash).toBe(secondHash);
    });

    it('recomputes plan fingerprints from schema content instead of trusting stored values', () => {
        const expectedBaselineFingerprint = hashCanonicalSchema({
            ...baseline,
            fingerprint: 'stale-fingerprint',
            importedAt: '2026-03-22T10:00:00.000Z',
        });
        const plan = createChangePlan({
            id: 'plan-3',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline: {
                ...baseline,
                fingerprint: 'stale-fingerprint',
                importedAt: '2026-03-22T10:00:00.000Z',
            },
            target: {
                ...baseline,
                fingerprint: 'another-stale-fingerprint',
                importedAt: '2026-03-22T10:05:00.000Z',
            },
        });

        expect(plan.baselineFingerprint).toBe(expectedBaselineFingerprint);
        expect(plan.targetFingerprint).toBe(expectedBaselineFingerprint);
    });

    it('blocks preview when new custom PostgreSQL types are introduced', () => {
        const plan = createChangePlan({
            id: 'plan-4',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline,
            target: {
                ...baseline,
                tables: [
                    {
                        ...baseline.tables[0],
                        columns: [
                            ...baseline.tables[0].columns,
                            {
                                id: 'users.revelation',
                                name: 'revelation',
                                dataType: 'revelation_type',
                                nullable: true,
                            },
                        ],
                    },
                ],
            },
        });

        expect(plan.blocked).toBe(true);
        expect(
            plan.warnings.some(
                (warning) => warning.code === 'unsupported_custom_type'
            )
        ).toBe(true);
    });

    it('does not block preview for builtin PostgreSQL aliases like int', () => {
        const plan = createChangePlan({
            id: 'plan-5',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline,
            target: {
                ...baseline,
                tables: [
                    {
                        ...baseline.tables[0],
                        columns: [
                            {
                                ...baseline.tables[0].columns[0],
                                dataType: 'int',
                            },
                            ...baseline.tables[0].columns.slice(1),
                        ],
                    },
                ],
            },
        });

        expect(plan.warnings).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'unsupported_custom_type',
                }),
            ])
        );
    });

    it('creates enum SQL before creating a new table that depends on it', () => {
        const plan = createChangePlan({
            id: 'plan-enum-create-table',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline: {
                ...baseline,
                tables: [],
            },
            target: {
                ...baseline,
                customTypes: [
                    {
                        id: 'public.audio_format',
                        schemaName: 'public',
                        name: 'audio_format',
                        kind: 'enum',
                        values: ['mp3', 'wav', 'aac'],
                    },
                ],
                tables: [
                    {
                        id: 'public.audio_files',
                        schemaName: 'public',
                        name: 'audio_files',
                        kind: 'table',
                        columns: [
                            {
                                id: 'public.audio_files.id',
                                name: 'id',
                                dataType: 'uuid',
                                nullable: false,
                            },
                            {
                                id: 'public.audio_files.format',
                                name: 'format',
                                dataType: 'audio_format',
                                customTypeId: 'public.audio_format',
                                nullable: false,
                            },
                        ],
                        primaryKey: {
                            id: 'public.audio_files_pkey',
                            name: 'audio_files_pkey',
                            columnIds: ['public.audio_files.id'],
                        },
                        uniqueConstraints: [],
                        indexes: [],
                        foreignKeys: [],
                        checkConstraints: [],
                    },
                ],
            },
        });

        expect(plan.blocked).toBe(false);
        expect(
            plan.changes.some((change) => change.kind === 'create_enum_type')
        ).toBe(true);
        expect(plan.sqlStatements[0]).toContain(
            'CREATE TYPE "public"."audio_format" AS ENUM'
        );
        expect(plan.sqlStatements[1]).toContain(
            'CREATE TABLE "public"."audio_files"'
        );
    });

    it('creates enum SQL before adding a dependent column to an existing table', () => {
        const baselineSchema: CanonicalSchema = {
            ...baseline,
            tables: [
                {
                    id: 'public.audio_files',
                    schemaName: 'public',
                    name: 'audio_files',
                    kind: 'table',
                    columns: [
                        {
                            id: 'public.audio_files.id',
                            name: 'id',
                            dataType: 'uuid',
                            nullable: false,
                        },
                    ],
                    primaryKey: {
                        id: 'public.audio_files_pkey',
                        name: 'audio_files_pkey',
                        columnIds: ['public.audio_files.id'],
                    },
                    uniqueConstraints: [],
                    indexes: [],
                    foreignKeys: [],
                    checkConstraints: [],
                },
            ],
            customTypes: [],
        };

        const plan = createChangePlan({
            id: 'plan-enum-add-column',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline: baselineSchema,
            target: {
                ...baselineSchema,
                customTypes: [
                    {
                        id: 'public.audio_format',
                        schemaName: 'public',
                        name: 'audio_format',
                        kind: 'enum',
                        values: ['mp3', 'wav', 'aac'],
                    },
                ],
                tables: [
                    {
                        ...baselineSchema.tables[0],
                        columns: [
                            ...baselineSchema.tables[0].columns,
                            {
                                id: 'public.audio_files.format',
                                name: 'format',
                                dataType: 'audio_format',
                                customTypeId: 'public.audio_format',
                                nullable: true,
                            },
                        ],
                    },
                ],
            },
        });

        expect(plan.blocked).toBe(false);
        expect(plan.sqlStatements[0]).toContain(
            'CREATE TYPE "public"."audio_format" AS ENUM'
        );
        expect(plan.sqlStatements[1]).toContain(
            'ALTER TABLE "public"."audio_files" ADD COLUMN'
        );
    });

    it('does not recreate an enum that already exists in the baseline schema', () => {
        const baselineSchema: CanonicalSchema = {
            ...baseline,
            tables: [
                {
                    id: 'public.audio_files',
                    schemaName: 'public',
                    name: 'audio_files',
                    kind: 'table',
                    columns: [
                        {
                            id: 'public.audio_files.id',
                            name: 'id',
                            dataType: 'uuid',
                            nullable: false,
                        },
                    ],
                    primaryKey: {
                        id: 'public.audio_files_pkey',
                        name: 'audio_files_pkey',
                        columnIds: ['public.audio_files.id'],
                    },
                    uniqueConstraints: [],
                    indexes: [],
                    foreignKeys: [],
                    checkConstraints: [],
                },
            ],
            customTypes: [
                {
                    id: 'public.audio_format',
                    schemaName: 'public',
                    name: 'audio_format',
                    kind: 'enum',
                    values: ['mp3', 'wav', 'aac'],
                },
            ],
        };

        const plan = createChangePlan({
            id: 'plan-existing-enum',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline: baselineSchema,
            target: {
                ...baselineSchema,
                tables: [
                    {
                        ...baselineSchema.tables[0],
                        columns: [
                            ...baselineSchema.tables[0].columns,
                            {
                                id: 'public.audio_files.format',
                                name: 'format',
                                dataType: 'audio_format',
                                customTypeId: 'public.audio_format',
                                nullable: true,
                            },
                        ],
                    },
                ],
            },
        });

        expect(
            plan.changes.some((change) => change.kind === 'create_enum_type')
        ).toBe(false);
        expect(plan.blocked).toBe(false);
    });

    it('blocks unknown custom types when no enum definition is available', () => {
        const plan = createChangePlan({
            id: 'plan-unknown-custom-type',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline,
            target: {
                ...baseline,
                tables: [
                    {
                        ...baseline.tables[0],
                        columns: [
                            ...baseline.tables[0].columns,
                            {
                                id: 'users.audio_format',
                                name: 'audio_format',
                                dataType: 'audio_format',
                                nullable: true,
                            },
                        ],
                    },
                ],
            },
        });

        expect(plan.blocked).toBe(true);
        expect(
            plan.warnings.some(
                (warning) =>
                    warning.code === 'unsupported_custom_type' &&
                    warning.message.includes('no enum definition is available')
            )
        ).toBe(true);
    });

    it('supports append-only enum value additions', () => {
        const baselineSchema: CanonicalSchema = {
            ...baseline,
            customTypes: [
                {
                    id: 'public.audio_format',
                    schemaName: 'public',
                    name: 'audio_format',
                    kind: 'enum',
                    values: ['mp3', 'wav'],
                },
            ],
        };

        const plan = createChangePlan({
            id: 'plan-enum-add-value',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline: baselineSchema,
            target: {
                ...baselineSchema,
                customTypes: [
                    {
                        id: 'public.audio_format',
                        schemaName: 'public',
                        name: 'audio_format',
                        kind: 'enum',
                        values: ['mp3', 'wav', 'aac'],
                    },
                ],
            },
        });

        expect(plan.blocked).toBe(false);
        expect(
            plan.changes.some((change) => change.kind === 'add_enum_value')
        ).toBe(true);
        expect(plan.sqlStatements).toContain(
            `ALTER TYPE "public"."audio_format" ADD VALUE IF NOT EXISTS 'aac';`
        );
    });

    it('blocks destructive enum changes such as removing or reordering labels', () => {
        const baselineSchema: CanonicalSchema = {
            ...baseline,
            customTypes: [
                {
                    id: 'public.audio_format',
                    schemaName: 'public',
                    name: 'audio_format',
                    kind: 'enum',
                    values: ['mp3', 'wav', 'aac'],
                },
            ],
        };

        const plan = createChangePlan({
            id: 'plan-enum-destructive-change',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline: baselineSchema,
            target: {
                ...baselineSchema,
                customTypes: [
                    {
                        id: 'public.audio_format',
                        schemaName: 'public',
                        name: 'audio_format',
                        kind: 'enum',
                        values: ['mp3', 'aac'],
                    },
                ],
            },
        });

        expect(plan.blocked).toBe(true);
        expect(
            plan.warnings.some(
                (warning) => warning.code === 'unsupported_enum_modification'
            )
        ).toBe(true);
    });

    it('blocks foreign keys that reference non-unique columns', () => {
        const plan = createChangePlan({
            id: 'plan-fk-non-unique',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline,
            target: {
                ...baseline,
                tables: [
                    {
                        ...baseline.tables[0],
                        columns: [
                            ...baseline.tables[0].columns,
                            {
                                id: 'users.favorite_email',
                                name: 'favorite_email',
                                dataType: 'text',
                                nullable: true,
                            },
                        ],
                        foreignKeys: [
                            {
                                id: 'users.favorite_email_fkey',
                                name: 'users.favorite_email_fkey',
                                columnIds: ['users.favorite_email'],
                                referencedSchemaName: 'public',
                                referencedTableName: 'users',
                                referencedColumnNames: ['email'],
                            },
                        ],
                    },
                ],
            },
        });

        expect(plan.blocked).toBe(true);
        expect(
            plan.warnings.some(
                (warning) => warning.code === 'foreign_key_reference_not_unique'
            )
        ).toBe(true);
    });

    it('allows foreign keys that reference unique columns', () => {
        const plan = createChangePlan({
            id: 'plan-fk-unique',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline,
            target: {
                ...baseline,
                tables: [
                    {
                        ...baseline.tables[0],
                        columns: [
                            ...baseline.tables[0].columns,
                            {
                                id: 'users.favorite_email',
                                name: 'favorite_email',
                                dataType: 'text',
                                nullable: true,
                            },
                        ],
                        uniqueConstraints: [
                            {
                                id: 'users_email_key',
                                name: 'users_email_key',
                                columnIds: ['users.email'],
                            },
                        ],
                        foreignKeys: [
                            {
                                id: 'users.favorite_email_fkey',
                                name: 'users.favorite_email_fkey',
                                columnIds: ['users.favorite_email'],
                                referencedSchemaName: 'public',
                                referencedTableName: 'users',
                                referencedColumnNames: ['email'],
                            },
                        ],
                    },
                ],
            },
        });

        expect(plan.blocked).toBe(false);
        expect(
            plan.warnings.some(
                (warning) => warning.code === 'foreign_key_reference_not_unique'
            )
        ).toBe(false);
    });
});
