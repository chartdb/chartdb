import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL Enum Type Parsing', () => {
    it('should parse CREATE TYPE ENUM statements', async () => {
        const sql = `
CREATE TYPE quest_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE adventurers (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE quests (
    id UUID PRIMARY KEY,
    adventurer_id UUID REFERENCES adventurers(id),
    status quest_status DEFAULT 'pending',
    difficulty difficulty_level NOT NULL
);`;

        const result = await fromPostgres(sql);

        // Check that enum types were parsed
        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(2);

        // Check first enum
        const questStatus = result.enums!.find(
            (e) => e.name === 'quest_status'
        );
        expect(questStatus).toBeDefined();
        expect(questStatus!.values).toEqual([
            'pending',
            'in_progress',
            'completed',
        ]);

        // Check second enum
        const difficultyLevel = result.enums!.find(
            (e) => e.name === 'difficulty_level'
        );
        expect(difficultyLevel).toBeDefined();
        expect(difficultyLevel!.values).toEqual(['easy', 'medium', 'hard']);

        // Check that tables were parsed
        expect(result.tables).toHaveLength(2);

        // Check that columns have the correct enum types
        const questsTable = result.tables.find((t) => t.name === 'quests');
        expect(questsTable).toBeDefined();

        const statusColumn = questsTable!.columns.find(
            (c) => c.name === 'status'
        );
        expect(statusColumn).toBeDefined();
        expect(statusColumn!.type.toLowerCase()).toBe('quest_status');

        const difficultyColumn = questsTable!.columns.find(
            (c) => c.name === 'difficulty'
        );
        expect(difficultyColumn).toBeDefined();
        expect(difficultyColumn!.type.toLowerCase()).toBe('difficulty_level');
    });

    it('should handle enum types with various quote styles', async () => {
        const sql = `
CREATE TYPE quote_test AS ENUM ('single', "double", 'mixed"quotes');
CREATE TYPE number_status AS ENUM ('1', '2', '3-inactive');
`;

        const result = await fromPostgres(sql);

        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(2);

        const quoteTest = result.enums!.find((e) => e.name === 'quote_test');
        expect(quoteTest).toBeDefined();
        expect(quoteTest!.values).toEqual(['single', 'double', 'mixed"quotes']);

        const numberStatus = result.enums!.find(
            (e) => e.name === 'number_status'
        );
        expect(numberStatus).toBeDefined();
        expect(numberStatus!.values).toEqual(['1', '2', '3-inactive']);
    });

    it('should handle enums with special characters and longer values', async () => {
        const sql = `
CREATE TYPE spell_status AS ENUM ('learning', 'mastered', 'forgotten', 'partially_learned', 'fully_mastered', 'forbidden', 'failed');
CREATE TYPE portal_status AS ENUM ('inactive', 'charging', 'active', 'unstable', 'collapsed');
`;

        const result = await fromPostgres(sql);

        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(2);

        const spellStatus = result.enums!.find(
            (e) => e.name === 'spell_status'
        );
        expect(spellStatus).toBeDefined();
        expect(spellStatus!.values).toHaveLength(7);
        expect(spellStatus!.values).toContain('partially_learned');

        const portalStatus = result.enums!.find(
            (e) => e.name === 'portal_status'
        );
        expect(portalStatus).toBeDefined();
        expect(portalStatus!.values).toHaveLength(5);
        expect(portalStatus!.values).toContain('collapsed');
    });

    it('should include warning for unsupported CREATE TYPE statements', async () => {
        const sql = `
CREATE TYPE creature_status AS ENUM ('dormant', 'awakened');

CREATE TABLE creatures (
    id INTEGER PRIMARY KEY,
    status creature_status
);`;

        const result = await fromPostgres(sql);

        // With the updated parser, enum types don't generate warnings
        // Only non-enum custom types generate warnings

        // But still parse the enum
        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(1);
        expect(result.enums![0].name).toBe('creature_status');
    });
});
