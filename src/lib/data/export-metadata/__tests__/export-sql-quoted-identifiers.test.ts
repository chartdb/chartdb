import { describe, it, expect } from 'vitest';
import { exportBaseSQL } from '../export-sql-script';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';

describe('Quoted Identifiers - Special Characters Handling', () => {
    // Helper to generate test IDs and timestamps
    let idCounter = 0;
    const testId = () => `test-id-${++idCounter}`;
    const testTime = Date.now();

    // Helper to create a field with all required properties
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

    // Helper to create a table with all required properties
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

    // Helper to create a diagram with all required properties
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

    describe('Table Names with Special Characters', () => {
        it('should quote table names with spaces', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
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

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain('CREATE TABLE "user profiles"');
        });

        it('should quote table names with dashes', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        name: 'user-accounts',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                ],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain('CREATE TABLE "user-accounts"');
        });

        it('should quote table names with dots', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        name: 'app.config.settings',
                        fields: [
                            createField({
                                name: 'key',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                ],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain('CREATE TABLE "app.config.settings"');
        });

        it('should not double-quote already quoted table names', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        name: '"already-quoted"',
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

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain('CREATE TABLE "already-quoted"');
            expect(sql).not.toContain('""already-quoted""');
        });

        it('should handle backtick-quoted table names', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.MYSQL,
                tables: [
                    createTable({
                        name: '`mysql-table`',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'int', name: 'int' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                ],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.MYSQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain('CREATE TABLE `mysql-table`');
            expect(sql).not.toContain('"`mysql-table`"');
        });

        it('should handle bracket-quoted table names', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.SQL_SERVER,
                tables: [
                    createTable({
                        name: '[sql-server-table]',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'int', name: 'int' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                ],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.SQL_SERVER,
                isDBMLFlow: true,
            });

            expect(sql).toContain('CREATE TABLE [sql-server-table]');
            expect(sql).not.toContain('"[sql-server-table]"');
        });
    });

    describe('Schema Names with Special Characters', () => {
        it('should quote schema names with spaces', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        schema: 'user data',
                        name: 'profiles',
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

            const sqlDBML = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            const sqlNormal = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: false,
            });

            // For DBML flow
            expect(sqlDBML).toContain('CREATE TABLE "user data"."profiles"');
            expect(sqlDBML).not.toContain('CREATE SCHEMA');

            // For normal flow (PostgreSQL quotes everything)
            expect(sqlNormal).toContain(
                'CREATE SCHEMA IF NOT EXISTS "user data"'
            );
            expect(sqlNormal).toContain('CREATE TABLE "user data"."profiles"');
        });

        it('should quote both schema and table names with special characters', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        schema: 'app-db',
                        name: 'user-settings',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                ],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain('CREATE TABLE "app-db"."user-settings"');
        });

        it('should not double-quote already quoted schema names', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        schema: '"quoted-schema"',
                        name: 'table',
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

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain('CREATE TABLE "quoted-schema"."table"');
            expect(sql).not.toContain('""quoted-schema""');
        });

        it('should handle mixed quoted and unquoted identifiers', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        schema: '"my-schema"',
                        name: 'regular_table',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        schema: 'public',
                        name: '"special-table"',
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

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain('CREATE TABLE "my-schema"."regular_table"');
            expect(sql).toContain('CREATE TABLE "public"."special-table"');
        });
    });

    describe('Foreign Key References with Special Characters', () => {
        it('should quote table names in foreign key constraints', () => {
            const parentTableId = testId();
            const childTableId = testId();
            const parentIdFieldId = testId();
            const childParentIdFieldId = testId();

            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: parentTableId,
                        name: 'user-accounts',
                        fields: [
                            createField({
                                id: parentIdFieldId,
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        id: childTableId,
                        name: 'user-profiles',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                            }),
                            createField({
                                id: childParentIdFieldId,
                                name: 'account_id',
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
                        sourceFieldId: childParentIdFieldId,
                        targetFieldId: parentIdFieldId,
                        sourceCardinality: 'many',
                        targetCardinality: 'one',
                        createdAt: testTime,
                    },
                ],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain(
                'ALTER TABLE "user-profiles" ADD CONSTRAINT fk_profiles_accounts FOREIGN KEY ("account_id") REFERENCES "user-accounts" ("id")'
            );
        });

        it('should handle foreign keys between schema-qualified tables with special characters', () => {
            const parentTableId = testId();
            const childTableId = testId();
            const parentIdFieldId = testId();
            const childParentIdFieldId = testId();

            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: parentTableId,
                        schema: 'auth-db',
                        name: 'user accounts',
                        fields: [
                            createField({
                                id: parentIdFieldId,
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        id: childTableId,
                        schema: 'app-data',
                        name: 'user profiles',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                            }),
                            createField({
                                id: childParentIdFieldId,
                                name: 'account_id',
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
                        sourceFieldId: childParentIdFieldId,
                        targetFieldId: parentIdFieldId,
                        sourceCardinality: 'many',
                        targetCardinality: 'one',
                        createdAt: testTime,
                    },
                ],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain(
                'ALTER TABLE "app-data"."user profiles" ADD CONSTRAINT fk_profiles_accounts FOREIGN KEY ("account_id") REFERENCES "auth-db"."user accounts" ("id")'
            );
        });
    });

    describe('Schema Quoting in Non-DBML Flow', () => {
        it('should properly quote schemas with special characters in non-DBML flow', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.GENERIC,
                tables: [
                    createTable({
                        schema: 'my-schema',
                        name: 'users',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        schema: 'my schema',
                        name: 'orders',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        schema: 'schema.with.dots',
                        name: 'products',
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

            // Test with Generic database type to use base exportSQL
            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.GENERIC,
                isDBMLFlow: false,
            });

            // Schemas should be quoted when they have special characters
            expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS "my-schema"');
            expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS "my schema"');
            expect(sql).toContain(
                'CREATE SCHEMA IF NOT EXISTS "schema.with.dots"'
            );

            // Tables should use quoted schema names (GENERIC uses PostgreSQL exporter which quotes everything)
            expect(sql).toContain('CREATE TABLE "my-schema"."users"');
            expect(sql).toContain('CREATE TABLE "my schema"."orders"');
            expect(sql).toContain('CREATE TABLE "schema.with.dots"."products"');
        });

        it('should not quote simple schema names in non-DBML flow', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.GENERIC,
                tables: [
                    createTable({
                        schema: 'public',
                        name: 'users',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        schema: 'myschema',
                        name: 'orders',
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

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.GENERIC,
                isDBMLFlow: false,
            });

            // GENERIC uses PostgreSQL exporter which quotes everything
            expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS "public"');
            expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS "myschema"');
            expect(sql).toContain('CREATE TABLE "public"."users"');
            expect(sql).toContain('CREATE TABLE "myschema"."orders"');
        });

        it('should handle schemas in foreign key relationships', () => {
            const parentTableId = testId();
            const childTableId = testId();
            const parentIdFieldId = testId();
            const childParentIdFieldId = testId();

            const diagram = createDiagram({
                databaseType: DatabaseType.GENERIC,
                tables: [
                    createTable({
                        id: parentTableId,
                        schema: 'auth-schema',
                        name: 'users',
                        fields: [
                            createField({
                                id: parentIdFieldId,
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        id: childTableId,
                        schema: 'app schema',
                        name: 'profiles',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                            }),
                            createField({
                                id: childParentIdFieldId,
                                name: 'user_id',
                                type: { id: 'uuid', name: 'uuid' },
                                nullable: false,
                            }),
                        ],
                    }),
                ],
                relationships: [
                    {
                        id: testId(),
                        name: 'fk_profiles_users',
                        sourceTableId: childTableId,
                        targetTableId: parentTableId,
                        sourceFieldId: childParentIdFieldId,
                        targetFieldId: parentIdFieldId,
                        sourceCardinality: 'many',
                        targetCardinality: 'one',
                        createdAt: testTime,
                    },
                ],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.GENERIC,
                isDBMLFlow: false,
            });

            // Check foreign key with schema-qualified tables (GENERIC uses PostgreSQL which quotes everything)
            expect(sql).toContain('ALTER TABLE "app schema"."profiles"');
            expect(sql).toContain('REFERENCES "auth-schema"."users"');
        });
    });

    describe('Edge Cases and Complex Scenarios', () => {
        it('should handle table names that are SQL reserved words', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        name: 'user',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        name: 'order',
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

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // For DBML flow, all names should be quoted
            expect(sql).toContain('CREATE TABLE "user"');
            expect(sql).toContain('CREATE TABLE "order"');
        });

        it('should handle Unicode characters in table names', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        name: 'użytkownik',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        name: '用户表',
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

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain('CREATE TABLE "użytkownik"');
            expect(sql).toContain('CREATE TABLE "用户表"');
        });

        it('should handle table names with parentheses', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        name: 'users(archived)',
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

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain('CREATE TABLE "users(archived)"');
        });

        it('should handle table names with forward slashes', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        name: 'api/v1/users',
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

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain('CREATE TABLE "api/v1/users"');
        });

        it('should handle empty table names gracefully', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
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

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Empty name should be quoted
            expect(sql).toContain('CREATE TABLE ""');
        });

        it('should preserve different quote styles when already quoted', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        name: '"double-quoted"',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        name: '`backtick-quoted`',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        name: '[bracket-quoted]',
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

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toContain('CREATE TABLE "double-quoted"');
            expect(sql).toContain('CREATE TABLE `backtick-quoted`');
            expect(sql).toContain('CREATE TABLE [bracket-quoted]');
        });
    });

    describe('DBML vs Non-DBML Flow Behavior', () => {
        it('should quote all table names when in DBML flow, but not in normal flow for simple names', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        name: 'users',
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

            const sqlNormal = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: false,
            });

            const sqlDBML = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // In non-DBML flow with PostgreSQL, the PostgreSQL exporter quotes everything
            expect(sqlNormal).toContain('CREATE TABLE "users"');

            // In DBML flow, all names are quoted
            expect(sqlDBML).toContain('CREATE TABLE "users"');
        });

        it('should quote table names with special characters even when not in DBML flow', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        name: 'user-accounts',
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

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: false,
            });

            expect(sql).toContain('CREATE TABLE "user-accounts"');
        });

        it('should create schema statements when not in DBML flow', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        schema: 'auth',
                        name: 'users',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        schema: 'app-data',
                        name: 'settings',
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

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: false,
            });

            expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS "auth"');
            expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS "app-data"');
            // PostgreSQL exporter quotes everything
            expect(sql).toContain('CREATE TABLE "auth"."users"');
            expect(sql).toContain('CREATE TABLE "app-data"."settings"');
        });
    });
});
