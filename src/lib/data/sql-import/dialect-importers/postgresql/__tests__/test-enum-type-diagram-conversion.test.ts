import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';
import { convertToChartDBDiagram } from '../../../common';
import { DatabaseType } from '@/lib/domain/database-type';

describe('Enum to Diagram Conversion', () => {
    it('should convert all enums and use them in table columns', async () => {
        const sql = `
CREATE TYPE wizard_rank AS ENUM ('apprentice', 'journeyman', 'master', 'archmage', 'legendary');
CREATE TYPE spell_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE magic_school AS ENUM ('fire', 'water', 'both');

CREATE TABLE spellbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wizard_id UUID NOT NULL,
    cast_frequency spell_frequency NOT NULL,
    primary_school magic_school NOT NULL,
    rank wizard_rank DEFAULT 'apprentice',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

        // Parse SQL
        const parserResult = await fromPostgres(sql);

        // Should find all 3 enums
        expect(parserResult.enums).toHaveLength(3);

        // Convert to diagram
        const diagram = convertToChartDBDiagram(
            parserResult,
            DatabaseType.POSTGRESQL,
            DatabaseType.POSTGRESQL
        );

        // Should have 3 custom types
        expect(diagram.customTypes).toHaveLength(3);

        // Check spellbooks table
        const spellbooksTable = diagram.tables?.find(
            (t) => t.name === 'spellbooks'
        );
        expect(spellbooksTable).toBeDefined();

        // Check that enum columns use the correct types
        const rankField = spellbooksTable!.fields.find(
            (f) => f.name === 'rank'
        );
        expect(rankField).toBeDefined();
        expect(rankField!.type.name).toBe('wizard_rank');
        expect(rankField!.type.id).toBe('wizard_rank');

        const frequencyField = spellbooksTable!.fields.find(
            (f) => f.name === 'cast_frequency'
        );
        expect(frequencyField).toBeDefined();
        expect(frequencyField!.type.name).toBe('spell_frequency');

        const schoolField = spellbooksTable!.fields.find(
            (f) => f.name === 'primary_school'
        );
        expect(schoolField).toBeDefined();
        expect(schoolField!.type.name).toBe('magic_school');
    });
});
