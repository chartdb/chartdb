import { describe, expect, it } from 'vitest';
import { applyIds } from '../apply-ids';
import {
    DatabaseType,
    DBCustomTypeKind,
    type Diagram,
    type DBTable,
    type DBField,
    type DBIndex,
    type DBRelationship,
    type DBDependency,
    type DBCustomType,
} from '../../domain';

describe('applyIds', () => {
    const createBaseDiagram = (overrides?: Partial<Diagram>): Diagram => ({
        id: 'diagram1',
        name: 'Test Diagram',
        databaseType: DatabaseType.POSTGRESQL,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    });

    const createTable = (overrides: Partial<DBTable>): DBTable => ({
        id: 'table-1',
        name: 'table',
        schema: 'public',
        x: 0,
        y: 0,
        fields: [],
        indexes: [],
        color: '#000000',
        comments: null,
        isView: false,
        createdAt: Date.now(),
        ...overrides,
    });

    const createField = (overrides: Partial<DBField>): DBField => ({
        id: 'field-1',
        name: 'field',
        type: { id: 'integer', name: 'integer' },
        primaryKey: false,
        nullable: false,
        unique: false,
        comments: null,
        collation: null,
        createdAt: Date.now(),
        ...overrides,
    });

    const createIndex = (overrides: Partial<DBIndex>): DBIndex => ({
        id: 'index-1',
        name: 'index',
        unique: false,
        fieldIds: [],
        createdAt: Date.now(),
        ...overrides,
    });

    const createRelationship = (
        overrides: Partial<DBRelationship>
    ): DBRelationship => ({
        id: 'rel-1',
        name: 'relationship',
        sourceTableId: 'table-1',
        sourceFieldId: 'field-1',
        targetTableId: 'table-2',
        targetFieldId: 'field-2',
        sourceCardinality: 'many',
        targetCardinality: 'one',
        createdAt: Date.now(),
        ...overrides,
    });

    const createDependency = (
        overrides: Partial<DBDependency>
    ): DBDependency => ({
        id: 'dep-1',
        tableId: 'table-1',
        dependentTableId: 'table-2',
        createdAt: Date.now(),
        ...overrides,
    });

    const createCustomType = (
        overrides: Partial<DBCustomType>
    ): DBCustomType => ({
        id: 'type-1',
        name: 'custom_type',
        schema: 'public',
        kind: DBCustomTypeKind.enum,
        values: [],
        ...overrides,
    });

    describe('table ID mapping', () => {
        it('should preserve table IDs when tables match by name and schema', () => {
            const sourceDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'source-table-1',
                        name: 'users',
                        schema: 'public',
                    }),
                    createTable({
                        id: 'source-table-2',
                        name: 'posts',
                        schema: 'public',
                    }),
                ],
            });

            const targetDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'target-table-1',
                        name: 'users',
                        schema: 'public',
                        x: 100,
                        y: 100,
                        color: '#ff0000',
                        comments: 'Users table',
                    }),
                    createTable({
                        id: 'target-table-2',
                        name: 'posts',
                        schema: 'public',
                        x: 200,
                        y: 200,
                        color: '#00ff00',
                    }),
                ],
            });

            const result = applyIds({ sourceDiagram, targetDiagram });

            expect(result.tables).toHaveLength(2);
            expect(result.tables?.[0].id).toBe('source-table-1');
            expect(result.tables?.[0].name).toBe('users');
            expect(result.tables?.[0].x).toBe(100); // Should keep target's position
            expect(result.tables?.[0].color).toBe('#ff0000'); // Should keep target's color
            expect(result.tables?.[1].id).toBe('source-table-2');
            expect(result.tables?.[1].name).toBe('posts');
        });

        it('should keep target table IDs when no matching source table exists', () => {
            const sourceDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'source-table-1',
                        name: 'users',
                        schema: 'public',
                    }),
                ],
            });

            const targetDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'target-table-1',
                        name: 'orders',
                        schema: 'public',
                        x: 100,
                        y: 100,
                        color: '#ff0000',
                    }),
                ],
            });

            const result = applyIds({ sourceDiagram, targetDiagram });

            expect(result.tables).toHaveLength(1);
            expect(result.tables?.[0].id).toBe('target-table-1'); // Should keep target ID
            expect(result.tables?.[0].name).toBe('orders');
        });
    });

    describe('field ID mapping', () => {
        it('should preserve field IDs when fields match by name within the same table', () => {
            const sourceDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'source-table-1',
                        name: 'users',
                        schema: 'public',
                        fields: [
                            createField({
                                id: 'source-field-1',
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                                unique: true,
                            }),
                            createField({
                                id: 'source-field-2',
                                name: 'email',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: false,
                                nullable: false,
                                unique: true,
                            }),
                        ],
                    }),
                ],
            });

            const targetDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'target-table-1',
                        name: 'users',
                        schema: 'public',
                        x: 100,
                        y: 100,
                        color: '#ff0000',
                        fields: [
                            createField({
                                id: 'target-field-1',
                                name: 'id',
                                type: { id: 'bigint', name: 'bigint' },
                                primaryKey: true,
                                nullable: false,
                                unique: true,
                                comments: 'Primary key',
                            }),
                            createField({
                                id: 'target-field-2',
                                name: 'email',
                                type: { id: 'text', name: 'text' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                            }),
                        ],
                    }),
                ],
            });

            const result = applyIds({ sourceDiagram, targetDiagram });

            expect(result.tables?.[0].fields).toHaveLength(2);
            expect(result.tables?.[0].fields[0].id).toBe('source-field-1');
            expect(result.tables?.[0].fields[0].name).toBe('id');
            expect(result.tables?.[0].fields[0].type.id).toBe('bigint'); // Should keep target's type
            expect(result.tables?.[0].fields[1].id).toBe('source-field-2');
            expect(result.tables?.[0].fields[1].name).toBe('email');
            expect(result.tables?.[0].fields[1].nullable).toBe(true); // Should keep target's nullable
        });
    });

    describe('index ID mapping', () => {
        it('should preserve index IDs and update field references', () => {
            const sourceDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'source-table-1',
                        name: 'users',
                        schema: 'public',
                        fields: [
                            createField({
                                id: 'source-field-1',
                                name: 'email',
                                type: { id: 'varchar', name: 'varchar' },
                            }),
                        ],
                        indexes: [
                            createIndex({
                                id: 'source-index-1',
                                name: 'idx_email',
                                unique: true,
                                fieldIds: ['source-field-1'],
                            }),
                        ],
                    }),
                ],
            });

            const targetDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'target-table-1',
                        name: 'users',
                        schema: 'public',
                        x: 100,
                        y: 100,
                        color: '#ff0000',
                        fields: [
                            createField({
                                id: 'target-field-1',
                                name: 'email',
                                type: { id: 'text', name: 'text' },
                            }),
                        ],
                        indexes: [
                            createIndex({
                                id: 'target-index-1',
                                name: 'idx_email',
                                unique: false,
                                fieldIds: ['target-field-1'],
                            }),
                        ],
                    }),
                ],
            });

            const result = applyIds({ sourceDiagram, targetDiagram });

            expect(result.tables?.[0].indexes).toHaveLength(1);
            expect(result.tables?.[0].indexes[0].id).toBe('source-index-1');
            expect(result.tables?.[0].indexes[0].fieldIds).toEqual([
                'source-field-1',
            ]); // Should update field reference
            expect(result.tables?.[0].indexes[0].unique).toBe(false); // Should keep target's unique setting
        });
    });

    describe('relationship ID mapping', () => {
        it('should preserve relationship IDs and update table/field references', () => {
            const sourceDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'source-table-1',
                        name: 'users',
                        schema: 'public',
                        fields: [
                            createField({
                                id: 'source-field-1',
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                unique: true,
                            }),
                        ],
                    }),
                    createTable({
                        id: 'source-table-2',
                        name: 'posts',
                        schema: 'public',
                        fields: [
                            createField({
                                id: 'source-field-2',
                                name: 'user_id',
                                type: { id: 'integer', name: 'integer' },
                            }),
                        ],
                    }),
                ],
                relationships: [
                    createRelationship({
                        id: 'source-rel-1',
                        name: 'fk_posts_users',
                        sourceTableId: 'source-table-2',
                        sourceFieldId: 'source-field-2',
                        targetTableId: 'source-table-1',
                        targetFieldId: 'source-field-1',
                    }),
                ],
            });

            const targetDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'target-table-1',
                        name: 'users',
                        schema: 'public',
                        x: 100,
                        y: 100,
                        color: '#ff0000',
                        fields: [
                            createField({
                                id: 'target-field-1',
                                name: 'id',
                                type: { id: 'bigint', name: 'bigint' },
                                primaryKey: true,
                                unique: true,
                            }),
                        ],
                    }),
                    createTable({
                        id: 'target-table-2',
                        name: 'posts',
                        schema: 'public',
                        x: 200,
                        y: 200,
                        color: '#00ff00',
                        fields: [
                            createField({
                                id: 'target-field-2',
                                name: 'user_id',
                                type: { id: 'bigint', name: 'bigint' },
                                nullable: true,
                            }),
                        ],
                    }),
                ],
                relationships: [
                    createRelationship({
                        id: 'target-rel-1',
                        name: 'fk_posts_users',
                        sourceTableId: 'target-table-2',
                        sourceFieldId: 'target-field-2',
                        targetTableId: 'target-table-1',
                        targetFieldId: 'target-field-1',
                    }),
                ],
            });

            const result = applyIds({ sourceDiagram, targetDiagram });

            expect(result.relationships).toHaveLength(1);
            expect(result.relationships?.[0].id).toBe('source-rel-1');
            expect(result.relationships?.[0].sourceTableId).toBe(
                'source-table-2'
            );
            expect(result.relationships?.[0].sourceFieldId).toBe(
                'source-field-2'
            );
            expect(result.relationships?.[0].targetTableId).toBe(
                'source-table-1'
            );
            expect(result.relationships?.[0].targetFieldId).toBe(
                'source-field-1'
            );
        });
    });

    describe('dependency ID mapping', () => {
        it('should preserve dependency IDs and update table references', () => {
            const sourceDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'source-table-1',
                        name: 'users',
                        schema: 'public',
                    }),
                    createTable({
                        id: 'source-table-2',
                        name: 'user_view',
                        schema: 'public',
                        isView: true,
                    }),
                ],
                dependencies: [
                    createDependency({
                        id: 'source-dep-1',
                        tableId: 'source-table-2',
                        dependentTableId: 'source-table-1',
                    }),
                ],
            });

            const targetDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'target-table-1',
                        name: 'users',
                        schema: 'public',
                        x: 100,
                        y: 100,
                        color: '#ff0000',
                    }),
                    createTable({
                        id: 'target-table-2',
                        name: 'user_view',
                        schema: 'public',
                        x: 200,
                        y: 200,
                        color: '#00ff00',
                        isView: true,
                    }),
                ],
                dependencies: [
                    createDependency({
                        id: 'target-dep-1',
                        tableId: 'target-table-2',
                        dependentTableId: 'target-table-1',
                    }),
                ],
            });

            const result = applyIds({ sourceDiagram, targetDiagram });

            expect(result.dependencies).toHaveLength(1);
            expect(result.dependencies?.[0].id).toBe('source-dep-1');
            expect(result.dependencies?.[0].tableId).toBe('source-table-2');
            expect(result.dependencies?.[0].dependentTableId).toBe(
                'source-table-1'
            );
        });
    });

    describe('custom type ID mapping', () => {
        it('should preserve custom type IDs when types match by name and schema', () => {
            const sourceDiagram = createBaseDiagram({
                customTypes: [
                    createCustomType({
                        id: 'source-type-1',
                        name: 'user_role',
                        schema: 'public',
                        values: ['admin', 'user', 'guest'],
                    }),
                ],
            });

            const targetDiagram = createBaseDiagram({
                customTypes: [
                    createCustomType({
                        id: 'target-type-1',
                        name: 'user_role',
                        schema: 'public',
                        values: ['admin', 'user', 'guest', 'moderator'],
                    }),
                ],
            });

            const result = applyIds({ sourceDiagram, targetDiagram });

            expect(result.customTypes).toHaveLength(1);
            expect(result.customTypes?.[0].id).toBe('source-type-1');
            expect(result.customTypes?.[0].values).toEqual([
                'admin',
                'user',
                'guest',
                'moderator',
            ]); // Should keep target's values
        });
    });

    describe('complex scenarios', () => {
        it('should handle partial matches correctly', () => {
            const sourceDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'source-table-1',
                        name: 'users',
                        schema: 'public',
                        fields: [
                            createField({
                                id: 'source-field-1',
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                unique: true,
                            }),
                            createField({
                                id: 'source-field-2',
                                name: 'email',
                                type: { id: 'varchar', name: 'varchar' },
                                unique: true,
                            }),
                        ],
                    }),
                ],
            });

            const targetDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'target-table-1',
                        name: 'users',
                        schema: 'public',
                        x: 100,
                        y: 100,
                        color: '#ff0000',
                        fields: [
                            createField({
                                id: 'target-field-1',
                                name: 'id',
                                type: { id: 'bigint', name: 'bigint' },
                                primaryKey: true,
                                unique: true,
                            }),
                            createField({
                                id: 'target-field-3',
                                name: 'username',
                                type: { id: 'varchar', name: 'varchar' },
                                unique: true,
                            }),
                        ],
                    }),
                    createTable({
                        id: 'target-table-2',
                        name: 'posts',
                        schema: 'public',
                        x: 200,
                        y: 200,
                        color: '#00ff00',
                    }),
                ],
            });

            const result = applyIds({ sourceDiagram, targetDiagram });

            expect(result.tables).toHaveLength(2);
            expect(result.tables?.[0].id).toBe('source-table-1');
            expect(result.tables?.[0].fields).toHaveLength(2);
            expect(result.tables?.[0].fields[0].id).toBe('source-field-1'); // Matched field
            expect(result.tables?.[0].fields[1].id).toBe('target-field-3'); // Unmatched field keeps target ID
            expect(result.tables?.[1].id).toBe('target-table-2'); // Unmatched table keeps target ID
        });

        it('should handle different schemas correctly', () => {
            const sourceDiagram = createBaseDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: 'source-table-1',
                        name: 'users',
                        schema: 'auth',
                    }),
                ],
            });

            const targetDiagram = createBaseDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: 'target-table-1',
                        name: 'users',
                        schema: 'public',
                        x: 100,
                        y: 100,
                        color: '#ff0000',
                    }),
                ],
            });

            const result = applyIds({ sourceDiagram, targetDiagram });

            expect(result.tables?.[0].id).toBe('target-table-1'); // Different schemas, no match
        });

        it('should handle empty diagrams', () => {
            const sourceDiagram = createBaseDiagram();
            const targetDiagram = createBaseDiagram();

            const result = applyIds({ sourceDiagram, targetDiagram });

            expect(result).toEqual(targetDiagram);
        });

        it('should return target diagram unchanged when source has no matching entities', () => {
            const sourceDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'source-table-1',
                        name: 'products',
                        schema: 'inventory',
                    }),
                ],
            });

            const targetDiagram = createBaseDiagram({
                tables: [
                    createTable({
                        id: 'target-table-1',
                        name: 'users',
                        schema: 'public',
                        x: 100,
                        y: 100,
                        color: '#ff0000',
                        fields: [
                            createField({
                                id: 'target-field-1',
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                unique: true,
                            }),
                        ],
                    }),
                ],
            });

            const result = applyIds({ sourceDiagram, targetDiagram });

            // Should keep all target IDs since nothing matches
            expect(result.tables?.[0].id).toBe('target-table-1');
            expect(result.tables?.[0].fields[0].id).toBe('target-field-1');
            expect(result.tables?.[0].name).toBe('users');
            expect(result.tables?.[0].schema).toBe('public');
        });
    });
});
