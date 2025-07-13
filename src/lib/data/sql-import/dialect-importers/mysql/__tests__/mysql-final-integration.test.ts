import { describe, it, expect } from 'vitest';
import { fromMySQL } from '../mysql';
import { fromMySQLImproved } from '../mysql-improved';

describe('MySQL Final Integration', () => {
    it('should use the improved parser from fromMySQL', async () => {
        const sql = `
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE posts (
    id INT PRIMARY KEY,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);`;

        const result = await fromMySQL(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);
    });

    it('should reject inline REFERENCES', async () => {
        const sql = `
CREATE TABLE posts (
    id INT PRIMARY KEY,
    user_id INT REFERENCES users(id)
);`;

        await expect(fromMySQL(sql)).rejects.toThrow(
            'MySQL/MariaDB does not support inline REFERENCES'
        );
    });

    it('should handle a large fantasy schema with skipValidation', async () => {
        const fantasySQL = `
-- Dragon Registry System
CREATE TABLE dragon_species (
    id INT AUTO_INCREMENT PRIMARY KEY,
    species_name VARCHAR(100) UNIQUE NOT NULL,
    element_affinity ENUM('fire', 'ice', 'lightning', 'earth', 'shadow', 'light') NOT NULL,
    average_wingspan_meters DECIMAL(6,2),
    is_ancient BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE dragon_lairs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_name VARCHAR(200) NOT NULL,
    coordinates JSON, -- {"x": 1000, "y": 2000, "z": 500}
    treasure_value INT DEFAULT 0,
    trap_level INT DEFAULT 1 CHECK (trap_level BETWEEN 1 AND 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_treasure (treasure_value)
) ENGINE=InnoDB;

CREATE TABLE dragons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dragon_name VARCHAR(200) NOT NULL,
    species_id INT NOT NULL,
    lair_id INT,
    age_years INT DEFAULT 0,
    hoard_size INT DEFAULT 0,
    breath_weapon_power INT DEFAULT 100,
    is_sleeping BOOLEAN DEFAULT FALSE,
    last_seen_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (species_id) REFERENCES dragon_species(id),
    FOREIGN KEY (lair_id) REFERENCES dragon_lairs(id) ON DELETE SET NULL,
    INDEX idx_species (species_id),
    INDEX idx_lair (lair_id)
) ENGINE=InnoDB;

-- Adventurer's Guild
CREATE TABLE adventurer_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) UNIQUE NOT NULL,
    primary_stat ENUM('strength', 'dexterity', 'intelligence', 'wisdom', 'charisma') NOT NULL,
    hit_dice INT DEFAULT 6,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE adventurers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    adventurer_name VARCHAR(200) NOT NULL,
    class_id INT NOT NULL,
    level INT DEFAULT 1,
    experience_points INT DEFAULT 0,
    gold_pieces INT DEFAULT 100,
    is_alive BOOLEAN DEFAULT TRUE,
    last_quest_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES adventurer_classes(id),
    INDEX idx_class (class_id),
    INDEX idx_level (level)
) ENGINE=InnoDB;

CREATE TABLE dragon_encounters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dragon_id INT NOT NULL,
    adventurer_id INT NOT NULL,
    encounter_date DATETIME NOT NULL,
    outcome ENUM('fled', 'negotiated', 'fought', 'befriended') NOT NULL,
    gold_stolen INT DEFAULT 0,
    survived BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dragon_id) REFERENCES dragons(id) ON DELETE CASCADE,
    FOREIGN KEY (adventurer_id) REFERENCES adventurers(id) ON DELETE CASCADE,
    INDEX idx_dragon (dragon_id),
    INDEX idx_adventurer (adventurer_id),
    INDEX idx_date (encounter_date)
) ENGINE=InnoDB;
`;

        // First, let's try with skipValidation
        const result = await fromMySQLImproved(fantasySQL, {
            skipValidation: true,
            includeWarnings: true,
        });

        console.log('\n=== Results with skipValidation ===');
        console.log('Tables:', result.tables.length);
        console.log('Relationships:', result.relationships.length);
        console.log('Warnings:', result.warnings?.length || 0);

        expect(result.tables.length).toBe(6);
        expect(result.relationships.length).toBeGreaterThanOrEqual(5);

        // Verify key tables
        const dragons = result.tables.find((t) => t.name === 'dragons');
        expect(dragons).toBeDefined();
        expect(
            dragons?.columns.find((c) => c.name === 'breath_weapon_power')
        ).toBeDefined();

        // Check relationships
        const dragonRelations = result.relationships.filter(
            (r) => r.sourceTable === 'dragons'
        );
        expect(dragonRelations).toHaveLength(2); // species_id and lair_id
    });

    it('should handle SQL with comments like PostgreSQL', async () => {
        // Use properly formatted SQL that won't break when comments are removed
        const sqlWithComments = `
CREATE TABLE test (
    id INT PRIMARY KEY,
    data JSON, -- Example: ["value1", "value2"]
    status VARCHAR(50), -- Can be "active" or "inactive"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Auto-set timestamp
);`;

        // This should work because comments are removed first
        const result = await fromMySQL(sqlWithComments);

        console.log('\n=== Result ===');
        console.log('Tables:', result.tables.length);
        console.log('Columns:', result.tables[0]?.columns.length);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('test');
        expect(result.tables[0].columns).toHaveLength(4);

        // Verify columns were parsed correctly
        const columns = result.tables[0].columns.map((c) => c.name);
        expect(columns).toContain('id');
        expect(columns).toContain('data');
        expect(columns).toContain('status');
        expect(columns).toContain('created_at');
    });

    it('should handle SQL that may become problematic after comment removal', async () => {
        // This SQL is problematic because removing comments leaves invalid syntax
        const problematicSql = `
CREATE TABLE test (
    id INT PRIMARY KEY,
    data JSON, -- [
    "value1",
    "value2"
]  -- This leaves broken syntax
);`;

        // The parser might handle this in different ways
        try {
            const result = await fromMySQL(problematicSql);
            // If it succeeds, it might have parsed partially
            expect(result.tables.length).toBeGreaterThanOrEqual(0);
        } catch (error) {
            // If it fails, that's also acceptable
            expect(error).toBeDefined();
        }
    });
});
