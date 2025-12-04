import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Junction Table Parsing - Spell Plans Database', () => {
    it('should parse all 3 tables (spell_plans, spells, plan_sample_spells) and 2 relationships', async () => {
        const sql = `-- Spell Plans Database with Enums and Junction Table
CREATE TYPE casting_difficulty AS ENUM ('simple', 'moderate', 'complex', 'arcane', 'forbidden');
CREATE TYPE magic_school AS ENUM ('elemental', 'healing', 'illusion', 'necromancy', 'transmutation');
CREATE TYPE spell_range AS ENUM ('touch', 'short', 'medium', 'long', 'sight');
CREATE TYPE component_type AS ENUM ('verbal', 'somatic', 'material', 'focus', 'divine');
CREATE TYPE power_source AS ENUM ('arcane', 'divine', 'nature', 'psionic', 'primal');

CREATE TABLE spell_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty casting_difficulty NOT NULL,
    school magic_school NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE spells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    mana_cost INTEGER NOT NULL,
    cast_time VARCHAR(100),
    range spell_range NOT NULL,
    components component_type[] NOT NULL,
    power_source power_source NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for showing sample spells in a spell plan
CREATE TABLE plan_sample_spells (
    spell_plan_id UUID NOT NULL REFERENCES spell_plans(id) ON DELETE CASCADE,
    spell_id UUID NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
    PRIMARY KEY (spell_plan_id, spell_id)
);`;

        const result = await fromPostgres(sql);

        // Verify parsing results
        expect(result.tables).toHaveLength(3);
        expect(result.relationships).toHaveLength(2);
        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(5);

        // Verify table names
        const tableNames = result.tables.map((t) => t.name).sort();
        expect(tableNames).toEqual([
            'plan_sample_spells',
            'spell_plans',
            'spells',
        ]);

        // Check plan_sample_spells specifically
        const planSampleSpells = result.tables.find(
            (t) => t.name === 'plan_sample_spells'
        );
        expect(planSampleSpells).toBeDefined();
        expect(planSampleSpells!.columns).toHaveLength(2);
    });

    it('should parse the exact junction table definition', async () => {
        const sql = `
-- Junction table for showing sample spells on a grimoire's page.
CREATE TABLE grimoire_sample_spells (
    grimoire_plan_id UUID NOT NULL REFERENCES grimoire_plans(id) ON DELETE CASCADE,
    spell_id UUID NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
    PRIMARY KEY (grimoire_plan_id, spell_id)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('grimoire_sample_spells');
        expect(result.tables[0].columns).toHaveLength(2);
    });
});
