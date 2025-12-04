import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Complex enum scenarios from real files', () => {
    it('should handle multiple schema-qualified enums with various syntax issues', async () => {
        // This test mimics the issues found in postgres_six_example_sql_script.sql
        const sql = `
CREATE TYPE "public"."wizard_status" AS ENUM('active', 'suspended', 'banned', 'inactive');
CREATE TYPE "public"."magic_school" AS ENUM('fire', 'water', 'earth', 'air', 'spirit');
CREATE TYPE "public"."spell_tier" AS ENUM('cantrip', 'novice', 'adept', 'expert', 'master', 'legendary');
CREATE TYPE "public"."potion_type" AS ENUM('healing', 'mana', 'strength', 'speed', 'invisibility', 'flying', 'resistance');
CREATE TYPE "public"."creature_type" AS ENUM('beast', 'dragon', 'elemental', 'undead', 'demon', 'fey', 'construct', 'aberration');
CREATE TYPE "public"."quest_status" AS ENUM('available', 'accepted', 'in_progress', 'completed', 'failed', 'abandoned');
CREATE TYPE "public"."item_rarity" AS ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic');

CREATE TABLE "wizard_account" (
    "id" text PRIMARY KEY NOT NULL,
    "wizardId" text NOT NULL,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "wizard" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "username" text,
    "email" text NOT NULL,
    "email_verified" boolean DEFAULT false NOT NULL,
    "status""wizard_status" DEFAULT 'active' NOT NULL,
    "primary_school""magic_school" DEFAULT 'fire' NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    CONSTRAINT "wizard_username_unique" UNIQUE("username"),
    CONSTRAINT "wizard_email_unique" UNIQUE("email")
);

CREATE TABLE "spells" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "wizard_id" text NOT NULL,
    "name" varchar(255) NOT NULL,
    "tier""spell_tier" DEFAULT 'cantrip' NOT NULL,
    "school""magic_school" DEFAULT 'fire' NOT NULL,
    "mana_cost" integer DEFAULT 10 NOT NULL,
    "metadata" jsonb DEFAULT '{}',
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "rarity""item_rarity" DEFAULT 'common' NOT NULL,
    "metadata" jsonb DEFAULT '{}': :jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "wizard_account" ADD CONSTRAINT "wizard_account_wizardId_wizard_id_fk" 
    FOREIGN KEY ("wizardId") REFERENCES "public"."wizard"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "spells" ADD CONSTRAINT "spells_wizard_id_wizard_id_fk" 
    FOREIGN KEY ("wizard_id") REFERENCES "public"."wizard"("id") ON DELETE cascade ON UPDATE no action;
`;

        const result = await fromPostgres(sql);

        // Should find all 7 enums
        expect(result.enums).toHaveLength(7);

        // Check specific enums
        const wizardStatus = result.enums?.find(
            (e) => e.name === 'wizard_status'
        );
        expect(wizardStatus).toBeDefined();
        expect(wizardStatus?.values).toEqual([
            'active',
            'suspended',
            'banned',
            'inactive',
        ]);

        const itemRarity = result.enums?.find((e) => e.name === 'item_rarity');
        expect(itemRarity).toBeDefined();
        expect(itemRarity?.values).toEqual([
            'common',
            'uncommon',
            'rare',
            'epic',
            'legendary',
            'mythic',
        ]);

        // Should find all 4 tables
        expect(result.tables).toHaveLength(4);
        expect(result.tables.map((t) => t.name).sort()).toEqual([
            'items',
            'spells',
            'wizard',
            'wizard_account',
        ]);

        // Should have warnings about custom types and parsing failures
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.length).toBeGreaterThan(0);

        // Check that the tables with missing spaces in column definitions still got parsed
        const wizardTable = result.tables.find((t) => t.name === 'wizard');
        expect(wizardTable).toBeDefined();

        const spellsTable = result.tables.find((t) => t.name === 'spells');
        expect(spellsTable).toBeDefined();
    });

    it('should parse enums used in column definitions even with syntax errors', async () => {
        const sql = `
CREATE TYPE "public"."dragon_element" AS ENUM('fire', 'ice', 'lightning', 'poison', 'shadow');

CREATE TABLE "dragons" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" varchar(255) NOT NULL,
    "element""dragon_element" NOT NULL,
    "power_level" integer DEFAULT 100,
    "metadata" jsonb DEFAULT '{}'::jsonb
);`;

        const result = await fromPostgres(sql);

        // Enum should be parsed
        expect(result.enums).toHaveLength(1);
        expect(result.enums?.[0].name).toBe('dragon_element');

        // Table might succeed or fail due to missing space syntax
        // The important thing is the enum was still parsed correctly
    });
});
