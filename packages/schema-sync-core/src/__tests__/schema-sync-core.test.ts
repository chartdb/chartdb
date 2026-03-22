import { describe, expect, it } from 'vitest';
import { createChangePlan } from '../diff.js';
import { hashCanonicalSchema } from '../hash.js';
import type { CanonicalSchema } from '../types.js';

const baseline: CanonicalSchema = {
    engine: 'postgresql',
    databaseName: 'app',
    defaultSchemaName: 'public',
    schemaNames: ['public'],
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
});
