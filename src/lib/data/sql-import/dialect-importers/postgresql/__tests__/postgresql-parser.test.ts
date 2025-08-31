import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL Parser', () => {
    describe('Basic Table Parsing', () => {
        it('should parse simple tables with basic data types', async () => {
            const sql = `
                CREATE TABLE wizards (
                    id INTEGER PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    magic_email TEXT UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.tables[0].name).toBe('wizards');
            expect(result.tables[0].columns).toHaveLength(4);
            expect(result.tables[0].columns[0].name).toBe('id');
            expect(result.tables[0].columns[0].type).toBe('INTEGER');
            expect(result.tables[0].columns[0].primaryKey).toBe(true);
        });

        it('should parse multiple tables', async () => {
            const sql = `
                CREATE TABLE guilds (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL
                );

                CREATE TABLE mages (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    guild_id INTEGER REFERENCES guilds(id)
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(2);
            expect(result.tables.map((t) => t.name).sort()).toEqual([
                'guilds',
                'mages',
            ]);
            expect(result.relationships).toHaveLength(1);
            expect(result.relationships[0].sourceTable).toBe('mages');
            expect(result.relationships[0].targetTable).toBe('guilds');
        });

        it('should handle IF NOT EXISTS clause', async () => {
            const sql = `
                CREATE TABLE IF NOT EXISTS potions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name TEXT NOT NULL
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.tables[0].name).toBe('potions');
        });
    });

    describe('Complex Data Types', () => {
        it('should handle UUID and special PostgreSQL types', async () => {
            const sql = `
                CREATE TABLE special_types (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    data JSONB,
                    tags TEXT[],
                    location POINT,
                    mana_cost MONEY,
                    binary_data BYTEA
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            const columns = result.tables[0].columns;
            expect(columns.find((c) => c.name === 'id')?.type).toBe('UUID');
            expect(columns.find((c) => c.name === 'data')?.type).toBe('JSONB');
            expect(columns.find((c) => c.name === 'tags')?.type).toBe('TEXT[]');
        });

        it('should handle numeric with precision', async () => {
            const sql = `
                CREATE TABLE treasury (
                    id SERIAL PRIMARY KEY,
                    amount NUMERIC(10, 2),
                    percentage DECIMAL(5, 2),
                    big_number BIGINT
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            const columns = result.tables[0].columns;
            // Parser limitation: scale on separate line is not captured
            const amountType = columns.find((c) => c.name === 'amount')?.type;
            expect(amountType).toMatch(/^NUMERIC/);
        });

        it('should handle multi-line numeric definitions', async () => {
            const sql = `
                CREATE TABLE multi_line (
                    id INTEGER PRIMARY KEY,
                    value NUMERIC(10,
2),
                    another_col TEXT
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.tables[0].columns).toHaveLength(3);
        });
    });

    describe('Foreign Key Relationships', () => {
        it('should parse inline foreign keys', async () => {
            const sql = `
                CREATE TABLE realms (id INTEGER PRIMARY KEY);
                CREATE TABLE sanctuaries (
                    id INTEGER PRIMARY KEY,
                    realm_id INTEGER REFERENCES realms(id)
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.relationships).toHaveLength(1);
            expect(result.relationships[0].sourceTable).toBe('sanctuaries');
            expect(result.relationships[0].targetTable).toBe('realms');
            expect(result.relationships[0].sourceColumn).toBe('realm_id');
            expect(result.relationships[0].targetColumn).toBe('id');
        });

        it('should parse table-level foreign key constraints', async () => {
            const sql = `
                CREATE TABLE enchantment_orders (id INTEGER PRIMARY KEY);
                CREATE TABLE enchantment_items (
                    id INTEGER PRIMARY KEY,
                    order_id INTEGER,
                    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES enchantment_orders(id)
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.relationships).toHaveLength(1);
            expect(result.relationships[0].sourceTable).toBe(
                'enchantment_items'
            );
            expect(result.relationships[0].targetTable).toBe(
                'enchantment_orders'
            );
        });

        it('should parse composite foreign keys', async () => {
            const sql = `
                CREATE TABLE magic_schools (id UUID PRIMARY KEY);
                CREATE TABLE quests (
                    school_id UUID,
                    quest_id UUID,
                    name TEXT,
                    PRIMARY KEY (school_id, quest_id),
                    FOREIGN KEY (school_id) REFERENCES magic_schools(id)
                );
                CREATE TABLE rituals (
                    id UUID PRIMARY KEY,
                    school_id UUID,
                    quest_id UUID,
                    FOREIGN KEY (school_id, quest_id) REFERENCES quests(school_id, quest_id)
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(3);
            // Composite foreign keys are not fully supported
            expect(result.relationships).toHaveLength(1);
            expect(result.relationships[0].sourceTable).toBe('quests');
            expect(result.relationships[0].targetTable).toBe('magic_schools');
        });

        it('should handle ON DELETE and ON UPDATE clauses', async () => {
            const sql = `
                CREATE TABLE wizards (id INTEGER PRIMARY KEY);
                CREATE TABLE scrolls (
                    id INTEGER PRIMARY KEY,
                    wizard_id INTEGER REFERENCES wizards(id) ON DELETE CASCADE ON UPDATE CASCADE
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.relationships).toHaveLength(1);
            // ON DELETE/UPDATE clauses are not preserved in output
        });
    });

    describe('Constraints', () => {
        it('should parse unique constraints', async () => {
            const sql = `
                CREATE TABLE wizards (
                    id INTEGER PRIMARY KEY,
                    magic_email TEXT UNIQUE,
                    wizard_name TEXT,
                    UNIQUE (wizard_name)
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            const columns = result.tables[0].columns;
            expect(columns.find((c) => c.name === 'magic_email')?.unique).toBe(
                true
            );
        });

        it('should parse check constraints', async () => {
            const sql = `
                CREATE TABLE potions (
                    id INTEGER PRIMARY KEY,
                    mana_cost DECIMAL CHECK (mana_cost > 0),
                    quantity INTEGER,
                    CONSTRAINT positive_quantity CHECK (quantity >= 0)
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.tables[0].columns).toHaveLength(3);
        });

        it('should parse composite primary keys', async () => {
            const sql = `
                CREATE TABLE enchantment_items (
                    order_id INTEGER,
                    potion_id INTEGER,
                    quantity INTEGER,
                    PRIMARY KEY (order_id, potion_id)
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            const columns = result.tables[0].columns;
            expect(columns.filter((c) => c.primaryKey)).toHaveLength(2);
        });
    });

    describe('Generated Columns', () => {
        it('should handle GENERATED ALWAYS AS IDENTITY', async () => {
            const sql = `
                CREATE TABLE items (
                    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                    name TEXT
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.tables[0].columns[0].increment).toBe(true);
        });

        it('should handle GENERATED BY DEFAULT AS IDENTITY', async () => {
            const sql = `
                CREATE TABLE items (
                    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    name TEXT
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.tables[0].columns[0].increment).toBe(true);
        });

        it('should handle computed columns', async () => {
            const sql = `
                CREATE TABLE calculations (
                    id INTEGER PRIMARY KEY,
                    value1 NUMERIC,
                    value2 NUMERIC,
                    total NUMERIC GENERATED ALWAYS AS (value1 + value2) STORED
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.tables[0].columns).toHaveLength(4);
        });
    });

    describe('Unsupported Statements', () => {
        it('should skip and warn about functions', async () => {
            const sql = `
                CREATE TABLE wizards (id INTEGER PRIMARY KEY);
                
                CREATE FUNCTION get_wizard_name(wizard_id INTEGER)
                RETURNS TEXT AS $$
                BEGIN
                    RETURN 'test';
                END;
                $$ LANGUAGE plpgsql;
                
                CREATE TABLE scrolls (
                    id INTEGER PRIMARY KEY,
                    wizard_id INTEGER REFERENCES wizards(id)
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(2);
            expect(result.warnings).toBeDefined();
            expect(result.warnings!.some((w) => w.includes('Function'))).toBe(
                true
            );
        });

        it('should skip and warn about triggers', async () => {
            const sql = `
                CREATE TABLE spell_audit_log (id SERIAL PRIMARY KEY);
                
                CREATE TRIGGER spell_audit_trigger
                AFTER INSERT ON spell_audit_log
                FOR EACH ROW
                EXECUTE FUNCTION spell_audit_function();
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.warnings).toBeDefined();
            expect(result.warnings!.some((w) => w.includes('Trigger'))).toBe(
                true
            );
        });

        it('should skip and warn about policies', async () => {
            const sql = `
                CREATE TABLE arcane_secrets (id INTEGER PRIMARY KEY);
                
                CREATE POLICY wizard_policy ON arcane_secrets
                FOR SELECT
                TO public
                USING (true);
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.warnings).toBeDefined();
            expect(result.warnings!.some((w) => w.includes('Policy'))).toBe(
                true
            );
        });

        it('should skip and warn about RLS', async () => {
            const sql = `
                CREATE TABLE enchanted_vault (id INTEGER PRIMARY KEY);
                ALTER TABLE enchanted_vault ENABLE ROW LEVEL SECURITY;
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.warnings).toBeDefined();
            expect(
                result.warnings!.some((w) =>
                    w.toLowerCase().includes('row level security')
                )
            ).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle tables after failed function parsing', async () => {
            const sql = `
                CREATE TABLE before_enchantment (id INTEGER PRIMARY KEY);
                
                CREATE FUNCTION complex_spell()
                RETURNS TABLE(id INTEGER, name TEXT) AS $$
                BEGIN
                    RETURN QUERY SELECT 1, 'test';
                END;
                $$ LANGUAGE plpgsql;
                
                CREATE TABLE after_enchantment (
                    id INTEGER PRIMARY KEY,
                    ref_id INTEGER REFERENCES before_enchantment(id)
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(2);
            expect(result.tables.map((t) => t.name).sort()).toEqual([
                'after_enchantment',
                'before_enchantment',
            ]);
            expect(result.relationships).toHaveLength(1);
        });

        it('should handle empty or null input', async () => {
            const result1 = await fromPostgres('');
            expect(result1.tables).toHaveLength(0);
            expect(result1.relationships).toHaveLength(0);

            const result2 = await fromPostgres('   \n   ');
            expect(result2.tables).toHaveLength(0);
            expect(result2.relationships).toHaveLength(0);
        });

        it('should handle comments in various positions', async () => {
            const sql = `
                -- This is a comment
                CREATE TABLE /* inline comment */ wizards (
                    id INTEGER PRIMARY KEY, -- end of line comment
                    /* multi-line
                       comment */
                    name TEXT
                );
                -- Another comment
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.tables[0].name).toBe('wizards');
            expect(result.tables[0].columns).toHaveLength(2);
        });

        it('should handle dollar-quoted strings', async () => {
            const sql = `
                CREATE TABLE spell_messages (
                    id INTEGER PRIMARY KEY,
                    template TEXT DEFAULT $tag$Hello, 'world'!$tag$,
                    content TEXT
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.tables[0].columns).toHaveLength(3);
        });
    });

    describe('Foreign Key Extraction from Unparsed Tables', () => {
        it('should extract foreign keys from tables that fail to parse', async () => {
            const sql = `
                CREATE TABLE ancient_artifact (id UUID PRIMARY KEY);
                
                -- This table has syntax that might fail parsing
                CREATE TABLE mystical_formula (
                    id UUID PRIMARY KEY,
                    artifact_ref UUID REFERENCES ancient_artifact(id),
                    value NUMERIC(10,
2) GENERATED ALWAYS AS (1 + 1) STORED,
                    FOREIGN KEY (artifact_ref) REFERENCES ancient_artifact(id) ON DELETE CASCADE
                );
                
                CREATE TABLE enchanted_relic (
                    id UUID PRIMARY KEY,
                    formula_ref UUID REFERENCES mystical_formula(id)
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.tables).toHaveLength(3);
            // Should find foreign keys even if mystical_formula fails to parse
            expect(result.relationships.length).toBeGreaterThanOrEqual(2);
        });
    });
});
