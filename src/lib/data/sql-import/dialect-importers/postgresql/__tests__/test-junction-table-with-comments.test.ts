import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('junction table parsing fix', () => {
    it('should parse table with single-line comment before CREATE TABLE', async () => {
        const sql = `
-- Junction table for tracking which wizards have learned which spells.
CREATE TABLE wizard_spellbook (
    wizard_id UUID NOT NULL REFERENCES wizards(id) ON DELETE CASCADE,
    spell_id UUID NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
    PRIMARY KEY (wizard_id, spell_id)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('wizard_spellbook');
        expect(result.tables[0].columns).toHaveLength(2);
        expect(result.tables[0].columns[0].name).toBe('wizard_id');
        expect(result.tables[0].columns[1].name).toBe('spell_id');
    });

    it('should handle multiple tables with comments', async () => {
        const sql = `
-- First table
CREATE TABLE mages (
    id UUID PRIMARY KEY
);

-- Junction table for tracking spellbook contents.
CREATE TABLE mage_grimoires (
    mage_id UUID NOT NULL REFERENCES mages(id) ON DELETE CASCADE,
    grimoire_id UUID NOT NULL REFERENCES grimoires(id) ON DELETE CASCADE,
    PRIMARY KEY (mage_id, grimoire_id)
);

-- Another table
CREATE TABLE grimoires (
    id UUID PRIMARY KEY
);

CREATE TABLE enchantments (
    id UUID PRIMARY KEY
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(4);
        const tableNames = result.tables.map((t) => t.name).sort();
        expect(tableNames).toEqual([
            'enchantments',
            'grimoires',
            'mage_grimoires',
            'mages',
        ]);

        // Verify mage_grimoires specifically
        const mageGrimoires = result.tables.find(
            (t) => t.name === 'mage_grimoires'
        );
        expect(mageGrimoires).toBeDefined();
        expect(mageGrimoires?.columns).toHaveLength(2);
    });

    it('should handle statements that start with comment but include CREATE TABLE', async () => {
        const sql = `
-- This comment mentions CREATE TABLE artifacts in the comment
-- but it's just a comment
;
-- This is the actual table
CREATE TABLE mystical_artifacts (
    id INTEGER PRIMARY KEY
);

-- Junction table for artifact_enchantments
CREATE TABLE artifact_enchantments (
    artifact_id INTEGER,
    enchantment_id INTEGER
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(2);
        const tableNames = result.tables.map((t) => t.name).sort();
        expect(tableNames).toEqual([
            'artifact_enchantments',
            'mystical_artifacts',
        ]);
    });

    it('should parse all three tables including junction table', async () => {
        const sql = `
CREATE TABLE spell_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE arcane_spells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incantation VARCHAR(255) NOT NULL,
    power_level INTEGER DEFAULT 1,
    mana_cost INTEGER NOT NULL
);

-- Junction table for categorizing spells
CREATE TABLE spell_categorization (
    category_id UUID NOT NULL REFERENCES spell_categories(id) ON DELETE CASCADE,
    spell_id UUID NOT NULL REFERENCES arcane_spells(id) ON DELETE CASCADE,
    PRIMARY KEY (category_id, spell_id)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(3);
        const tableNames = result.tables.map((t) => t.name).sort();
        expect(tableNames).toEqual([
            'arcane_spells',
            'spell_categories',
            'spell_categorization',
        ]);

        // Check the junction table exists and has correct structure
        const spellCategorization = result.tables.find(
            (t) => t.name === 'spell_categorization'
        );
        expect(spellCategorization).toBeDefined();
        expect(spellCategorization!.columns).toHaveLength(2);
        expect(spellCategorization!.columns.map((c) => c.name).sort()).toEqual([
            'category_id',
            'spell_id',
        ]);
    });
});
