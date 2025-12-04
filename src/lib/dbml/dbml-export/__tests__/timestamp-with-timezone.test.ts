import { describe, it, expect } from 'vitest';
import { generateDBMLFromDiagram } from '../dbml-export';
import { importDBMLToDiagram } from '../../dbml-import/dbml-import';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import { generateId, generateDiagramId } from '@/lib/utils';

describe('DBML Export - Timestamp with Time Zone', () => {
    it('should preserve "timestamp with time zone" type through export and reimport', async () => {
        // Create a diagram with timestamp with time zone field
        const diagram: Diagram = {
            id: generateDiagramId(),
            name: 'Test Diagram',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: generateId(),
                    name: 'events',
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
                        {
                            id: generateId(),
                            name: 'created_at',
                            type: {
                                id: 'timestamp_with_time_zone',
                                name: 'timestamp with time zone',
                            },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            createdAt: Date.now(),
                        },
                        {
                            id: generateId(),
                            name: 'updated_at',
                            type: {
                                id: 'timestamp_without_time_zone',
                                name: 'timestamp without time zone',
                            },
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

        // Export to DBML
        const exportResult = generateDBMLFromDiagram(diagram);

        // Verify the DBML contains quoted multi-word types
        expect(exportResult.inlineDbml).toContain('"timestamp with time zone"');
        expect(exportResult.inlineDbml).toContain(
            '"timestamp without time zone"'
        );

        // Reimport the DBML
        const reimportedDiagram = await importDBMLToDiagram(
            exportResult.inlineDbml,
            {
                databaseType: DatabaseType.POSTGRESQL,
            }
        );

        // Verify the types are preserved
        const table = reimportedDiagram.tables?.find(
            (t) => t.name === 'events'
        );
        expect(table).toBeDefined();

        const createdAtField = table?.fields.find(
            (f) => f.name === 'created_at'
        );
        const updatedAtField = table?.fields.find(
            (f) => f.name === 'updated_at'
        );

        expect(createdAtField?.type.name).toBe('timestamptz');
        expect(updatedAtField?.type.name).toBe('timestamp');
    });

    it('should handle time with time zone types', async () => {
        const diagram: Diagram = {
            id: generateDiagramId(),
            name: 'Test Diagram',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: generateId(),
                    name: 'schedules',
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
                        {
                            id: generateId(),
                            name: 'start_time',
                            type: {
                                id: 'time_with_time_zone',
                                name: 'time with time zone',
                            },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            createdAt: Date.now(),
                        },
                        {
                            id: generateId(),
                            name: 'end_time',
                            type: {
                                id: 'time_without_time_zone',
                                name: 'time without time zone',
                            },
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

        const exportResult = generateDBMLFromDiagram(diagram);

        expect(exportResult.inlineDbml).toContain('"time with time zone"');
        expect(exportResult.inlineDbml).toContain('"time without time zone"');

        const reimportedDiagram = await importDBMLToDiagram(
            exportResult.inlineDbml,
            {
                databaseType: DatabaseType.POSTGRESQL,
            }
        );

        const table = reimportedDiagram.tables?.find(
            (t) => t.name === 'schedules'
        );
        const startTimeField = table?.fields.find(
            (f) => f.name === 'start_time'
        );
        const endTimeField = table?.fields.find((f) => f.name === 'end_time');

        expect(startTimeField?.type.name).toBe('timetz');
        expect(endTimeField?.type.name).toBe('time');
    });

    it('should handle double precision type', async () => {
        const diagram: Diagram = {
            id: generateDiagramId(),
            name: 'Test Diagram',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: generateId(),
                    name: 'measurements',
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
                        {
                            id: generateId(),
                            name: 'value',
                            type: {
                                id: 'double_precision',
                                name: 'double precision',
                            },
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

        const exportResult = generateDBMLFromDiagram(diagram);

        expect(exportResult.inlineDbml).toContain('"double precision"');

        const reimportedDiagram = await importDBMLToDiagram(
            exportResult.inlineDbml,
            {
                databaseType: DatabaseType.POSTGRESQL,
            }
        );

        const table = reimportedDiagram.tables?.find(
            (t) => t.name === 'measurements'
        );
        const valueField = table?.fields.find((f) => f.name === 'value');

        expect(valueField?.type.name).toBe('double precision');
    });
});
