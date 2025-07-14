import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Junction Table Parsing', () => {
    it('should parse junction table with composite primary key', async () => {
        const sql = `
CREATE TABLE spell_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL
);

CREATE TABLE spells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incantation VARCHAR(100) NOT NULL
);

-- Junction table for tracking which spells are contained in which books.
CREATE TABLE book_spells (
    spell_book_id UUID NOT NULL REFERENCES spell_books(id) ON DELETE CASCADE,
    spell_id UUID NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
    PRIMARY KEY (spell_book_id, spell_id)
);`;

        const result = await fromPostgres(sql);

        // Should parse all 3 tables
        expect(result.tables).toHaveLength(3);

        const tableNames = result.tables.map((t) => t.name).sort();
        expect(tableNames).toEqual(['book_spells', 'spell_books', 'spells']);

        // Check book_spells specifically
        const bookSpells = result.tables.find((t) => t.name === 'book_spells');
        expect(bookSpells).toBeDefined();
        expect(bookSpells!.columns).toHaveLength(2);

        const columnNames = bookSpells!.columns.map((c) => c.name).sort();
        expect(columnNames).toEqual(['spell_book_id', 'spell_id']);

        // Check that both columns are recognized as foreign keys
        const spellBookIdColumn = bookSpells!.columns.find(
            (c) => c.name === 'spell_book_id'
        );
        expect(spellBookIdColumn).toBeDefined();
        expect(spellBookIdColumn!.type).toBe('UUID');
        expect(spellBookIdColumn!.nullable).toBe(false);

        const spellIdColumn = bookSpells!.columns.find(
            (c) => c.name === 'spell_id'
        );
        expect(spellIdColumn).toBeDefined();
        expect(spellIdColumn!.type).toBe('UUID');
        expect(spellIdColumn!.nullable).toBe(false);
    });

    it('should handle various junction table formats', async () => {
        const sql = `
-- Format 1: Inline references
CREATE TABLE artifact_enchantments (
    artifact_id INTEGER NOT NULL REFERENCES artifacts(id),
    enchantment_id INTEGER NOT NULL REFERENCES enchantments(id),
    PRIMARY KEY (artifact_id, enchantment_id)
);

-- Format 2: With additional columns
CREATE TABLE wizard_guilds (
    wizard_id UUID NOT NULL REFERENCES wizards(id),
    guild_id UUID NOT NULL REFERENCES guilds(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    recruited_by UUID REFERENCES wizards(id),
    PRIMARY KEY (wizard_id, guild_id)
);

-- Format 3: With named constraint
CREATE TABLE potion_ingredients (
    potion_id BIGINT NOT NULL REFERENCES potions(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    CONSTRAINT pk_potion_ingredients PRIMARY KEY (potion_id, ingredient_id)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(3);

        // All tables should be found
        const tableNames = result.tables.map((t) => t.name).sort();
        expect(tableNames).toEqual([
            'artifact_enchantments',
            'potion_ingredients',
            'wizard_guilds',
        ]);

        // Check each table has the expected columns
        const artifactEnchantments = result.tables.find(
            (t) => t.name === 'artifact_enchantments'
        );
        expect(artifactEnchantments!.columns).toHaveLength(2);

        const wizardGuilds = result.tables.find(
            (t) => t.name === 'wizard_guilds'
        );
        expect(wizardGuilds!.columns).toHaveLength(4); // Including joined_at and recruited_by

        const potionIngredients = result.tables.find(
            (t) => t.name === 'potion_ingredients'
        );
        expect(potionIngredients!.columns).toHaveLength(3); // Including quantity
    });
});
