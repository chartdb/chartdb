import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Test All 5 Enums', () => {
    it('should parse all 5 enum types', async () => {
        // Test with exact SQL from the file
        const sql = `
-- Using ENUM types for fixed sets of values improves data integrity.
CREATE TYPE quest_status AS ENUM ('active', 'paused', 'grace_period', 'expired', 'completed');
CREATE TYPE spell_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE magic_time AS ENUM ('dawn', 'dusk', 'both');
CREATE TYPE ritual_status AS ENUM ('pending', 'channeling', 'completed', 'failed', 'skipped');
CREATE TYPE mana_status AS ENUM ('pending', 'charged', 'depleted');

CREATE TABLE spellbooks (
    id UUID PRIMARY KEY,
    status quest_status DEFAULT 'active',
    cast_frequency spell_frequency NOT NULL,
    cast_time magic_time NOT NULL
);
`;

        const result = await fromPostgres(sql);

        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(5);

        // Check all enum names
        const enumNames = result.enums!.map((e) => e.name).sort();
        expect(enumNames).toEqual([
            'magic_time',
            'mana_status',
            'quest_status',
            'ritual_status',
            'spell_frequency',
        ]);

        // Check quest_status specifically
        const questStatus = result.enums!.find(
            (e) => e.name === 'quest_status'
        );
        expect(questStatus).toBeDefined();
        expect(questStatus!.values).toEqual([
            'active',
            'paused',
            'grace_period',
            'expired',
            'completed',
        ]);
    });
});
