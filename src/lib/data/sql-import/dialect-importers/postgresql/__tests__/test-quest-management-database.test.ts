import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL Quest Management Database', () => {
    it('should parse the magical quest management database', async () => {
        const sql = `-- Quest Management System Database
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Type definitions
CREATE TYPE quest_status AS ENUM ('draft', 'active', 'on_hold', 'completed', 'abandoned');
CREATE TYPE difficulty_level AS ENUM ('novice', 'apprentice', 'journeyman', 'expert', 'master');
CREATE TYPE reward_type AS ENUM ('gold', 'item', 'experience', 'reputation', 'special');
CREATE TYPE adventurer_rank AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'legendary');
CREATE TYPE region_climate AS ENUM ('temperate', 'arctic', 'desert', 'tropical', 'magical');

CREATE TABLE adventurers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rank adventurer_rank DEFAULT 'bronze',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE guild_masters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    specialization VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    climate region_climate NOT NULL,
    danger_level INTEGER CHECK (danger_level BETWEEN 1 AND 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE outposts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_id UUID REFERENCES regions(id),
    name VARCHAR(255) NOT NULL,
    location_coordinates POINT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE scouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    outpost_id UUID REFERENCES outposts(id),
    scouting_range INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE scout_region_assignments (
    scout_id UUID REFERENCES scouts(id),
    region_id UUID REFERENCES regions(id),
    assigned_date DATE NOT NULL,
    PRIMARY KEY (scout_id, region_id)
);

CREATE TABLE quest_givers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    title VARCHAR(100),
    location VARCHAR(255),
    reputation_required INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quest_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty difficulty_level NOT NULL,
    base_reward_gold INTEGER DEFAULT 0,
    quest_giver_id UUID REFERENCES quest_givers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quest_template_id UUID REFERENCES quest_templates(id),
    title VARCHAR(255) NOT NULL,
    status quest_status DEFAULT 'draft',
    reward_multiplier DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    reward_type reward_type NOT NULL,
    value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quest_sample_rewards (
    quest_template_id UUID REFERENCES quest_templates(id),
    reward_id UUID REFERENCES rewards(id),
    PRIMARY KEY (quest_template_id, reward_id)
);

CREATE TABLE quest_rotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rotation_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rotation_quests (
    rotation_id UUID REFERENCES quest_rotations(id),
    quest_id UUID REFERENCES quests(id),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7),
    PRIMARY KEY (rotation_id, quest_id, day_of_week)
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adventurer_id UUID REFERENCES adventurers(id),
    quest_id UUID REFERENCES quests(id),
    status quest_status DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE completion_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id),
    scout_id UUID REFERENCES scouts(id),
    verification_notes TEXT,
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bounties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id),
    amount_gold INTEGER NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE guild_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id),
    entry_type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reputation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adventurer_id UUID REFERENCES adventurers(id),
    quest_id UUID REFERENCES quests(id),
    reputation_change INTEGER NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quest_suspensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id),
    suspension_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE guild_master_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_master_id UUID REFERENCES guild_masters(id),
    action_type VARCHAR(100) NOT NULL,
    target_table VARCHAR(100),
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

        const result = await fromPostgres(sql);

        // Should parse tables despite extensions and custom types
        expect(result.tables.length).toBeGreaterThan(0);

        // Should have warnings about unsupported features
        expect(result.warnings).toBeDefined();
        expect(
            result.warnings!.some(
                (w) => w.includes('Extension') || w.includes('type')
            )
        ).toBe(true);

        // Should have parsed all 20 tables
        expect(result.tables).toHaveLength(20);

        const tableNames = result.tables.map((t) => t.name).sort();
        const expectedTables = [
            'adventurers',
            'guild_masters',
            'regions',
            'outposts',
            'scouts',
            'scout_region_assignments',
            'quest_givers',
            'quest_templates',
            'quests',
            'rewards',
            'quest_sample_rewards',
            'quest_rotations',
            'rotation_quests',
            'contracts',
            'completion_events',
            'bounties',
            'guild_ledgers',
            'reputation_logs',
            'quest_suspensions',
            'guild_master_actions',
        ];
        expect(tableNames).toEqual(expectedTables.sort());

        // Check that enum types were parsed
        expect(result.enums).toBeDefined();
        expect(result.enums!.length).toBe(5);

        // Check specific enums
        const questStatus = result.enums!.find(
            (e) => e.name === 'quest_status'
        );
        expect(questStatus).toBeDefined();
        expect(questStatus!.values).toEqual([
            'draft',
            'active',
            'on_hold',
            'completed',
            'abandoned',
        ]);

        // Check that custom enum types are handled in columns
        const contractsTable = result.tables.find(
            (t) => t.name === 'contracts'
        );
        expect(contractsTable).toBeDefined();
        const statusColumn = contractsTable!.columns.find(
            (c) => c.name === 'status'
        );
        expect(statusColumn).toBeDefined();
        expect(statusColumn?.type).toMatch(/quest_status/i);

        // Verify foreign keys are still extracted
        if (result.tables.length > 3) {
            expect(result.relationships.length).toBeGreaterThan(0);
        }
    });
});
