import { describe, it, expect } from 'vitest';
import { generateDBMLFromDiagram, sanitizeSQLforDBML } from '../dbml-export';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBField } from '@/lib/domain/db-field';

const field = (overrides: Partial<DBField>): DBField => ({
    id: overrides.name ?? 'f',
    name: 'f',
    type: { id: 'integer', name: 'integer' },
    primaryKey: false,
    nullable: true,
    unique: false,
    collation: null,
    default: null,
    characterMaximumLength: null,
    createdAt: Date.now(),
    ...overrides,
});

const diagramWith = (
    databaseType: DatabaseType,
    fields: DBField[],
    indexes: Diagram['tables'] extends (infer T)[] | undefined
        ? T extends { indexes: infer I }
            ? I
            : never
        : never = []
): Diagram => ({
    id: 'd',
    name: 'Test',
    databaseType,
    createdAt: new Date(),
    updatedAt: new Date(),
    tables: [
        {
            id: 't1',
            name: 'payment_methods',
            x: 0,
            y: 0,
            fields,
            indexes,
            color: 'blue',
            isView: false,
            createdAt: Date.now(),
        },
    ],
    relationships: [],
});

describe('DBML export - open issues', () => {
    // https://github.com/chartdb/chartdb/issues/1127
    it('does not corrupt index names containing "default"', () => {
        const sql =
            'CREATE INDEX idx_payment_methods_is_default ON "payment_methods" ("is_default");';
        expect(sanitizeSQLforDBML(sql)).toBe(sql);

        const result = generateDBMLFromDiagram(
            diagramWith(
                DatabaseType.POSTGRESQL,
                [
                    field({ id: 'id', name: 'id', primaryKey: true }),
                    field({
                        id: 'is_default',
                        name: 'is_default',
                        type: { id: 'boolean', name: 'boolean' },
                        default: 'false',
                    }),
                ],
                [
                    {
                        id: 'i1',
                        name: 'idx_payment_methods_is_default',
                        unique: false,
                        fieldIds: ['is_default'],
                        createdAt: Date.now(),
                    },
                ]
            )
        );
        expect(result.error).toBeUndefined();
        expect(result.standardDbml).toContain('idx_payment_methods_is_default');
    });

    it('still quotes bare identifier defaults', () => {
        expect(sanitizeSQLforDBML('"status" varchar(10) DEFAULT active,')).toBe(
            `"status" varchar(10) DEFAULT 'active',`
        );
    });

    // https://github.com/chartdb/chartdb/issues/1165
    it('generates DBML for SQLite autoincrement primary key', () => {
        const result = generateDBMLFromDiagram(
            diagramWith(DatabaseType.SQLITE, [
                field({
                    id: 'id',
                    name: 'id',
                    primaryKey: true,
                    nullable: false,
                    increment: true,
                }),
            ])
        );
        expect(result.error).toBeUndefined();
        expect(result.standardDbml).toMatch(/"id" integer \[[^\]]*increment/);
    });
});
