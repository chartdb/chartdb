import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Diagnostic tests for magical spell parsing cases', () => {
    it('should correctly parse spells table with Ancient Fire Blast descriptions', async () => {
        const sql = `
CREATE TABLE spells (
    id UUID PRIMARY KEY,
    description TEXT, -- Overall description of the spell, e.g., "Ancient Fire Blast"
    category VARCHAR(50) NOT NULL
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        const spellsTable = result.tables[0];
        expect(spellsTable.name).toBe('spells');
        expect(spellsTable.columns).toHaveLength(3);

        // Verify all columns are present
        const columnNames = spellsTable.columns.map((c) => c.name);
        expect(columnNames).toContain('id');
        expect(columnNames).toContain('description');
        expect(columnNames).toContain('category');
    });

    it('should handle magical enum types with mixed quotes', async () => {
        const sql = `CREATE TYPE quote_test AS ENUM ('single', "double", 'mixed"quotes');`;

        const result = await fromPostgres(sql);

        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(1);
        expect(result.enums![0].values).toEqual([
            'single',
            'double',
            'mixed"quotes',
        ]);
    });
});
