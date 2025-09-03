import { describe, it, expect } from 'vitest';
import { fromSQLServer } from '../sqlserver';

describe('SQL Server Default Value Import', () => {
    describe('String Default Values', () => {
        it('should parse simple string defaults with single quotes', async () => {
            const sql = `
                CREATE TABLE kingdom_citizens (
                    citizen_id INT NOT NULL,
                    allegiance NVARCHAR(50) DEFAULT 'neutral',
                    PRIMARY KEY (citizen_id)
                );
            `;
            const result = await fromSQLServer(sql);
            expect(result.tables).toHaveLength(1);
            const allegianceColumn = result.tables[0].columns.find(
                (c) => c.name === 'allegiance'
            );
            expect(allegianceColumn?.default).toBe("'neutral'");
        });

        it('should parse string defaults with Unicode prefix', async () => {
            const sql = `
                CREATE TABLE ancient_scrolls (
                    scroll_id INT NOT NULL,
                    runic_inscription NVARCHAR(255) DEFAULT N'Ancient wisdom',
                    prophecy NVARCHAR(MAX) DEFAULT N'The chosen one shall rise',
                    PRIMARY KEY (scroll_id)
                );
            `;
            const result = await fromSQLServer(sql);
            expect(result.tables).toHaveLength(1);
            const runicColumn = result.tables[0].columns.find(
                (c) => c.name === 'runic_inscription'
            );
            expect(runicColumn?.default).toBe("N'Ancient wisdom'");
            const prophecyColumn = result.tables[0].columns.find(
                (c) => c.name === 'prophecy'
            );
            expect(prophecyColumn?.default).toBe(
                "N'The chosen one shall rise'"
            );
        });
    });

    describe('Numeric Default Values', () => {
        it('should parse integer defaults', async () => {
            const sql = `
                CREATE TABLE castle_treasury (
                    treasury_id INT NOT NULL,
                    gold_count INT DEFAULT 0,
                    max_capacity BIGINT DEFAULT 100000,
                    guard_posts SMALLINT DEFAULT 5,
                    PRIMARY KEY (treasury_id)
                );
            `;
            const result = await fromSQLServer(sql);
            expect(result.tables).toHaveLength(1);
            const goldColumn = result.tables[0].columns.find(
                (c) => c.name === 'gold_count'
            );
            expect(goldColumn?.default).toBe('0');
            const capacityColumn = result.tables[0].columns.find(
                (c) => c.name === 'max_capacity'
            );
            expect(capacityColumn?.default).toBe('100000');
            const guardColumn = result.tables[0].columns.find(
                (c) => c.name === 'guard_posts'
            );
            expect(guardColumn?.default).toBe('5');
        });

        it('should parse decimal defaults', async () => {
            const sql = `
                CREATE TABLE blacksmith_shop (
                    item_id INT NOT NULL,
                    weapon_price DECIMAL(10, 2) DEFAULT 99.99,
                    guild_discount FLOAT DEFAULT 0.15,
                    enchantment_tax NUMERIC(5, 4) DEFAULT 0.0825,
                    PRIMARY KEY (item_id)
                );
            `;
            const result = await fromSQLServer(sql);
            expect(result.tables).toHaveLength(1);
            const priceColumn = result.tables[0].columns.find(
                (c) => c.name === 'weapon_price'
            );
            expect(priceColumn?.default).toBe('99.99');
            const discountColumn = result.tables[0].columns.find(
                (c) => c.name === 'guild_discount'
            );
            expect(discountColumn?.default).toBe('0.15');
            const taxColumn = result.tables[0].columns.find(
                (c) => c.name === 'enchantment_tax'
            );
            expect(taxColumn?.default).toBe('0.0825');
        });
    });

    describe('Boolean Default Values', () => {
        it('should parse BIT defaults', async () => {
            const sql = `
                CREATE TABLE magic_barriers (
                    barrier_id INT NOT NULL,
                    is_active BIT DEFAULT 1,
                    is_breached BIT DEFAULT 0,
                    PRIMARY KEY (barrier_id)
                );
            `;
            const result = await fromSQLServer(sql);
            expect(result.tables).toHaveLength(1);
            const activeColumn = result.tables[0].columns.find(
                (c) => c.name === 'is_active'
            );
            expect(activeColumn?.default).toBe('1');
            const breachedColumn = result.tables[0].columns.find(
                (c) => c.name === 'is_breached'
            );
            expect(breachedColumn?.default).toBe('0');
        });
    });

    describe('Date and Time Default Values', () => {
        it('should parse date/time function defaults', async () => {
            const sql = `
                CREATE TABLE battle_logs (
                    battle_id INT NOT NULL,
                    battle_started DATETIME DEFAULT GETDATE(),
                    last_action DATETIME2 DEFAULT SYSDATETIME(),
                    battle_date DATE DEFAULT GETDATE(),
                    PRIMARY KEY (battle_id)
                );
            `;
            const result = await fromSQLServer(sql);
            expect(result.tables).toHaveLength(1);
            const startedColumn = result.tables[0].columns.find(
                (c) => c.name === 'battle_started'
            );
            expect(startedColumn?.default).toBe('GETDATE()');
            const actionColumn = result.tables[0].columns.find(
                (c) => c.name === 'last_action'
            );
            expect(actionColumn?.default).toBe('SYSDATETIME()');
            const dateColumn = result.tables[0].columns.find(
                (c) => c.name === 'battle_date'
            );
            expect(dateColumn?.default).toBe('GETDATE()');
        });
    });

    describe('IDENTITY columns', () => {
        it('should handle IDENTITY columns correctly', async () => {
            const sql = `
                CREATE TABLE legendary_weapons (
                    weapon_id INT IDENTITY(1,1) NOT NULL,
                    legacy_id BIGINT IDENTITY(100,10) NOT NULL,
                    weapon_name NVARCHAR(100),
                    PRIMARY KEY (weapon_id)
                );
            `;
            const result = await fromSQLServer(sql);
            expect(result.tables).toHaveLength(1);
            const weaponColumn = result.tables[0].columns.find(
                (c) => c.name === 'weapon_id'
            );
            expect(weaponColumn?.increment).toBe(true);
            const legacyColumn = result.tables[0].columns.find(
                (c) => c.name === 'legacy_id'
            );
            expect(legacyColumn?.increment).toBe(true);
        });
    });

    describe('Complex Real-World Example with Schema', () => {
        it('should handle complex table with schema and multiple default types', async () => {
            const sql = `
                CREATE TABLE [dbo].[QuestContracts] (
                    [ContractID] INT IDENTITY(1,1) NOT NULL,
                    [AdventurerID] INT NOT NULL,
                    [QuestDate] DATETIME DEFAULT GETDATE(),
                    [QuestStatus] NVARCHAR(20) DEFAULT N'Available',
                    [RewardAmount] DECIMAL(10, 2) DEFAULT 0.00,
                    [IsCompleted] BIT DEFAULT 0,
                    [CompletedDate] DATETIME NULL,
                    [QuestNotes] NVARCHAR(MAX) DEFAULT NULL,
                    [DifficultyLevel] INT DEFAULT 5,
                    [QuestGuid] UNIQUEIDENTIFIER DEFAULT NEWID(),
                    PRIMARY KEY ([ContractID])
                );
            `;

            const result = await fromSQLServer(sql);
            const table = result.tables[0];
            expect(table).toBeDefined();
            expect(table.schema).toBe('dbo');

            // Check various default values
            const questDateColumn = table.columns.find(
                (c) => c.name === 'QuestDate'
            );
            expect(questDateColumn?.default).toBe('GETDATE()');

            const statusColumn = table.columns.find(
                (c) => c.name === 'QuestStatus'
            );
            expect(statusColumn?.default).toBe("N'Available'");

            const rewardColumn = table.columns.find(
                (c) => c.name === 'RewardAmount'
            );
            expect(rewardColumn?.default).toBe('0.00');

            const completedColumn = table.columns.find(
                (c) => c.name === 'IsCompleted'
            );
            expect(completedColumn?.default).toBe('0');

            const difficultyColumn = table.columns.find(
                (c) => c.name === 'DifficultyLevel'
            );
            expect(difficultyColumn?.default).toBe('5');

            const guidColumn = table.columns.find(
                (c) => c.name === 'QuestGuid'
            );
            expect(guidColumn?.default).toBe('NEWID()');
        });
    });

    describe('Expressions in defaults', () => {
        it('should handle parentheses in default expressions', async () => {
            const sql = `
                CREATE TABLE spell_calculations (
                    calculation_id INT NOT NULL,
                    base_damage INT DEFAULT (10 + 5),
                    total_power DECIMAL(10,2) DEFAULT ((100.0 * 0.15) + 10),
                    PRIMARY KEY (calculation_id)
                );
            `;
            const result = await fromSQLServer(sql);
            expect(result.tables).toHaveLength(1);
            const damageColumn = result.tables[0].columns.find(
                (c) => c.name === 'base_damage'
            );
            expect(damageColumn?.default).toBe('(10 + 5)');
            const powerColumn = result.tables[0].columns.find(
                (c) => c.name === 'total_power'
            );
            expect(powerColumn?.default).toBe('((100.0 * 0.15) + 10)');
        });
    });
});
