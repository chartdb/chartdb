import { describe, it, expect, vi } from 'vitest';
import { fromMySQL } from '../mysql';

describe('MySQL Default Value Import', () => {
    describe('String Default Values', () => {
        it('should parse simple string defaults with single quotes', async () => {
            const sql = `
                CREATE TABLE tavern_patrons (
                    patron_id INT NOT NULL,
                    membership_status VARCHAR(50) DEFAULT 'regular',
                    PRIMARY KEY (patron_id)
                );
            `;
            const result = await fromMySQL(sql);
            expect(result.tables).toHaveLength(1);
            const statusColumn = result.tables[0].columns.find(
                (c) => c.name === 'membership_status'
            );
            expect(statusColumn?.default).toBe("'regular'");
        });

        it('should parse string defaults with escaped quotes', async () => {
            const sql = `
                CREATE TABLE wizard_spellbooks (
                    spellbook_id INT NOT NULL,
                    incantation VARCHAR(255) DEFAULT 'Dragon\\'s flame',
                    spell_metadata TEXT DEFAULT '{"type": "fire"}',
                    PRIMARY KEY (spellbook_id)
                );
            `;
            const result = await fromMySQL(sql);
            expect(result.tables).toHaveLength(1);
            const incantationColumn = result.tables[0].columns.find(
                (c) => c.name === 'incantation'
            );
            expect(incantationColumn?.default).toBeTruthy();
            const metadataColumn = result.tables[0].columns.find(
                (c) => c.name === 'spell_metadata'
            );
            expect(metadataColumn?.default).toBeTruthy();
        });
    });

    describe('Numeric Default Values', () => {
        it('should parse integer defaults', async () => {
            const sql = `
                CREATE TABLE dungeon_levels (
                    level_id INT NOT NULL,
                    monster_count INT DEFAULT 0,
                    max_treasure INT DEFAULT 1000,
                    PRIMARY KEY (level_id)
                );
            `;
            const result = await fromMySQL(sql);
            expect(result.tables).toHaveLength(1);
            const monsterColumn = result.tables[0].columns.find(
                (c) => c.name === 'monster_count'
            );
            expect(monsterColumn?.default).toBe('0');
            const treasureColumn = result.tables[0].columns.find(
                (c) => c.name === 'max_treasure'
            );
            expect(treasureColumn?.default).toBe('1000');
        });

        it('should parse decimal defaults', async () => {
            const sql = `
                CREATE TABLE merchant_inventory (
                    item_id INT NOT NULL,
                    base_price DECIMAL(10, 2) DEFAULT 99.99,
                    loyalty_discount FLOAT DEFAULT 0.15,
                    PRIMARY KEY (item_id)
                );
            `;
            const result = await fromMySQL(sql);
            expect(result.tables).toHaveLength(1);
            const priceColumn = result.tables[0].columns.find(
                (c) => c.name === 'base_price'
            );
            expect(priceColumn?.default).toBe('99.99');
            const discountColumn = result.tables[0].columns.find(
                (c) => c.name === 'loyalty_discount'
            );
            expect(discountColumn?.default).toBe('0.15');
        });
    });

    describe('Boolean Default Values', () => {
        it('should parse boolean defaults in MySQL (using TINYINT)', async () => {
            const sql = `
                CREATE TABLE character_status (
                    character_id INT NOT NULL,
                    is_alive TINYINT(1) DEFAULT 1,
                    is_cursed TINYINT(1) DEFAULT 0,
                    has_magic BOOLEAN DEFAULT TRUE,
                    PRIMARY KEY (character_id)
                );
            `;
            const result = await fromMySQL(sql);
            expect(result.tables).toHaveLength(1);
            const aliveColumn = result.tables[0].columns.find(
                (c) => c.name === 'is_alive'
            );
            expect(aliveColumn?.default).toBe('1');
            const cursedColumn = result.tables[0].columns.find(
                (c) => c.name === 'is_cursed'
            );
            expect(cursedColumn?.default).toBe('0');
        });
    });

    describe('NULL Default Values', () => {
        it('should parse NULL defaults', async () => {
            const sql = `
                CREATE TABLE companion_animals (
                    companion_id INT NOT NULL,
                    special_trait VARCHAR(255) DEFAULT NULL,
                    PRIMARY KEY (companion_id)
                );
            `;
            const result = await fromMySQL(sql);
            expect(result.tables).toHaveLength(1);
            const traitColumn = result.tables[0].columns.find(
                (c) => c.name === 'special_trait'
            );
            expect(traitColumn?.default).toBe('NULL');
        });
    });

    describe('Function Default Values', () => {
        it('should parse function defaults', async () => {
            const sql = `
                CREATE TABLE quest_entries (
                    entry_id INT NOT NULL AUTO_INCREMENT,
                    quest_accepted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    quest_uuid VARCHAR(36) DEFAULT (UUID()),
                    PRIMARY KEY (entry_id)
                );
            `;
            const result = await fromMySQL(sql);
            expect(result.tables).toHaveLength(1);
            const acceptedColumn = result.tables[0].columns.find(
                (c) => c.name === 'quest_accepted'
            );
            expect(acceptedColumn?.default).toBe('CURRENT_TIMESTAMP');
            const updatedColumn = result.tables[0].columns.find(
                (c) => c.name === 'last_updated'
            );
            expect(updatedColumn?.default).toBe('CURRENT_TIMESTAMP');
        });
    });

    describe('AUTO_INCREMENT', () => {
        it('should handle AUTO_INCREMENT columns correctly', async () => {
            const sql = `
                CREATE TABLE hero_registry (
                    hero_id INT NOT NULL AUTO_INCREMENT,
                    hero_name VARCHAR(100),
                    PRIMARY KEY (hero_id)
                );
            `;
            const result = await fromMySQL(sql);
            expect(result.tables).toHaveLength(1);
            const idColumn = result.tables[0].columns.find(
                (c) => c.name === 'hero_id'
            );
            expect(idColumn?.increment).toBe(true);
            // AUTO_INCREMENT columns typically don't have a default value
            expect(idColumn?.default).toBeUndefined();
        });
    });

    describe('Complex Real-World Example', () => {
        it('should handle complex table with multiple default types', async () => {
            const consoleErrorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            const sql = `
                CREATE TABLE adventurer_profiles (
                    adventurer_id BIGINT NOT NULL AUTO_INCREMENT,
                    character_name VARCHAR(50) NOT NULL,
                    guild_email VARCHAR(255) NOT NULL,
                    rank VARCHAR(20) DEFAULT 'novice',
                    is_guild_verified TINYINT(1) DEFAULT 0,
                    gold_coins INT DEFAULT 100,
                    account_balance DECIMAL(10, 2) DEFAULT 0.00,
                    joined_realm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_quest TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    inventory_data JSON DEFAULT NULL,
                    PRIMARY KEY (adventurer_id),
                    UNIQUE KEY uk_guild_email (guild_email),
                    INDEX idx_rank (rank)
                );
            `;

            const result = await fromMySQL(sql);
            const table = result.tables[0];
            expect(table).toBeDefined();

            // Check various default values
            const rankColumn = table.columns.find((c) => c.name === 'rank');
            expect(rankColumn?.default).toBe("'novice'");

            const verifiedColumn = table.columns.find(
                (c) => c.name === 'is_guild_verified'
            );
            expect(verifiedColumn?.default).toBe('0');

            const goldColumn = table.columns.find(
                (c) => c.name === 'gold_coins'
            );
            expect(goldColumn?.default).toBe('100');

            const balanceColumn = table.columns.find(
                (c) => c.name === 'account_balance'
            );
            expect(balanceColumn?.default).toBe('0.00');

            const joinedColumn = table.columns.find(
                (c) => c.name === 'joined_realm'
            );
            expect(joinedColumn?.default).toBe('CURRENT_TIMESTAMP');

            const inventoryColumn = table.columns.find(
                (c) => c.name === 'inventory_data'
            );
            expect(inventoryColumn?.default).toBe('NULL');

            consoleErrorSpy.mockRestore();
        });
    });
});
