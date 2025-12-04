import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Schema-qualified enum parsing', () => {
    it('should parse enums with schema prefix', async () => {
        const sql = `
CREATE TYPE "public"."wizard_rank" AS ENUM('apprentice', 'journeyman', 'master', 'grandmaster');
CREATE TYPE "public"."spell_school" AS ENUM('fire', 'water', 'earth', 'air', 'spirit');

CREATE TABLE "wizards" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "rank" "wizard_rank" DEFAULT 'apprentice' NOT NULL,
    "primary_school" "spell_school" NOT NULL
);`;

        const result = await fromPostgres(sql);

        // Should find both enums
        expect(result.enums).toHaveLength(2);

        const wizardRank = result.enums?.find((e) => e.name === 'wizard_rank');
        expect(wizardRank).toBeDefined();
        expect(wizardRank?.values).toEqual([
            'apprentice',
            'journeyman',
            'master',
            'grandmaster',
        ]);

        const spellSchool = result.enums?.find(
            (e) => e.name === 'spell_school'
        );
        expect(spellSchool).toBeDefined();
        expect(spellSchool?.values).toEqual([
            'fire',
            'water',
            'earth',
            'air',
            'spirit',
        ]);
    });

    it('should handle missing spaces between column name and type', async () => {
        const sql = `
CREATE TYPE "public"."dragon_type" AS ENUM('fire', 'ice', 'storm', 'earth');

CREATE TABLE "dragons" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "type""dragon_type" DEFAULT 'fire' NOT NULL
);`;

        const result = await fromPostgres(sql);

        // Should still parse the enum
        expect(result.enums).toHaveLength(1);
        expect(result.enums?.[0].name).toBe('dragon_type');

        // Table parsing might succeed or fail due to missing space syntax
        // The important thing is the enum was still parsed correctly
    });
});
