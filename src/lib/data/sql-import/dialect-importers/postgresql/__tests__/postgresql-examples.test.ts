import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL Real-World Examples', () => {
    describe('Magical Academy Example', () => {
        it('should parse the magical academy example with all 16 tables', async () => {
            const sql = `
                    CREATE TABLE schools(
                        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                        name text NOT NULL,
                        created_at timestamptz NOT NULL DEFAULT now()
                    );

                    CREATE TABLE towers(
                        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                        name text NOT NULL
                    );

                    CREATE TABLE ranks(
                        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                        name text NOT NULL
                    );

                    CREATE TABLE spell_permissions(
                        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                        spell_type text NOT NULL,
                        casting_level text NOT NULL
                    );

                    CREATE TABLE rank_spell_permissions(
                        rank_id uuid NOT NULL REFERENCES ranks(id) ON DELETE CASCADE,
                        spell_permission_id uuid NOT NULL REFERENCES spell_permissions(id) ON DELETE CASCADE,
                        PRIMARY KEY (rank_id, spell_permission_id)
                    );

                    CREATE TABLE grimoire_types(
                        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                        name text NOT NULL
                    );

                    CREATE TABLE wizards(
                        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                        tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
                        wizard_name text NOT NULL,
                        email text NOT NULL,
                        UNIQUE (school_id, wizard_name)
                    );

                    CREATE FUNCTION enforce_wizard_tower_school()
                    RETURNS TRIGGER AS $$
                    BEGIN
                        -- Function body
                        RETURN NEW;
                    END;
                    $$ LANGUAGE plpgsql;

                    CREATE TABLE wizard_ranks(
                        wizard_id uuid NOT NULL REFERENCES wizards(id) ON DELETE CASCADE,
                        rank_id uuid NOT NULL REFERENCES ranks(id) ON DELETE CASCADE,
                        tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
                        assigned_at timestamptz NOT NULL DEFAULT now(),
                        PRIMARY KEY (wizard_id, rank_id, tower_id)
                    );

                    CREATE TABLE apprentices(
                        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                        tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
                        first_name text NOT NULL,
                        last_name text NOT NULL,
                        enrollment_date date NOT NULL,
                        primary_mentor uuid REFERENCES wizards(id),
                        sponsoring_wizard uuid REFERENCES wizards(id)
                    );

                    CREATE TABLE spell_lessons(
                        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                        tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
                        apprentice_id uuid NOT NULL REFERENCES apprentices(id) ON DELETE CASCADE,
                        instructor_id uuid NOT NULL REFERENCES wizards(id),
                        lesson_date timestamptz NOT NULL
                    );

                    CREATE TABLE grimoires(
                        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                        tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
                        apprentice_id uuid NOT NULL REFERENCES apprentices(id) ON DELETE CASCADE,
                        grimoire_type_id uuid NOT NULL REFERENCES grimoire_types(id),
                        author_wizard_id uuid NOT NULL REFERENCES wizards(id),
                        content jsonb NOT NULL
                    );

                    CREATE TABLE tuition_scrolls(
                        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                        tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
                        apprentice_id uuid NOT NULL REFERENCES apprentices(id) ON DELETE CASCADE,
                        total_amount numeric(10,2) NOT NULL,
                        status text NOT NULL
                    );

                    CREATE TABLE tuition_items(
                        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                        tuition_scroll_id uuid NOT NULL REFERENCES tuition_scrolls(id) ON DELETE CASCADE,
                        description text NOT NULL,
                        amount numeric(10,2) NOT NULL
                    );

                    CREATE TABLE patron_sponsorships(
                        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                        tuition_scroll_id uuid NOT NULL REFERENCES tuition_scrolls(id) ON DELETE CASCADE,
                        patron_house text NOT NULL,
                        sponsorship_code text NOT NULL,
                        status text NOT NULL
                    );

                    CREATE TABLE gold_payments(
                        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                        tuition_scroll_id uuid NOT NULL REFERENCES tuition_scrolls(id) ON DELETE CASCADE,
                        amount numeric(10,2) NOT NULL,
                        payment_date timestamptz NOT NULL DEFAULT now()
                    );

                    CREATE TABLE arcane_logs(
                        id bigserial PRIMARY KEY,
                        school_id uuid,
                        wizard_id uuid,
                        tower_id uuid,
                        table_name text NOT NULL,
                        operation text NOT NULL,
                        record_id uuid,
                        changes jsonb,
                        created_at timestamptz NOT NULL DEFAULT now(),
                        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL,
                        FOREIGN KEY (wizard_id) REFERENCES wizards(id) ON DELETE SET NULL,
                        FOREIGN KEY (tower_id) REFERENCES towers(id) ON DELETE SET NULL
                    );

                    -- Enable RLS
                    ALTER TABLE wizards ENABLE ROW LEVEL SECURITY;
                    ALTER TABLE apprentices ENABLE ROW LEVEL SECURITY;

                    -- Create policies
                    CREATE POLICY school_isolation ON wizards
                        FOR ALL TO public
                        USING (school_id = current_setting('app.current_school')::uuid);
                `;

            const result = await fromPostgres(sql);

            // Should find all 16 tables
            const expectedTables = [
                'apprentices',
                'arcane_logs',
                'gold_payments',
                'grimoire_types',
                'grimoires',
                'patron_sponsorships',
                'rank_spell_permissions',
                'ranks',
                'schools',
                'spell_lessons',
                'spell_permissions',
                'towers',
                'tuition_items',
                'tuition_scrolls',
                'wizard_ranks',
                'wizards',
            ];

            expect(result.tables).toHaveLength(16);
            expect(result.tables.map((t) => t.name).sort()).toEqual(
                expectedTables
            );

            // Verify key relationships exist
            const relationships = result.relationships;

            // Check some critical relationships
            expect(
                relationships.some(
                    (r) =>
                        r.sourceTable === 'wizards' &&
                        r.targetTable === 'schools' &&
                        r.sourceColumn === 'school_id'
                )
            ).toBe(true);

            expect(
                relationships.some(
                    (r) =>
                        r.sourceTable === 'wizard_ranks' &&
                        r.targetTable === 'wizards' &&
                        r.sourceColumn === 'wizard_id'
                )
            ).toBe(true);

            expect(
                relationships.some(
                    (r) =>
                        r.sourceTable === 'apprentices' &&
                        r.targetTable === 'wizards' &&
                        r.sourceColumn === 'primary_mentor'
                )
            ).toBe(true);

            // Should have warnings about functions, policies, and RLS
            expect(result.warnings).toBeDefined();
            expect(result.warnings!.length).toBeGreaterThan(0);
        });
    });

    describe('Enchanted Bazaar Example', () => {
        it('should parse the enchanted bazaar example with functions and policies', async () => {
            const sql = `
                    -- Enchanted Bazaar tables with complex features
                    CREATE TABLE merchants(
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE artifacts(
                        id SERIAL PRIMARY KEY,
                        merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
                        name VARCHAR(255) NOT NULL,
                        price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
                        enchantment_charges INTEGER DEFAULT 0 CHECK (enchantment_charges >= 0)
                    );

                    -- Function that should be skipped
                    CREATE FUNCTION consume_charges(artifact_id INTEGER, charges_used INTEGER)
                    RETURNS VOID AS $$
                    BEGIN
                        UPDATE artifacts SET enchantment_charges = enchantment_charges - charges_used WHERE id = artifact_id;
                    END;
                    $$ LANGUAGE plpgsql;

                    CREATE TABLE trades(
                        id SERIAL PRIMARY KEY,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        status VARCHAR(50) DEFAULT 'negotiating'
                    );

                    CREATE TABLE trade_items(
                        trade_id INTEGER REFERENCES trades(id) ON DELETE CASCADE,
                        artifact_id INTEGER REFERENCES artifacts(id),
                        quantity INTEGER NOT NULL CHECK (quantity > 0),
                        agreed_price DECIMAL(10, 2) NOT NULL,
                        PRIMARY KEY (trade_id, artifact_id)
                    );

                    -- Enable RLS
                    ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

                    -- Create policy
                    CREATE POLICY merchant_artifacts ON artifacts
                        FOR ALL TO merchants
                        USING (merchant_id = current_user_id());

                    -- Create trigger
                    CREATE TRIGGER charge_consumption_trigger
                        AFTER INSERT ON trade_items
                        FOR EACH ROW
                        EXECUTE FUNCTION consume_charges();
                `;

            const result = await fromPostgres(sql);

            // Should parse all tables despite functions, policies, and triggers
            expect(result.tables.length).toBeGreaterThanOrEqual(4);

            // Check for specific tables
            const tableNames = result.tables.map((t) => t.name);
            expect(tableNames).toContain('merchants');
            expect(tableNames).toContain('artifacts');
            expect(tableNames).toContain('trades');
            expect(tableNames).toContain('trade_items');

            // Check relationships
            if (tableNames.includes('marketplace_tokens')) {
                // Real file relationships
                expect(
                    result.relationships.some(
                        (r) =>
                            r.sourceTable === 'marketplace_listings' &&
                            r.targetTable === 'inventory_items'
                    )
                ).toBe(true);
            } else {
                // Mock data relationships
                expect(
                    result.relationships.some(
                        (r) =>
                            r.sourceTable === 'artifacts' &&
                            r.targetTable === 'merchants'
                    )
                ).toBe(true);

                expect(
                    result.relationships.some(
                        (r) =>
                            r.sourceTable === 'trade_items' &&
                            r.targetTable === 'trades'
                    )
                ).toBe(true);
            }

            // Should have warnings about unsupported features
            if (result.warnings) {
                expect(
                    result.warnings.some(
                        (w) =>
                            w.includes('Function') ||
                            w.includes('Policy') ||
                            w.includes('Trigger') ||
                            w.includes('ROW LEVEL SECURITY')
                    )
                ).toBe(true);
            }
        });
    });
});
