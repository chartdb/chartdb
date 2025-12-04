import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Missing quest_status Bug - Magical Quest Management System', () => {
    it('should parse all 5 magical enums including quest_status for adventurer tracking', async () => {
        // Exact content from the file
        const sql = `
-- ##################################################
-- # TYPE DEFINITIONS
-- ##################################################

-- Using ENUM types for fixed sets of values improves data integrity.
CREATE TYPE quest_status AS ENUM ('active', 'paused', 'grace_period', 'expired', 'completed');
CREATE TYPE spell_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE magic_time AS ENUM ('dawn', 'dusk', 'both');
CREATE TYPE ritual_status AS ENUM ('pending', 'channeling', 'completed', 'failed', 'skipped');
CREATE TYPE mana_status AS ENUM ('pending', 'charged', 'depleted');
`;

        const result = await fromPostgres(sql);

        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(5);

        // Specifically check for quest_status
        const questStatus = result.enums!.find(
            (e) => e.name === 'quest_status'
        );
        expect(questStatus).toBeDefined();
        expect(questStatus!.name).toBe('quest_status');
        expect(questStatus!.values).toEqual([
            'active',
            'paused',
            'grace_period',
            'expired',
            'completed',
        ]);
    });

    it('should also work with the improved parser for magical quest and spell enums', async () => {
        const sql = `
CREATE TYPE quest_status AS ENUM ('active', 'paused', 'grace_period', 'expired', 'completed');
CREATE TYPE spell_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE magic_time AS ENUM ('dawn', 'dusk', 'both');
CREATE TYPE ritual_status AS ENUM ('pending', 'channeling', 'completed', 'failed', 'skipped');
CREATE TYPE mana_status AS ENUM ('pending', 'charged', 'depleted');
`;

        const result = await fromPostgres(sql);

        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(5);

        const enumNames = result.enums!.map((e) => e.name).sort();
        expect(enumNames).toEqual([
            'magic_time',
            'mana_status',
            'quest_status',
            'ritual_status',
            'spell_frequency',
        ]);
    });
});
