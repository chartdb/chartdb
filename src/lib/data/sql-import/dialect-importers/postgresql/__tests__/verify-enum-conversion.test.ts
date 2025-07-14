import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';
import { convertToChartDBDiagram } from '../../../common';
import { DatabaseType } from '@/lib/domain/database-type';
import { DBCustomTypeKind } from '@/lib/domain/db-custom-type';

describe('PostgreSQL Enum Type Conversion to Diagram', () => {
    it('should convert enum types to custom types in diagram', async () => {
        const sql = `
CREATE TYPE wizard_rank AS ENUM ('apprentice', 'master', 'archmage');
CREATE TYPE spell_element AS ENUM ('fire', 'water', 'both');

CREATE TABLE wizards (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL
);

CREATE TABLE spellbooks (
    id UUID PRIMARY KEY,
    wizard_id UUID REFERENCES wizards(id),
    rank wizard_rank DEFAULT 'apprentice',
    primary_element spell_element NOT NULL
);`;

        // Parse SQL
        const parserResult = await fromPostgres(sql);

        // Convert to diagram
        const diagram = convertToChartDBDiagram(
            parserResult,
            DatabaseType.POSTGRESQL,
            DatabaseType.POSTGRESQL
        );

        // Check that custom types were created in the diagram
        expect(diagram.customTypes).toBeDefined();
        expect(diagram.customTypes).toHaveLength(2);

        // Check first custom type
        const wizardRankType = diagram.customTypes!.find(
            (t) => t.name === 'wizard_rank'
        );
        expect(wizardRankType).toBeDefined();
        expect(wizardRankType!.kind).toBe(DBCustomTypeKind.enum);
        expect(wizardRankType!.values).toEqual([
            'apprentice',
            'master',
            'archmage',
        ]);
        expect(wizardRankType!.schema).toBe('public');

        // Check second custom type
        const spellElementType = diagram.customTypes!.find(
            (t) => t.name === 'spell_element'
        );
        expect(spellElementType).toBeDefined();
        expect(spellElementType!.kind).toBe(DBCustomTypeKind.enum);
        expect(spellElementType!.values).toEqual(['fire', 'water', 'both']);

        // Check that tables use the enum types
        const spellbooksTable = diagram.tables!.find(
            (t) => t.name === 'spellbooks'
        );
        expect(spellbooksTable).toBeDefined();

        // Find columns that use enum types
        const rankField = spellbooksTable!.fields.find(
            (f) => f.name === 'rank'
        );
        expect(rankField).toBeDefined();
        // The type should be preserved as the enum name
        expect(rankField!.type.name.toLowerCase()).toBe('wizard_rank');

        const elementField = spellbooksTable!.fields.find(
            (f) => f.name === 'primary_element'
        );
        expect(elementField).toBeDefined();
        expect(elementField!.type.name.toLowerCase()).toBe('spell_element');
    });

    it('should handle fantasy realm SQL with all enum types', async () => {
        // Fantasy realm example with all enum types
        const sql = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE wizard_rank AS ENUM ('apprentice', 'journeyman', 'master', 'archmage', 'legendary');
CREATE TYPE spell_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE magic_element AS ENUM ('fire', 'water', 'earth');
CREATE TYPE quest_status AS ENUM ('pending', 'active', 'completed', 'failed', 'abandoned');
CREATE TYPE dragon_mood AS ENUM ('happy', 'content', 'grumpy');

CREATE TABLE wizards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    magic_id VARCHAR(15) UNIQUE NOT NULL
);

CREATE TABLE spellbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wizard_id UUID NOT NULL REFERENCES wizards(id),
    cast_frequency spell_frequency NOT NULL,
    primary_element magic_element NOT NULL,
    owner_rank wizard_rank DEFAULT 'apprentice'
);

CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spellbook_id UUID NOT NULL REFERENCES spellbooks(id),
    status quest_status DEFAULT 'pending'
);

CREATE TABLE dragons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wizard_id UUID NOT NULL REFERENCES wizards(id),
    mood dragon_mood NOT NULL
);`;

        const parserResult = await fromPostgres(sql);
        const diagram = convertToChartDBDiagram(
            parserResult,
            DatabaseType.POSTGRESQL,
            DatabaseType.POSTGRESQL
        );

        // Should have all 5 enum types
        expect(diagram.customTypes).toBeDefined();
        expect(diagram.customTypes).toHaveLength(5);

        // Check all enum types are present
        const enumNames = diagram.customTypes!.map((t) => t.name).sort();
        expect(enumNames).toEqual([
            'dragon_mood',
            'magic_element',
            'quest_status',
            'spell_frequency',
            'wizard_rank',
        ]);

        // Verify each enum has the correct values
        const spellFreq = diagram.customTypes!.find(
            (t) => t.name === 'spell_frequency'
        );
        expect(spellFreq!.values).toEqual(['daily', 'weekly']);

        const questStatus = diagram.customTypes!.find(
            (t) => t.name === 'quest_status'
        );
        expect(questStatus!.values).toEqual([
            'pending',
            'active',
            'completed',
            'failed',
            'abandoned',
        ]);

        // Check that tables reference the enum types correctly
        const spellbooksTable = diagram.tables!.find(
            (t) => t.name === 'spellbooks'
        );
        const castFreqField = spellbooksTable!.fields.find(
            (f) => f.name === 'cast_frequency'
        );
        expect(castFreqField!.type.name.toLowerCase()).toBe('spell_frequency');
    });
});
