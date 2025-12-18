import { describe, it, expect } from 'vitest';
import { exportBaseSQL } from '../export-sql-script';
import { exportPostgreSQL } from '../export-per-type/postgresql';
import { exportMySQL } from '../export-per-type/mysql';
import { exportMSSQL } from '../export-per-type/mssql';
import { exportSQLite } from '../export-per-type/sqlite';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';

describe('SQL Export Tests', () => {
    let idCounter = 0;
    const testId = () => `test-id-${++idCounter}`;
    const testTime = Date.now();

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

    const createDiagram = (overrides: Partial<Diagram>): Diagram =>
        ({
            id: testId(),
            name: 'diagram',
            databaseType: DatabaseType.GENERIC,
            tables: [],
            relationships: [],
            createdAt: testTime,
            updatedAt: testTime,
            ...overrides,
        }) as Diagram;

    const createTestDiagramWithPKIndex = (
        databaseType: DatabaseType
    ): { diagram: Diagram; fieldId: string } => {
        const fieldId = testId();
        const diagram = createDiagram({
            id: testId(),
            name: 'PK Test',
            databaseType,
            tables: [
                createTable({
                    id: testId(),
                    name: 'table_1',
                    schema: 'public',
                    fields: [
                        createField({
                            id: fieldId,
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                        }),
                    ],
                    indexes: [
                        {
                            id: testId(),
                            name: '', // Empty name indicates auto-generated PK index
                            unique: true,
                            fieldIds: [fieldId],
                            createdAt: testTime,
                            isPrimaryKey: true,
                        },
                    ],
                }),
            ],
            relationships: [],
        });
        return { diagram, fieldId };
    };

    describe('Primary Key Index Export', () => {
        describe('exportBaseSQL', () => {
            it('should export PRIMARY KEY without CONSTRAINT for PostgreSQL', () => {
                const { diagram } = createTestDiagramWithPKIndex(
                    DatabaseType.POSTGRESQL
                );

                const sql = exportBaseSQL({
                    diagram,
                    targetDatabaseType: DatabaseType.POSTGRESQL,
                });

                expect(sql).toContain('PRIMARY KEY ("id")');
                expect(sql).not.toContain('CONSTRAINT');
            });

            it('should export PRIMARY KEY without CONSTRAINT for MySQL', () => {
                const { diagram } = createTestDiagramWithPKIndex(
                    DatabaseType.MYSQL
                );

                const sql = exportBaseSQL({
                    diagram,
                    targetDatabaseType: DatabaseType.MYSQL,
                });

                expect(sql).toContain('PRIMARY KEY');
                expect(sql).not.toContain('CONSTRAINT');
            });

            it('should export PRIMARY KEY without CONSTRAINT for SQL Server', () => {
                const { diagram } = createTestDiagramWithPKIndex(
                    DatabaseType.SQL_SERVER
                );

                const sql = exportBaseSQL({
                    diagram,
                    targetDatabaseType: DatabaseType.SQL_SERVER,
                });

                expect(sql).toContain('PRIMARY KEY');
                expect(sql).not.toContain('CONSTRAINT');
            });

            it('should export PRIMARY KEY without CONSTRAINT for SQLite', () => {
                const { diagram } = createTestDiagramWithPKIndex(
                    DatabaseType.SQLITE
                );

                const sql = exportBaseSQL({
                    diagram,
                    targetDatabaseType: DatabaseType.SQLITE,
                });

                expect(sql).toContain('PRIMARY KEY');
                expect(sql).not.toContain('CONSTRAINT');
            });
        });

        describe('Database-specific exporters', () => {
            it('exportPostgreSQL: should export PRIMARY KEY without CONSTRAINT', () => {
                const { diagram } = createTestDiagramWithPKIndex(
                    DatabaseType.POSTGRESQL
                );

                const sql = exportPostgreSQL({ diagram });

                expect(sql).toContain('PRIMARY KEY ("id")');
                expect(sql).not.toContain('CONSTRAINT');
            });

            it('exportMySQL: should export PRIMARY KEY without CONSTRAINT', () => {
                const { diagram } = createTestDiagramWithPKIndex(
                    DatabaseType.MYSQL
                );

                const sql = exportMySQL({ diagram });

                expect(sql).toContain('PRIMARY KEY (`id`)');
                expect(sql).not.toContain('CONSTRAINT');
            });

            it('exportMSSQL: should export PRIMARY KEY without CONSTRAINT', () => {
                const { diagram } = createTestDiagramWithPKIndex(
                    DatabaseType.SQL_SERVER
                );

                const sql = exportMSSQL({ diagram });

                expect(sql).toContain('PRIMARY KEY ([id])');
                expect(sql).not.toContain('CONSTRAINT');
            });

            it('exportSQLite: should export PRIMARY KEY without CONSTRAINT', () => {
                const { diagram } = createTestDiagramWithPKIndex(
                    DatabaseType.SQLITE
                );

                const sql = exportSQLite({ diagram });

                // SQLite uses inline PRIMARY KEY for single integer columns
                expect(sql).toContain('PRIMARY KEY');
                expect(sql).not.toContain('CONSTRAINT');
            });
        });
    });
});
