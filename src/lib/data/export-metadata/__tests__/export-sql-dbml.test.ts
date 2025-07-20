import { describe, it, expect, vi } from 'vitest';
import { exportBaseSQL } from '../export-sql-script';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';

// Mock the dbml/core importer
vi.mock('@dbml/core', () => ({
    importer: {
        import: vi.fn((sql: string) => {
            // Return a simplified DBML for testing
            return sql;
        }),
    },
}));

describe('DBML Export - SQL Generation Tests', () => {
    // Helper to generate test IDs
    let idCounter = 0;
    const testId = () => `test-id-${++idCounter}`;

    describe('Composite Primary Keys', () => {
        it('should handle tables with composite primary keys correctly', () => {
            const tableId = testId();
            const field1Id = testId();
            const field2Id = testId();

            const diagram: Diagram = {
                id: testId(),
                name: 'Enchanted Library',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    {
                        id: tableId,
                        name: 'spell_components',
                        fields: [
                            {
                                id: field1Id,
                                name: 'spell_id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: field2Id,
                                name: 'component_id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'quantity',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                                default: '1',
                            },
                        ],
                        indexes: [],
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#FFD700',
                    },
                ],
                relationships: [],
            };

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should contain composite primary key syntax
            expect(sql).toContain('PRIMARY KEY (spell_id, component_id)');
            // Should NOT contain individual PRIMARY KEY constraints
            expect(sql).not.toMatch(/spell_id\s+uuid\s+NOT NULL\s+PRIMARY KEY/);
            expect(sql).not.toMatch(
                /component_id\s+uuid\s+NOT NULL\s+PRIMARY KEY/
            );
        });

        it('should handle single primary keys inline', () => {
            const diagram: Diagram = {
                id: testId(),
                name: 'Wizard Academy',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    {
                        id: testId(),
                        name: 'wizards',
                        fields: [
                            {
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'name',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            },
                        ],
                        indexes: [],
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#9370DB',
                    },
                ],
                relationships: [],
            };

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should contain inline PRIMARY KEY
            expect(sql).toMatch(/id\s+uuid\s+NOT NULL\s+PRIMARY KEY/);
            // Should NOT contain separate PRIMARY KEY constraint
            expect(sql).not.toContain('PRIMARY KEY (id)');
        });
    });

    describe('Default Value Handling', () => {
        it('should skip invalid default values like "has default"', () => {
            const diagram: Diagram = {
                id: testId(),
                name: 'Potion Shop',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    {
                        id: testId(),
                        name: 'potions',
                        fields: [
                            {
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'is_active',
                                type: { id: 'boolean', name: 'boolean' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                default: 'has default',
                            },
                            {
                                id: testId(),
                                name: 'stock_count',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                                default: 'DEFAULT has default',
                            },
                        ],
                        indexes: [],
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#98FB98',
                    },
                ],
                relationships: [],
            };

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should not contain invalid default values
            expect(sql).not.toContain('DEFAULT has default');
            expect(sql).not.toContain('DEFAULT DEFAULT has default');
            // The fields should still be in the table
            expect(sql).toContain('is_active boolean');
            expect(sql).toContain('stock_count int NOT NULL'); // integer gets simplified to int
        });

        it('should handle valid default values correctly', () => {
            const diagram: Diagram = {
                id: testId(),
                name: 'Treasure Vault',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    {
                        id: testId(),
                        name: 'treasures',
                        fields: [
                            {
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'gold_value',
                                type: { id: 'numeric', name: 'numeric' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                                default: '100.50',
                                precision: '10',
                                scale: '2',
                            },
                            {
                                id: testId(),
                                name: 'created_at',
                                type: { id: 'timestamp', name: 'timestamp' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                default: 'now()',
                            },
                            {
                                id: testId(),
                                name: 'currency',
                                type: { id: 'char', name: 'char' },
                                characterMaximumLength: '3',
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                                default: 'EUR',
                            },
                        ],
                        indexes: [],
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#FFD700',
                    },
                ],
                relationships: [],
            };

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
            const diagram: Diagram = {
                id: testId(),
                name: 'Quest Log',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    {
                        id: testId(),
                        name: 'quests',
                        fields: [
                            {
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'created_at',
                                type: { id: 'timestamp', name: 'timestamp' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                default: 'NOW',
                            },
                            {
                                id: testId(),
                                name: 'updated_at',
                                type: { id: 'timestamp', name: 'timestamp' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                default: "('now')",
                            },
                        ],
                        indexes: [],
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#4169E1',
                    },
                ],
                relationships: [],
            };

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should convert NOW to NOW() and ('now') to now()
            expect(sql).toContain('created_at timestamp DEFAULT NOW');
            expect(sql).toContain('updated_at timestamp DEFAULT now()');
        });
    });

    describe('Character Type Handling', () => {
        it('should handle char types with and without length correctly', () => {
            const diagram: Diagram = {
                id: testId(),
                name: 'Dragon Registry',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    {
                        id: testId(),
                        name: 'dragons',
                        fields: [
                            {
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'element_code',
                                type: { id: 'char', name: 'char' },
                                characterMaximumLength: '2',
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'status',
                                type: { id: 'char', name: 'char' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            },
                        ],
                        indexes: [],
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#FF6347',
                    },
                ],
                relationships: [],
            };

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should handle char with explicit length
            expect(sql).toContain('element_code char(2)');
            // Should add default length for char without length
            expect(sql).toContain('status char(1)');
        });

        it('should not have spaces between char and parentheses', () => {
            const diagram: Diagram = {
                id: testId(),
                name: 'Rune Inscriptions',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    {
                        id: testId(),
                        name: 'runes',
                        fields: [
                            {
                                id: testId(),
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'symbol',
                                type: { id: 'char', name: 'char' },
                                characterMaximumLength: '5',
                                primaryKey: false,
                                nullable: false,
                                unique: true,
                            },
                        ],
                        indexes: [],
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#8B4513',
                    },
                ],
                relationships: [],
            };

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
            const diagram: Diagram = {
                id: testId(),
                name: 'Alchemy Log',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    {
                        id: testId(),
                        name: 'experiment_logs',
                        fields: [
                            {
                                id: testId(),
                                name: 'experiment_id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'alchemist_id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'result',
                                type: { id: 'text', name: 'text' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'logged_at',
                                type: { id: 'timestamp', name: 'timestamp' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                                default: 'now()',
                            },
                        ],
                        indexes: [],
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#32CD32',
                    },
                ],
                relationships: [],
            };

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should create a valid table without primary key
            expect(sql).toContain('CREATE TABLE experiment_logs');
            expect(sql).not.toContain('PRIMARY KEY');
        });

        it('should handle multiple tables with relationships', () => {
            const guildTableId = testId();
            const memberTableId = testId();
            const guildIdFieldId = testId();
            const memberGuildIdFieldId = testId();

            const diagram: Diagram = {
                id: testId(),
                name: 'Adventurer Guild System',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    {
                        id: guildTableId,
                        name: 'guilds',
                        fields: [
                            {
                                id: guildIdFieldId,
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'name',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: false,
                                nullable: false,
                                unique: true,
                            },
                            {
                                id: testId(),
                                name: 'founded_year',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                            },
                        ],
                        indexes: [],
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#4169E1',
                    },
                    {
                        id: memberTableId,
                        name: 'guild_members',
                        fields: [
                            {
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: memberGuildIdFieldId,
                                name: 'guild_id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'member_name',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'rank',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                default: "'Novice'",
                            },
                        ],
                        indexes: [],
                        x: 250,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#FFD700',
                    },
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
                    },
                ],
            };

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should create both tables
            expect(sql).toContain('CREATE TABLE guilds');
            expect(sql).toContain('CREATE TABLE guild_members');
            // Should create foreign key
            expect(sql).toContain(
                'ALTER TABLE guild_members ADD CONSTRAINT fk_guild_members_guild FOREIGN KEY (guild_id) REFERENCES guilds (id)'
            );
        });
    });

    describe('Schema Support', () => {
        it('should handle tables with schemas correctly', () => {
            const diagram: Diagram = {
                id: testId(),
                name: 'Multi-Realm Database',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    {
                        id: testId(),
                        name: 'portals',
                        schema: 'transportation',
                        fields: [
                            {
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'destination',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                            },
                        ],
                        indexes: [],
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#9370DB',
                    },
                    {
                        id: testId(),
                        name: 'spells',
                        schema: 'magic',
                        fields: [
                            {
                                id: testId(),
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'name',
                                type: { id: 'varchar', name: 'varchar' },
                                primaryKey: false,
                                nullable: false,
                                unique: true,
                            },
                        ],
                        indexes: [],
                        x: 250,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#FF1493',
                    },
                ],
                relationships: [],
            };

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should create schemas
            expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS transportation');
            expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS magic');
            // Should use schema-qualified table names
            expect(sql).toContain('CREATE TABLE transportation.portals');
            expect(sql).toContain('CREATE TABLE magic.spells');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty tables array', () => {
            const diagram: Diagram = {
                id: testId(),
                name: 'Empty Realm',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [],
                relationships: [],
            };

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            expect(sql).toBe('');
        });

        it('should handle tables with empty fields', () => {
            const diagram: Diagram = {
                id: testId(),
                name: 'Void Space',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    {
                        id: testId(),
                        name: 'empty_table',
                        fields: [],
                        indexes: [],
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#000000',
                    },
                ],
                relationships: [],
            };

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should still create table structure
            expect(sql).toContain('CREATE TABLE empty_table');
            expect(sql).toContain('(\n\n)');
        });

        it('should handle special characters in default values', () => {
            const diagram: Diagram = {
                id: testId(),
                name: 'Mystic Scrolls',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    {
                        id: testId(),
                        name: 'scrolls',
                        fields: [
                            {
                                id: testId(),
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'inscription',
                                type: { id: 'text', name: 'text' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                default: "'Ancient\\'s Wisdom'",
                            },
                        ],
                        indexes: [],
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#8B4513',
                    },
                ],
                relationships: [],
            };

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should preserve escaped quotes
            expect(sql).toContain("DEFAULT 'Ancient\\'s Wisdom'");
        });

        it('should handle numeric precision and scale', () => {
            const diagram: Diagram = {
                id: testId(),
                name: 'Treasury',
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    {
                        id: testId(),
                        name: 'gold_reserves',
                        fields: [
                            {
                                id: testId(),
                                name: 'id',
                                type: { id: 'integer', name: 'integer' },
                                primaryKey: true,
                                nullable: false,
                                unique: false,
                            },
                            {
                                id: testId(),
                                name: 'amount',
                                type: { id: 'numeric', name: 'numeric' },
                                primaryKey: false,
                                nullable: false,
                                unique: false,
                                precision: '15',
                                scale: '2',
                            },
                            {
                                id: testId(),
                                name: 'interest_rate',
                                type: { id: 'numeric', name: 'numeric' },
                                primaryKey: false,
                                nullable: true,
                                unique: false,
                                precision: '5',
                            },
                        ],
                        indexes: [],
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 100,
                        color: '#FFD700',
                    },
                ],
                relationships: [],
            };

            const sql = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.POSTGRESQL,
                isDBMLFlow: true,
            });

            // Should include precision and scale
            expect(sql).toContain('amount numeric(15, 2)');
            // Should include precision only when scale is not provided
            expect(sql).toContain('interest_rate numeric(5)');
        });
    });
});
