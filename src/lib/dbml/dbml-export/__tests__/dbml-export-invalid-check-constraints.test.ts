import { describe, it, expect } from 'vitest';
import { generateDBMLFromDiagram } from '../dbml-export';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';

describe('DBML Export - Invalid Check Constraints', () => {
    it('should not fail when table has invalid check constraints', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'table_1',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                    checkConstraints: [
                        {
                            id: 'check1',
                            expression: 'id > 0', // Valid
                            createdAt: Date.now(),
                        },
                        {
                            id: 'check2',
                            expression: '(a < b)', // Valid
                            createdAt: Date.now(),
                        },
                        {
                            id: 'check3',
                            expression: '(a a)', // Invalid - no operator
                            createdAt: Date.now(),
                        },
                    ],
                },
            ],
            relationships: [],
        };

        // Should not throw
        const result = generateDBMLFromDiagram(diagram);

        // Should not contain error message
        expect(result.error).toBeUndefined();
        expect(result.standardDbml).not.toContain('Error generating DBML');

        // Should contain the table
        expect(result.standardDbml).toContain('table_1');

        // Should contain valid check constraints
        expect(result.standardDbml).toContain('id > 0');
        expect(result.standardDbml).toContain('(a < b)');

        // Should NOT contain invalid check constraint
        expect(result.standardDbml).not.toContain('(a a)');
    });

    it('should handle table with only invalid check constraints', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'products',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'price',
                            type: { id: 'decimal', name: 'decimal' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                    checkConstraints: [
                        {
                            id: 'check1',
                            expression: 'price >', // Invalid - incomplete
                            createdAt: Date.now(),
                        },
                        {
                            id: 'check2',
                            expression: '> 0', // Invalid - no left operand
                            createdAt: Date.now(),
                        },
                    ],
                },
            ],
            relationships: [],
        };

        // Should not throw
        const result = generateDBMLFromDiagram(diagram);

        // Should not contain error message
        expect(result.error).toBeUndefined();
        expect(result.standardDbml).not.toContain('Error generating DBML');

        // Should contain the table
        expect(result.standardDbml).toContain('products');

        // Should NOT contain a checks block (no valid constraints)
        expect(result.standardDbml).not.toContain('checks {');
    });

    it('should handle empty check constraint expressions', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'users',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'age',
                            type: { id: 'integer', name: 'integer' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                    checkConstraints: [
                        {
                            id: 'check1',
                            expression: '', // Empty
                            createdAt: Date.now(),
                        },
                        {
                            id: 'check2',
                            expression: '   ', // Whitespace only
                            createdAt: Date.now(),
                        },
                        {
                            id: 'check3',
                            expression: 'age >= 0', // Valid
                            createdAt: Date.now(),
                        },
                    ],
                },
            ],
            relationships: [],
        };

        // Should not throw
        const result = generateDBMLFromDiagram(diagram);

        // Should not contain error message
        expect(result.error).toBeUndefined();

        // Should contain valid constraint
        expect(result.standardDbml).toContain('age >= 0');
    });

    it('should handle unbalanced parentheses in check constraints', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'orders',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'status',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                    checkConstraints: [
                        {
                            id: 'check1',
                            expression: "(status = 'active'", // Missing closing paren
                            createdAt: Date.now(),
                        },
                    ],
                },
            ],
            relationships: [],
        };

        // Should not throw
        const result = generateDBMLFromDiagram(diagram);

        // Should not contain error message
        expect(result.error).toBeUndefined();
        expect(result.standardDbml).not.toContain('Error generating DBML');

        // Should contain the table
        expect(result.standardDbml).toContain('orders');

        // Should NOT contain the invalid constraint
        expect(result.standardDbml).not.toContain("(status = 'active'");
    });
});
