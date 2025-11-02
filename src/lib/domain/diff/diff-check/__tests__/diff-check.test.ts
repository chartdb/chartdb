import { describe, it, expect } from 'vitest';
import { generateDiff } from '../diff-check';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import type { DBIndex } from '@/lib/domain/db-index';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { Area } from '@/lib/domain/area';
import type { Note } from '@/lib/domain/note';
import { DatabaseType } from '@/lib/domain/database-type';
import type { TableDiffChanged } from '../../table-diff';
import type { FieldDiffChanged } from '../../field-diff';
import type { AreaDiffChanged } from '../../area-diff';
import type { NoteDiffChanged } from '../../note-diff';

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

// Helper function to create a mock note
function createMockNote(overrides?: Partial<Note>): Note {
    return {
        id: 'note-1',
        content: 'Test note content',
        x: 0,
        y: 0,
        width: 200,
        height: 150,
        color: '#3b82f6',
        ...overrides,
    } as Note;
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

    describe('Note Diffing', () => {
        it('should detect added notes when includeNotes is true', () => {
            const oldDiagram = createMockDiagram({ notes: [] });
            const newDiagram = createMockDiagram({
                notes: [createMockNote()],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeNotes: true,
                },
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('note-note-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('added');
            expect(result.changedNotes.has('note-1')).toBe(true);
        });

        it('should not detect note changes when includeNotes is false', () => {
            const oldDiagram = createMockDiagram({ notes: [] });
            const newDiagram = createMockDiagram({
                notes: [createMockNote()],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeNotes: false,
                },
            });

            expect(result.diffMap.size).toBe(0);
            expect(result.changedNotes.size).toBe(0);
        });

        it('should detect removed notes', () => {
            const oldDiagram = createMockDiagram({
                notes: [createMockNote()],
            });
            const newDiagram = createMockDiagram({ notes: [] });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeNotes: true,
                },
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('note-note-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('removed');
            expect(result.changedNotes.has('note-1')).toBe(true);
        });

        it('should detect note content changes', () => {
            const oldDiagram = createMockDiagram({
                notes: [createMockNote({ content: 'Old content' })],
            });
            const newDiagram = createMockDiagram({
                notes: [createMockNote({ content: 'New content' })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeNotes: true,
                },
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('note-content-note-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('changed');
            expect((diff as NoteDiffChanged)?.attribute).toBe('content');
            expect((diff as NoteDiffChanged)?.oldValue).toBe('Old content');
            expect((diff as NoteDiffChanged)?.newValue).toBe('New content');
        });

        it('should detect note color changes', () => {
            const oldDiagram = createMockDiagram({
                notes: [createMockNote({ color: '#3b82f6' })],
            });
            const newDiagram = createMockDiagram({
                notes: [createMockNote({ color: '#ef4444' })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeNotes: true,
                },
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('note-color-note-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('changed');
            expect((diff as NoteDiffChanged)?.attribute).toBe('color');
            expect((diff as NoteDiffChanged)?.oldValue).toBe('#3b82f6');
            expect((diff as NoteDiffChanged)?.newValue).toBe('#ef4444');
        });

        it('should detect note position changes', () => {
            const oldDiagram = createMockDiagram({
                notes: [createMockNote({ x: 0, y: 0 })],
            });
            const newDiagram = createMockDiagram({
                notes: [createMockNote({ x: 100, y: 200 })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeNotes: true,
                    attributes: {
                        notes: ['content', 'color', 'x', 'y'],
                    },
                },
            });

            expect(result.diffMap.size).toBe(2);
            expect(result.diffMap.has('note-x-note-1')).toBe(true);
            expect(result.diffMap.has('note-y-note-1')).toBe(true);

            const xDiff = result.diffMap.get('note-x-note-1');
            expect((xDiff as NoteDiffChanged)?.oldValue).toBe(0);
            expect((xDiff as NoteDiffChanged)?.newValue).toBe(100);
        });

        it('should detect note width changes', () => {
            const oldDiagram = createMockDiagram({
                notes: [createMockNote({ width: 200 })],
            });
            const newDiagram = createMockDiagram({
                notes: [createMockNote({ width: 300 })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeNotes: true,
                    attributes: {
                        notes: ['width'],
                    },
                },
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('note-width-note-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('changed');
            expect((diff as NoteDiffChanged)?.attribute).toBe('width');
            expect((diff as NoteDiffChanged)?.oldValue).toBe(200);
            expect((diff as NoteDiffChanged)?.newValue).toBe(300);
        });

        it('should detect note height changes', () => {
            const oldDiagram = createMockDiagram({
                notes: [createMockNote({ height: 150 })],
            });
            const newDiagram = createMockDiagram({
                notes: [createMockNote({ height: 250 })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeNotes: true,
                    attributes: {
                        notes: ['height'],
                    },
                },
            });

            expect(result.diffMap.size).toBe(1);
            const diff = result.diffMap.get('note-height-note-1');
            expect(diff).toBeDefined();
            expect(diff?.type).toBe('changed');
            expect((diff as NoteDiffChanged)?.attribute).toBe('height');
            expect((diff as NoteDiffChanged)?.oldValue).toBe(150);
            expect((diff as NoteDiffChanged)?.newValue).toBe(250);
        });

        it('should detect multiple note dimension changes', () => {
            const oldDiagram = createMockDiagram({
                notes: [
                    createMockNote({ x: 0, y: 0, width: 200, height: 150 }),
                ],
            });
            const newDiagram = createMockDiagram({
                notes: [
                    createMockNote({ x: 50, y: 75, width: 300, height: 250 }),
                ],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeNotes: true,
                    attributes: {
                        notes: ['x', 'y', 'width', 'height'],
                    },
                },
            });

            expect(result.diffMap.size).toBe(4);
            expect(result.diffMap.has('note-x-note-1')).toBe(true);
            expect(result.diffMap.has('note-y-note-1')).toBe(true);
            expect(result.diffMap.has('note-width-note-1')).toBe(true);
            expect(result.diffMap.has('note-height-note-1')).toBe(true);

            const widthDiff = result.diffMap.get('note-width-note-1');
            expect((widthDiff as NoteDiffChanged)?.oldValue).toBe(200);
            expect((widthDiff as NoteDiffChanged)?.newValue).toBe(300);

            const heightDiff = result.diffMap.get('note-height-note-1');
            expect((heightDiff as NoteDiffChanged)?.oldValue).toBe(150);
            expect((heightDiff as NoteDiffChanged)?.newValue).toBe(250);
        });

        it('should detect multiple notes with different changes', () => {
            const oldDiagram = createMockDiagram({
                notes: [
                    createMockNote({ id: 'note-1', content: 'Note 1' }),
                    createMockNote({ id: 'note-2', content: 'Note 2' }),
                    createMockNote({ id: 'note-3', content: 'Note 3' }),
                ],
            });
            const newDiagram = createMockDiagram({
                notes: [
                    createMockNote({
                        id: 'note-1',
                        content: 'Note 1 Updated',
                    }), // Changed
                    createMockNote({ id: 'note-2', content: 'Note 2' }), // Unchanged
                    // note-3 removed
                    createMockNote({ id: 'note-4', content: 'Note 4' }), // Added
                ],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeNotes: true,
                },
            });

            // Should detect: 1 content change, 1 removal, 1 addition
            expect(result.diffMap.has('note-content-note-1')).toBe(true); // Changed
            expect(result.diffMap.has('note-note-3')).toBe(true); // Removed
            expect(result.diffMap.has('note-note-4')).toBe(true); // Added

            expect(result.changedNotes.has('note-1')).toBe(true);
            expect(result.changedNotes.has('note-3')).toBe(true);
            expect(result.changedNotes.has('note-4')).toBe(true);
        });

        it('should use custom note matcher', () => {
            const oldDiagram = createMockDiagram({
                notes: [
                    createMockNote({
                        id: 'note-1',
                        content: 'Unique content',
                        color: '#3b82f6',
                    }),
                ],
            });
            const newDiagram = createMockDiagram({
                notes: [
                    createMockNote({
                        id: 'note-2',
                        content: 'Unique content',
                        color: '#ef4444',
                    }),
                ],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeNotes: true,
                    matchers: {
                        note: (note, notes) =>
                            notes.find((n) => n.content === note.content),
                    },
                },
            });

            // With content-based matching, note-1 should match note-2 by content
            // and detect the color change
            const colorChange = result.diffMap.get('note-color-note-1');
            expect(colorChange).toBeDefined();
            expect(colorChange?.type).toBe('changed');
            expect((colorChange as NoteDiffChanged)?.attribute).toBe('color');
            expect((colorChange as NoteDiffChanged)?.oldValue).toBe('#3b82f6');
            expect((colorChange as NoteDiffChanged)?.newValue).toBe('#ef4444');
        });

        it('should only check specified note change types', () => {
            const oldDiagram = createMockDiagram({
                notes: [createMockNote({ id: 'note-1', content: 'Note 1' })],
            });
            const newDiagram = createMockDiagram({
                notes: [createMockNote({ id: 'note-2', content: 'Note 2' })],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeNotes: true,
                    changeTypes: {
                        notes: ['added'], // Only check for added notes
                    },
                },
            });

            // Should only detect added note (note-2)
            const addedNotes = Array.from(result.diffMap.values()).filter(
                (diff) => diff.type === 'added' && diff.object === 'note'
            );
            expect(addedNotes.length).toBe(1);

            // Should not detect removed note (note-1)
            const removedNotes = Array.from(result.diffMap.values()).filter(
                (diff) => diff.type === 'removed' && diff.object === 'note'
            );
            expect(removedNotes.length).toBe(0);
        });

        it('should only check specified note attributes', () => {
            const oldDiagram = createMockDiagram({
                notes: [
                    createMockNote({
                        id: 'note-1',
                        content: 'Old content',
                        color: '#3b82f6',
                        x: 0,
                        y: 0,
                    }),
                ],
            });
            const newDiagram = createMockDiagram({
                notes: [
                    createMockNote({
                        id: 'note-1',
                        content: 'New content',
                        color: '#ef4444',
                        x: 100,
                        y: 200,
                    }),
                ],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeNotes: true,
                    attributes: {
                        notes: ['content'], // Only check content changes
                    },
                },
            });

            // Should only detect content change
            const contentChanges = Array.from(result.diffMap.values()).filter(
                (diff) =>
                    diff.type === 'changed' &&
                    diff.attribute === 'content' &&
                    diff.object === 'note'
            );
            expect(contentChanges.length).toBe(1);

            // Should not detect color or position changes
            const otherChanges = Array.from(result.diffMap.values()).filter(
                (diff) =>
                    diff.type === 'changed' &&
                    (diff.attribute === 'color' ||
                        diff.attribute === 'x' ||
                        diff.attribute === 'y') &&
                    diff.object === 'note'
            );
            expect(otherChanges.length).toBe(0);
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
        it('should detect all dimensional changes for tables, areas, and notes', () => {
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
                notes: [
                    createMockNote({
                        id: 'note-1',
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 200,
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
                notes: [
                    createMockNote({
                        id: 'note-1',
                        x: 40,
                        y: 50,
                        width: 350,
                        height: 225,
                    }),
                ],
            });

            const result = generateDiff({
                diagram: oldDiagram,
                newDiagram,
                options: {
                    includeAreas: true,
                    includeNotes: true,
                    attributes: {
                        tables: ['x', 'y', 'width'],
                        areas: ['x', 'y', 'width', 'height'],
                        notes: ['x', 'y', 'width', 'height'],
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

            // Note dimensional changes
            expect(result.diffMap.has('note-x-note-1')).toBe(true);
            expect(result.diffMap.has('note-y-note-1')).toBe(true);
            expect(result.diffMap.has('note-width-note-1')).toBe(true);
            expect(result.diffMap.has('note-height-note-1')).toBe(true);

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

            const noteWidthDiff = result.diffMap.get('note-width-note-1');
            expect((noteWidthDiff as NoteDiffChanged)?.oldValue).toBe(300);
            expect((noteWidthDiff as NoteDiffChanged)?.newValue).toBe(350);

            const noteHeightDiff = result.diffMap.get('note-height-note-1');
            expect((noteHeightDiff as NoteDiffChanged)?.oldValue).toBe(200);
            expect((noteHeightDiff as NoteDiffChanged)?.newValue).toBe(225);
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
            expect(result.changedNotes.size).toBe(0);
        });

        it('should handle diagrams with undefined collections', () => {
            const diagram1 = createMockDiagram({
                tables: undefined,
                relationships: undefined,
                areas: undefined,
                notes: undefined,
            });
            const diagram2 = createMockDiagram({
                tables: [createMockTable({ id: 'table-1' })],
                relationships: [createMockRelationship({ id: 'rel-1' })],
                areas: [createMockArea({ id: 'area-1' })],
                notes: [createMockNote({ id: 'note-1' })],
            });

            const result = generateDiff({
                diagram: diagram1,
                newDiagram: diagram2,
                options: {
                    includeAreas: true,
                    includeNotes: true,
                },
            });

            // Should detect all as added
            expect(result.diffMap.has('table-table-1')).toBe(true);
            expect(result.diffMap.has('relationship-rel-1')).toBe(true);
            expect(result.diffMap.has('area-area-1')).toBe(true);
            expect(result.diffMap.has('note-note-1')).toBe(true);
        });
    });
});
