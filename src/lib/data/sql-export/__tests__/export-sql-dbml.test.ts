import { describe, it, expect } from 'vitest';
import { exportBaseSQL } from '../export-sql-script';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';

describe('DBML Export - SQL Generation Tests', () => {
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

    describe('Composite Primary Keys', () => {
        it('should handle tables with composite primary keys correctly', () => {
            const tableId = testId();
            const field1Id = testId();
            const field2Id = testId();

            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Enchanted Library',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: tableId,
                        name: 'spell_components',
                        fields: [
                            createField({
                                id: field1Id,
                                name: 'spell_id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: field2Id,
                                name: 'component_id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'quantity',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                                default: '1',
                            }),
                        ],
                        indexes: [],
                        color: '#FFD700',
                    }),
                ],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should contain composite primary key syntax
            expect(sql).toContain('PRIMARY KEY ("spell_id", "component_id")');
            // Should NOT contain individual PRIMARY KEY constraints
            expect(sql).not.toMatch(/spell_id\s+uuid\s+NOT NULL\s+PRIMARY KEY/);
            expect(sql).not.toMatch(
                /component_id\s+uuid\s+NOT NULL\s+PRIMARY KEY/
            );
        });

        it('should not create duplicate index for composite primary key', () => {
            const tableId = testId();
            const field1Id = testId();
            const field2Id = testId();
            const field3Id = testId();

            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Landlord System',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: tableId,
                        name: 'users_master_table',
                        schema: 'landlord',
                        fields: [
                            createField({
                                id: field1Id,
                                name: 'master_user_id',
                                type: { id: 'bigint', name: 'bigint' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: field2Id,
                                name: 'tenant_id',
                                type: { id: 'bigint', name: 'bigint' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: field3Id,
                                name: 'tenant_user_id',
                                type: { id: 'bigint', name: 'bigint' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'enabled',
                                type: { id: 'boolean', name: 'boolean' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                            }),
                        ],
                        indexes: [
                            {
                                id: testId(),
                                name: 'idx_users_master_table_master_user_id_tenant_id_tenant_user_id',
                                unique: false,
                                fieldIds: [field1Id, field2Id, field3Id],
                                createdAt: testTime,
                            },
                            {
                                id: testId(),
                                name: 'index_1',
                                unique: true,
                                fieldIds: [field2Id, field3Id],
                                createdAt: testTime,
                            },
                        ],
                    }),
                ],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should contain composite primary key constraint
            expect(sql).toContain(
                'PRIMARY KEY ("master_user_id", "tenant_id", "tenant_user_id")'
            );

            // Should NOT contain the duplicate index for the primary key fields
            expect(sql).not.toContain(
                'CREATE INDEX idx_users_master_table_master_user_id_tenant_id_tenant_user_id'
            );

            // Should still contain the unique index on subset of fields
            expect(sql).toContain('CREATE UNIQUE INDEX index_1');
        });

        it('should handle single primary keys inline', () => {
            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Wizard Academy',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: testId(),
                        name: 'wizards',
                        fields: [
                            createField({
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'name',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            }),
                        ],
                        indexes: [],
                        color: '#9370DB',
                    }),
                ],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should contain inline PRIMARY KEY
            expect(sql).toMatch(/"id"\s+uuid\s+NOT NULL\s+PRIMARY KEY/);
            // Should NOT contain separate PRIMARY KEY constraint
            expect(sql).not.toContain('PRIMARY KEY (id)');
        });
    });

    describe('Default Value Handling', () => {
        it('should skip invalid default values like "has default"', () => {
            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Potion Shop',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: testId(),
                        name: 'potions',
                        fields: [
                            createField({
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'is_active',
                                type: { id: 'boolean', name: 'boolean' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                default: 'has default',
                            }),
                            createField({
                                id: testId(),
                                name: 'stock_count',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                                default: 'DEFAULT has default',
                            }),
                        ],
                        indexes: [],
                        color: '#98FB98',
                    }),
                ],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should not contain invalid default values
            expect(sql).not.toContain('DEFAULT has default');
            expect(sql).not.toContain('DEFAULT DEFAULT has default');
            // The fields should still be in the table
            expect(sql).toContain('"is_active" boolean');
            expect(sql).toContain('"stock_count" integer NOT NULL'); // integer gets simplified to int
        });

        it('should handle valid default values correctly', () => {
            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Treasure Vault',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: testId(),
                        name: 'treasures',
                        fields: [
                            createField({
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'gold_value',
                                type: { id: 'numeric', name: 'numeric' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                                default: '100.50',
                                precision: 10,
                                scale: 2,
                            }),
                            createField({
                                id: testId(),
                                name: 'created_at',
                                type: { id: 'timestamp', name: 'timestamp' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                default: 'now()',
                            }),
                            createField({
                                id: testId(),
                                name: 'currency',
                                type: { id: 'char', name: 'char' },
                                characterMaximumLength: '3',
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                                default: 'EUR',
                            }),
                        ],
                        indexes: [],
                        color: '#FFD700',
                    }),
                ],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should contain valid defaults
            expect(sql).toContain('DEFAULT 100.50');
            expect(sql).toContain('DEFAULT now()');
            expect(sql).toContain('DEFAULT EUR');
        });

        it('should handle NOW and similar default values', () => {
            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Quest Log',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: testId(),
                        name: 'quests',
                        fields: [
                            createField({
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'created_at',
                                type: { id: 'timestamp', name: 'timestamp' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                default: 'NOW',
                            }),
                            createField({
                                id: testId(),
                                name: 'updated_at',
                                type: { id: 'timestamp', name: 'timestamp' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                default: "('now')",
                            }),
                        ],
                        indexes: [],
                        color: '#4169E1',
                    }),
                ],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should convert NOW to NOW() and ('now') to now()
            expect(sql).toContain('"created_at" timestamp DEFAULT NOW');
            expect(sql).toContain('"updated_at" timestamp DEFAULT now()');
        });
    });

    describe('Character Type Handling', () => {
        it('should handle char types with and without length correctly', () => {
            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Dragon Registry',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: testId(),
                        name: 'dragons',
                        fields: [
                            createField({
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'element_code',
                                type: { id: 'char', name: 'char' },
                                characterMaximumLength: '2',
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'status',
                                type: { id: 'char', name: 'char' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            }),
                        ],
                        indexes: [],
                        color: '#FF6347',
                    }),
                ],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should handle char with explicit length
            expect(sql).toContain('"element_code" char(2)');
            // Should add default length for char without length
            expect(sql).toContain('"status" char(1)');
        });

        it('should not have spaces between char and parentheses', () => {
            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Rune Inscriptions',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: testId(),
                        name: 'runes',
                        fields: [
                            createField({
                                id: testId(),
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'symbol',
                                type: { id: 'char', name: 'char' },
                                characterMaximumLength: '5',
                                primaryKey: false,
                                nullable: false,
                                unique: true,
                            }),
                        ],
                        indexes: [],
                        color: '#8B4513',
                    }),
                ],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should not contain "char (" with space
            expect(sql).not.toContain('char (');
            expect(sql).toContain('char(5)');
        });
    });

    describe('Complex Table Structures', () => {
        it('should handle tables with no primary key', () => {
            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Alchemy Log',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: testId(),
                        name: 'experiment_logs',
                        fields: [
                            createField({
                                id: testId(),
                                name: 'experiment_id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'alchemist_id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'result',
                                type: { id: 'text', name: 'text' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'logged_at',
                                type: { id: 'timestamp', name: 'timestamp' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                                default: 'now()',
                            }),
                        ],
                        indexes: [],
                        color: '#32CD32',
                    }),
                ],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should create a valid table without primary key
            expect(sql).toContain('CREATE TABLE "experiment_logs"');
            expect(sql).not.toContain('PRIMARY KEY');
        });

        it('should handle multiple tables with relationships', () => {
            const guildTableId = testId();
            const memberTableId = testId();
            const guildIdFieldId = testId();
            const memberGuildIdFieldId = testId();

            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Adventurer Guild System',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: guildTableId,
                        name: 'guilds',
                        fields: [
                            createField({
                                id: guildIdFieldId,
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'name',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: false,
                                nullable: false,
                                unique: true,
                            }),
                            createField({
                                id: testId(),
                                name: 'founded_year',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                            }),
                        ],
                        indexes: [],
                        x: 0,
                        y: 0,
                        color: '#4169E1',
                    }),
                    createTable({
                        id: memberTableId,
                        name: 'guild_members',
                        fields: [
                            createField({
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: memberGuildIdFieldId,
                                name: 'guild_id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'member_name',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'rank',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                default: "'Novice'",
                            }),
                        ],
                        indexes: [],
                        x: 250,
                        y: 0,
                        color: '#FFD700',
                    }),
                ],
                relationships: [
                    {
                        id: testId(),
                        name: 'fk_guild_members_guild',
                        sourceTableId: memberTableId,
                        targetTableId: guildTableId,
                        sourceFieldId: memberGuildIdFieldId,
                        targetFieldId: guildIdFieldId,
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

            // Should create both tables
            expect(sql).toContain('CREATE TABLE "guilds"');
            expect(sql).toContain('CREATE TABLE "guild_members"');
            // Should create foreign key
            expect(sql).toContain(
                'ALTER TABLE "guild_members" ADD CONSTRAINT fk_guild_members_guild FOREIGN KEY ("guild_id") REFERENCES "guilds" ("id");'
            );
        });
    });

    describe('Schema Support', () => {
        it('should handle tables with schemas correctly', () => {
            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Multi-Realm Database',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: testId(),
                        name: 'portals',
                        schema: 'transportation',
                        fields: [
                            createField({
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'destination',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            }),
                        ],
                        indexes: [],
                        color: '#9370DB',
                    }),
                    createTable({
                        id: testId(),
                        name: 'spells',
                        schema: 'magic',
                        fields: [
                            createField({
                                id: testId(),
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'name',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: false,
                                nullable: false,
                                unique: true,
                            }),
                        ],
                        indexes: [],
                        x: 250,
                        y: 0,
                        color: '#FF1493',
                    }),
                ],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should use schema-qualified table names
            expect(sql).toContain('CREATE TABLE "transportation"."portals"');
            expect(sql).toContain('CREATE TABLE "magic"."spells"');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty tables array', () => {
            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Empty Realm',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toBe('');
        });

        it('should handle tables with empty fields', () => {
            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Void Space',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: testId(),
                        name: 'empty_table',
                        fields: [],
                        indexes: [],
                        color: '#000000',
                    }),
                ],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should still create table structure
            expect(sql).toContain('CREATE TABLE "empty_table"');
            expect(sql).toContain('(\n\n)');
        });

        it('should handle special characters in default values', () => {
            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Mystic Scrolls',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: testId(),
                        name: 'scrolls',
                        fields: [
                            createField({
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'inscription',
                                type: { id: 'text', name: 'text' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                default: "'Ancient\\'s Wisdom'",
                            }),
                        ],
                        indexes: [],
                        color: '#8B4513',
                    }),
                ],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should preserve escaped quotes
            expect(sql).toContain("DEFAULT 'Ancient\\'s Wisdom'");
        });

        it('should handle numeric precision and scale', () => {
            const diagram: Diagram = createDiagram({
                id: testId(),
                name: 'Treasury',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        id: testId(),
                        name: 'gold_reserves',
                        fields: [
                            createField({
                                id: testId(),
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            }),
                            createField({
                                id: testId(),
                                name: 'amount',
                                type: { id: 'numeric', name: 'numeric' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                                precision: 15,
                                scale: 2,
                            }),
                            createField({
                                id: testId(),
                                name: 'interest_rate',
                                type: { id: 'numeric', name: 'numeric' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                precision: 5,
                            }),
                        ],
                        indexes: [],
                        color: '#FFD700',
                    }),
                ],
                relationships: [],
            });

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should include precision and scale
            expect(sql).toContain('"amount" numeric(15, 2)');
            // Should include precision only when scale is not provided
            expect(sql).toContain('"interest_rate" numeric(5)');
        });
    });
});
