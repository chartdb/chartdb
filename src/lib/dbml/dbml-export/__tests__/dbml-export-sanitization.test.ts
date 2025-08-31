import { describe, it, expect } from 'vitest';
import { sanitizeSQLforDBML } from '../dbml-export';

describe('DBML SQL Sanitization - Fantasy Examples', () => {
    describe('Character Type Fixes', () => {
        it('should fix char type with spaces before parentheses', () => {
            const sql = `CREATE TABLE dragon_breeds (
  id uuid PRIMARY KEY,
  breed_code char (3) NOT NULL,
  element_affinity char (1) DEFAULT 'F',
  rarity_class character (10)
);`;

            const sanitized = sanitizeSQLforDBML(sql);

            expect(sanitized).toContain('breed_code char(3)');
            expect(sanitized).toContain('element_affinity char(1)');
            expect(sanitized).toContain('rarity_class character(10)');
            expect(sanitized).not.toContain('char (');
        });
    });

    describe('Default Value Fixes', () => {
        it('should quote three-letter currency codes', () => {
            const sql = `CREATE TABLE merchant_accounts (
  id uuid PRIMARY KEY,
  merchant_name varchar(200) NOT NULL,
  gold_balance numeric(15,2) DEFAULT 1000.00,
  preferred_currency char(3) DEFAULT EUR,
  backup_currency char(3) DEFAULT USD,
  exotic_currency char(3) DEFAULT GPD
);`;

            const sanitized = sanitizeSQLforDBML(sql);

            expect(sanitized).toContain("DEFAULT 'EUR'");
            expect(sanitized).toContain("DEFAULT 'USD'");
            expect(sanitized).toContain("DEFAULT 'GPD'"); // Gold Pieces Dragon currency
            // Should not affect numeric defaults
            expect(sanitized).toContain('DEFAULT 1000.00');
        });

        it('should convert DEFAULT NOW to DEFAULT NOW()', () => {
            const sql = `CREATE TABLE spell_cooldowns (
  id uuid PRIMARY KEY,
  spell_id integer NOT NULL,
  wizard_id uuid NOT NULL,
  cast_at timestamp DEFAULT NOW,
  expires_at timestamp DEFAULT now,
  created_at timestamp DEFAULT NOW()
);`;

            const sanitized = sanitizeSQLforDBML(sql);

            // Should convert both NOW and now to NOW()
            expect(sanitized.match(/DEFAULT NOW\(\)/gi)?.length).toBe(2); // cast_at becomes NOW(), created_at already has NOW()
            expect(sanitized).not.toMatch(/DEFAULT NOW(?!\()/i);
        });

        it('should not affect other DEFAULT values', () => {
            const sql = `CREATE TABLE potion_inventory (
  id uuid PRIMARY KEY,
  potion_name varchar(200) NOT NULL,
  quantity integer DEFAULT 0,
  quality varchar(20) DEFAULT 'standard',
  is_magical boolean DEFAULT true,
  created_date date DEFAULT CURRENT_DATE
);`;

            const sanitized = sanitizeSQLforDBML(sql);

            expect(sanitized).toContain('DEFAULT 0');
            expect(sanitized).toContain("DEFAULT 'standard'");
            expect(sanitized).toContain('DEFAULT true');
            expect(sanitized).toContain('DEFAULT CURRENT_DATE');
        });
    });

    describe('Foreign Key Constraint Fixes', () => {
        it('should handle duplicate constraint names', () => {
            const sql = `ALTER TABLE wizard_apprentices ADD CONSTRAINT fk_mentor FOREIGN KEY (mentor_id) REFERENCES wizards (id);
ALTER TABLE wizard_familiars ADD CONSTRAINT fk_mentor FOREIGN KEY (wizard_id) REFERENCES wizards (id);
ALTER TABLE wizard_spellbooks ADD CONSTRAINT fk_mentor FOREIGN KEY (owner_id) REFERENCES wizards (id);`;

            const sanitized = sanitizeSQLforDBML(sql);

            expect(sanitized).toContain('ADD CONSTRAINT fk_mentor FOREIGN KEY');
            expect(sanitized).toContain(
                'ADD CONSTRAINT fk_mentor_1 FOREIGN KEY'
            );
            expect(sanitized).toContain(
                'ADD CONSTRAINT fk_mentor_2 FOREIGN KEY'
            );
        });

        it('should preserve valid self-referential foreign keys but filter invalid ones', () => {
            const sql = `-- Valid self-references (different fields)
ALTER TABLE spell_components ADD CONSTRAINT fk_component_substitute FOREIGN KEY (substitute_id) REFERENCES spell_components (id);
ALTER TABLE guild_hierarchy ADD CONSTRAINT fk_parent_guild FOREIGN KEY (parent_guild_id) REFERENCES guild_hierarchy (guild_id);
ALTER TABLE "finance"."general_ledger" ADD CONSTRAINT fk_reversal FOREIGN KEY("reversal_id") REFERENCES "finance"."general_ledger"("ledger_id");

-- Invalid self-references (same field referencing itself)
ALTER TABLE quest_prerequisites ADD CONSTRAINT fk_quest_prereq FOREIGN KEY (quest_id) REFERENCES quest_prerequisites (quest_id);
ALTER TABLE "finance"."general_ledger" ADD CONSTRAINT fk_ledger_self FOREIGN KEY("ledger_id") REFERENCES "finance"."general_ledger"("ledger_id");
ALTER TABLE wizards ADD CONSTRAINT fk_wizard_self FOREIGN KEY (id) REFERENCES wizards (id);`;

            const sanitized = sanitizeSQLforDBML(sql);

            // Valid self-referential constraints should be preserved
            expect(sanitized).toContain(
                'ALTER TABLE spell_components ADD CONSTRAINT'
            );
            expect(sanitized).toContain(
                'ALTER TABLE guild_hierarchy ADD CONSTRAINT'
            );
            expect(sanitized).toMatch(
                /ALTER TABLE "finance"\."general_ledger".*fk_reversal.*FOREIGN KEY\("reversal_id"\)/
            );

            // Invalid self-referential constraints (same field to itself) should be commented out
            expect(sanitized).toContain('-- ALTER TABLE quest_prerequisites');
            expect(sanitized).toMatch(
                /-- ALTER TABLE "finance"\."general_ledger".*fk_ledger_self.*FOREIGN KEY\("ledger_id"\).*REFERENCES.*\("ledger_id"\)/
            );
            expect(sanitized).toContain(
                '-- ALTER TABLE wizards ADD CONSTRAINT fk_wizard_self'
            );
        });

        it('should not comment out normal foreign keys', () => {
            const sql = `ALTER TABLE dragon_hoards ADD CONSTRAINT fk_dragon FOREIGN KEY (dragon_id) REFERENCES dragons (id);
ALTER TABLE treasure_items ADD CONSTRAINT fk_hoard FOREIGN KEY (hoard_id) REFERENCES dragon_hoards (id);`;

            const sanitized = sanitizeSQLforDBML(sql);

            // Normal constraints should not be commented
            expect(sanitized).not.toContain('-- ALTER TABLE dragon_hoards');
            expect(sanitized).not.toContain('-- ALTER TABLE treasure_items');
        });
    });

    describe('PostgreSQL Type Casting Fixes', () => {
        it('should remove ::regclass type casts', () => {
            const sql = `CREATE TABLE enchantments (
  id serial PRIMARY KEY,
  enchantment_seq integer DEFAULT nextval('enchantments_id_seq'::regclass),
  power_level integer DEFAULT nextval('power_levels_seq': :regclass)
);`;

            const sanitized = sanitizeSQLforDBML(sql);

            expect(sanitized).not.toContain('::regclass');
            expect(sanitized).not.toContain(': :regclass');
            expect(sanitized).toContain("nextval('enchantments_id_seq')");
            expect(sanitized).toContain("nextval('power_levels_seq')");
        });
    });

    describe('Index Column Deduplication', () => {
        it('should remove duplicate columns from index definitions', () => {
            const sql = `CREATE UNIQUE INDEX idx_spell_components ON spell_recipes (spell_id, component_id, spell_id);
CREATE INDEX idx_merchant_location ON merchants (region, city, region);
CREATE UNIQUE INDEX idx_guild_member ON guild_members (guild_id, member_id, guild_id, member_id);`;

            const sanitized = sanitizeSQLforDBML(sql);

            expect(sanitized).toContain('(spell_id, component_id)');
            expect(sanitized).not.toContain('spell_id, component_id, spell_id');

            expect(sanitized).toContain('(region, city)');
            expect(sanitized).not.toContain('region, city, region');

            expect(sanitized).toContain('(guild_id, member_id)');
            expect(sanitized).not.toContain(
                'guild_id, member_id, guild_id, member_id'
            );
        });
    });

    describe('Special Character Replacement', () => {
        it('should replace ?? with __', () => {
            const sql = `CREATE TABLE mysterious_artifacts (
  id uuid PRIMARY KEY,
  name varchar(200) NOT NULL,
  origin varchar(100) DEFAULT 'Unknown??Realm',
  power_source varchar(50) DEFAULT '??Magic??'
);`;

            const sanitized = sanitizeSQLforDBML(sql);

            expect(sanitized).toContain("DEFAULT 'Unknown__Realm'");
            expect(sanitized).toContain("DEFAULT '__Magic__'");
            expect(sanitized).not.toContain('??');
        });
    });

    describe('Complex Real-World Scenario', () => {
        it('should handle the problematic SQL from the error message', () => {
            const sql = `CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE public.accounts (
  id uuid DEFAULT GEN_RANDOM_UUID PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  legal_name text NOT NULL,
  is_agency boolean NOT NULL DEFAULT FALSE,
  chargebee_customer_id text UNIQUE,
  currency_iso char(3) NOT NULL DEFAULT EUR,
  plan_id text NOT NULL,
  kickback_percent numeric,
  created_at text DEFAULT NOW,
  updated_at text DEFAULT NOW
);

CREATE TABLE public.monitoring_group_keywords (
  monitoring_group_id uuid PRIMARY KEY,
  keyword_id uuid PRIMARY KEY
);

CREATE TABLE public.account_users (
  account_id uuid,
  user_id uuid,
  role role_type NOT NULL,
  is_active boolean DEFAULT has default
);`;

            const sanitized = sanitizeSQLforDBML(sql);

            // Check all fixes were applied
            expect(sanitized).toContain('char(3)');
            expect(sanitized).not.toContain('char (3)');
            expect(sanitized).toContain("DEFAULT 'EUR'");
            expect(sanitized).not.toContain('DEFAULT EUR');
            expect(sanitized).toContain("DEFAULT 'NOW'"); // NOW is quoted in this case
            expect(sanitized).not.toContain('DEFAULT NOW,');

            // The composite primary key issue isn't fixed by sanitization
            // but by the exportBaseSQL function, so we just ensure
            // the SQL passes through without breaking
            expect(sanitized).toContain('monitoring_group_id uuid PRIMARY KEY');
        });
    });

    describe('Magic System Edge Cases', () => {
        it('should handle complex magical database structures', () => {
            const sql = `CREATE TABLE spell_matrices (
  id uuid PRIMARY KEY,
  matrix_pattern char (64) NOT NULL,
  mana_cost numeric(5,2) DEFAULT 10.00,
  element_type char (1) DEFAULT F,
  cast_time_ms integer DEFAULT 1000,
  created_at timestamp DEFAULT NOW,
  last_used timestamp DEFAULT NOW,
  effectiveness_rating numeric(3,2) DEFAULT has default
);

CREATE UNIQUE INDEX idx_matrix_pattern ON spell_matrices (matrix_pattern, matrix_pattern);

ALTER TABLE spell_matrices ADD CONSTRAINT fk_self_ref FOREIGN KEY (parent_matrix_id) REFERENCES spell_matrices (id);
ALTER TABLE spell_matrices ADD CONSTRAINT fk_creator FOREIGN KEY (creator_id) REFERENCES wizards (id);
ALTER TABLE spell_component_links ADD CONSTRAINT fk_creator FOREIGN KEY (link_id) REFERENCES component_links (id);`;

            const sanitized = sanitizeSQLforDBML(sql);

            // All fixes should be applied
            expect(sanitized).toContain('char(64)');
            expect(sanitized).toContain('char(1)');
            expect(sanitized).toContain("DEFAULT 'F'");
            expect(sanitized).toContain("DEFAULT 'NOW'"); // NOW is quoted as a single word
            expect(sanitized).toContain('(matrix_pattern)'); // Deduplicated
            // Valid self-referencing relationships (different fields) are preserved
            expect(sanitized).toContain(
                'ALTER TABLE spell_matrices ADD CONSTRAINT fk_self_ref'
            );
            expect(sanitized).not.toContain(
                '-- ALTER TABLE spell_matrices ADD CONSTRAINT fk_self_ref'
            );
            expect(sanitized).toContain(
                'ADD CONSTRAINT fk_creator FOREIGN KEY'
            );
            expect(sanitized).toContain(
                'ADD CONSTRAINT fk_creator_1 FOREIGN KEY'
            );
            expect(sanitized).toContain('DEFAULT has default'); // This should be handled by export function
        });
    });
});
