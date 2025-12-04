import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Dragon Status Enum Test', () => {
    it('should parse dragon_status enum specifically', async () => {
        const sql = `
CREATE TYPE dragon_status AS ENUM ('sleeping', 'hunting', 'guarding', 'hibernating', 'enraged');

CREATE TABLE dragons (
    id UUID PRIMARY KEY,
    status dragon_status DEFAULT 'sleeping'
);`;

        const result = await fromPostgres(sql);

        // Check that the enum was parsed
        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(1);
        expect(result.enums![0].name).toBe('dragon_status');
        expect(result.enums![0].values).toEqual([
            'sleeping',
            'hunting',
            'guarding',
            'hibernating',
            'enraged',
        ]);

        // Check that the table uses the enum
        const table = result.tables.find((t) => t.name === 'dragons');
        expect(table).toBeDefined();

        const statusColumn = table!.columns.find((c) => c.name === 'status');
        expect(statusColumn).toBeDefined();
        expect(statusColumn!.type).toBe('dragon_status');
    });

    it('should handle multiple enums including dragon_status', async () => {
        const sql = `
CREATE TYPE dragon_status AS ENUM ('sleeping', 'hunting', 'guarding', 'hibernating', 'enraged');
CREATE TYPE spell_power AS ENUM ('weak', 'strong');
CREATE TYPE magic_element AS ENUM ('fire', 'ice', 'both');

CREATE TABLE dragons (
    id UUID PRIMARY KEY,
    status dragon_status DEFAULT 'sleeping',
    breath_power spell_power NOT NULL,
    breath_element magic_element NOT NULL
);`;

        const result = await fromPostgres(sql);

        expect(result.enums).toHaveLength(3);

        // Specifically check for dragon_status
        const dragonStatus = result.enums!.find(
            (e) => e.name === 'dragon_status'
        );
        expect(dragonStatus).toBeDefined();
        expect(dragonStatus!.name).toBe('dragon_status');
    });
});
