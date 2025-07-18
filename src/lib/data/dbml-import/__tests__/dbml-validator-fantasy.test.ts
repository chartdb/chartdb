import { describe, it, expect } from 'vitest';
import { validateDBML } from '../dbml-validator';

describe('DBML Validator - Fantasy Themed Auto-fix Tests', () => {
    describe('Dragon Kingdom Database', () => {
        it('should fix split attributes in dragon rider tables', () => {
            const dragonDBML = `{
  database_type: "PostgreSQL"
}
Table dragon_riders {
  id uuid [pk, default: \`uuid_generate_v4()\`
    ] // Split across lines
  name varchar(100) [not null, 
    unique
    ] // Multi-line unique constraint
  dragon_id uuid [ref: > dragons.id, 
    not null] // Reference split
  level int [default: 1, 
    check: "level > 0"
    ] // Check constraint split
  joined_at timestamp [default: \`now()\`, 
    not null
    ]
}

Table dragons {
  id uuid [pk
    ]
  name varchar(100) [unique
    ]
  species dragon_species [not null
    ] // Enum type
  fire_power numeric(10,
    2) // Split numeric type
  wingspan decimal(5,
    1) // Split decimal
}`;

            const result = validateDBML(dragonDBML);
            expect(result.isValid).toBe(true);
            expect(result.fixedDBML).toBeDefined();
            expect(result.warnings.length).toBeGreaterThan(0);

            const fixed = result.fixedDBML!;
            // Check that split attributes are fixed
            expect(fixed).toContain('[pk, default: `uuid_generate_v4()`]');
            expect(fixed).toContain('[not null, unique]');
            expect(fixed).toContain('[ref: > dragons.id, not null]');
            expect(fixed).toContain('[default: 1, check: "level > 0"]');
            expect(fixed).toContain('numeric(10,2)');
            expect(fixed).toContain('decimal(5,1)');
            // Check header removal
            expect(fixed).not.toContain('database_type');
        });

        it('should fix malformed indexes in treasure vault', () => {
            const treasureDBML = `Table treasure_vault {
  id int [pk, increment]
  dragon_id uuid [ref: > dragons.id]
  gold_pieces bigint
  magical_items jsonb
  location point
  discovered_at timestamp
  
  Indexes {
    dragon_id
    (dragon_id, discovered_at) [name: "idx_dragon_discoveries"]
    location(location) // Malformed - missing space
    magical_items(magical_items, gold_pieces) [unique] // Malformed
  }
}`;

            const result = validateDBML(treasureDBML);
            expect(result.fixedDBML).toBeDefined();

            const fixed = result.fixedDBML!;
            // Check that malformed indexes are fixed
            expect(fixed).toContain('location (location)');
            expect(fixed).toContain(
                'magical_items (magical_items, gold_pieces)'
            );
        });
    });

    describe('Magical Academy Database', () => {
        it('should handle complex wizard enrollment system', () => {
            const wizardDBML = `{
  database_type: "MySQL"
}
Enum spell_school {
  EVOCATION
  ILLUSION
  NECROMANCY
  TRANSMUTATION
  DIVINATION
  ENCHANTMENT
  ABJURATION
  CONJURATION
}

Table wizards {
  id int [pk, 
    increment
    ]
  name varchar(100) [not null,
    unique] // Famous wizard names must be unique
  primary_school spell_school [not null
    ]
  power_level decimal(5,
    2) [check: "power_level BETWEEN 0 AND 100"
    ]
  
  Note: 'This table stores all registered wizards'
  
  Indexes {
    name
    primary_school(primary_school, power_level) [name: "idx_school_power"]
  }
}

Table spell_components {
  id int [pk
    ]
  spell_id int [ref: > spells.id,
    not null
    ]
  component_name varchar(50) [not null
    ]
  quantity int [default: 1,
    check: "quantity > 0"
    ]
  
  indexes {
    spell_id(spell_id, component_name) [unique]
  }
}`;

            const result = validateDBML(wizardDBML);
            expect(result.isValid).toBe(true);
            expect(result.fixedDBML).toBeDefined();

            const fixed = result.fixedDBML!;
            // Check header removal
            expect(fixed).not.toContain('database_type: "MySQL"');
            // Check attribute fixes
            expect(fixed).toContain('[pk, increment]');
            expect(fixed).toContain('[not null, unique]');
            expect(fixed).toContain('decimal(5,2)');
            // Check index fixes
            expect(fixed).toContain(
                'primary_school (primary_school, power_level)'
            );
            expect(fixed).toContain('spell_id (spell_id, component_name)');
            // Note: We're not removing Note declarations anymore as they're valid DBML
            // Check indexes capitalization
            expect(fixed).toContain('Indexes {');
        });
    });

    describe('Space Pirates Database', () => {
        it('should fix complex starship registry with multiple issues', () => {
            const starshipDBML = `{
  database_type: "PostgreSQL"
}
Table starships {
  registry_id uuid [pk, 
    default: \`uuid_generate_v4()\`
    ]
  ship_name varchar(200) [not null,
    unique
    ]
  captain_id uuid [ref: > space_pirates.id,
    not null
    ]
  cargo_capacity numeric(12,
    3) // In metric tons
  warp_capable boolean [default: true
    ]
  shields_strength decimal(5,
    2) [check: "shields_strength <= 100"
    ]
  
  Note: 'Registry of all known pirate vessels'
  
  Indexes {
    captain_id
    ship_name(ship_name) // Search by name
    (captain_id, warp_capable) [name: "idx_captain_warp"]
    cargo_capacity(cargo_capacity, shields_strength) [name: "idx_cargo_shields"]
  }
}

Table space_pirates {
  id uuid [pk
    ]
  pirate_name varchar(100) [unique,
    not null
    ]
  bounty numeric(15,
    2) // Space credits
  danger_level int [check: "danger_level BETWEEN 1 AND 10"
    ]
  last_seen_at timestamp [default: \`now()\`
    ]
  
  Indexes {
    bounty
    danger_level(danger_level, bounty) [name: "idx_wanted_list"]
    (pirate_name, last_seen_at) // Tracking index
  }
}

Table plunder_records {
  id bigint [pk,
    increment
    ]
  pirate_id uuid [ref: > space_pirates.id
    ]
  starship_id uuid [ref: > starships.registry_id
    ]
  plunder_value numeric(18,
    2)
  plunder_date date [not null,
    default: \`current_date\`
    ]
  
  Indexes {
    (pirate_id, starship_id, plunder_date) [unique]
    plunder_value(plunder_value) // For ranking
  }
}`;

            const result = validateDBML(starshipDBML);
            expect(result.isValid).toBe(true);
            expect(result.fixedDBML).toBeDefined();

            const fixed = result.fixedDBML!;

            // Verify comprehensive fixes
            expect(fixed).not.toContain('database_type');

            // Check all split attributes are fixed
            expect(fixed).toContain('[pk, default: `uuid_generate_v4()`]');
            expect(fixed).toContain('[not null, unique]');
            expect(fixed).toContain('[ref: > space_pirates.id, not null]');
            expect(fixed).toContain('numeric(12,3)');
            expect(fixed).toContain('decimal(5,2)');
            expect(fixed).toContain('[default: true]');
            expect(fixed).toContain('[unique, not null]');
            expect(fixed).toContain('numeric(15,2)');
            expect(fixed).toContain('[default: `now()`]');
            expect(fixed).toContain('[pk, increment]');
            expect(fixed).toContain('[not null, default: `current_date`]');
            expect(fixed).toContain('numeric(18,2)');

            // Check all malformed indexes are fixed
            expect(fixed).toContain('ship_name (ship_name)');
            expect(fixed).toContain(
                'cargo_capacity (cargo_capacity, shields_strength)'
            );
            expect(fixed).toContain('danger_level (danger_level, bounty)');
            expect(fixed).toContain('plunder_value (plunder_value)');

            // Ensure indexes/Indexes are normalized
            expect(fixed.match(/Indexes\s*{/g)?.length).toBeGreaterThanOrEqual(
                3
            );
        });
    });

    describe('Mythical Marketplace Database', () => {
        it('should handle marketplace with all types of formatting issues', () => {
            const marketDBML = `{
  database_type: "MariaDB"
}
enum item_rarity {
  COMMON
  UNCOMMON
  RARE
  EPIC
  LEGENDARY
  MYTHICAL
}

enum merchant_status {
  ACTIVE
  SUSPENDED
  PREMIUM
  VERIFIED
}

Table merchants {
  id int [pk,
    increment
    ]
  shop_name varchar(100) [unique,
    not null
    ]
  owner_name varchar(100) [not null
    ]
  status merchant_status [default: 'ACTIVE'
    ]
  rating decimal(3,
    2) [check: "rating BETWEEN 0 AND 5"
    ]
  gold_balance numeric(20,
    2) [default: 0
    ]
  
  Note: 'Verified merchants of the mythical marketplace'
  
  indexes {
    status
    rating(rating, status) [name: "idx_merchant_quality"]
    shop_name(shop_name) // Fast shop lookup
  }
}

Table magical_items {
  id uuid [pk,
    default: \`uuid_generate_v4()\`
    ]
  item_name varchar(200) [not null
    ]
  description text
  rarity item_rarity [not null,
    default: 'COMMON'
    ]
  base_price numeric(10,
    2) [check: "base_price > 0"
    ]
  power_level int [check: "power_level BETWEEN 1 AND 100"
    ]
  merchant_id int [ref: > merchants.id,
    not null
    ]
  
  Indexes {
    merchant_id
    rarity(rarity, power_level) [name: "idx_item_power"]
    (item_name, merchant_id) [unique]
    base_price(base_price)
  }
}

Table transaction_ledger {
  transaction_id bigint [pk,
    increment
    ]
  buyer_id int [ref: > merchants.id
    ]
  seller_id int [ref: > merchants.id,
    not null
    ]
  item_id uuid [ref: > magical_items.id,
    not null
    ]
  sale_price numeric(12,
    2) [not null
    ]
  commission numeric(10,
    2) [default: 0
    ]
  transaction_date timestamp [default: \`now()\`,
    not null
    ]
  
  indexes {
    (buyer_id, transaction_date)
    (seller_id, transaction_date)
    item_id(item_id, transaction_date) [name: "idx_item_history"]
    sale_price(sale_price, commission) // For analytics
  }
}`;

            const result = validateDBML(marketDBML);
            expect(result.isValid).toBe(true);
            expect(result.fixedDBML).toBeDefined();

            const fixed = result.fixedDBML!;

            // Comprehensive validation of all fixes
            expect(fixed).not.toContain('database_type: "MariaDB"');

            // Verify all attributes are properly formatted
            const attributePatterns = [
                '[pk, increment]',
                '[unique, not null]',
                '[not null]',
                "[default: 'ACTIVE']",
                'decimal(3,2)',
                '[check: "rating BETWEEN 0 AND 5"]',
                'numeric(20,2)',
                '[default: 0]',
                '[pk, default: `uuid_generate_v4()`]',
                "[not null, default: 'COMMON']",
                'numeric(10,2)',
                '[check: "base_price > 0"]',
                '[ref: > merchants.id, not null]',
                'numeric(12,2)',
                '[default: `now()`, not null]',
            ];

            attributePatterns.forEach((pattern) => {
                expect(fixed).toContain(pattern);
            });

            // Verify all index fixes
            const indexPatterns = [
                'rating (rating, status)',
                'shop_name (shop_name)',
                'rarity (rarity, power_level)',
                'base_price (base_price)',
                'item_id (item_id, transaction_date)',
                'sale_price (sale_price, commission)',
            ];

            indexPatterns.forEach((pattern) => {
                expect(fixed).toContain(pattern);
            });

            // Ensure consistent Indexes capitalization
            const allIndexBlocks = fixed.match(/indexes\s*{/gi) || [];
            const capitalizedIndexBlocks = fixed.match(/Indexes\s*{/g) || [];
            // All index blocks should be capitalized
            expect(allIndexBlocks.length).toBe(capitalizedIndexBlocks.length);
            expect(capitalizedIndexBlocks.length).toBe(3);
        });
    });

    describe('Edge Cases and Special Scenarios', () => {
        it('should handle empty DBML after preprocessing', () => {
            const emptyDBML = `{
  database_type: "PostgreSQL"
}`;

            const result = validateDBML(emptyDBML);
            expect(result.fixedDBML).toBeDefined();
            expect(result.fixedDBML!.trim()).toBe('');
        });

        it('should handle DBML with only comments after header removal', () => {
            const commentOnlyDBML = `{
  database_type: "SQLite"
}
// This is a comment about the database
// Another comment
/* Block comment
   spanning multiple lines */`;

            const result = validateDBML(commentOnlyDBML);
            expect(result.fixedDBML).toBeDefined();
            const fixed = result.fixedDBML!;
            expect(fixed).not.toContain('database_type');
            expect(fixed).toContain('// This is a comment');
        });

        it('should handle deeply nested parentheses in indexes', () => {
            const nestedDBML = `Table complex_functions {
  id int [pk]
  formula text
  result numeric(10,2)
  
  Indexes {
    formula(SUBSTRING(formula FROM 1 FOR 50)) // Function index
    result(ABS(result), ROUND(result, 0)) // Multiple functions
  }
}`;

            const result = validateDBML(nestedDBML);
            expect(result.fixedDBML).toBeDefined();
            const fixed = result.fixedDBML!;
            expect(fixed).toContain(
                'formula (SUBSTRING(formula FROM 1 FOR 50))'
            );
            // The autofix should add space before the first parenthesis only
            expect(fixed).toContain(
                'result (ABS(result), ROUND(result, 0)) // Multiple functions'
            );
        });

        it('should extract Note: declarations inside tables and remove them from DBML', () => {
            const dragonLairDBML = `Table dragon_lair {
  
  Note: 'The primary dwelling of ancient dragons with their hoarded treasures.'
  id uuid [pk, note: 'Unique identifier for each lair'
    ]
  dragon_id uuid [ref: > ancient_dragons.id, note: 'Reference to the dragon owner'
    ]
  location_coordinates point [not null, note: 'Magical coordinates accessible only by flight'
    ]
  treasure_value numeric(20,
    2) [note: 'Total value in gold pieces'
    ]
  trap_level int [check: "trap_level BETWEEN 1 AND 10"
    ]
  
  Indexes {
    dragon_id
    location_coordinates(location_coordinates)
  }
}

Table spell_library {
  Note: 'Repository of all known spells across the realms'
  id int [pk,
    increment
    ]
  spell_name varchar(100) [unique,
    not null
    ]
  mana_cost int [default: 10,
    check: "mana_cost > 0"
    ]
  
  indexes {
    spell_name(spell_name)
    mana_cost(mana_cost, spell_name)
  }
}`;

            const result = validateDBML(dragonLairDBML);
            expect(result.isValid).toBe(true);
            expect(result.fixedDBML).toBeDefined();

            const fixed = result.fixedDBML!;

            // Check that table-level Note: declarations are removed from DBML
            expect(fixed).not.toContain(
                "Note: 'The primary dwelling of ancient dragons"
            );
            expect(fixed).not.toContain(
                "Note: 'Repository of all known spells"
            );

            // Verify that table notes were extracted
            expect(result.tableNotes).toBeDefined();
            expect(result.tableNotes?.get('dragon_lair')).toBe(
                'The primary dwelling of ancient dragons with their hoarded treasures.'
            );
            expect(result.tableNotes?.get('spell_library')).toBe(
                'Repository of all known spells across the realms'
            );

            // Check that other fixes are applied too
            expect(fixed).toContain(
                "[pk, note: 'Unique identifier for each lair']"
            );
            expect(fixed).toContain('numeric(20,2)');
            expect(fixed).toContain('[pk, increment]');
            expect(fixed).toContain('[unique, not null]');
            expect(fixed).toContain('[default: 10, check: "mana_cost > 0"]');

            // Check index fixes
            expect(fixed).toContain(
                'location_coordinates (location_coordinates)'
            );
            expect(fixed).toContain('spell_name (spell_name)');
            expect(fixed).toContain('mana_cost (mana_cost, spell_name)');

            // Check Indexes capitalization
            expect(fixed).toContain('Indexes {');
            expect(fixed).not.toMatch(/indexes\s*{/);
        });
    });
});
