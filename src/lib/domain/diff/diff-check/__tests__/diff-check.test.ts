import { describe, it, expect } from 'vitest';
import { generateDiff } from '../diff-check';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import type { DBIndex } from '@/lib/domain/db-index';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { Area } from '@/lib/domain/area';
import { DatabaseType } from '@/lib/domain/database-type';
import type { TableDiffChanged } from '../../table-diff';
import type { FieldDiffChanged } from '../../field-diff';
import type { AreaDiffChanged } from '../../area-diff';

// Helper function to create a mock diagram
function createMockDiagram(overrides?: Partial<Diagram>): Diagram {
    return {
        id: 'diagram-1',
        name: 'Test Diagram',
        databaseType: DatabaseType.POSTGRESQL,
        tables: [],
        relationships: [],
        areas: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

// Helper function to create a mock table
function createMockTable(overrides?: Partial<DBTable>): DBTable {
    return {
        id: 'table-1',
        name: 'users',
        fields: [],
        indexes: [],
        x: 0,
        y: 0,
        ...overrides,
    } as DBTable;
}

// Helper function to create a mock field
function createMockField(overrides?: Partial<DBField>): DBField {
    return {
        id: 'field-1',
        name: 'id',
        type: { id: 'integer', name: 'integer' },
        primaryKey: false,
        nullable: true,
        unique: false,
        ...overrides,
    } as DBField;
}

// Helper function to create a mock relationship
function createMockRelationship(
    overrides?: Partial<DBRelationship>
): DBRelationship {
    return {
        id: 'rel-1',
        sourceTableId: 'table-1',
        targetTableId: 'table-2',
        sourceFieldId: 'field-1',
        targetFieldId: 'field-2',
        type: 'one-to-many',
        ...overrides,
    } as DBRelationship;
}

// Helper function to create a mock area
function createMockArea(overrides?: Partial<Area>): Area {
    return {
        id: 'area-1',
        name: 'Main Area',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        color: 'blue',
        ...overrides,
    } as Area;
}

describe('generateDiff', () => {
    describe('Basic Table Diffing', () => {
        it('should detect added tables', () => {
            const oldDiagram = createMockDiagram({ tables: [] });
            const newDiagram = createMockDiagram({
                tables: [createMockTable()],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('table-table-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('added');
            expect(result.changedTables.has('table-1')).toBe(true);
        });

        it('should detect removed tables', () => {
            const oldDiagram = createMockDiagram({
                tables: [createMockTable()],
            });
            const newDiagram = createMockDiagram({ tables: [] });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('table-table-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('removed');
            expect(result.changedTables.has('table-1')).toBe(true);
        });

        it('should detect table name changes', () => {
            const oldDiagram = createMockDiagram({
                tables: [createMockTable({ name: 'users' })],
            });
            const newDiagram = createMockDiagram({
                tables: [createMockTable({ name: 'customers' })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('table-name-table-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('changed');
            expect((diff as TableDiffChanged)?.attribute).toBe('name');
        });

        it('should detect table position changes', () => {
            const oldDiagram = createMockDiagram({
                tables: [createMockTable({ x: 0, y: 0 })],
            });
            const newDiagram = createMockDiagram({
                tables: [createMockTable({ x: 100, y: 200 })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    attributes: {
                        tables: ['name', 'comments', 'color', 'x', 'y'],
                    },
                },
            });

            expect(result.diffMap.size).toBe(2);
            expect(result.diffMap.has('table-x-table-1')).toBe(true);
            expect(result.diffMap.has('table-y-table-1')).toBe(true);
        });

        it('should detect table width changes', () => {
            const oldDiagram = createMockDiagram({
                tables: [createMockTable({ width: 150 })],
            });
            const newDiagram = createMockDiagram({
                tables: [createMockTable({ width: 250 })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    attributes: {
                        tables: ['width'],
                    },
                },
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('table-width-table-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('changed');
            expect((diff as TableDiffChanged)?.attribute).toBe('width');
            expect((diff as TableDiffChanged)?.oldValue).toBe(150);
            expect((diff as TableDiffChanged)?.newValue).toBe(250);
        });

        it('should detect multiple table dimension changes', () => {
            const oldDiagram = createMockDiagram({
                tables: [createMockTable({ x: 0, y: 0, width: 100 })],
            });
            const newDiagram = createMockDiagram({
                tables: [createMockTable({ x: 50, y: 75, width: 200 })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    attributes: {
                        tables: ['x', 'y', 'width'],
                    },
                },
            });

            expect(result.diffMap.size).toBe(3);
            expect(result.diffMap.has('table-x-table-1')).toBe(true);
            expect(result.diffMap.has('table-y-table-1')).toBe(true);
            expect(result.diffMap.has('table-width-table-1')).toBe(true);

            const widthDiff = result.diffMap.get('table-width-table-1');
            expect(widthDiff?.type).toBe('changed');
            expect((widthDiff as TableDiffChanged)?.oldValue).toBe(100);
            expect((widthDiff as TableDiffChanged)?.newValue).toBe(200);
        });
    });

    describe('Field Diffing', () => {
        it('should detect added fields', () => {
            const oldDiagram = createMockDiagram({
                tables: [createMockTable({ fields: [] })],
            });
            const newDiagram = createMockDiagram({
                tables: [
                    createMockTable({
                        fields: [createMockField()],
                    }),
                ],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('field-field-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('added');
            expect(result.changedFields.has('field-1')).toBe(true);
        });

        it('should detect removed fields', () => {
            const oldDiagram = createMockDiagram({
                tables: [
                    createMockTable({
                        fields: [createMockField()],
                    }),
                ],
            });
            const newDiagram = createMockDiagram({
                tables: [createMockTable({ fields: [] })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('field-field-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('removed');
        });

        it('should detect field type changes', () => {
            const oldDiagram = createMockDiagram({
                tables: [
                    createMockTable({
                        fields: [
                            createMockField({
                                type: { id: 'integer', name: 'integer' },
                            }),
                        ],
                    }),
                ],
            });
            const newDiagram = createMockDiagram({
                tables: [
                    createMockTable({
                        fields: [
                            createMockField({
                                type: { id: 'varchar', name: 'varchar' },
                            }),
                        ],
                    }),
                ],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('field-type-field-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('changed');
            expect((diff as FieldDiffChanged)?.attribute).toBe('type');
        });
    });

    describe('Relationship Diffing', () => {
        it('should detect added relationships', () => {
            const oldDiagram = createMockDiagram({ relationships: [] });
            const newDiagram = createMockDiagram({
                relationships: [createMockRelationship()],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('relationship-rel-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('added');
        });

        it('should detect removed relationships', () => {
            const oldDiagram = createMockDiagram({
                relationships: [createMockRelationship()],
            });
            const newDiagram = createMockDiagram({ relationships: [] });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('relationship-rel-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('removed');
        });
    });

    describe('Area Diffing', () => {
        it('should detect added areas when includeAreas is true', () => {
            const oldDiagram = createMockDiagram({ areas: [] });
            const newDiagram = createMockDiagram({
                areas: [createMockArea()],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeAreas: true,
                },
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('area-area-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('added');
            expect(result.changedAreas.has('area-1')).toBe(true);
        });

        it('should not detect area changes when includeAreas is false', () => {
            const oldDiagram = createMockDiagram({ areas: [] });
            const newDiagram = createMockDiagram({
                areas: [createMockArea()],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeAreas: false,
                },
            });

            expect(result.diffMap.size).toBe(0);
        });

        it('should detect area width changes', () => {
            const oldDiagram = createMockDiagram({
                areas: [createMockArea({ width: 100 })],
            });
            const newDiagram = createMockDiagram({
                areas: [createMockArea({ width: 200 })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeAreas: true,
                    attributes: {
                        areas: ['width'],
                    },
                },
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('area-width-area-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('changed');
            expect((diff as AreaDiffChanged)?.attribute).toBe('width');
            expect((diff as AreaDiffChanged)?.oldValue).toBe(100);
            expect((diff as AreaDiffChanged)?.newValue).toBe(200);
        });

        it('should detect area height changes', () => {
            const oldDiagram = createMockDiagram({
                areas: [createMockArea({ height: 100 })],
            });
            const newDiagram = createMockDiagram({
                areas: [createMockArea({ height: 300 })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeAreas: true,
                    attributes: {
                        areas: ['height'],
                    },
                },
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('area-height-area-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('changed');
            expect((diff as AreaDiffChanged)?.attribute).toBe('height');
            expect((diff as AreaDiffChanged)?.oldValue).toBe(100);
            expect((diff as AreaDiffChanged)?.newValue).toBe(300);
        });

        it('should detect multiple area dimension changes', () => {
            const oldDiagram = createMockDiagram({
                areas: [
                    createMockArea({ x: 0, y: 0, width: 100, height: 100 }),
                ],
            });
            const newDiagram = createMockDiagram({
                areas: [
                    createMockArea({ x: 50, y: 50, width: 200, height: 300 }),
                ],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeAreas: true,
                    attributes: {
                        areas: ['x', 'y', 'width', 'height'],
                    },
                },
            });

            expect(result.diffMap.size).toBe(4);
            expect(result.diffMap.has('area-x-area-1')).toBe(true);
            expect(result.diffMap.has('area-y-area-1')).toBe(true);
            expect(result.diffMap.has('area-width-area-1')).toBe(true);
            expect(result.diffMap.has('area-height-area-1')).toBe(true);
        });
    });

    describe('Custom Matchers', () => {
        it('should use custom table matcher to match by name', () => {
            const oldDiagram = createMockDiagram({
                tables: [createMockTable({ id: 'table-1', name: 'users' })],
            });
            const newDiagram = createMockDiagram({
                tables: [createMockTable({ id: 'table-2', name: 'users' })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    matchers: {
                        table: (table, tables) =>
                            tables.find((t) => t.name === table.name),
                    },
                },
            });

            // Should not detect any changes since tables match by name
            expect(result.diffMap.size).toBe(0);
        });

        it('should detect changes when custom matcher finds no match', () => {
            const oldDiagram = createMockDiagram({
                tables: [createMockTable({ id: 'table-1', name: 'users' })],
            });
            const newDiagram = createMockDiagram({
                tables: [createMockTable({ id: 'table-2', name: 'customers' })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    matchers: {
                        table: (table, tables) =>
                            tables.find((t) => t.name === table.name),
                    },
                },
            });

            // Should detect both added and removed since names don't match
            expect(result.diffMap.size).toBe(2);
            expect(result.diffMap.has('table-table-1')).toBe(true); // removed
            expect(result.diffMap.has('table-table-2')).toBe(true); // added
        });

        it('should use custom field matcher to match by name', () => {
            const field1 = createMockField({
                id: 'field-1',
                name: 'email',
                nullable: true,
            });
            const field2 = createMockField({
                id: 'field-2',
                name: 'email',
                nullable: false,
            });

            const oldDiagram = createMockDiagram({
                tables: [createMockTable({ id: 'table-1', fields: [field1] })],
            });
            const newDiagram = createMockDiagram({
                tables: [createMockTable({ id: 'table-1', fields: [field2] })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    matchers: {
                        field: (field, fields) =>
                            fields.find((f) => f.name === field.name),
                    },
                },
            });

            // With name-based matching, field-1 should match field-2 by name
            // and detect the nullable change
            const nullableChange = result.diffMap.get('field-nullable-field-1');
            expect(nullableChange).toBeDefined();
            expect(nullableChange?.type).toBe('changed');
            expect((nullableChange as FieldDiffChanged)?.attribute).toBe(
                'nullable'
            );
        });

        it('should use case-insensitive custom matcher', () => {
            const oldDiagram = createMockDiagram({
                tables: [createMockTable({ id: 'table-1', name: 'Users' })],
            });
            const newDiagram = createMockDiagram({
                tables: [createMockTable({ id: 'table-2', name: 'users' })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    matchers: {
                        table: (table, tables) =>
                            tables.find(
                                (t) =>
                                    t.name.toLowerCase() ===
                                    table.name.toLowerCase()
                            ),
                    },
                },
            });

            // With case-insensitive name matching, the tables are matched
            // but the name case difference is still detected as a change
            expect(result.diffMap.size).toBe(1);
            const nameChange = result.diffMap.get('table-name-table-1');
            expect(nameChange).toBeDefined();
            expect(nameChange?.type).toBe('changed');
            expect((nameChange as TableDiffChanged)?.attribute).toBe('name');
            expect((nameChange as TableDiffChanged)?.oldValue).toBe('Users');
            expect((nameChange as TableDiffChanged)?.newValue).toBe('users');
        });
    });

    describe('Filtering Options', () => {
        it('should only check specified change types', () => {
            const oldDiagram = createMockDiagram({
                tables: [createMockTable({ id: 'table-1', name: 'users' })],
            });
            const newDiagram = createMockDiagram({
                tables: [createMockTable({ id: 'table-2', name: 'products' })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    changeTypes: {
                        tables: ['added'], // Only check for added tables
                    },
                },
            });

            // Should only detect added table (table-2)
            const addedTables = Array.from(result.diffMap.values()).filter(
                (diff) => diff.type === 'added' && diff.object === 'table'
            );
            expect(addedTables.length).toBe(1);

            // Should not detect removed table (table-1)
            const removedTables = Array.from(result.diffMap.values()).filter(
                (diff) => diff.type === 'removed' && diff.object === 'table'
            );
            expect(removedTables.length).toBe(0);
        });

        it('should only check specified attributes', () => {
            const oldDiagram = createMockDiagram({
                tables: [
                    createMockTable({
                        id: 'table-1',
                        name: 'users',
                        color: 'blue',
                        comments: 'old comment',
                    }),
                ],
            });
            const newDiagram = createMockDiagram({
                tables: [
                    createMockTable({
                        id: 'table-1',
                        name: 'customers',
                        color: 'red',
                        comments: 'new comment',
                    }),
                ],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    attributes: {
                        tables: ['name'], // Only check name changes
                    },
                },
            });

            // Should only detect name change
            const nameChanges = Array.from(result.diffMap.values()).filter(
                (diff) =>
                    diff.type === 'changed' &&
                    diff.attribute === 'name' &&
                    diff.object === 'table'
            );
            expect(nameChanges.length).toBe(1);

            // Should not detect color or comments changes
            const otherChanges = Array.from(result.diffMap.values()).filter(
                (diff) =>
                    diff.type === 'changed' &&
                    (diff.attribute === 'color' ||
                        diff.attribute === 'comments') &&
                    diff.object === 'table'
            );
            expect(otherChanges.length).toBe(0);
        });

        it('should respect include flags', () => {
            const oldDiagram = createMockDiagram({
                tables: [
                    createMockTable({
                        fields: [createMockField()],
                        indexes: [{ id: 'idx-1', name: 'idx' } as DBIndex],
                    }),
                ],
            });
            const newDiagram = createMockDiagram({
                tables: [
                    createMockTable({
                        fields: [],
                        indexes: [],
                    }),
                ],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeFields: false,
                    includeIndexes: true,
                },
            });

            // Should only detect index removal, not field removal
            expect(result.diffMap.has('index-idx-1')).toBe(true);
            expect(result.diffMap.has('field-field-1')).toBe(false);
        });
    });

    describe('Complex Scenarios', () => {
        it('should detect all dimensional changes for tables and areas', () => {
            const oldDiagram = createMockDiagram({
                tables: [
                    createMockTable({
                        id: 'table-1',
                        x: 0,
                        y: 0,
                        width: 100,
                    }),
                ],
                areas: [
                    createMockArea({
                        id: 'area-1',
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 150,
                    }),
                ],
            });

            const newDiagram = createMockDiagram({
                tables: [
                    createMockTable({
                        id: 'table-1',
                        x: 10,
                        y: 20,
                        width: 120,
                    }),
                ],
                areas: [
                    createMockArea({
                        id: 'area-1',
                        x: 25,
                        y: 35,
                        width: 250,
                        height: 175,
                    }),
                ],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeAreas: true,
                    attributes: {
                        tables: ['x', 'y', 'width'],
                        areas: ['x', 'y', 'width', 'height'],
                    },
                },
            });

            // Table dimensional changes
            expect(result.diffMap.has('table-x-table-1')).toBe(true);
            expect(result.diffMap.has('table-y-table-1')).toBe(true);
            expect(result.diffMap.has('table-width-table-1')).toBe(true);

            // Area dimensional changes
            expect(result.diffMap.has('area-x-area-1')).toBe(true);
            expect(result.diffMap.has('area-y-area-1')).toBe(true);
            expect(result.diffMap.has('area-width-area-1')).toBe(true);
            expect(result.diffMap.has('area-height-area-1')).toBe(true);

            // Verify the correct values
            const tableWidthDiff = result.diffMap.get('table-width-table-1');
            expect((tableWidthDiff as TableDiffChanged)?.oldValue).toBe(100);
            expect((tableWidthDiff as TableDiffChanged)?.newValue).toBe(120);

            const areaWidthDiff = result.diffMap.get('area-width-area-1');
            expect((areaWidthDiff as AreaDiffChanged)?.oldValue).toBe(200);
            expect((areaWidthDiff as AreaDiffChanged)?.newValue).toBe(250);

            const areaHeightDiff = result.diffMap.get('area-height-area-1');
            expect((areaHeightDiff as AreaDiffChanged)?.oldValue).toBe(150);
            expect((areaHeightDiff as AreaDiffChanged)?.newValue).toBe(175);
        });

        it('should handle multiple simultaneous changes', () => {
            const oldDiagram = createMockDiagram({
                tables: [
                    createMockTable({
                        id: 'table-1',
                        name: 'users',
                        fields: [
                            createMockField({ id: 'field-1', name: 'id' }),
                            createMockField({ id: 'field-2', name: 'email' }),
                        ],
                    }),
                    createMockTable({
                        id: 'table-2',
                        name: 'products',
                    }),
                ],
                relationships: [createMockRelationship()],
            });

            const newDiagram = createMockDiagram({
                tables: [
                    createMockTable({
                        id: 'table-1',
                        name: 'customers', // Changed name
                        fields: [
                            createMockField({ id: 'field-1', name: 'id' }),
                            // Removed field-2
                            createMockField({ id: 'field-3', name: 'name' }), // Added field
                        ],
                    }),
                    // Removed table-2
                    createMockTable({
                        id: 'table-3',
                        name: 'orders', // Added table
                    }),
                ],
                relationships: [], // Removed relationship
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
            });

            // Verify all changes are detected
            expect(result.diffMap.has('table-name-table-1')).toBe(true); // Table name change
            expect(result.diffMap.has('field-field-2')).toBe(true); // Removed field
            expect(result.diffMap.has('field-field-3')).toBe(true); // Added field
            expect(result.diffMap.has('table-table-2')).toBe(true); // Removed table
            expect(result.diffMap.has('table-table-3')).toBe(true); // Added table
            expect(result.diffMap.has('relationship-rel-1')).toBe(true); // Removed relationship
        });

        it('should handle empty diagrams', () => {
            const emptyDiagram1 = createMockDiagram();
            const emptyDiagram2 = createMockDiagram();

            const result = generateDiff({
                diagram: emptyDiagram1,
                newDiagram: emptyDiagram2,
            });

            expect(result.diffMap.size).toBe(0);
            expect(result.changedTables.size).toBe(0);
            expect(result.changedFields.size).toBe(0);
            expect(result.changedAreas.size).toBe(0);
        });

        it('should handle diagrams with undefined collections', () => {
            const diagram1 = createMockDiagram({
                tables: undefined,
                relationships: undefined,
                areas: undefined,
            });
            const diagram2 = createMockDiagram({
                tables: [createMockTable({ id: 'table-1' })],
                relationships: [createMockRelationship({ id: 'rel-1' })],
                areas: [createMockArea({ id: 'area-1' })],
            });

            const result = generateDiff({
                diagram: diagram1,
                newDiagram: diagram2,
                options: {
                    includeAreas: true,
                },
            });

            // Should detect all as added
            expect(result.diffMap.has('table-table-1')).toBe(true);
            expect(result.diffMap.has('relationship-rel-1')).toBe(true);
            expect(result.diffMap.has('area-area-1')).toBe(true);
        });
    });
});
