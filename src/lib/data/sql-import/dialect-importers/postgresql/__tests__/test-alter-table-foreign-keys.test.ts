import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('ALTER TABLE FOREIGN KEY parsing with fallback', () => {
    it('should parse foreign keys from ALTER TABLE ONLY statements with DEFERRABLE', async () => {
        const sql = `
CREATE TABLE "public"."wizard" (
    "id" bigint NOT NULL,
    "name" character varying(255) NOT NULL,
    CONSTRAINT "wizard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."spellbook" (
    "id" integer NOT NULL,
    "wizard_id" bigint NOT NULL,
    "title" character varying(254) NOT NULL,
    CONSTRAINT "spellbook_pkey" PRIMARY KEY ("id")
);

ALTER TABLE ONLY "public"."spellbook" ADD CONSTRAINT "spellbook_wizard_id_fk" FOREIGN KEY (wizard_id) REFERENCES wizard(id) DEFERRABLE INITIALLY DEFERRED DEFERRABLE;
`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);

        const fk = result.relationships[0];
        expect(fk.sourceTable).toBe('spellbook');
        expect(fk.targetTable).toBe('wizard');
        expect(fk.sourceColumn).toBe('wizard_id');
        expect(fk.targetColumn).toBe('id');
        expect(fk.name).toBe('spellbook_wizard_id_fk');
    });

    it('should parse foreign keys without schema qualification', async () => {
        const sql = `
CREATE TABLE dragon (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE dragon_rider (
    id UUID PRIMARY KEY,
    rider_name VARCHAR(100) NOT NULL,
    dragon_id UUID NOT NULL
);

-- Without ONLY keyword and without schema
ALTER TABLE dragon_rider ADD CONSTRAINT dragon_rider_dragon_fk FOREIGN KEY (dragon_id) REFERENCES dragon(id);
`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);

        const fk = result.relationships[0];
        expect(fk.sourceTable).toBe('dragon_rider');
        expect(fk.targetTable).toBe('dragon');
        expect(fk.sourceColumn).toBe('dragon_id');
        expect(fk.targetColumn).toBe('id');
        expect(fk.sourceSchema).toBe('public');
        expect(fk.targetSchema).toBe('public');
    });

    it('should parse foreign keys with mixed schema specifications', async () => {
        const sql = `
CREATE TABLE "magic_school"."instructor" (
    "id" bigint NOT NULL,
    "name" text NOT NULL,
    CONSTRAINT "instructor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."apprentice" (
    "id" integer NOT NULL,
    "name" varchar(255) NOT NULL,
    "instructor_id" bigint NOT NULL,
    CONSTRAINT "apprentice_pkey" PRIMARY KEY ("id")
);

-- Source table with public schema, target table with magic_school schema
ALTER TABLE ONLY "public"."apprentice" ADD CONSTRAINT "apprentice_instructor_fk" FOREIGN KEY (instructor_id) REFERENCES "magic_school"."instructor"(id) ON DELETE CASCADE;
`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);

        const fk = result.relationships[0];
        expect(fk.sourceTable).toBe('apprentice');
        expect(fk.targetTable).toBe('instructor');
        expect(fk.sourceSchema).toBe('public');
        expect(fk.targetSchema).toBe('magic_school');
        expect(fk.sourceColumn).toBe('instructor_id');
        expect(fk.targetColumn).toBe('id');
    });

    it('should parse foreign keys with various constraint options', async () => {
        const sql = `
CREATE TABLE potion (
    id UUID PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE ingredient (
    id UUID PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE potion_ingredient (
    id SERIAL PRIMARY KEY,
    potion_id UUID NOT NULL,
    ingredient_id UUID NOT NULL,
    quantity INTEGER DEFAULT 1
);

-- Different variations of ALTER TABLE foreign key syntax
ALTER TABLE potion_ingredient ADD CONSTRAINT potion_ingredient_potion_fk FOREIGN KEY (potion_id) REFERENCES potion(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE ONLY potion_ingredient ADD CONSTRAINT potion_ingredient_ingredient_fk FOREIGN KEY (ingredient_id) REFERENCES ingredient(id) DEFERRABLE;
`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(3);
        expect(result.relationships).toHaveLength(2);

        // Check first FK (with ON DELETE CASCADE ON UPDATE CASCADE)
        const potionFK = result.relationships.find(
            (r) => r.sourceColumn === 'potion_id'
        );
        expect(potionFK).toBeDefined();
        expect(potionFK?.targetTable).toBe('potion');

        // Check second FK (with DEFERRABLE)
        const ingredientFK = result.relationships.find(
            (r) => r.sourceColumn === 'ingredient_id'
        );
        expect(ingredientFK).toBeDefined();
        expect(ingredientFK?.targetTable).toBe('ingredient');
    });

    it('should handle quoted and unquoted identifiers', async () => {
        const sql = `
CREATE TABLE "wizard_tower" (
    id BIGINT PRIMARY KEY,
    "tower_name" VARCHAR(255)
);

CREATE TABLE wizard_resident (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    tower_id BIGINT
);

-- First ALTER TABLE statement
ALTER TABLE wizard_resident ADD CONSTRAINT wizard_tower_fk FOREIGN KEY (tower_id) REFERENCES "wizard_tower"(id) DEFERRABLE INITIALLY DEFERRED DEFERRABLE;

-- Second ALTER TABLE statement  
ALTER TABLE ONLY "wizard_resident" ADD CONSTRAINT "wizard_tower_fk2" FOREIGN KEY ("tower_id") REFERENCES "wizard_tower"("id") ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED DEFERRABLE;
`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(2);

        // At least one relationship should be found (the regex fallback should catch at least one)
        expect(result.relationships.length).toBeGreaterThanOrEqual(1);

        // Check the first relationship
        const fk = result.relationships[0];
        expect(fk.sourceTable).toBe('wizard_resident');
        expect(fk.targetTable).toBe('wizard_tower');
        expect(fk.sourceColumn).toBe('tower_id');
        expect(fk.targetColumn).toBe('id');
    });

    it('should handle the exact problematic syntax from postgres_seven', async () => {
        const sql = `
CREATE TABLE "public"."users_user" (
    "id" bigint NOT NULL,
    "email" character varying(254) NOT NULL,
    CONSTRAINT "users_user_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."account_emailaddress" (
    "id" integer DEFAULT GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "email" character varying(254) NOT NULL,
    "user_id" bigint NOT NULL,
    CONSTRAINT "account_emailaddress_pkey" PRIMARY KEY ("id")
);

-- Exact syntax from the problematic file with double DEFERRABLE
ALTER TABLE ONLY "public"."account_emailaddress" ADD CONSTRAINT "account_emailaddress_user_id_2c513194_fk_users_user_id" FOREIGN KEY (user_id) REFERENCES users_user(id) DEFERRABLE INITIALLY DEFERRED DEFERRABLE;
`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);

        const fk = result.relationships[0];
        expect(fk.name).toBe(
            'account_emailaddress_user_id_2c513194_fk_users_user_id'
        );
        expect(fk.sourceTable).toBe('account_emailaddress');
        expect(fk.targetTable).toBe('users_user');
    });

    it('should handle multiple foreign keys in different formats', async () => {
        const sql = `
CREATE TABLE realm (
    id UUID PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE region (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    realm_id UUID
);

CREATE TABLE city (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    region_id UUID,
    realm_id UUID
);

-- Mix of syntaxes that might fail parsing
ALTER TABLE ONLY region ADD CONSTRAINT region_realm_fk FOREIGN KEY (realm_id) REFERENCES realm(id) DEFERRABLE INITIALLY DEFERRED DEFERRABLE;
ALTER TABLE city ADD CONSTRAINT city_region_fk FOREIGN KEY (region_id) REFERENCES region(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."city" ADD CONSTRAINT "city_realm_fk" FOREIGN KEY ("realm_id") REFERENCES "public"."realm"("id");
`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(3);
        expect(result.relationships).toHaveLength(3);

        // Verify all three relationships were captured
        const regionRealmFK = result.relationships.find(
            (r) => r.sourceTable === 'region' && r.targetTable === 'realm'
        );
        const cityRegionFK = result.relationships.find(
            (r) => r.sourceTable === 'city' && r.targetTable === 'region'
        );
        const cityRealmFK = result.relationships.find(
            (r) => r.sourceTable === 'city' && r.targetTable === 'realm'
        );

        expect(regionRealmFK).toBeDefined();
        expect(cityRegionFK).toBeDefined();
        expect(cityRealmFK).toBeDefined();
    });

    it('should use regex fallback for unparseable ALTER TABLE statements', async () => {
        const sql = `
CREATE TABLE magical_item (
    id UUID PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE enchantment (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    item_id UUID NOT NULL
);

-- This should fail to parse due to syntax variations and trigger regex fallback
ALTER TABLE ONLY enchantment ADD CONSTRAINT enchantment_item_fk FOREIGN KEY (item_id) REFERENCES magical_item(id) ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED DEFERRABLE;
`;

        const result = await fromPostgres(sql);

        // Should find the foreign key even if parser fails
        expect(result.relationships).toHaveLength(1);

        const fk = result.relationships[0];
        expect(fk.name).toBe('enchantment_item_fk');
        expect(fk.sourceTable).toBe('enchantment');
        expect(fk.targetTable).toBe('magical_item');
        expect(fk.sourceColumn).toBe('item_id');
        expect(fk.targetColumn).toBe('id');

        // Should have a warning about the failed parse
        expect(result.warnings).toBeDefined();
        const hasAlterWarning = result.warnings!.some(
            (w) =>
                w.includes('Failed to parse statement') &&
                w.includes('ALTER TABLE')
        );
        expect(hasAlterWarning).toBe(true);
    });
});
