import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Tables with undefined magical references', () => {
    it('should parse tables even with references to non-existent magical entities', async () => {
        const sql = `
CREATE TABLE table1 (
    id UUID PRIMARY KEY
);

CREATE TABLE table2 (
    id UUID PRIMARY KEY,
    nonexistent_id UUID REFERENCES nonexistent_table(id)
);

CREATE TABLE table3 (
    table1_id UUID REFERENCES table1(id),
    table2_id UUID REFERENCES table2(id),
    PRIMARY KEY (table1_id, table2_id)
);`;

        const result = await fromPostgres(sql);

        // Should parse all 3 tables even though table2 has undefined reference
        expect(result.tables).toHaveLength(3);

        const tableNames = result.tables.map((t) => t.name).sort();
        expect(tableNames).toEqual(['table1', 'table2', 'table3']);
    });

    it('should handle the wizard tower spells and spell plans scenario', async () => {
        const sql = `
CREATE TABLE spell_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

CREATE TABLE spells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wizard_tower_id UUID NOT NULL REFERENCES wizard_towers(id),
    name VARCHAR(255) NOT NULL
);

-- Junction table
CREATE TABLE plan_sample_spells (
    spell_plan_id UUID NOT NULL REFERENCES spell_plans(id),
    spell_id UUID NOT NULL REFERENCES spells(id),
    PRIMARY KEY (spell_plan_id, spell_id)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(3);
        expect(result.tables.map((t) => t.name).sort()).toEqual([
            'plan_sample_spells',
            'spell_plans',
            'spells',
        ]);
    });
});
