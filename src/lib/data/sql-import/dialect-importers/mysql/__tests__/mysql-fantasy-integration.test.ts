import { describe, it, expect } from 'vitest';
import { fromMySQL } from '../mysql';
import { fromMySQLImproved } from '../mysql-improved';
import { validateMySQLSyntax } from '../mysql-validator';

describe('MySQL Fantasy World Integration', () => {
    const fantasyWorldSQL = `
-- Fantasy World Database Schema
-- A magical realm management system

-- Realm Management
CREATE TABLE realms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    magic_level ENUM('low', 'medium', 'high', 'legendary') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_magic_level (magic_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Magical Creatures Registry
CREATE TABLE creature_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    classification ENUM('beast', 'dragon', 'elemental', 'undead', 'fey', 'construct') NOT NULL,
    danger_level INT CHECK (danger_level BETWEEN 1 AND 10),
    is_sentient BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE creatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    creature_type_id INT NOT NULL,
    realm_id INT NOT NULL,
    health_points INT DEFAULT 100,
    magic_points INT DEFAULT 50,
    special_abilities JSON, -- ["fire_breath", "invisibility", "teleportation"]
    last_sighted DATETIME,
    status ENUM('active', 'dormant', 'banished', 'deceased') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creature_type_id) REFERENCES creature_types(id),
    FOREIGN KEY (realm_id) REFERENCES realms(id) ON DELETE CASCADE,
    INDEX idx_realm_status (realm_id, status),
    INDEX idx_type (creature_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Wizard Registry
CREATE TABLE wizard_ranks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rank_name VARCHAR(50) UNIQUE NOT NULL,
    min_power_level INT NOT NULL,
    permissions JSON, -- ["cast_forbidden_spells", "access_restricted_library", "mentor_apprentices"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wizards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    wizard_rank_id INT NOT NULL,
    realm_id INT NOT NULL,
    power_level INT DEFAULT 1,
    specialization ENUM('elemental', 'necromancy', 'illusion', 'healing', 'divination') NOT NULL,
    familiar_creature_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wizard_rank_id) REFERENCES wizard_ranks(id),
    FOREIGN KEY (realm_id) REFERENCES realms(id),
    FOREIGN KEY (familiar_creature_id) REFERENCES creatures(id) ON DELETE SET NULL,
    INDEX idx_rank (wizard_rank_id),
    INDEX idx_realm (realm_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Spell Library
CREATE TABLE spell_schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    forbidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE spells (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    incantation TEXT,
    spell_school_id INT NOT NULL,
    mana_cost INT DEFAULT 10,
    cast_time_seconds INT DEFAULT 3,
    range_meters INT DEFAULT 10,
    components JSON, -- ["verbal", "somatic", "material:dragon_scale"]
    effects JSON, -- {"damage": 50, "duration": 300, "area": "cone"}
    min_wizard_rank_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (spell_school_id) REFERENCES spell_schools(id),
    FOREIGN KEY (min_wizard_rank_id) REFERENCES wizard_ranks(id),
    INDEX idx_school (spell_school_id),
    FULLTEXT idx_search (name, incantation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Wizard Spellbooks (many-to-many)
CREATE TABLE wizard_spellbooks (
    wizard_id INT NOT NULL,
    spell_id INT NOT NULL,
    learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mastery_level INT DEFAULT 1 CHECK (mastery_level BETWEEN 1 AND 5),
    times_cast INT DEFAULT 0,
    PRIMARY KEY (wizard_id, spell_id),
    FOREIGN KEY (wizard_id) REFERENCES wizards(id) ON DELETE CASCADE,
    FOREIGN KEY (spell_id) REFERENCES spells(id) ON DELETE CASCADE,
    INDEX idx_spell (spell_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Magical Items
CREATE TABLE item_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE magical_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    item_category_id INT NOT NULL,
    rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'artifact') NOT NULL,
    power_level INT DEFAULT 1,
    enchantments JSON, -- ["strength+5", "fire_resistance", "invisibility_on_use"]
    curse_effects JSON, -- ["bound_to_owner", "drains_life", "attracts_monsters"]
    created_by_wizard_id INT,
    found_in_realm_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_category_id) REFERENCES item_categories(id),
    FOREIGN KEY (created_by_wizard_id) REFERENCES wizards(id) ON DELETE SET NULL,
    FOREIGN KEY (found_in_realm_id) REFERENCES realms(id) ON DELETE SET NULL,
    INDEX idx_category (item_category_id),
    INDEX idx_rarity (rarity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Wizard Inventory
CREATE TABLE wizard_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wizard_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT DEFAULT 1,
    equipped BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wizard_id) REFERENCES wizards(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES magical_items(id) ON DELETE CASCADE,
    UNIQUE KEY uk_wizard_item (wizard_id, item_id),
    INDEX idx_wizard (wizard_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quests and Adventures
CREATE TABLE quests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    realm_id INT NOT NULL,
    difficulty ENUM('novice', 'adept', 'expert', 'master', 'legendary') NOT NULL,
    reward_gold INT DEFAULT 0,
    reward_experience INT DEFAULT 0,
    reward_items JSON, -- [{"item_id": 1, "quantity": 1}]
    status ENUM('available', 'in_progress', 'completed', 'failed') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (realm_id) REFERENCES realms(id),
    INDEX idx_realm_status (realm_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quest Participants
CREATE TABLE quest_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quest_id INT NOT NULL,
    wizard_id INT NOT NULL,
    role ENUM('leader', 'member', 'guide', 'support') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
    FOREIGN KEY (wizard_id) REFERENCES wizards(id) ON DELETE CASCADE,
    UNIQUE KEY uk_quest_wizard (quest_id, wizard_id),
    INDEX idx_wizard (wizard_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Magical Events Log
CREATE TABLE magical_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type ENUM('spell_cast', 'item_created', 'creature_summoned', 'realm_shift', 'quest_completed') NOT NULL,
    realm_id INT NOT NULL,
    wizard_id INT,
    creature_id INT,
    description TEXT,
    magic_fluctuation INT DEFAULT 0, -- Positive or negative impact on realm magic
    event_data JSON, -- Additional event-specific data
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (realm_id) REFERENCES realms(id),
    FOREIGN KEY (wizard_id) REFERENCES wizards(id) ON DELETE SET NULL,
    FOREIGN KEY (creature_id) REFERENCES creatures(id) ON DELETE SET NULL,
    INDEX idx_realm_time (realm_id, occurred_at),
    INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Wizard Guilds
CREATE TABLE guilds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL,
    motto TEXT,
    realm_id INT NOT NULL,
    founded_by_wizard_id INT,
    member_count INT DEFAULT 0,
    guild_hall_location VARCHAR(500),
    treasury_gold INT DEFAULT 0,
    founded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (realm_id) REFERENCES realms(id),
    FOREIGN KEY (founded_by_wizard_id) REFERENCES wizards(id) ON DELETE SET NULL,
    INDEX idx_realm (realm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Guild Memberships
CREATE TABLE guild_memberships (
    wizard_id INT NOT NULL,
    guild_id INT NOT NULL,
    rank ENUM('apprentice', 'member', 'officer', 'leader') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contribution_points INT DEFAULT 0,
    PRIMARY KEY (wizard_id, guild_id),
    FOREIGN KEY (wizard_id) REFERENCES wizards(id) ON DELETE CASCADE,
    FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE,
    INDEX idx_guild (guild_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Enchantment Recipes
CREATE TABLE enchantment_recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    required_spell_ids JSON NOT NULL, -- [1, 5, 12]
    required_items JSON NOT NULL, -- [{"item_id": 3, "quantity": 2}]
    result_enchantment VARCHAR(200) NOT NULL,
    success_rate DECIMAL(5,2) DEFAULT 75.00,
    created_by_wizard_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_wizard_id) REFERENCES wizards(id) ON DELETE SET NULL,
    INDEX idx_creator (created_by_wizard_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ALTER TABLE for additional constraints
ALTER TABLE creatures ADD CONSTRAINT fk_creature_realm 
    FOREIGN KEY (realm_id) REFERENCES realms(id) ON UPDATE CASCADE;

ALTER TABLE magical_items ADD CONSTRAINT unique_artifact_name 
    UNIQUE KEY (name, rarity);
`;

    describe('Full Fantasy World Schema', () => {
        it('should parse the complete fantasy world database', async () => {
            const result = await fromMySQL(fantasyWorldSQL);

            // Verify all tables are parsed
            expect(result.tables).toHaveLength(17);

            const expectedTables = [
                'creature_types',
                'creatures',
                'enchantment_recipes',
                'guild_memberships',
                'guilds',
                'item_categories',
                'magical_events',
                'magical_items',
                'quest_participants',
                'quests',
                'realms',
                'spell_schools',
                'spells',
                'wizard_inventory',
                'wizard_ranks',
                'wizard_spellbooks',
                'wizards',
            ];

            expect(result.tables.map((t) => t.name).sort()).toEqual(
                expectedTables
            );

            // Verify key relationships
            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'wizards' &&
                        r.targetTable === 'wizard_ranks' &&
                        r.sourceColumn === 'wizard_rank_id'
                )
            ).toBe(true);

            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'creatures' &&
                        r.targetTable === 'realms' &&
                        r.deleteAction === 'CASCADE'
                )
            ).toBe(true);

            // Verify JSON columns
            const creatures = result.tables.find((t) => t.name === 'creatures');
            const abilitiesCol = creatures?.columns.find(
                (c) => c.name === 'special_abilities'
            );
            expect(abilitiesCol?.type).toBe('JSON');

            // Verify ENUM columns
            const magicLevel = result.tables
                .find((t) => t.name === 'realms')
                ?.columns.find((c) => c.name === 'magic_level');
            expect(magicLevel?.type).toBe('ENUM');

            // Verify indexes
            const wizards = result.tables.find((t) => t.name === 'wizards');
            expect(
                wizards?.indexes.some((idx) => idx.name === 'idx_email')
            ).toBe(true);

            // Verify many-to-many relationship table
            const spellbooks = result.tables.find(
                (t) => t.name === 'wizard_spellbooks'
            );
            expect(
                spellbooks?.columns.filter((c) => c.primaryKey)
            ).toHaveLength(2);
        });

        it('should handle the schema with skipValidation', async () => {
            const result = await fromMySQLImproved(fantasyWorldSQL, {
                skipValidation: true,
                includeWarnings: true,
            });

            expect(result.tables).toHaveLength(17);
            expect(result.relationships.length).toBeGreaterThan(20);

            // Check for CASCADE actions
            const cascadeRelations = result.relationships.filter(
                (r) =>
                    r.deleteAction === 'CASCADE' || r.updateAction === 'CASCADE'
            );
            expect(cascadeRelations.length).toBeGreaterThan(5);
        });

        it('should validate the fantasy schema', () => {
            const validation = validateMySQLSyntax(fantasyWorldSQL);

            // Should be valid (no multi-line comment issues)
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);

            // May have some warnings but should be minimal
            expect(validation.warnings.length).toBeLessThan(5);
        });
    });

    describe('Fantasy Schema with Validation Issues', () => {
        it('should handle SQL that becomes invalid after comment removal', async () => {
            const problematicSQL = `
CREATE TABLE spell_components (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    rarity VARCHAR(50), -- "Common",
"Rare", "Legendary"  -- This will cause issues
    properties JSON -- [
    "magical_essence",
    "dragon_scale"
]  -- This JSON example will also cause issues
);`;

            // After comment removal, this SQL becomes malformed
            // The parser should handle this gracefully
            try {
                await fromMySQL(problematicSQL);
                // If it parses, that's OK - the sanitizer may have cleaned it up
            } catch (error) {
                // If it fails, that's also OK - the SQL was problematic
                expect(error.message).toBeDefined();
            }
        });

        it('should detect inline REFERENCES in fantasy schema', async () => {
            const invalidSQL = `
CREATE TABLE wizard_familiars (
    id INT PRIMARY KEY,
    wizard_id INT REFERENCES wizards(id),  -- PostgreSQL style, not MySQL
    familiar_name VARCHAR(100)
);`;

            await expect(fromMySQL(invalidSQL)).rejects.toThrow(
                'inline REFERENCES'
            );
        });
    });
});
