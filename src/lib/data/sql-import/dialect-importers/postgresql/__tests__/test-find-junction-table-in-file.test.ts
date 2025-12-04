import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Debug Missing Junction Table', () => {
    it('should find quest_sample_rewards junction table in the quest management system', async () => {
        const sql = `-- Quest Management System Database with Junction Tables
CREATE TYPE quest_status AS ENUM ('draft', 'active', 'on_hold', 'completed', 'abandoned');
CREATE TYPE difficulty_level AS ENUM ('novice', 'apprentice', 'journeyman', 'expert', 'master');
CREATE TYPE reward_type AS ENUM ('gold', 'item', 'experience', 'reputation', 'special');
CREATE TYPE adventurer_rank AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'legendary');
CREATE TYPE region_climate AS ENUM ('temperate', 'arctic', 'desert', 'tropical', 'magical');

CREATE TABLE adventurers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rank adventurer_rank DEFAULT 'bronze'
);

CREATE TABLE guild_masters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    climate region_climate NOT NULL
);

CREATE TABLE outposts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES regions(id),
    name VARCHAR(255) NOT NULL
);

CREATE TABLE scouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    outpost_id UUID REFERENCES outposts(id)
);

CREATE TABLE scout_region_assignments (
    scout_id UUID REFERENCES scouts(id),
    region_id UUID REFERENCES regions(id),
    assigned_date DATE NOT NULL,
    PRIMARY KEY (scout_id, region_id)
);

CREATE TABLE quest_givers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    title VARCHAR(100)
);

CREATE TABLE quest_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty difficulty_level NOT NULL
);

CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_template_id UUID REFERENCES quest_templates(id),
    title VARCHAR(255) NOT NULL,
    status quest_status DEFAULT 'draft'
);

CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    reward_type reward_type NOT NULL,
    value INTEGER NOT NULL
);

-- Junction table for quest template sample rewards
CREATE TABLE quest_sample_rewards (
    quest_template_id UUID REFERENCES quest_templates(id),
    reward_id UUID REFERENCES rewards(id),
    PRIMARY KEY (quest_template_id, reward_id)
);

CREATE TABLE quest_rotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rotation_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL
);

CREATE TABLE rotation_quests (
    rotation_id UUID REFERENCES quest_rotations(id),
    quest_id UUID REFERENCES quests(id),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7),
    PRIMARY KEY (rotation_id, quest_id, day_of_week)
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adventurer_id UUID REFERENCES adventurers(id),
    quest_id UUID REFERENCES quests(id),
    status quest_status DEFAULT 'active'
);

CREATE TABLE completion_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    scout_id UUID REFERENCES scouts(id)
);

CREATE TABLE bounties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    amount_gold INTEGER NOT NULL
);

CREATE TABLE guild_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    entry_type VARCHAR(50) NOT NULL
);

CREATE TABLE reputation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adventurer_id UUID REFERENCES adventurers(id),
    quest_id UUID REFERENCES quests(id)
);

CREATE TABLE quest_suspensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    suspension_date DATE NOT NULL
);

CREATE TABLE guild_master_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_master_id UUID REFERENCES guild_masters(id),
    action_type VARCHAR(100) NOT NULL
);`;

        // First, verify the table exists in the SQL
        const tableExists = sql.includes('CREATE TABLE quest_sample_rewards');

        // Now parse
        const result = await fromPostgres(sql);

        // Look for quest_sample_rewards
        const questSampleRewards = result.tables.find(
            (t) => t.name === 'quest_sample_rewards'
        );

        // The test expectation
        expect(tableExists).toBe(true);
        expect(result.tables.length).toBeGreaterThanOrEqual(19); // At least 19 tables
        expect(questSampleRewards).toBeDefined();

        // Verify quest_sample_rewards has correct columns
        expect(questSampleRewards!.columns).toHaveLength(2);
        const columnNames = questSampleRewards!.columns.map((c) => c.name);
        expect(columnNames).toContain('quest_template_id');
        expect(columnNames).toContain('reward_id');

        // Verify no parsing warnings for this table
        const questSampleRewardsWarnings = result.warnings?.filter((w) =>
            w.includes('quest_sample_rewards')
        );
        expect(questSampleRewardsWarnings?.length ?? 0).toBe(0);
    });
});
