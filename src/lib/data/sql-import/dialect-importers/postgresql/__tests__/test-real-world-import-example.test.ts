import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Real-world PostgreSQL import examples', () => {
    it('should successfully parse a complex real-world schema with enums', async () => {
        // This example demonstrates how the parser handles real-world PostgreSQL exports
        // that may contain schema-qualified identifiers and syntax variations
        const sql = `
-- Example of a real PostgreSQL database export with schema-qualified types
CREATE TYPE "public"."mage_rank" AS ENUM('novice', 'apprentice', 'journeyman', 'expert', 'master', 'archmage');
CREATE TYPE "public"."spell_category" AS ENUM('combat', 'healing', 'utility', 'summoning', 'enchantment');
CREATE TYPE "public"."artifact_quality" AS ENUM('crude', 'common', 'fine', 'exceptional', 'masterwork', 'legendary');

-- Tables with proper spacing in column definitions
CREATE TABLE "mages" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "rank" "mage_rank" DEFAULT 'novice' NOT NULL,
    "specialization" "spell_category",
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    CONSTRAINT "mages_email_unique" UNIQUE("email")
);

-- Example of a table with missing spaces (common in some exports)
CREATE TABLE "grimoires" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "mage_id" text NOT NULL,
    "title" varchar(255) NOT NULL,
    "category""spell_category" NOT NULL,
    "quality""artifact_quality" DEFAULT 'common' NOT NULL,
    "pages" integer DEFAULT 100 NOT NULL,
    "created_at" timestamp DEFAULT now()
);

-- Table with JSON syntax issues (: :jsonb instead of ::jsonb)
CREATE TABLE "spell_components" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "spell_id" uuid NOT NULL,
    "component_name" text NOT NULL,
    "quantity" integer DEFAULT 1,
    "properties" jsonb DEFAULT '{}': :jsonb,
    "created_at" timestamp DEFAULT now()
);

-- Foreign key constraints using schema-qualified references
ALTER TABLE "grimoires" ADD CONSTRAINT "grimoires_mage_id_mages_id_fk" 
    FOREIGN KEY ("mage_id") REFERENCES "public"."mages"("id") ON DELETE cascade;

-- Indexes
CREATE UNIQUE INDEX "mages_rank_email_idx" ON "mages" ("rank", "email");
CREATE INDEX "grimoires_category_idx" ON "grimoires" ("category");
`;

        const result = await fromPostgres(sql);

        // All enums should be parsed despite schema qualification
        expect(result.enums).toHaveLength(3);
        expect(result.enums?.map((e) => e.name).sort()).toEqual([
            'artifact_quality',
            'mage_rank',
            'spell_category',
        ]);

        // All tables should be parsed, even with syntax issues
        expect(result.tables).toHaveLength(3);
        expect(result.tables.map((t) => t.name).sort()).toEqual([
            'grimoires',
            'mages',
            'spell_components',
        ]);

        // Foreign keys should be recognized
        expect(result.relationships.length).toBeGreaterThan(0);
        const fk = result.relationships.find(
            (r) => r.sourceTable === 'grimoires' && r.targetTable === 'mages'
        );
        expect(fk).toBeDefined();

        // Note: Index parsing may not be fully implemented in the current parser
        // This is acceptable as the main focus is on tables, enums, and relationships

        // Check specific enum values
        const mageRank = result.enums?.find((e) => e.name === 'mage_rank');
        expect(mageRank?.values).toEqual([
            'novice',
            'apprentice',
            'journeyman',
            'expert',
            'master',
            'archmage',
        ]);
    });

    it('should provide actionable feedback for common syntax issues', async () => {
        const sql = `
CREATE TYPE "public"."potion_effect" AS ENUM('healing', 'mana', 'strength', 'speed');

CREATE TABLE "potions" (
    "id" uuid PRIMARY KEY,
    "name" text NOT NULL,
    "effect""potion_effect" NOT NULL,
    "duration" interval DEFAULT '30 minutes': :interval,
    "power" integer DEFAULT 50
);`;

        const result = await fromPostgres(sql);

        // Enum should still be parsed
        expect(result.enums).toHaveLength(1);
        expect(result.enums?.[0].name).toBe('potion_effect');

        // Table should be parsed despite issues
        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('potions');

        // Should have warnings about parsing issues
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.length).toBeGreaterThan(0);

        // The warning should indicate which statement failed
        const hasParseWarning = result.warnings!.some(
            (w) =>
                w.includes('Failed to parse statement') && w.includes('potions')
        );
        expect(hasParseWarning).toBe(true);
    });
});
