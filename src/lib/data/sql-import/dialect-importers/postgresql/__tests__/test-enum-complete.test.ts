import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';
import { convertToChartDBDiagram } from '../../../common';
import { DatabaseType } from '@/lib/domain/database-type';

describe('Complete Enum Test with Fantasy Example', () => {
    it('should parse all enums and use them in tables', async () => {
        const sql = `
-- Fantasy realm database with multiple enum types
CREATE TYPE wizard_rank AS ENUM ('apprentice', 'journeyman', 'master', 'archmage', 'legendary');
CREATE TYPE spell_frequency AS ENUM ('hourly', 'daily');
CREATE TYPE magic_school AS ENUM ('fire', 'water', 'earth');
CREATE TYPE quest_status AS ENUM ('pending', 'active', 'completed');
CREATE TYPE dragon_mood AS ENUM ('happy', 'grumpy', 'sleepy');

CREATE TABLE wizards (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    rank wizard_rank DEFAULT 'apprentice'
);

CREATE TABLE spellbooks (
    id UUID PRIMARY KEY,
    wizard_id UUID REFERENCES wizards(id),
    cast_frequency spell_frequency NOT NULL,
    primary_school magic_school NOT NULL
);

CREATE TABLE dragon_quests (
    id UUID PRIMARY KEY,
    status quest_status DEFAULT 'pending',
    dragon_mood dragon_mood
);
        `;

        // Parse the SQL
        const result = await fromPostgres(sql);

        // Convert to diagram
        const diagram = convertToChartDBDiagram(
            result,
            DatabaseType.POSTGRESQL,
            DatabaseType.POSTGRESQL
        );

        // Assertions
        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(5);
        expect(diagram.customTypes).toHaveLength(5);

        // Verify all expected enums are present
        const expectedEnums = [
            'wizard_rank',
            'spell_frequency',
            'magic_school',
            'quest_status',
            'dragon_mood',
        ];
        const foundEnumNames = result.enums!.map((e) => e.name);
        expectedEnums.forEach((enumName) => {
            expect(foundEnumNames).toContain(enumName);
        });

        // Check that wizard_rank is present with correct values
        const wizardRankEnum = result.enums!.find(
            (e) => e.name === 'wizard_rank'
        );
        expect(wizardRankEnum).toBeDefined();
        expect(wizardRankEnum!.values).toHaveLength(5);

        // Check that the rank field uses wizard_rank type
        const wizardsTable = diagram.tables?.find((t) => t.name === 'wizards');
        expect(wizardsTable).toBeDefined();
        const rankField = wizardsTable!.fields.find((f) => f.name === 'rank');
        expect(rankField).toBeDefined();
        expect(rankField!.type.name.toLowerCase()).toBe('wizard_rank');

        // Check spellbooks table enum fields
        const spellbooksTable = diagram.tables?.find(
            (t) => t.name === 'spellbooks'
        );
        expect(spellbooksTable).toBeDefined();

        const frequencyField = spellbooksTable!.fields.find(
            (f) => f.name === 'cast_frequency'
        );
        expect(frequencyField).toBeDefined();
        expect(frequencyField!.type.name.toLowerCase()).toBe('spell_frequency');

        const schoolField = spellbooksTable!.fields.find(
            (f) => f.name === 'primary_school'
        );
        expect(schoolField).toBeDefined();
        expect(schoolField!.type.name.toLowerCase()).toBe('magic_school');
    });
});
