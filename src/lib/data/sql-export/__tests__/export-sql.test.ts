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

    describe('exportBaseSQL with foreign key relationships', () => {
        it('should export PostgreSQL diagram with two tables and a foreign key relationship', () => {
            const diagram = createDiagram({
                id: 'ee570f766a15',
                name: 'Diagram 1',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: '10hmfnjq496fk2p0vgl5cooal',
                        name: 'user_profiles',
                        x: 1701,
                        y: -100,
                        schema: 'public',
                        color: '#8eb7ff',
                        isView: false,
                        order: 1,
                        fields: [
                            createField({
                                id: '0moy7ijg3k2azxhsbsjg0n94f',
                                name: 'id',
                                type: { id: 'bigint', name: 'bigint' },
                                unique: true,
                                nullable: false,
                                primaryKey: true,
                            }),
                            createField({
                                id: '3vo5j6c208kox4qt2i6lpx9x8',
                                name: 'user_id',
                                type: { id: 'bigint', name: 'bigint' },
                                unique: false,
                                nullable: true,
                                primaryKey: false,
                            }),
                        ],
                        indexes: [
                            {
                                id: '4sjv9srxk3ny3j4aptozbjzg2',
                                name: '',
                                fieldIds: ['0moy7ijg3k2azxhsbsjg0n94f'],
                                unique: true,
                                isPrimaryKey: true,
                                createdAt: testTime,
                            },
                        ],
                    }),
                    createTable({
                        id: 'tooohdxmn7kw9u1sv77o7x0pb',
                        name: 'users',
                        x: 1229,
                        y: -92,
                        schema: 'public',
                        color: '#8eb7ff',
                        isView: false,
                        order: 0,
                        fields: [
                            createField({
                                id: 'ahppb8odc54hqyenfslw37xv1',
                                name: 'id',
                                type: { id: 'bigint', name: 'bigint' },
                                unique: true,
                                nullable: false,
                                primaryKey: true,
                            }),
                        ],
                        indexes: [
                            {
                                id: 'y7rauhiqqwywx7zz1z59pig0r',
                                name: '',
                                fieldIds: ['ahppb8odc54hqyenfslw37xv1'],
                                unique: true,
                                isPrimaryKey: true,
                                createdAt: testTime,
                            },
                        ],
                    }),
                ],
                relationships: [
                    {
                        id: 's8leta6fjmm86fcwfpjngq65c',
                        name: 'users_id_fk',
                        sourceSchema: 'public',
                        sourceTableId: 'tooohdxmn7kw9u1sv77o7x0pb',
                        targetSchema: 'public',
                        targetTableId: '10hmfnjq496fk2p0vgl5cooal',
                        sourceFieldId: 'ahppb8odc54hqyenfslw37xv1',
                        targetFieldId: '3vo5j6c208kox4qt2i6lpx9x8',
                        sourceCardinality: 'one',
                        targetCardinality: 'one',
                        createdAt: testTime,
                    },
                ],
            });

            const expectedSql = `CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "public"."user_profiles" (
    "id" bigint NOT NULL,
    "user_id" bigint,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."users" (
    "id" bigint NOT NULL,
    PRIMARY KEY ("id")
);

-- Foreign key constraints
-- Schema: public
ALTER TABLE "public"."user_profiles" ADD CONSTRAINT "fk_user_profiles_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");`;

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
            });

            expect(sql.trim()).toBe(expectedSql.trim());
        });

        it('should place FK on target table for 1:1 relationships in DBML flow', () => {
            // This tests the generic code path used by DBML export (isDBMLFlow: true)
            const usersTableId = 'users-table-id';
            const profilesTableId = 'profiles-table-id';
            const usersIdFieldId = 'users-id-field';
            const profilesUserIdFieldId = 'profiles-user-id-field';

            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: usersTableId,
                        name: 'users',
                        schema: 'public',
                        fields: [
                            createField({
                                id: usersIdFieldId,
                                name: 'id',
                                type: { id: 'bigint', name: 'bigint' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        id: profilesTableId,
                        name: 'profiles',
                        schema: 'public',
                        fields: [
                            createField({
                                id: profilesUserIdFieldId,
                                name: 'user_id',
                                type: { id: 'bigint', name: 'bigint' },
                                nullable: true,
                            }),
                        ],
                    }),
                ],
                relationships: [
                    {
                        id: 'rel-1',
                        name: 'profiles_user_fk',
                        sourceSchema: 'public',
                        sourceTableId: usersTableId, // users is source (parent)
                        targetSchema: 'public',
                        targetTableId: profilesTableId, // profiles is target (child with FK)
                        sourceFieldId: usersIdFieldId,
                        targetFieldId: profilesUserIdFieldId,
                        sourceCardinality: 'one',
                        targetCardinality: 'one',
                        createdAt: testTime,
                    },
                ],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true, // Use the generic code path
            });

            // For 1:1 relationships, FK should be on target table (profiles)
            // The ALTER TABLE should be on profiles, referencing users
            expect(sql).toContain(
                'ALTER TABLE "public"."profiles" ADD CONSTRAINT profiles_user_fk FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id")'
            );
        });

        it('should place FK on many side for one-to-many relationships', () => {
            const ordersTableId = 'orders-table-id';
            const customersTableId = 'customers-table-id';
            const ordersCustomerIdFieldId = 'orders-customer-id-field';
            const customersIdFieldId = 'customers-id-field';

            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: customersTableId,
                        name: 'customers',
                        schema: 'public',
                        fields: [
                            createField({
                                id: customersIdFieldId,
                                name: 'id',
                                type: { id: 'bigint', name: 'bigint' },
                                primaryKey: true,
                                nullable: false,
                            }),
                        ],
                    }),
                    createTable({
                        id: ordersTableId,
                        name: 'orders',
                        schema: 'public',
                        fields: [
                            createField({
                                id: ordersCustomerIdFieldId,
                                name: 'customer_id',
                                type: { id: 'bigint', name: 'bigint' },
                                nullable: true,
                            }),
                        ],
                    }),
                ],
                relationships: [
                    {
                        id: 'rel-2',
                        name: 'orders_customer_fk',
                        sourceSchema: 'public',
                        sourceTableId: customersTableId, // customers is one
                        targetSchema: 'public',
                        targetTableId: ordersTableId, // orders is many
                        sourceFieldId: customersIdFieldId,
                        targetFieldId: ordersCustomerIdFieldId,
                        sourceCardinality: 'one',
                        targetCardinality: 'many',
                        createdAt: testTime,
                    },
                ],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // For one:many, FK should be on the many side (orders)
            expect(sql).toContain(
                'ALTER TABLE "public"."orders" ADD CONSTRAINT orders_customer_fk FOREIGN KEY ("customer_id") REFERENCES "public"."customers" ("id")'
            );
        });
    });
});
