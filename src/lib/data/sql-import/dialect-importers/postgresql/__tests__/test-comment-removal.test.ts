import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Comment removal before formatting', () => {
    it('should remove single-line comments', async () => {
        const sql = `
-- This is a comment that will be removed
CREATE TABLE magic_items (
    item_id INTEGER PRIMARY KEY, -- unique identifier
    spell_power VARCHAR(100) -- mystical energy level
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('magic_items');
        expect(result.tables[0].columns).toHaveLength(2);
    });

    it('should remove multi-line comments', async () => {
        const sql = `
/* This is a multi-line comment
   that spans multiple lines
   and will be removed */
CREATE TABLE wizard_inventory (
    wizard_id INTEGER PRIMARY KEY,
    /* Stores the magical
       artifacts collected */
    artifact_name VARCHAR(100)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('wizard_inventory');
    });

    it('should preserve strings that contain comment-like patterns', async () => {
        const sql = `
CREATE TABLE potion_recipes (
    recipe_id INTEGER PRIMARY KEY,
    brewing_note VARCHAR(100) DEFAULT '--shake before use',
    ingredient_source VARCHAR(200) DEFAULT 'https://alchemy.store',
    instructions TEXT DEFAULT '/* mix carefully */'
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].columns).toHaveLength(4);

        // Check that defaults are preserved
        const brewingNoteCol = result.tables[0].columns.find(
            (c) => c.name === 'brewing_note'
        );
        expect(brewingNoteCol?.default).toBeDefined();
    });

    it('should handle complex scenarios with comments before tables', async () => {
        const sql = `
-- Dragon types catalog
CREATE TABLE dragons (dragon_id INTEGER PRIMARY KEY);

/* Knights registry
   for the kingdom */
CREATE TABLE knights (knight_id INTEGER PRIMARY KEY);

-- Battle records junction
-- Tracks dragon-knight encounters
CREATE TABLE dragon_battles (
    dragon_id INTEGER REFERENCES dragons(dragon_id),
    knight_id INTEGER REFERENCES knights(knight_id),
    PRIMARY KEY (dragon_id, knight_id)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(3);
        const tableNames = result.tables.map((t) => t.name).sort();
        expect(tableNames).toEqual(['dragon_battles', 'dragons', 'knights']);
    });

    it('should handle the exact forth example scenario', async () => {
        const sql = `
CREATE TABLE spell_books (
    book_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL
);

CREATE TABLE spells (
    spell_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incantation VARCHAR(255) NOT NULL,
    effect TEXT, -- Magical effect description
    element VARCHAR(50) NOT NULL -- fire, water, earth, air
);

-- Junction table linking spells to their books.
CREATE TABLE book_spells (
    book_id UUID NOT NULL REFERENCES spell_books(book_id) ON DELETE CASCADE,
    spell_id UUID NOT NULL REFERENCES spells(spell_id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, spell_id)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(3);
        expect(result.tables.map((t) => t.name).sort()).toEqual([
            'book_spells',
            'spell_books',
            'spells',
        ]);
    });
});
