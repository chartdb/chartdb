import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('String preservation during comment removal', () => {
    it('should preserve strings containing -- pattern', async () => {
        const sql = `
CREATE TABLE spell_ingredients (
    ingredient_id INTEGER PRIMARY KEY,
    preparation_note VARCHAR(100) DEFAULT '--grind finely'
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].columns).toHaveLength(2);

        const noteCol = result.tables[0].columns.find(
            (c) => c.name === 'preparation_note'
        );
        expect(noteCol).toBeDefined();
        expect(noteCol?.default).toBeDefined();
    });

    it('should preserve URL strings with double slashes', async () => {
        const sql = `
CREATE TABLE artifact_sources (
    artifact_id INTEGER,
    origin_url VARCHAR(200) DEFAULT 'https://ancient-library.realm'
);`;

        const result = await fromPostgres(sql);

        expect(result.tables[0].columns).toHaveLength(2);
        const urlCol = result.tables[0].columns.find(
            (c) => c.name === 'origin_url'
        );
        expect(urlCol).toBeDefined();
    });
});
