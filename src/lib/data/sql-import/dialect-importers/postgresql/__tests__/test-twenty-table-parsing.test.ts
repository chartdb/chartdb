import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Full database import - 20 tables verification', () => {
    it('should parse all 20 tables from quest management system', async () => {
        const sql = `-- Quest Management System Database
CREATE TYPE quest_status AS ENUM ('draft', 'active', 'on_hold', 'completed', 'abandoned');
CREATE TYPE difficulty_level AS ENUM ('novice', 'apprentice', 'journeyman', 'expert', 'master');
CREATE TYPE reward_type AS ENUM ('gold', 'item', 'experience', 'reputation', 'special');
CREATE TYPE adventurer_rank AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'legendary');
CREATE TYPE region_climate AS ENUM ('temperate', 'arctic', 'desert', 'tropical', 'magical');

CREATE TABLE adventurers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rank adventurer_rank DEFAULT 'bronze',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guild_masters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    specialization VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    climate region_climate NOT NULL,
    danger_level INTEGER CHECK (danger_level BETWEEN 1 AND 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE outposts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES regions(id),
    name VARCHAR(255) NOT NULL,
    location_coordinates POINT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    outpost_id UUID REFERENCES outposts(id),
    scouting_range INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    title VARCHAR(100),
    location VARCHAR(255),
    reputation_required INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quest_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty difficulty_level NOT NULL,
    base_reward_gold INTEGER DEFAULT 0,
    quest_giver_id UUID REFERENCES quest_givers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_template_id UUID REFERENCES quest_templates(id),
    title VARCHAR(255) NOT NULL,
    status quest_status DEFAULT 'draft',
    reward_multiplier DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    reward_type reward_type NOT NULL,
    value INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quest_sample_rewards (
    quest_template_id UUID REFERENCES quest_templates(id),
    reward_id UUID REFERENCES rewards(id),
    PRIMARY KEY (quest_template_id, reward_id)
);

CREATE TABLE quest_rotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rotation_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    status quest_status DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE completion_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    scout_id UUID REFERENCES scouts(id),
    verification_notes TEXT,
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bounties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    amount_gold INTEGER NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guild_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    entry_type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reputation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adventurer_id UUID REFERENCES adventurers(id),
    quest_id UUID REFERENCES quests(id),
    reputation_change INTEGER NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quest_suspensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    suspension_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guild_master_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_master_id UUID REFERENCES guild_masters(id),
    action_type VARCHAR(100) NOT NULL,
    target_table VARCHAR(100),
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

        // Expected tables for the quest management system
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
            'quest_sample_rewards', // Junction table that must be included!
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

        const result = await fromPostgres(sql);

        console.log('\n=== PARSING RESULTS ===');
        console.log(`Tables parsed: ${result.tables.length}`);
        console.log(`Expected: ${expectedTables.length}`);

        const parsedTableNames = result.tables.map((t) => t.name).sort();
        console.log('\nParsed tables:');
        parsedTableNames.forEach((name, i) => {
            console.log(`  ${i + 1}. ${name}`);
        });

        // Find missing tables
        const missingTables = expectedTables.filter(
            (expected) => !parsedTableNames.includes(expected)
        );
        if (missingTables.length > 0) {
            console.log('\nMissing tables:');
            missingTables.forEach((name) => {
                console.log(`  - ${name}`);
            });
        }

        // Check for quest_sample_rewards specifically
        const questSampleRewards = result.tables.find(
            (t) => t.name === 'quest_sample_rewards'
        );
        console.log(`\nquest_sample_rewards found: ${!!questSampleRewards}`);
        if (questSampleRewards) {
            console.log('quest_sample_rewards details:');
            console.log(`  - Columns: ${questSampleRewards.columns.length}`);
            questSampleRewards.columns.forEach((col) => {
                console.log(`    - ${col.name}: ${col.type}`);
            });
        }

        // Verify all tables were parsed
        expect(result.tables).toHaveLength(expectedTables.length);
        expect(parsedTableNames).toEqual(expectedTables.sort());

        // Specifically check quest_sample_rewards junction table
        expect(questSampleRewards).toBeDefined();
        expect(questSampleRewards!.columns).toHaveLength(2);

        const columnNames = questSampleRewards!.columns
            .map((c) => c.name)
            .sort();
        expect(columnNames).toEqual(['quest_template_id', 'reward_id']);

        // Check warnings if any
        if (result.warnings && result.warnings.length > 0) {
            console.log('\nWarnings:');
            result.warnings.forEach((w) => console.log(`  - ${w}`));
        }
    });
});
