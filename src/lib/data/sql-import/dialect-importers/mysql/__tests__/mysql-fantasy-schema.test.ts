import { describe, it, expect } from 'vitest';
import { fromMySQL } from '../mysql';

describe('MySQL Fantasy Schema Test', () => {
    it('should parse a complete fantasy realm management schema', async () => {
        const fantasySQL = `
-- Enchanted Realms Database
CREATE TABLE magical_realms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    realm_name VARCHAR(100) UNIQUE NOT NULL,
    magic_density DECIMAL(5,2) DEFAULT 100.00,
    portal_coordinates VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_realm_name (realm_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE creature_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) UNIQUE NOT NULL,
    base_health INT DEFAULT 100,
    base_mana INT DEFAULT 50,
    special_traits JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE magical_creatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creature_name VARCHAR(200) NOT NULL,
    class_id INT NOT NULL,
    realm_id INT NOT NULL,
    level INT DEFAULT 1,
    experience_points INT DEFAULT 0,
    is_legendary BOOLEAN DEFAULT FALSE,
    abilities TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES creature_classes(id),
    FOREIGN KEY (realm_id) REFERENCES magical_realms(id) ON DELETE CASCADE,
    INDEX idx_realm_creatures (realm_id),
    INDEX idx_legendary (is_legendary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wizard_towers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tower_name VARCHAR(100) NOT NULL,
    realm_id INT NOT NULL,
    height_meters INT DEFAULT 50,
    defensive_wards JSON,
    library_size ENUM('small', 'medium', 'large', 'grand') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (realm_id) REFERENCES magical_realms(id),
    INDEX idx_realm_towers (realm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE arcane_wizards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wizard_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    tower_id INT,
    specialization VARCHAR(50) NOT NULL,
    mana_capacity INT DEFAULT 1000,
    spell_slots INT DEFAULT 10,
    familiar_creature_id INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tower_id) REFERENCES wizard_towers(id) ON DELETE SET NULL,
    FOREIGN KEY (familiar_creature_id) REFERENCES magical_creatures(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_tower (tower_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE spell_tomes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spell_name VARCHAR(200) NOT NULL,
    mana_cost INT DEFAULT 50,
    cast_time_seconds DECIMAL(4,2) DEFAULT 1.5,
    damage_type ENUM('fire', 'ice', 'lightning', 'arcane', 'nature', 'shadow') NOT NULL,
    spell_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FULLTEXT idx_spell_search (spell_name, spell_description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wizard_spellbooks (
    wizard_id INT NOT NULL,
    spell_id INT NOT NULL,
    mastery_level INT DEFAULT 1,
    times_cast INT DEFAULT 0,
    learned_date DATE,
    PRIMARY KEY (wizard_id, spell_id),
    FOREIGN KEY (wizard_id) REFERENCES arcane_wizards(id) ON DELETE CASCADE,
    FOREIGN KEY (spell_id) REFERENCES spell_tomes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE enchanted_artifacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artifact_name VARCHAR(200) UNIQUE NOT NULL,
    power_level INT CHECK (power_level BETWEEN 1 AND 100),
    curse_type VARCHAR(100),
    owner_wizard_id INT,
    found_in_realm_id INT,
    enchantments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_wizard_id) REFERENCES arcane_wizards(id) ON DELETE SET NULL,
    FOREIGN KEY (found_in_realm_id) REFERENCES magical_realms(id),
    INDEX idx_power (power_level),
    INDEX idx_owner (owner_wizard_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE portal_network (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portal_name VARCHAR(100) NOT NULL,
    source_realm_id INT NOT NULL,
    destination_realm_id INT NOT NULL,
    stability_percentage DECIMAL(5,2) DEFAULT 95.00,
    mana_cost_per_use INT DEFAULT 100,
    is_bidirectional BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_realm_id) REFERENCES magical_realms(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_realm_id) REFERENCES magical_realms(id) ON DELETE CASCADE,
    UNIQUE KEY uk_portal_connection (source_realm_id, destination_realm_id),
    INDEX idx_source (source_realm_id),
    INDEX idx_destination (destination_realm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE magical_guilds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_name VARCHAR(200) UNIQUE NOT NULL,
    founding_wizard_id INT,
    headquarters_tower_id INT,
    guild_treasury INT DEFAULT 0,
    member_limit INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (founding_wizard_id) REFERENCES arcane_wizards(id) ON DELETE SET NULL,
    FOREIGN KEY (headquarters_tower_id) REFERENCES wizard_towers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE guild_memberships (
    wizard_id INT NOT NULL,
    guild_id INT NOT NULL,
    joined_date DATE NOT NULL,
    guild_rank ENUM('apprentice', 'member', 'elder', 'master') DEFAULT 'apprentice',
    contribution_points INT DEFAULT 0,
    PRIMARY KEY (wizard_id, guild_id),
    FOREIGN KEY (wizard_id) REFERENCES arcane_wizards(id) ON DELETE CASCADE,
    FOREIGN KEY (guild_id) REFERENCES magical_guilds(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE realm_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    realm_id INT NOT NULL,
    description TEXT,
    magic_fluctuation INT DEFAULT 0,
    participants JSON,
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (realm_id) REFERENCES magical_realms(id) ON DELETE CASCADE,
    INDEX idx_realm_time (realm_id, event_timestamp),
    INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Additional constraints via ALTER TABLE
ALTER TABLE magical_creatures 
    ADD CONSTRAINT chk_level CHECK (level BETWEEN 1 AND 100);

ALTER TABLE wizard_spellbooks 
    ADD CONSTRAINT chk_mastery CHECK (mastery_level BETWEEN 1 AND 10);
`;

        console.log('Parsing fantasy realm schema...');
        const result = await fromMySQL(fantasySQL);

        // Expected structure
        const expectedTables = [
            'arcane_wizards',
            'creature_classes',
            'enchanted_artifacts',
            'guild_memberships',
            'magical_creatures',
            'magical_guilds',
            'magical_realms',
            'portal_network',
            'realm_events',
            'spell_tomes',
            'wizard_spellbooks',
            'wizard_towers',
        ];

        console.log('Found tables:', result.tables.map((t) => t.name).sort());

        expect(result.tables).toHaveLength(12);
        expect(result.tables.map((t) => t.name).sort()).toEqual(expectedTables);

        // Verify relationships
        console.log(
            `\nTotal relationships found: ${result.relationships.length}`
        );

        // Check some key relationships
        const creatureRelations = result.relationships.filter(
            (r) => r.sourceTable === 'magical_creatures'
        );
        expect(creatureRelations).toHaveLength(2); // class_id and realm_id

        const wizardRelations = result.relationships.filter(
            (r) => r.sourceTable === 'arcane_wizards'
        );
        expect(wizardRelations).toHaveLength(2); // tower_id and familiar_creature_id

        // Check CASCADE relationships
        const cascadeRelations = result.relationships.filter(
            (r) => r.deleteAction === 'CASCADE'
        );
        console.log(
            `\nRelationships with CASCADE delete: ${cascadeRelations.length}`
        );
        expect(cascadeRelations.length).toBeGreaterThan(5);

        // Verify special columns
        const realms = result.tables.find((t) => t.name === 'magical_realms');
        const magicDensity = realms?.columns.find(
            (c) => c.name === 'magic_density'
        );
        expect(magicDensity?.type).toBe('DECIMAL');

        const spells = result.tables.find((t) => t.name === 'spell_tomes');
        const damageType = spells?.columns.find(
            (c) => c.name === 'damage_type'
        );
        expect(damageType?.type).toBe('ENUM');

        // Check indexes
        const wizards = result.tables.find((t) => t.name === 'arcane_wizards');
        expect(wizards?.indexes.some((idx) => idx.name === 'idx_email')).toBe(
            true
        );

        // Check unique constraints
        const portals = result.tables.find((t) => t.name === 'portal_network');
        expect(
            portals?.indexes.some(
                (idx) =>
                    idx.name === 'uk_portal_connection' && idx.unique === true
            )
        ).toBe(true);

        console.log('\n=== Parsing Summary ===');
        console.log(`Tables parsed: ${result.tables.length}`);
        console.log(`Relationships found: ${result.relationships.length}`);
        console.log(
            `Tables with indexes: ${result.tables.filter((t) => t.indexes.length > 0).length}`
        );
        console.log(
            `Tables with primary keys: ${
                result.tables.filter((t) => t.columns.some((c) => c.primaryKey))
                    .length
            }`
        );
    });
});
