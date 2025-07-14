import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL Minimal Type Test', () => {
    it('should handle CREATE EXTENSION, CREATE TYPE, and multi-line comments', async () => {
        const sql = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE spell_time AS ENUM ('dawn', 'dusk', 'both');

CREATE TABLE spells (
    id UUID PRIMARY KEY,
    description TEXT, -- Overall description of the spell, e.g., "Ancient Fire Blast"
    category VARCHAR(50) NOT NULL
);

CREATE TABLE rituals (
    id UUID PRIMARY KEY,
    day_of_week INTEGER NOT NULL, -- 1=Monday, 7=Sunday
    cast_time spell_time NOT NULL
);`;

        const result = await fromPostgres(sql);

        // Should parse tables
        expect(result.tables).toHaveLength(2);
        expect(result.tables.map((t) => t.name).sort()).toEqual([
            'rituals',
            'spells',
        ]);

        // Should have warnings about extension and type
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.some((w) => w.includes('Extension'))).toBe(
            true
        );
        // Enum types no longer generate warnings with the updated parser

        // Check that the enum was parsed
        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(1);
        expect(result.enums![0].name).toBe('spell_time');
        expect(result.enums![0].values).toEqual(['dawn', 'dusk', 'both']);

        // Check that multi-line comments were handled
        const spellsTable = result.tables.find((t) => t.name === 'spells');
        expect(spellsTable).toBeDefined();
        expect(spellsTable!.columns).toHaveLength(3); // id, description, category

        const ritualsTable = result.tables.find((t) => t.name === 'rituals');
        expect(ritualsTable).toBeDefined();
        expect(ritualsTable!.columns).toHaveLength(3); // id, day_of_week, cast_time

        // Custom type should be preserved (possibly uppercase)
        const castTimeColumn = ritualsTable!.columns.find(
            (c) => c.name === 'cast_time'
        );
        expect(castTimeColumn).toBeDefined();
        expect(castTimeColumn!.type.toLowerCase()).toBe('spell_time');
    });
});
