import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Simple Enum Test', () => {
    it('should parse 5 simple enum types', async () => {
        // Test with just the enum definitions
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
    });

    it('should parse enums one by one', async () => {
        const enums = [
            {
                sql: "CREATE TYPE quest_status AS ENUM ('active', 'paused', 'grace_period', 'expired', 'completed');",
                name: 'quest_status',
                values: [
                    'active',
                    'paused',
                    'grace_period',
                    'expired',
                    'completed',
                ],
            },
            {
                sql: "CREATE TYPE spell_frequency AS ENUM ('daily', 'weekly');",
                name: 'spell_frequency',
                values: ['daily', 'weekly'],
            },
        ];

        for (const enumDef of enums) {
            const result = await fromPostgres(enumDef.sql);

            expect(result.enums).toBeDefined();
            expect(result.enums).toHaveLength(1);
            expect(result.enums![0].name).toBe(enumDef.name);
            expect(result.enums![0].values).toEqual(enumDef.values);
        }
    });
});
