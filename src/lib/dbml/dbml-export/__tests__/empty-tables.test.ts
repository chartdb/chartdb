import { describe, it, expect } from 'vitest';
import { generateDBMLFromDiagram } from '../dbml-export';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import { generateId, generateDiagramId } from '@/lib/utils';

describe('DBML Export - Empty Tables', () => {
    it('should filter out tables with no fields', () => {
        const diagram: Diagram = {
            id: generateDiagramId(),
            name: 'Test Diagram',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: generateId(),
                    name: 'valid_table',
                    schema: 'public',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: generateId(),
                            name: 'id',
                            type: { id: 'integer', name: 'integer' },
                            primaryKey: true,
                            unique: true,
                            nullable: false,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: '#8eb7ff',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: generateId(),
                    name: 'empty_table',
                    schema: 'public',
                    x: 0,
                    y: 0,
                    fields: [], // Empty fields array
                    indexes: [],
                    color: '#8eb7ff',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: generateId(),
                    name: 'another_valid_table',
                    schema: 'public',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: generateId(),
                            name: 'name',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: '#8eb7ff',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = generateDBMLFromDiagram(diagram);

        // Verify the DBML doesn't contain the empty table
        expect(result.inlineDbml).not.toContain('empty_table');
        expect(result.standardDbml).not.toContain('empty_table');

        // Verify the valid tables are still present
        expect(result.inlineDbml).toContain('valid_table');
        expect(result.inlineDbml).toContain('another_valid_table');
    });

    it('should handle diagram with only empty tables', () => {
        const diagram: Diagram = {
            id: generateDiagramId(),
            name: 'Test Diagram',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: generateId(),
                    name: 'empty_table_1',
                    schema: 'public',
                    x: 0,
                    y: 0,
                    fields: [],
                    indexes: [],
                    color: '#8eb7ff',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: generateId(),
                    name: 'empty_table_2',
                    schema: 'public',
                    x: 0,
                    y: 0,
                    fields: [],
                    indexes: [],
                    color: '#8eb7ff',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = generateDBMLFromDiagram(diagram);

        // Should not error and should return empty DBML (or just enums if any)
        expect(result.inlineDbml).toBeTruthy();
        expect(result.standardDbml).toBeTruthy();
        expect(result.error).toBeUndefined();
    });

    it('should filter out table that becomes empty after removing invalid fields', () => {
        const diagram: Diagram = {
            id: generateDiagramId(),
            name: 'Test Diagram',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: generateId(),
                    name: 'table_with_only_empty_field_names',
                    schema: 'public',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: generateId(),
                            name: '', // Empty field name - will be filtered
                            type: { id: 'integer', name: 'integer' },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            createdAt: Date.now(),
                        },
                        {
                            id: generateId(),
                            name: '', // Empty field name - will be filtered
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: '#8eb7ff',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: generateId(),
                    name: 'valid_table',
                    schema: 'public',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: generateId(),
                            name: 'id',
                            type: { id: 'integer', name: 'integer' },
                            primaryKey: true,
                            unique: true,
                            nullable: false,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: '#8eb7ff',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = generateDBMLFromDiagram(diagram);

        // Table with only empty field names should be filtered out
        expect(result.inlineDbml).not.toContain(
            'table_with_only_empty_field_names'
        );
        // Valid table should remain
        expect(result.inlineDbml).toContain('valid_table');
    });
});
