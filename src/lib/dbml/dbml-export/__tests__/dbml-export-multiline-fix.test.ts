import { describe, it, expect } from 'vitest';
import { generateDBMLFromDiagram } from '../dbml-export';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';

describe('DBML Export - Fix Multiline Table Names', () => {
    // Helper to generate test IDs and timestamps
    let idCounter = 0;
    const testId = () => `test-id-${++idCounter}`;
    const testTime = Date.now();

    // Helper to create a field
    const createField = (overrides: Partial<DBField>): DBField =>
        ({
            id: testId(),
            name: 'field',
            type: { id: 'text', name: 'text' },
            primaryKey: false,
            nullable: true,
            unique: false,
            createdAt: testTime,
            ...overrides,
        }) as DBField;

    // Helper to create a table
    const createTable = (overrides: Partial<DBTable>): DBTable =>
        ({
            id: testId(),
            name: 'table',
            fields: [],
            indexes: [],
            createdAt: testTime,
            x: 0,
            y: 0,
            width: 200,
            ...overrides,
        }) as DBTable;

    // Helper to create a diagram
    const createDiagram = (overrides: Partial<Diagram>): Diagram =>
        ({
            id: testId(),
            name: 'diagram',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [],
            relationships: [],
            createdAt: testTime,
            updatedAt: testTime,
            ...overrides,
        }) as Diagram;

    describe('DBML Generation with Special Characters', () => {
        it('should handle table names with special characters', () => {
            const diagram = createDiagram({
                tables: [
                    createTable({
                        name: 'user-profiles',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                            createField({
                                name: 'user-name',
                                type: { id: 'varchar', name: 'varchar' },
                                nullable: true,
                            }),
                        ],
                    }),
                ],
            });

            const result = generateDBMLFromDiagram(diagram);

            // Should properly quote table names with special characters
            expect(result.standardDbml).toContain('Table "user-profiles"');

            // Field names with special characters should also be quoted
            expect(result.standardDbml).toContain('"user-name"');

            // Should not have any errors
            expect(result.error).toBeUndefined();
        });

        it('should handle schema-qualified table names', () => {
            const diagram = createDiagram({
                tables: [
                    createTable({
                        schema: 'my-schema',
                        name: 'my-table',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                ],
            });

            const result = generateDBMLFromDiagram(diagram);

            // Should properly quote schema and table names
            expect(result.standardDbml).toContain(
                'Table "my-schema"."my-table"'
            );

            // Should not have any errors
            expect(result.error).toBeUndefined();
        });

        it('should handle table names with spaces', () => {
            const diagram = createDiagram({
                tables: [
                    createTable({
                        name: 'user profiles',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                ],
            });

            const result = generateDBMLFromDiagram(diagram);

            // Should properly quote table names with spaces
            expect(result.standardDbml).toContain('Table "user profiles"');

            // Should not have any errors
            expect(result.error).toBeUndefined();
        });

        it('should handle schema names with spaces', () => {
            const diagram = createDiagram({
                tables: [
                    createTable({
                        schema: 'my schema',
                        name: 'my_table',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                ],
            });

            const result = generateDBMLFromDiagram(diagram);

            // Should properly quote schema with spaces
            expect(result.standardDbml).toContain(
                'Table "my schema"."my_table"'
            );

            // Should not have any errors
            expect(result.error).toBeUndefined();
        });

        it('should handle table names with dots', () => {
            const diagram = createDiagram({
                tables: [
                    createTable({
                        name: 'app.config',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                ],
            });

            const result = generateDBMLFromDiagram(diagram);

            // Should properly quote table names with dots
            expect(result.standardDbml).toContain('Table "app.config"');

            // Should not have any errors
            expect(result.error).toBeUndefined();
        });

        it('should not have line breaks in table declarations', () => {
            const diagram = createDiagram({
                tables: [
                    createTable({
                        schema: 'very-long-schema-name-with-dashes',
                        name: 'very-long-table-name-with-special-characters',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                ],
            });

            const result = generateDBMLFromDiagram(diagram);

            // Table declaration should be on a single line
            const tableDeclarations =
                result.standardDbml.match(/Table\s+[^{]+\{/g) || [];
            tableDeclarations.forEach((decl) => {
                // Should not contain newlines before the opening brace
                expect(decl).not.toContain('\n');
            });

            // The full qualified name should be on one line
            expect(result.standardDbml).toMatch(
                /Table\s+"very-long-schema-name-with-dashes"\."very-long-table-name-with-special-characters"\s*\{/
            );
        });
    });

    describe('Multiple tables and relationships', () => {
        it('should handle multiple tables with special characters', () => {
            const parentTableId = testId();
            const childTableId = testId();
            const parentIdField = testId();
            const childParentIdField = testId();

            const diagram = createDiagram({
                tables: [
                    createTable({
                        id: parentTableId,
                        schema: 'auth-schema',
                        name: 'user-accounts',
                        fields: [
                            createField({
                                id: parentIdField,
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        id: childTableId,
                        schema: 'app-schema',
                        name: 'user-profiles',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                            }),
                            createField({
                                id: childParentIdField,
                                name: 'account-id',
                                type: { id: 'uuid', name: 'uuid' },
                                nullable: false,
                            }),
                        ],
                    }),
                ],
                relationships: [
                    {
                        id: testId(),
                        name: 'fk_profiles_accounts',
                        sourceTableId: childTableId,
                        targetTableId: parentTableId,
                        sourceFieldId: childParentIdField,
                        targetFieldId: parentIdField,
                        sourceCardinality: 'many',
                        targetCardinality: 'one',
                        createdAt: testTime,
                    },
                ],
            });

            const result = generateDBMLFromDiagram(diagram);

            // Should contain both tables properly quoted
            expect(result.standardDbml).toContain(
                'Table "auth-schema"."user-accounts"'
            );
            expect(result.standardDbml).toContain(
                'Table "app-schema"."user-profiles"'
            );

            // Should contain the relationship reference
            expect(result.standardDbml).toContain('Ref');

            // Should contain field names with dashes properly quoted
            expect(result.standardDbml).toContain('"account-id"');

            // Should not have any errors
            expect(result.error).toBeUndefined();
        });

        it('should work correctly with inline DBML format', () => {
            const parentTableId = testId();
            const childTableId = testId();
            const parentIdField = testId();
            const childParentIdField = testId();

            const diagram = createDiagram({
                tables: [
                    createTable({
                        id: parentTableId,
                        name: 'parent-table',
                        fields: [
                            createField({
                                id: parentIdField,
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        id: childTableId,
                        name: 'child-table',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                            createField({
                                id: childParentIdField,
                                name: 'parent-id',
                                type: { id: 'integer', name: 'integer' },
                                nullable: false,
                            }),
                        ],
                    }),
                ],
                relationships: [
                    {
                        id: testId(),
                        name: 'fk_child_parent',
                        sourceTableId: childTableId,
                        targetTableId: parentTableId,
                        sourceFieldId: childParentIdField,
                        targetFieldId: parentIdField,
                        sourceCardinality: 'many',
                        targetCardinality: 'one',
                        createdAt: testTime,
                    },
                ],
            });

            const result = generateDBMLFromDiagram(diagram);

            // Both standard and inline should be generated
            expect(result.standardDbml).toBeDefined();
            expect(result.inlineDbml).toBeDefined();

            // Inline version should contain inline references
            expect(result.inlineDbml).toContain('ref:');

            // Both should properly quote table names
            expect(result.standardDbml).toContain('Table "parent-table"');
            expect(result.inlineDbml).toContain('Table "parent-table"');
            expect(result.standardDbml).toContain('Table "child-table"');
            expect(result.inlineDbml).toContain('Table "child-table"');

            // Should not have any errors
            expect(result.error).toBeUndefined();
        });
    });

    describe('Edge cases', () => {
        it('should handle empty table names gracefully', () => {
            const diagram = createDiagram({
                tables: [
                    createTable({
                        name: '',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                ],
            });

            const result = generateDBMLFromDiagram(diagram);

            // Should not throw error
            expect(result.error).toBeUndefined();
        });

        it('should handle Unicode characters in names', () => {
            const diagram = createDiagram({
                tables: [
                    createTable({
                        name: 'użytkownik',
                        fields: [
                            createField({
                                name: 'identyfikator',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                ],
            });

            const result = generateDBMLFromDiagram(diagram);

            // Should handle Unicode characters
            expect(result.standardDbml).toContain('Table "użytkownik"');
            expect(result.standardDbml).toContain('"identyfikator"');

            // Should not have any errors
            expect(result.error).toBeUndefined();
        });
    });
});
