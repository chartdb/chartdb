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

        console.log('Spells table result:', {
            tableCount: result.tables.length,
            columns: result.tables[0]?.columns.map((c) => ({
                name: c.name,
                type: c.type,
            })),
        });

        expect(result.tables).toHaveLength(1);
        const spellsTable = result.tables[0];
        expect(spellsTable.name).toBe('spells');

        // Debug: list all columns found
        console.log('Columns found:', spellsTable.columns.length);
        spellsTable.columns.forEach((col, idx) => {
            console.log(`  ${idx + 1}. ${col.name}: ${col.type}`);
        });

        expect(spellsTable.columns).toHaveLength(3);
    });

    it('should handle magical enum types with mixed quotes', async () => {
        const sql = `CREATE TYPE quote_test AS ENUM ('single', "double", 'mixed"quotes');`;

        const result = await fromPostgres(sql);

        console.log('Enum result:', {
            enumCount: result.enums?.length || 0,
            values: result.enums?.[0]?.values,
        });

        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(1);
        expect(result.enums![0].values).toEqual([
            'single',
            'double',
            'mixed"quotes',
        ]);
    });
});
