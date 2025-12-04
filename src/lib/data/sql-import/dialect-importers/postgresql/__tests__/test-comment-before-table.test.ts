import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Table with Comment Before CREATE TABLE', () => {
    it('should parse table with single-line comment before CREATE TABLE', async () => {
        const sql = `
-- Junction table for tracking which crystals power which enchantments.
CREATE TABLE crystal_enchantments (
    crystal_id UUID NOT NULL REFERENCES crystals(id) ON DELETE CASCADE,
    enchantment_id UUID NOT NULL REFERENCES enchantments(id) ON DELETE CASCADE,
    PRIMARY KEY (crystal_id, enchantment_id)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('crystal_enchantments');
        expect(result.tables[0].columns).toHaveLength(2);
    });

    it('should handle various comment formats before CREATE TABLE', async () => {
        const sql = `
-- This is a wizards table
CREATE TABLE wizards (
    id UUID PRIMARY KEY
);

-- This table stores
-- multiple artifacts
CREATE TABLE artifacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

/* This is a multi-line
   comment before table */
CREATE TABLE quests (
    id BIGSERIAL PRIMARY KEY
);

-- Comment 1
-- Comment 2
-- Comment 3
CREATE TABLE spell_schools (
    id INTEGER PRIMARY KEY
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(4);
        const tableNames = result.tables.map((t) => t.name).sort();
        expect(tableNames).toEqual([
            'artifacts',
            'quests',
            'spell_schools',
            'wizards',
        ]);
    });

    it('should not confuse comment-only statements with tables', async () => {
        const sql = `
-- This is just a comment, not a table
-- Even though it mentions CREATE TABLE in the comment
-- It should not be parsed as a table

CREATE TABLE ancient_tome (
    id INTEGER PRIMARY KEY
);

-- Another standalone comment`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('ancient_tome');
    });
});
