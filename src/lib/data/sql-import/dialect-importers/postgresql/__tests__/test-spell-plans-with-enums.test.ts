import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Exact forth example reproduction - Spell Plans Database', () => {
    it('should parse the exact SQL from forth example with spell plans and magical components', async () => {
        // Exact copy of the SQL that's failing
        const sql = `-- Using ENUM types for fixed sets of values improves data integrity.
CREATE TYPE quest_status AS ENUM ('active', 'paused', 'grace_period', 'expired', 'completed');
CREATE TYPE spell_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE magic_time AS ENUM ('dawn', 'dusk', 'both');
CREATE TYPE ritual_status AS ENUM ('pending', 'channeling', 'completed', 'failed', 'skipped');
CREATE TYPE mana_status AS ENUM ('pending', 'charged', 'depleted');

CREATE TABLE spell_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    duration_days INTEGER NOT NULL,
    total_skips INTEGER NOT NULL,
    validity_days INTEGER NOT NULL,
    mana_cost INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE spells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wizard_tower_id UUID NOT NULL REFERENCES wizard_towers(id),
    name VARCHAR(255) NOT NULL,
    description TEXT, -- Overall description of the spell, e.g.,"Ancient Fire Blast"
    category VARCHAR(50) NOT NULL, -- combat, healing
    -- Structured breakdown of the spell's components.
    -- Example: [{"name": "Dragon Scale", "category": "Reagent"}, {"name": "Phoenix Feather", "category": "Catalyst"} ] 
    components JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for showing sample spells on a plan's grimoire page.
CREATE TABLE plan_sample_spells (
    spell_plan_id UUID NOT NULL REFERENCES spell_plans(id) ON DELETE CASCADE,
    spell_id UUID NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
    PRIMARY KEY (spell_plan_id, spell_id)
);`;

        const result = await fromPostgres(sql);

        // Should have 3 tables
        expect(result.tables).toHaveLength(3);

        // Check all table names
        const tableNames = result.tables.map((t) => t.name).sort();
        expect(tableNames).toEqual([
            'plan_sample_spells',
            'spell_plans',
            'spells',
        ]);

        // Verify plan_sample_spells exists
        const planSampleSpells = result.tables.find(
            (t) => t.name === 'plan_sample_spells'
        );
        expect(planSampleSpells).toBeDefined();
        expect(planSampleSpells!.columns).toHaveLength(2);
    });
});
