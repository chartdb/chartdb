import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Test All Five Enums', () => {
    it('should find all 5 enums from the exact SQL in the file', async () => {
        // Exact copy from the file
        const sql = `
-- Using ENUM types for fixed sets of values improves data integrity.
CREATE TYPE quest_status AS ENUM ('active', 'paused', 'grace_period', 'expired', 'completed');
CREATE TYPE spell_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE magic_time AS ENUM ('dawn', 'dusk', 'both');
CREATE TYPE ritual_status AS ENUM ('pending', 'channeling', 'completed', 'failed', 'skipped');
CREATE TYPE mana_status AS ENUM ('pending', 'charged', 'depleted');
`;

        const result = await fromPostgres(sql);

        // Check we got all 5
        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(5);

        // Check each one exists
        const enumNames = result.enums!.map((e) => e.name).sort();
        expect(enumNames).toEqual([
            'magic_time',
            'mana_status',
            'quest_status',
            'ritual_status',
            'spell_frequency',
        ]);
    });

    it('should handle CREATE TYPE statements with semicolons on same line', async () => {
        // Test different formatting
        const sql = `CREATE TYPE quest_status AS ENUM ('active', 'paused', 'grace_period', 'expired', 'completed');
CREATE TYPE spell_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE magic_time AS ENUM ('dawn', 'dusk', 'both');
CREATE TYPE ritual_status AS ENUM ('pending', 'channeling', 'completed', 'failed', 'skipped');
CREATE TYPE mana_status AS ENUM ('pending', 'charged', 'depleted');`;

        const result = await fromPostgres(sql);

        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(5);

        // Specifically check quest_status
        const questStatus = result.enums!.find(
            (e) => e.name === 'quest_status'
        );
        expect(questStatus).toBeDefined();
        expect(questStatus!.values).toHaveLength(5);
        expect(questStatus!.values).toContain('grace_period');
    });
});
