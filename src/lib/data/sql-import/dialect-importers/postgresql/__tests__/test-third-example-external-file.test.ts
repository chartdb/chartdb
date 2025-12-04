import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';
import { convertToChartDBDiagram } from '../../../common';
import { DatabaseType } from '@/lib/domain/database-type';

describe('Enum Parsing Test - Quest Management System', () => {
    it('should parse all 5 enums from the quest management database', async () => {
        const sql = `-- Quest Management System with Enums
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

CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    climate region_climate NOT NULL,
    danger_level INTEGER CHECK (danger_level BETWEEN 1 AND 10)
);

CREATE TABLE quest_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty difficulty_level NOT NULL,
    base_reward_gold INTEGER DEFAULT 0
);

CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_template_id UUID REFERENCES quest_templates(id),
    title VARCHAR(255) NOT NULL,
    status quest_status DEFAULT 'draft',
    reward_multiplier DECIMAL(3,2) DEFAULT 1.0
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adventurer_id UUID REFERENCES adventurers(id),
    quest_id UUID REFERENCES quests(id),
    status quest_status DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID REFERENCES quests(id),
    adventurer_id UUID REFERENCES adventurers(id),
    reward_type reward_type NOT NULL,
    value INTEGER NOT NULL
);`;

        // Use the improved parser
        const parserResult = await fromPostgres(sql);

        // Convert to diagram
        const diagram = convertToChartDBDiagram(
            parserResult,
            DatabaseType.POSTGRESQL,
            DatabaseType.POSTGRESQL
        );

        // Assertions
        expect(parserResult.enums).toHaveLength(5);
        expect(diagram.customTypes).toHaveLength(5);

        // Check quest_status specifically
        const questStatusParser = parserResult.enums?.find(
            (e) => e.name === 'quest_status'
        );
        expect(questStatusParser).toBeDefined();

        const questStatusDiagram = diagram.customTypes?.find(
            (t) => t.name === 'quest_status'
        );
        expect(questStatusDiagram).toBeDefined();

        // Check that status field uses the enum
        const questsTable = diagram.tables?.find((t) => t.name === 'quests');
        if (questsTable) {
            const statusField = questsTable.fields.find(
                (f) => f.name === 'status'
            );
            expect(statusField?.type.name).toBe('quest_status');
        }
    });
});
