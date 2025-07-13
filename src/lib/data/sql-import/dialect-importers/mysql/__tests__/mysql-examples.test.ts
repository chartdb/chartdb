import { describe, it, expect } from 'vitest';
import { fromMySQLImproved } from '../mysql-improved';

describe('MySQL Real-World Examples', () => {
    describe('Magical Academy Example', () => {
        it('should parse the magical academy example with all 16 tables', async () => {
            const sql = `
                CREATE TABLE schools(
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE towers(
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    school_id INT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
                );

                CREATE TABLE ranks(
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    school_id INT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
                );

                CREATE TABLE spell_permissions(
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    spell_type VARCHAR(100) NOT NULL,
                    casting_level VARCHAR(50) NOT NULL
                );

                CREATE TABLE rank_spell_permissions(
                    rank_id INT NOT NULL,
                    spell_permission_id INT NOT NULL,
                    PRIMARY KEY (rank_id, spell_permission_id),
                    FOREIGN KEY (rank_id) REFERENCES ranks(id) ON DELETE CASCADE,
                    FOREIGN KEY (spell_permission_id) REFERENCES spell_permissions(id) ON DELETE CASCADE
                );

                CREATE TABLE grimoire_types(
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    school_id INT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
                );

                CREATE TABLE wizards(
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    school_id INT NOT NULL,
                    tower_id INT NOT NULL,
                    wizard_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    UNIQUE KEY school_wizard_unique (school_id, wizard_name),
                    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
                    FOREIGN KEY (tower_id) REFERENCES towers(id) ON DELETE CASCADE
                );

                CREATE TABLE wizard_ranks(
                    wizard_id INT NOT NULL,
                    rank_id INT NOT NULL,
                    tower_id INT NOT NULL,
                    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (wizard_id, rank_id, tower_id),
                    FOREIGN KEY (wizard_id) REFERENCES wizards(id) ON DELETE CASCADE,
                    FOREIGN KEY (rank_id) REFERENCES ranks(id) ON DELETE CASCADE,
                    FOREIGN KEY (tower_id) REFERENCES towers(id) ON DELETE CASCADE
                );

                CREATE TABLE apprentices(
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    school_id INT NOT NULL,
                    tower_id INT NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    enrollment_date DATE NOT NULL,
                    primary_mentor INT,
                    sponsoring_wizard INT,
                    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
                    FOREIGN KEY (tower_id) REFERENCES towers(id) ON DELETE CASCADE,
                    FOREIGN KEY (primary_mentor) REFERENCES wizards(id),
                    FOREIGN KEY (sponsoring_wizard) REFERENCES wizards(id)
                );

                CREATE TABLE spell_lessons(
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    school_id INT NOT NULL,
                    tower_id INT NOT NULL,
                    apprentice_id INT NOT NULL,
                    instructor_id INT NOT NULL,
                    lesson_date DATETIME NOT NULL,
                    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
                    FOREIGN KEY (tower_id) REFERENCES towers(id) ON DELETE CASCADE,
                    FOREIGN KEY (apprentice_id) REFERENCES apprentices(id) ON DELETE CASCADE,
                    FOREIGN KEY (instructor_id) REFERENCES wizards(id)
                );

                CREATE TABLE grimoires(
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    school_id INT NOT NULL,
                    tower_id INT NOT NULL,
                    apprentice_id INT NOT NULL,
                    grimoire_type_id INT NOT NULL,
                    author_wizard_id INT NOT NULL,
                    content JSON NOT NULL,
                    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
                    FOREIGN KEY (tower_id) REFERENCES towers(id) ON DELETE CASCADE,
                    FOREIGN KEY (apprentice_id) REFERENCES apprentices(id) ON DELETE CASCADE,
                    FOREIGN KEY (grimoire_type_id) REFERENCES grimoire_types(id),
                    FOREIGN KEY (author_wizard_id) REFERENCES wizards(id)
                );

                CREATE TABLE tuition_scrolls(
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    school_id INT NOT NULL,
                    tower_id INT NOT NULL,
                    apprentice_id INT NOT NULL,
                    total_amount DECIMAL(10,2) NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
                    FOREIGN KEY (tower_id) REFERENCES towers(id) ON DELETE CASCADE,
                    FOREIGN KEY (apprentice_id) REFERENCES apprentices(id) ON DELETE CASCADE
                );

                CREATE TABLE tuition_items(
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    tuition_scroll_id INT NOT NULL,
                    description TEXT NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    FOREIGN KEY (tuition_scroll_id) REFERENCES tuition_scrolls(id) ON DELETE CASCADE
                );

                CREATE TABLE patron_sponsorships(
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    tuition_scroll_id INT NOT NULL,
                    patron_house VARCHAR(255) NOT NULL,
                    sponsorship_code VARCHAR(100) NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    FOREIGN KEY (tuition_scroll_id) REFERENCES tuition_scrolls(id) ON DELETE CASCADE
                );

                CREATE TABLE gold_payments(
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    tuition_scroll_id INT NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (tuition_scroll_id) REFERENCES tuition_scrolls(id) ON DELETE CASCADE
                );

                CREATE TABLE arcane_logs(
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    school_id INT,
                    wizard_id INT,
                    tower_id INT,
                    table_name VARCHAR(100) NOT NULL,
                    operation VARCHAR(50) NOT NULL,
                    record_id INT,
                    changes JSON,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL,
                    FOREIGN KEY (wizard_id) REFERENCES wizards(id) ON DELETE SET NULL,
                    FOREIGN KEY (tower_id) REFERENCES towers(id) ON DELETE SET NULL
                );
            `;

            const result = await fromMySQLImproved(sql);

            // Should find all 16 tables
            const expectedTables = [
                'apprentices',
                'arcane_logs',
                'gold_payments',
                'grimoire_types',
                'grimoires',
                'patron_sponsorships',
                'rank_spell_permissions',
                'ranks',
                'schools',
                'spell_lessons',
                'spell_permissions',
                'towers',
                'tuition_items',
                'tuition_scrolls',
                'wizard_ranks',
                'wizards',
            ];

            expect(result.tables).toHaveLength(16);
            expect(result.tables.map((t) => t.name).sort()).toEqual(
                expectedTables
            );

            // Verify key relationships exist
            const relationships = result.relationships;

            // Check some critical relationships
            expect(
                relationships.some(
                    (r) =>
                        r.sourceTable === 'wizards' &&
                        r.targetTable === 'schools' &&
                        r.sourceColumn === 'school_id'
                )
            ).toBe(true);

            expect(
                relationships.some(
                    (r) =>
                        r.sourceTable === 'wizard_ranks' &&
                        r.targetTable === 'wizards' &&
                        r.sourceColumn === 'wizard_id'
                )
            ).toBe(true);

            expect(
                relationships.some(
                    (r) =>
                        r.sourceTable === 'apprentices' &&
                        r.targetTable === 'wizards' &&
                        r.sourceColumn === 'primary_mentor'
                )
            ).toBe(true);
        });
    });

    describe('Enchanted Bazaar Example', () => {
        it('should parse the enchanted bazaar example with triggers and procedures', async () => {
            const sql = `
                -- Enchanted Bazaar tables with complex features
                CREATE TABLE merchants(
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE artifacts(
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    merchant_id INT,
                    name VARCHAR(255) NOT NULL,
                    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
                    enchantment_charges INT DEFAULT 0 CHECK (enchantment_charges >= 0),
                    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
                );

                -- Stored procedure that should be skipped
                DELIMITER $$
                CREATE PROCEDURE consume_charges(IN artifact_id INT, IN charges_used INT)
                BEGIN
                    UPDATE artifacts SET enchantment_charges = enchantment_charges - charges_used WHERE id = artifact_id;
                END$$
                DELIMITER ;

                CREATE TABLE trades(
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'negotiating'
                );

                CREATE TABLE trade_items(
                    trade_id INT,
                    artifact_id INT,
                    quantity INT NOT NULL CHECK (quantity > 0),
                    agreed_price DECIMAL(10, 2) NOT NULL,
                    PRIMARY KEY (trade_id, artifact_id),
                    FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
                    FOREIGN KEY (artifact_id) REFERENCES artifacts(id)
                );

                -- Create trigger
                CREATE TRIGGER charge_consumption_trigger
                    AFTER INSERT ON trade_items
                    FOR EACH ROW
                    CALL consume_charges(NEW.artifact_id, NEW.quantity);
            `;

            const result = await fromMySQLImproved(sql, {
                includeWarnings: true,
            });

            // Should parse all tables despite procedures and triggers
            expect(result.tables.length).toBeGreaterThanOrEqual(4);

            // Check for specific tables
            const tableNames = result.tables.map((t) => t.name);
            expect(tableNames).toContain('merchants');
            expect(tableNames).toContain('artifacts');
            expect(tableNames).toContain('trades');
            expect(tableNames).toContain('trade_items');

            // Check relationships
            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'artifacts' &&
                        r.targetTable === 'merchants'
                )
            ).toBe(true);

            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'trade_items' &&
                        r.targetTable === 'trades'
                )
            ).toBe(true);

            // Should have warnings about unsupported features
            if (result.warnings) {
                expect(
                    result.warnings.some(
                        (w) =>
                            w.includes('procedure') ||
                            w.includes('function') ||
                            w.includes('Trigger') ||
                            w.includes('trigger')
                    )
                ).toBe(true);
            }
        });
    });

    describe('Dragon Registry Example', () => {
        it('should parse dragon registry with mixed constraint styles', async () => {
            const sql = `
                CREATE TABLE dragon_species (
                    id INT NOT NULL AUTO_INCREMENT,
                    species_name VARCHAR(100) NOT NULL UNIQUE,
                    breath_type ENUM('fire', 'ice', 'lightning', 'acid', 'poison') NOT NULL,
                    max_wingspan DECIMAL(5,2),
                    PRIMARY KEY (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE dragon_habitats (
                    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    habitat_name VARCHAR(200) NOT NULL,
                    location_type VARCHAR(50) NOT NULL,
                    climate VARCHAR(50),
                    INDEX idx_location (location_type)
                ) ENGINE=InnoDB;

                CREATE TABLE dragons (
                    dragon_id INT NOT NULL AUTO_INCREMENT,
                    dragon_name VARCHAR(255) NOT NULL,
                    species_id INT NOT NULL,
                    habitat_id INT,
                    birth_year INT,
                    treasure_value DECIMAL(15,2) DEFAULT 0.00,
                    is_active BOOLEAN DEFAULT TRUE,
                    PRIMARY KEY (dragon_id),
                    CONSTRAINT fk_dragon_species FOREIGN KEY (species_id) REFERENCES dragon_species(id),
                    CONSTRAINT fk_dragon_habitat FOREIGN KEY (habitat_id) REFERENCES dragon_habitats(id) ON DELETE SET NULL,
                    INDEX idx_species (species_id),
                    INDEX idx_active_dragons (is_active, species_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE dragon_riders (
                    rider_id INT NOT NULL AUTO_INCREMENT,
                    rider_name VARCHAR(255) NOT NULL,
                    guild_membership VARCHAR(100),
                    years_experience INT DEFAULT 0,
                    PRIMARY KEY (rider_id),
                    UNIQUE KEY uk_rider_name (rider_name)
                ) ENGINE=InnoDB;

                CREATE TABLE dragon_bonds (
                    bond_id INT NOT NULL AUTO_INCREMENT,
                    dragon_id INT NOT NULL,
                    rider_id INT NOT NULL,
                    bond_date DATE NOT NULL,
                    bond_strength ENUM('weak', 'moderate', 'strong', 'unbreakable') DEFAULT 'weak',
                    PRIMARY KEY (bond_id),
                    UNIQUE KEY unique_dragon_rider (dragon_id, rider_id),
                    FOREIGN KEY (dragon_id) REFERENCES dragons(dragon_id) ON DELETE CASCADE,
                    FOREIGN KEY (rider_id) REFERENCES dragon_riders(rider_id) ON DELETE CASCADE
                );
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(5);

            const tableNames = result.tables.map((t) => t.name).sort();
            expect(tableNames).toEqual([
                'dragon_bonds',
                'dragon_habitats',
                'dragon_riders',
                'dragon_species',
                'dragons',
            ]);

            // Check that ENUMs were parsed correctly
            const dragonSpecies = result.tables.find(
                (t) => t.name === 'dragon_species'
            );
            const breathTypeColumn = dragonSpecies?.columns.find(
                (c) => c.name === 'breath_type'
            );
            expect(breathTypeColumn?.type).toBe('ENUM');

            // Check indexes
            const dragonsTable = result.tables.find(
                (t) => t.name === 'dragons'
            );
            expect(dragonsTable?.indexes.length).toBeGreaterThan(0);
            expect(
                dragonsTable?.indexes.some((idx) => idx.name === 'idx_species')
            ).toBe(true);

            // Check relationships
            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'dragons' &&
                        r.targetTable === 'dragon_species' &&
                        r.sourceColumn === 'species_id'
                )
            ).toBe(true);

            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'dragon_bonds' &&
                        r.targetTable === 'dragons' &&
                        r.deleteAction === 'CASCADE'
                )
            ).toBe(true);
        });
    });

    describe('Mystic Marketplace Example with Backticks', () => {
        it('should handle tables with backticks and special characters', async () => {
            const sql = `
                CREATE TABLE \`marketplace-vendors\` (
                    \`vendor-id\` INT NOT NULL AUTO_INCREMENT,
                    \`vendor name\` VARCHAR(255) NOT NULL,
                    \`shop.location\` VARCHAR(500),
                    \`rating%\` DECIMAL(3,2),
                    PRIMARY KEY (\`vendor-id\`)
                ) ENGINE=InnoDB;

                CREATE TABLE \`item_categories\` (
                    \`category-id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    \`category@name\` VARCHAR(100) NOT NULL UNIQUE,
                    \`parent_category\` INT,
                    FOREIGN KEY (\`parent_category\`) REFERENCES \`item_categories\`(\`category-id\`)
                );

                CREATE TABLE \`magical.items\` (
                    \`item#id\` INT NOT NULL AUTO_INCREMENT,
                    \`item-name\` VARCHAR(255) NOT NULL,
                    \`vendor-id\` INT NOT NULL,
                    \`category-id\` INT NOT NULL,
                    \`price$gold\` DECIMAL(10,2) NOT NULL,
                    PRIMARY KEY (\`item#id\`),
                    CONSTRAINT \`fk_item_vendor\` FOREIGN KEY (\`vendor-id\`) REFERENCES \`marketplace-vendors\`(\`vendor-id\`),
                    CONSTRAINT \`fk_item_category\` FOREIGN KEY (\`category-id\`) REFERENCES \`item_categories\`(\`category-id\`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(3);

            // Check that backtick-wrapped names are preserved
            const vendor = result.tables.find(
                (t) => t.name === 'marketplace-vendors'
            );
            expect(vendor).toBeDefined();
            expect(vendor?.columns.some((c) => c.name === 'vendor-id')).toBe(
                true
            );
            expect(vendor?.columns.some((c) => c.name === 'vendor name')).toBe(
                true
            );

            // Check self-referencing foreign key
            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'item_categories' &&
                        r.targetTable === 'item_categories' &&
                        r.sourceColumn === 'parent_category'
                )
            ).toBe(true);

            // Check cross-table relationships
            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'magical.items' &&
                        r.targetTable === 'marketplace-vendors'
                )
            ).toBe(true);
        });
    });
});
