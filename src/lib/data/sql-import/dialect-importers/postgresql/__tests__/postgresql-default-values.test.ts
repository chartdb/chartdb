import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL Default Value Import', () => {
    describe('String Default Values', () => {
        it('should parse simple string defaults with single quotes', async () => {
            const sql = `
                CREATE TABLE heroes (
                    hero_id INTEGER NOT NULL,
                    hero_status CHARACTER VARYING DEFAULT 'questing',
                    PRIMARY KEY (hero_id)
                );
            `;
            const result = await fromPostgres(sql);
            expect(result.tables).toHaveLength(1);
            const statusColumn = result.tables[0].columns.find(
                (c) => c.name === 'hero_status'
            );
            expect(statusColumn?.default).toBe("'questing'");
        });

        it('should parse string defaults with special characters that need escaping', async () => {
            const sql = `
                CREATE TABLE spell_scrolls (
                    scroll_id INTEGER NOT NULL,
                    incantation CHARACTER VARYING DEFAULT 'Dragon''s breath',
                    rune_inscription TEXT DEFAULT 'Ancient rune
Sacred symbol',
                    PRIMARY KEY (scroll_id)
                );
            `;
            const result = await fromPostgres(sql);
            expect(result.tables).toHaveLength(1);
            const incantationColumn = result.tables[0].columns.find(
                (c) => c.name === 'incantation'
            );
            expect(incantationColumn?.default).toBe("'Dragon''s breath'");
        });

        it('should parse elvish text default values', async () => {
            const sql = `
                CREATE TABLE elven_greetings (
                    greeting_id INTEGER NOT NULL,
                    elvish_welcome CHARACTER VARYING DEFAULT 'Mae govannen',
                    PRIMARY KEY (greeting_id)
                );
            `;
            const result = await fromPostgres(sql);
            expect(result.tables).toHaveLength(1);
            const greetingColumn = result.tables[0].columns.find(
                (c) => c.name === 'elvish_welcome'
            );
            expect(greetingColumn?.default).toBe("'Mae govannen'");
        });
    });

    describe('Numeric Default Values', () => {
        it('should parse integer defaults', async () => {
            const sql = `
                CREATE TABLE dragon_hoards (
                    hoard_id INTEGER NOT NULL,
                    gold_pieces INTEGER DEFAULT 0,
                    max_treasure_value INTEGER DEFAULT 10000,
                    PRIMARY KEY (hoard_id)
                );
            `;
            const result = await fromPostgres(sql);
            expect(result.tables).toHaveLength(1);
            const goldColumn = result.tables[0].columns.find(
                (c) => c.name === 'gold_pieces'
            );
            expect(goldColumn?.default).toBe('0');
            const treasureColumn = result.tables[0].columns.find(
                (c) => c.name === 'max_treasure_value'
            );
            expect(treasureColumn?.default).toBe('10000');
        });

        it('should parse decimal defaults', async () => {
            const sql = `
                CREATE TABLE enchanted_items (
                    item_id INTEGER NOT NULL,
                    market_price DECIMAL(10, 2) DEFAULT 99.99,
                    magic_power_rating NUMERIC DEFAULT 0.85,
                    PRIMARY KEY (item_id)
                );
            `;
            const result = await fromPostgres(sql);
            expect(result.tables).toHaveLength(1);
            const priceColumn = result.tables[0].columns.find(
                (c) => c.name === 'market_price'
            );
            expect(priceColumn?.default).toBe('99.99');
            const powerColumn = result.tables[0].columns.find(
                (c) => c.name === 'magic_power_rating'
            );
            expect(powerColumn?.default).toBe('0.85');
        });
    });

    describe('Boolean Default Values', () => {
        it('should parse boolean defaults', async () => {
            const sql = `
                CREATE TABLE magical_artifacts (
                    artifact_id INTEGER NOT NULL,
                    is_cursed BOOLEAN DEFAULT TRUE,
                    is_destroyed BOOLEAN DEFAULT FALSE,
                    is_legendary BOOLEAN DEFAULT '1',
                    is_identified BOOLEAN DEFAULT '0',
                    PRIMARY KEY (artifact_id)
                );
            `;
            const result = await fromPostgres(sql);
            expect(result.tables).toHaveLength(1);
            const cursedColumn = result.tables[0].columns.find(
                (c) => c.name === 'is_cursed'
            );
            expect(cursedColumn?.default).toBe('TRUE');
            const destroyedColumn = result.tables[0].columns.find(
                (c) => c.name === 'is_destroyed'
            );
            expect(destroyedColumn?.default).toBe('FALSE');
            const legendaryColumn = result.tables[0].columns.find(
                (c) => c.name === 'is_legendary'
            );
            expect(legendaryColumn?.default).toBe("'1'");
            const identifiedColumn = result.tables[0].columns.find(
                (c) => c.name === 'is_identified'
            );
            expect(identifiedColumn?.default).toBe("'0'");
        });
    });

    describe('NULL Default Values', () => {
        it('should parse NULL defaults', async () => {
            const sql = `
                CREATE TABLE wizard_familiars (
                    familiar_id INTEGER NOT NULL,
                    special_ability CHARACTER VARYING DEFAULT NULL,
                    PRIMARY KEY (familiar_id)
                );
            `;
            const result = await fromPostgres(sql);
            expect(result.tables).toHaveLength(1);
            const abilityColumn = result.tables[0].columns.find(
                (c) => c.name === 'special_ability'
            );
            expect(abilityColumn?.default).toBe('NULL');
        });
    });

    describe('Function Default Values', () => {
        it('should parse function defaults', async () => {
            const sql = `
                CREATE TABLE quest_logs (
                    quest_id UUID DEFAULT gen_random_uuid(),
                    quest_started TIMESTAMP DEFAULT NOW(),
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    difficulty_roll INTEGER DEFAULT random()
                );
            `;
            const result = await fromPostgres(sql);
            expect(result.tables).toHaveLength(1);
            const questIdColumn = result.tables[0].columns.find(
                (c) => c.name === 'quest_id'
            );
            expect(questIdColumn?.default).toBe('GEN_RANDOM_UUID()');
            const startedColumn = result.tables[0].columns.find(
                (c) => c.name === 'quest_started'
            );
            expect(startedColumn?.default).toBe('NOW()');
            const updatedColumn = result.tables[0].columns.find(
                (c) => c.name === 'last_updated'
            );
            expect(updatedColumn?.default).toBe('CURRENT_TIMESTAMP');
            const difficultyColumn = result.tables[0].columns.find(
                (c) => c.name === 'difficulty_roll'
            );
            expect(difficultyColumn?.default).toBe('RANDOM()');
        });
    });

    describe('Complex Real-World Example', () => {
        it('should handle a complex guild management table correctly', async () => {
            const sql = `
                CREATE TABLE "realm"(
                    "realm_id" integer NOT NULL
                );

                CREATE TABLE "guild"(
                    "guild_id" CHARACTER VARYING NOT NULL UNIQUE,
                    PRIMARY KEY ("guild_id")
                );

                CREATE TABLE "guild_schedule"(
                    "schedule_id" CHARACTER VARYING NOT NULL UNIQUE,
                    PRIMARY KEY ("schedule_id")
                );

                CREATE TABLE "guild_quests"(
                    "is_active" CHARACTER VARYING NOT NULL DEFAULT 'active',
                    "quest_description" CHARACTER VARYING,
                    "quest_type" CHARACTER VARYING,
                    "quest_status" CHARACTER VARYING DEFAULT 'pending',
                    "quest_id" CHARACTER VARYING NOT NULL UNIQUE,
                    "reward_gold" CHARACTER VARYING,
                    "quest_giver" CHARACTER VARYING,
                    "party_size" CHARACTER VARYING,
                    "difficulty_level" CHARACTER VARYING,
                    "monster_type" CHARACTER VARYING,
                    "dungeon_location" CHARACTER VARYING,
                    "main_guild_ref" CHARACTER VARYING NOT NULL,
                    "schedule_ref" CHARACTER VARYING,
                    "last_attempt" CHARACTER VARYING,
                    "max_attempts" INTEGER,
                    "failed_attempts" INTEGER,
                    "party_members" INTEGER,
                    "loot_distributor" CHARACTER VARYING,
                    "quest_validator" CHARACTER VARYING,
                    "scout_report" CHARACTER VARYING,
                    "completion_xp" INTEGER,
                    "bonus_xp" INTEGER,
                    "map_coordinates" CHARACTER VARYING,
                    "quest_correlation" CHARACTER VARYING,
                    "is_completed" BOOLEAN NOT NULL DEFAULT '0',
                    "reward_items" CHARACTER VARYING,
                    "quest_priority" INTEGER,
                    "started_at" CHARACTER VARYING,
                    "status" CHARACTER VARYING,
                    "completed_at" CHARACTER VARYING,
                    "party_level" INTEGER,
                    "quest_master" CHARACTER VARYING,
                    PRIMARY KEY ("quest_id"),
                    FOREIGN KEY ("main_guild_ref") REFERENCES "guild"("guild_id"),
                    FOREIGN KEY ("schedule_ref") REFERENCES "guild_schedule"("schedule_id")
                );
            `;

            const result = await fromPostgres(sql);

            // Find the guild_quests table
            const questTable = result.tables.find(
                (t) => t.name === 'guild_quests'
            );
            expect(questTable).toBeDefined();

            // Check specific default values
            const activeColumn = questTable?.columns.find(
                (c) => c.name === 'is_active'
            );
            expect(activeColumn?.default).toBe("'active'");

            const statusColumn = questTable?.columns.find(
                (c) => c.name === 'quest_status'
            );
            expect(statusColumn?.default).toBe("'pending'");

            const completedColumn = questTable?.columns.find(
                (c) => c.name === 'is_completed'
            );
            expect(completedColumn?.default).toBe("'0'");
        });
    });

    describe('ALTER TABLE ADD COLUMN with defaults', () => {
        it('should handle ALTER TABLE ADD COLUMN with default values', async () => {
            const sql = `
                CREATE TABLE adventurers (
                    adventurer_id INTEGER NOT NULL,
                    PRIMARY KEY (adventurer_id)
                );
                
                ALTER TABLE adventurers ADD COLUMN class_type VARCHAR(50) DEFAULT 'warrior';
                ALTER TABLE adventurers ADD COLUMN experience_points INTEGER DEFAULT 0;
                ALTER TABLE adventurers ADD COLUMN is_guild_member BOOLEAN DEFAULT TRUE;
                ALTER TABLE adventurers ADD COLUMN joined_at TIMESTAMP DEFAULT NOW();
            `;

            const result = await fromPostgres(sql);
            expect(result.tables).toHaveLength(1);

            const classColumn = result.tables[0].columns.find(
                (c) => c.name === 'class_type'
            );
            expect(classColumn?.default).toBe("'warrior'");

            const xpColumn = result.tables[0].columns.find(
                (c) => c.name === 'experience_points'
            );
            expect(xpColumn?.default).toBe('0');

            const guildColumn = result.tables[0].columns.find(
                (c) => c.name === 'is_guild_member'
            );
            expect(guildColumn?.default).toBe('TRUE');

            const joinedColumn = result.tables[0].columns.find(
                (c) => c.name === 'joined_at'
            );
            expect(joinedColumn?.default).toBe('NOW()');
        });
    });

    describe('Edge Cases and Special Characters', () => {
        it('should handle defaults with parentheses in strings', async () => {
            const sql = `
                CREATE TABLE spell_formulas (
                    formula_id INTEGER NOT NULL,
                    damage_calculation VARCHAR DEFAULT '(strength + magic) * 2',
                    mana_cost TEXT DEFAULT 'cast(level * 10 - wisdom)',
                    PRIMARY KEY (formula_id)
                );
            `;
            const result = await fromPostgres(sql);
            expect(result.tables).toHaveLength(1);
            const damageColumn = result.tables[0].columns.find(
                (c) => c.name === 'damage_calculation'
            );
            expect(damageColumn?.default).toBe("'(strength + magic) * 2'");
            const manaColumn = result.tables[0].columns.find(
                (c) => c.name === 'mana_cost'
            );
            expect(manaColumn?.default).toBe("'cast(level * 10 - wisdom)'");
        });

        it('should handle defaults with JSON strings', async () => {
            const sql = `
                CREATE TABLE item_enchantments (
                    enchantment_id INTEGER NOT NULL,
                    properties JSON DEFAULT '{"element": "fire"}',
                    modifiers JSONB DEFAULT '[]',
                    PRIMARY KEY (enchantment_id)
                );
            `;
            const result = await fromPostgres(sql);
            expect(result.tables).toHaveLength(1);
            const propertiesColumn = result.tables[0].columns.find(
                (c) => c.name === 'properties'
            );
            expect(propertiesColumn?.default).toBe(`'{"element": "fire"}'`);
            const modifiersColumn = result.tables[0].columns.find(
                (c) => c.name === 'modifiers'
            );
            expect(modifiersColumn?.default).toBe("'[]'");
        });

        it('should handle casting in defaults', async () => {
            const sql = `
                CREATE TABLE ancient_runes (
                    rune_id INTEGER NOT NULL,
                    rune_type VARCHAR DEFAULT 'healing'::text,
                    PRIMARY KEY (rune_id)
                );
            `;
            const result = await fromPostgres(sql);
            expect(result.tables).toHaveLength(1);
            const runeColumn = result.tables[0].columns.find(
                (c) => c.name === 'rune_type'
            );
            expect(runeColumn?.default).toBe("'healing'::text");
        });
    });

    describe('Serial Types', () => {
        it('should not set default for SERIAL types as they auto-increment', async () => {
            const sql = `
                CREATE TABLE monster_spawns (
                    spawn_id SERIAL PRIMARY KEY,
                    minion_id SMALLSERIAL,
                    boss_id BIGSERIAL
                );
            `;
            const result = await fromPostgres(sql);
            expect(result.tables).toHaveLength(1);

            const spawnColumn = result.tables[0].columns.find(
                (c) => c.name === 'spawn_id'
            );
            expect(spawnColumn?.default).toBeUndefined();
            expect(spawnColumn?.increment).toBe(true);

            const minionColumn = result.tables[0].columns.find(
                (c) => c.name === 'minion_id'
            );
            expect(minionColumn?.default).toBeUndefined();
            expect(minionColumn?.increment).toBe(true);

            const bossColumn = result.tables[0].columns.find(
                (c) => c.name === 'boss_id'
            );
            expect(bossColumn?.default).toBeUndefined();
            expect(bossColumn?.increment).toBe(true);
        });
    });
});
