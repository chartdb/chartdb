import { describe, it, expect } from 'vitest';
import { reconcileDiagram, type AIDiagram } from '../edit-diagram';
import type { Diagram } from '@/lib/domain/diagram';
import { DatabaseType } from '@/lib/domain/database-type';

const current: Diagram = {
    id: 'd1',
    name: 'test',
    databaseType: DatabaseType.POSTGRESQL,
    createdAt: new Date(),
    updatedAt: new Date(),
    tables: [
        {
            id: 'users-id',
            name: 'users',
            schema: 'public',
            x: 0,
            y: 0,
            color: '#111111',
            isView: false,
            createdAt: 0,
            indexes: [],
            fields: [
                {
                    id: 'users-pk',
                    name: 'id',
                    type: { id: 'integer', name: 'integer' },
                    primaryKey: true,
                    unique: true,
                    nullable: false,
                    createdAt: 0,
                },
            ],
        },
    ],
    relationships: [],
};

describe('reconcileDiagram', () => {
    it('preserves existing table and field ids when echoed', () => {
        const ai: AIDiagram = {
            tables: [
                {
                    id: 'users-id',
                    name: 'users',
                    schema: 'public',
                    fields: [
                        {
                            id: 'users-pk',
                            name: 'id',
                            type: 'integer',
                            primaryKey: true,
                        },
                    ],
                },
            ],
            relationships: [],
        };
        const result = reconcileDiagram(current, ai);
        expect(result.tables?.[0].id).toBe('users-id');
        expect(result.tables?.[0].fields[0].id).toBe('users-pk');
    });

    it('reuses ids by name when the model omits them', () => {
        const ai: AIDiagram = {
            tables: [
                {
                    name: 'users',
                    schema: 'public',
                    fields: [{ name: 'id', type: 'integer', primaryKey: true }],
                },
            ],
            relationships: [],
        };
        const result = reconcileDiagram(current, ai);
        expect(result.tables?.[0].id).toBe('users-id');
        expect(result.tables?.[0].fields[0].id).toBe('users-pk');
    });

    it('mints ids and marks explicit color for a new table', () => {
        const ai: AIDiagram = {
            tables: [
                {
                    name: 'users',
                    schema: 'public',
                    fields: [{ name: 'id', type: 'integer', primaryKey: true }],
                },
                {
                    name: 'orders',
                    schema: 'public',
                    color: '#4dee8a',
                    fields: [
                        { name: 'id', type: 'integer', primaryKey: true },
                        { name: 'user_id', type: 'integer' },
                    ],
                },
            ],
            relationships: [
                {
                    sourceTable: 'orders',
                    sourceField: 'user_id',
                    targetTable: 'users',
                    targetField: 'id',
                },
            ],
        };
        const result = reconcileDiagram(current, ai);
        const orders = result.tables?.find((t) => t.name === 'orders');
        expect(orders).toBeDefined();
        expect(orders?.id).toBeTruthy();
        expect(orders?.id).not.toBe('users-id');
        expect(orders?.color).toBe('#4dee8a');
        expect(orders?.isColorCustom).toBe(true);
        // relationship resolved by name to concrete ids
        expect(result.relationships).toHaveLength(1);
        const rel = result.relationships?.[0];
        expect(rel?.sourceTableId).toBe(orders?.id);
        expect(rel?.targetTableId).toBe('users-id');
    });

    it('drops tables the model omits (deletion)', () => {
        const ai: AIDiagram = { tables: [], relationships: [] };
        const result = reconcileDiagram(current, ai);
        expect(result.tables).toHaveLength(0);
    });

    it('skips relationships that reference unknown tables/fields', () => {
        const ai: AIDiagram = {
            tables: [
                {
                    id: 'users-id',
                    name: 'users',
                    schema: 'public',
                    fields: [{ id: 'users-pk', name: 'id', type: 'integer' }],
                },
            ],
            relationships: [
                {
                    sourceTable: 'ghost',
                    sourceField: 'x',
                    targetTable: 'users',
                    targetField: 'id',
                },
            ],
        };
        const result = reconcileDiagram(current, ai);
        expect(result.relationships).toHaveLength(0);
    });
});
