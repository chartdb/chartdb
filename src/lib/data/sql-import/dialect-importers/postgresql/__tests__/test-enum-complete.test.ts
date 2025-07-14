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

        // Check enums
        console.log('\nEnum parsing results:');
        console.log(`Found ${result.enums?.length || 0} enum types`);

        if (result.enums) {
            result.enums.forEach((e) => {
                console.log(`  - ${e.name}: ${e.values.length} values`);
            });
        }

        // Expected enums
        const expectedEnums = [
            'wizard_rank',
            'spell_frequency',
            'magic_school',
            'quest_status',
            'dragon_mood',
        ];

        // Check which are missing
        const foundEnumNames = result.enums?.map((e) => e.name) || [];
        const missingEnums = expectedEnums.filter(
            (e) => !foundEnumNames.includes(e)
        );

        if (missingEnums.length > 0) {
            console.log('\nMissing enums:', missingEnums);

            // Let's check if they're in the SQL at all
            missingEnums.forEach((enumName) => {
                const regex = new RegExp(`CREATE\\s+TYPE\\s+${enumName}`, 'i');
                if (regex.test(sql)) {
                    console.log(
                        `  ${enumName} exists in SQL but wasn't parsed`
                    );

                    // Find the line
                    const lines = sql.split('\n');
                    const lineIndex = lines.findIndex((line) =>
                        regex.test(line)
                    );
                    if (lineIndex !== -1) {
                        console.log(
                            `    Line ${lineIndex + 1}: ${lines[lineIndex].trim()}`
                        );
                    }
                }
            });
        }

        // Convert to diagram
        const diagram = convertToChartDBDiagram(
            result,
            DatabaseType.POSTGRESQL,
            DatabaseType.POSTGRESQL
        );

        // Check custom types in diagram
        console.log(
            '\nCustom types in diagram:',
            diagram.customTypes?.length || 0
        );

        // Check wizards table
        const wizardsTable = diagram.tables?.find((t) => t.name === 'wizards');
        if (wizardsTable) {
            console.log('\nWizards table:');
            const rankField = wizardsTable.fields.find(
                (f) => f.name === 'rank'
            );
            if (rankField) {
                console.log(
                    `  rank field type: ${rankField.type.name} (id: ${rankField.type.id})`
                );
            }
        }

        // Check spellbooks table
        const spellbooksTable = diagram.tables?.find(
            (t) => t.name === 'spellbooks'
        );
        if (spellbooksTable) {
            console.log('\nSpellbooks table:');
            const frequencyField = spellbooksTable.fields.find(
                (f) => f.name === 'cast_frequency'
            );
            if (frequencyField) {
                console.log(
                    `  cast_frequency field type: ${frequencyField.type.name}`
                );
            }

            const schoolField = spellbooksTable.fields.find(
                (f) => f.name === 'primary_school'
            );
            if (schoolField) {
                console.log(
                    `  primary_school field type: ${schoolField.type.name}`
                );
            }
        }

        // Assertions
        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(5);
        expect(diagram.customTypes).toHaveLength(5);

        // Check that wizard_rank is present
        const wizardRankEnum = result.enums!.find(
            (e) => e.name === 'wizard_rank'
        );
        expect(wizardRankEnum).toBeDefined();

        // Check that the rank field uses wizard_rank type
        if (wizardsTable) {
            const rankField = wizardsTable.fields.find(
                (f) => f.name === 'rank'
            );
            expect(rankField?.type.name.toLowerCase()).toBe('wizard_rank');
        }
    });
});
