import { describe, it, expect, vi } from 'vitest';
import { fromPostgres } from '../postgresql';
import { sqlImportToDiagram } from '@/lib/data/sql-import';
import { DatabaseType } from '@/lib/domain/database-type';
import * as dataTypes from '@/lib/data/data-types/data-types';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';

describe('PostgreSQL Core Parser Tests', () => {
    it('should parse basic tables', async () => {
        const sql = `
            CREATE TABLE wizards (
                id INTEGER PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            );
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('wizards');
        expect(result.tables[0].columns).toHaveLength(2);
    });

    it('should parse foreign key relationships', async () => {
        const sql = `
            CREATE TABLE guilds (id INTEGER PRIMARY KEY);
            CREATE TABLE mages (
                id INTEGER PRIMARY KEY,
                guild_id INTEGER REFERENCES guilds(id)
            );
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships[0].sourceTable).toBe('mages');
        expect(result.relationships[0].targetTable).toBe('guilds');
    });

    it('should skip functions with warnings', async () => {
        const sql = `
            CREATE TABLE test_table (id INTEGER PRIMARY KEY);
            
            CREATE FUNCTION test_func() RETURNS VOID AS $$
            BEGIN
                NULL;
            END;
            $$ LANGUAGE plpgsql;
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.some((w) => w.includes('Function'))).toBe(true);
    });

    it('should handle tables that fail to parse', async () => {
        const sql = `
            CREATE TABLE valid_table (id INTEGER PRIMARY KEY);
            
            -- This table has syntax that might fail parsing
            CREATE TABLE complex_table (
                id INTEGER PRIMARY KEY,
                value NUMERIC(10,
2) GENERATED ALWAYS AS (1 + 1) STORED
            );
            
            CREATE TABLE another_valid (
                id INTEGER PRIMARY KEY,
                complex_ref INTEGER REFERENCES complex_table(id)
            );
        `;

        const result = await fromPostgres(sql);

        // Should find all 3 tables even if complex_table fails to parse
        expect(result.tables).toHaveLength(3);
        expect(result.tables.map((t) => t.name).sort()).toEqual([
            'another_valid',
            'complex_table',
            'valid_table',
        ]);

        // Should still find the foreign key relationship
        expect(
            result.relationships.some(
                (r) =>
                    r.sourceTable === 'another_valid' &&
                    r.targetTable === 'complex_table'
            )
        ).toBe(true);
    });

    it('should parse the magical academy system fixture', async () => {
        const sql = `-- Magical Academy System Database Schema
-- This is a test fixture representing a typical magical academy system

CREATE TABLE magic_schools(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE towers(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES magic_schools(id) ON DELETE CASCADE,
    name text NOT NULL,
    location text,
    crystal_frequency varchar(20),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE magical_ranks(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES magic_schools(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_system boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE spell_permissions(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    spell_school text NOT NULL,
    spell_action text NOT NULL,
    description text,
    UNIQUE (spell_school, spell_action)
);

CREATE TABLE rank_permissions(
    rank_id uuid NOT NULL REFERENCES magical_ranks(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES spell_permissions(id) ON DELETE CASCADE,
    granted_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (rank_id, permission_id)
);

CREATE TABLE grimoire_types(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES magic_schools(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE wizards(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES magic_schools(id) ON DELETE CASCADE,
    tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (school_id, username),
    UNIQUE (email)
);

-- This function should not prevent the next table from being parsed
CREATE FUNCTION enforce_wizard_tower_school()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM towers 
        WHERE id = NEW.tower_id AND school_id = NEW.school_id
    ) THEN
        RAISE EXCEPTION 'Tower does not belong to magic school';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE wizard_ranks(
    wizard_id uuid NOT NULL REFERENCES wizards(id) ON DELETE CASCADE,
    rank_id uuid NOT NULL REFERENCES magical_ranks(id) ON DELETE CASCADE,
    tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    assigned_by uuid REFERENCES wizards(id),
    PRIMARY KEY (wizard_id, rank_id, tower_id)
);

CREATE TABLE apprentices(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES magic_schools(id) ON DELETE CASCADE,
    tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
    apprentice_id text NOT NULL, -- Magical Apprentice Identifier
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth date NOT NULL,
    magical_affinity varchar(10),
    email text,
    crystal_phone varchar(20),
    dormitory text,
    emergency_contact jsonb,
    patron_info jsonb,
    primary_mentor uuid REFERENCES wizards(id),
    referring_wizard uuid REFERENCES wizards(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (school_id, apprentice_id)
);

CREATE TABLE spell_lessons(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES magic_schools(id) ON DELETE CASCADE,
    tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
    apprentice_id uuid NOT NULL REFERENCES apprentices(id) ON DELETE CASCADE,
    instructor_id uuid NOT NULL REFERENCES wizards(id),
    lesson_date timestamptz NOT NULL,
    duration_minutes integer NOT NULL DEFAULT 30,
    status text NOT NULL DEFAULT 'scheduled',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL REFERENCES wizards(id),
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'))
);

CREATE TABLE grimoires(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES magic_schools(id) ON DELETE CASCADE,
    tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
    apprentice_id uuid NOT NULL REFERENCES apprentices(id) ON DELETE CASCADE,
    lesson_id uuid REFERENCES spell_lessons(id),
    grimoire_type_id uuid NOT NULL REFERENCES grimoire_types(id),
    instructor_id uuid NOT NULL REFERENCES wizards(id),
    content jsonb NOT NULL,
    enchantments jsonb,
    is_sealed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tuition_scrolls(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES magic_schools(id) ON DELETE CASCADE,
    tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
    apprentice_id uuid NOT NULL REFERENCES apprentices(id) ON DELETE CASCADE,
    scroll_number text NOT NULL,
    scroll_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    magical_tax numeric(10,2) NOT NULL DEFAULT 0,
    scholarship_amount numeric(10,2) NOT NULL DEFAULT 0,
    total_gold numeric(10,2) NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL REFERENCES wizards(id),
    UNIQUE (school_id, scroll_number),
    CONSTRAINT valid_scroll_status CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'))
);

CREATE TABLE scroll_line_items(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scroll_id uuid NOT NULL REFERENCES tuition_scrolls(id) ON DELETE CASCADE,
    description text NOT NULL,
    quantity numeric(10,2) NOT NULL DEFAULT 1,
    gold_per_unit numeric(10,2) NOT NULL,
    total_gold numeric(10,2) NOT NULL,
    lesson_id uuid REFERENCES spell_lessons(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE patron_sponsorships(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scroll_id uuid NOT NULL REFERENCES tuition_scrolls(id) ON DELETE CASCADE,
    patron_house text NOT NULL,
    sponsorship_code text NOT NULL,
    claim_number text NOT NULL,
    claim_date date NOT NULL DEFAULT CURRENT_DATE,
    gold_requested numeric(10,2) NOT NULL,
    gold_approved numeric(10,2),
    status text NOT NULL DEFAULT 'submitted',
    denial_reason text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (claim_number),
    CONSTRAINT valid_sponsorship_status CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'partial', 'denied', 'appealed'))
);

CREATE TABLE gold_payments(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scroll_id uuid NOT NULL REFERENCES tuition_scrolls(id) ON DELETE CASCADE,
    payment_date timestamptz NOT NULL DEFAULT now(),
    gold_amount numeric(10,2) NOT NULL,
    payment_method text NOT NULL,
    reference_rune text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL REFERENCES wizards(id),
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('gold_coins', 'crystal_transfer', 'mithril_card', 'dragon_scale', 'patron_sponsorship', 'other'))
);

CREATE TABLE arcane_logs(
    id bigserial PRIMARY KEY,
    school_id uuid,
    wizard_id uuid,
    tower_id uuid,
    table_name text NOT NULL,
    record_id uuid,
    spell_operation text NOT NULL,
    old_values jsonb,
    new_values jsonb,
    casting_source inet,
    magical_signature text,
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (school_id) REFERENCES magic_schools(id) ON DELETE SET NULL,
    FOREIGN KEY (wizard_id) REFERENCES wizards(id) ON DELETE SET NULL,
    FOREIGN KEY (tower_id) REFERENCES towers(id) ON DELETE SET NULL,
    CONSTRAINT valid_spell_operation CHECK (spell_operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Enable Row Level Security
ALTER TABLE wizards ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentices ENABLE ROW LEVEL SECURITY;
ALTER TABLE grimoires ENABLE ROW LEVEL SECURITY;
ALTER TABLE spell_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuition_scrolls ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY school_isolation_wizards ON wizards
    FOR ALL TO authenticated
    USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY school_isolation_apprentices ON apprentices
    FOR ALL TO authenticated
    USING (school_id = current_setting('app.current_school')::uuid);

-- Create arcane audit trigger function
CREATE FUNCTION arcane_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO arcane_logs (
        school_id,
        wizard_id,
        tower_id,
        table_name,
        record_id,
        spell_operation,
        old_values,
        new_values
    ) VALUES (
        current_setting('app.current_school', true)::uuid,
        current_setting('app.current_wizard', true)::uuid,
        current_setting('app.current_tower', true)::uuid,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER arcane_audit_wizards AFTER INSERT OR UPDATE OR DELETE ON wizards
    FOR EACH ROW EXECUTE FUNCTION arcane_audit_trigger();

CREATE TRIGGER arcane_audit_apprentices AFTER INSERT OR UPDATE OR DELETE ON apprentices
    FOR EACH ROW EXECUTE FUNCTION arcane_audit_trigger();`;

        const result = await fromPostgres(sql);

        // Should find all 16 tables
        expect(result.tables).toHaveLength(16);

        const tableNames = result.tables.map((t) => t.name).sort();
        const expectedTables = [
            'apprentices',
            'arcane_logs',
            'gold_payments',
            'grimoire_types',
            'grimoires',
            'magic_schools',
            'magical_ranks',
            'patron_sponsorships',
            'rank_permissions',
            'scroll_line_items',
            'spell_lessons',
            'spell_permissions',
            'towers',
            'tuition_scrolls',
            'wizard_ranks',
            'wizards',
        ];

        expect(tableNames).toEqual(expectedTables);

        // Should have many relationships
        expect(result.relationships.length).toBeGreaterThan(30);

        // Should have warnings about unsupported features
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.length).toBeGreaterThan(0);

        // Verify specific critical relationships exist
        const hasWizardSchoolFK = result.relationships.some(
            (r) =>
                r.sourceTable === 'wizards' &&
                r.targetTable === 'magic_schools' &&
                r.sourceColumn === 'school_id'
        );
        expect(hasWizardSchoolFK).toBe(true);

        const hasApprenticeMentorFK = result.relationships.some(
            (r) =>
                r.sourceTable === 'apprentices' &&
                r.targetTable === 'wizards' &&
                r.sourceColumn === 'primary_mentor'
        );
        expect(hasApprenticeMentorFK).toBe(true);
    });

    it('should handle ALTER TABLE ENABLE ROW LEVEL SECURITY', async () => {
        const sql = `
            CREATE TABLE secure_table (id INTEGER PRIMARY KEY);
            ALTER TABLE secure_table ENABLE ROW LEVEL SECURITY;
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.warnings).toBeDefined();
        // The warning should mention row level security
        expect(
            result.warnings!.some((w) =>
                w.toLowerCase().includes('row level security')
            )
        ).toBe(true);
    });

    it('should extract foreign keys even from unparsed tables', async () => {
        const sql = `
            CREATE TABLE base (id UUID PRIMARY KEY);
            
            -- Intentionally malformed to fail parsing
            CREATE TABLE malformed (
                id UUID PRIMARY KEY,
                base_id UUID REFERENCES base(id),
                FOREIGN KEY (base_id) REFERENCES base(id) ON DELETE CASCADE,
                value NUMERIC(10, 
            2) -- Missing closing paren will cause parse failure
        `;

        const result = await fromPostgres(sql);

        // Should still create the table entry
        expect(result.tables.map((t) => t.name)).toContain('malformed');

        // Should extract the foreign key
        const fks = result.relationships.filter(
            (r) => r.sourceTable === 'malformed'
        );
        expect(fks.length).toBeGreaterThan(0);
        expect(fks[0].targetTable).toBe('base');
    });

    describe('Type Synonym Resolution', () => {
        it('should call getPreferredSynonym for PostgreSQL types and use resolved types', async () => {
            // Spy on getPreferredSynonym
            const getPreferredSynonymSpy = vi.spyOn(
                dataTypes,
                'getPreferredSynonym'
            );

            // Mock return value for 'character varying' -> 'varchar'
            getPreferredSynonymSpy.mockImplementation(
                (typeName, databaseType) => {
                    if (
                        typeName === 'character varying' &&
                        databaseType === DatabaseType.POSTGRESQL
                    ) {
                        return {
                            id: 'varchar',
                            name: 'varchar',
                            fieldAttributes: { hasCharMaxLength: true },
                            usageLevel: 1,
                        } as const;
                    }
                    if (
                        typeName === 'integer' &&
                        databaseType === DatabaseType.POSTGRESQL
                    ) {
                        return {
                            id: 'int',
                            name: 'int',
                            usageLevel: 1,
                        } as const;
                    }
                    return null;
                }
            );

            const sql = `
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY,
                    name CHARACTER VARYING(255),
                    email CHARACTER VARYING(100)
                );
            `;

            const diagram = await sqlImportToDiagram({
                sqlContent: sql,
                sourceDatabaseType: DatabaseType.POSTGRESQL,
                targetDatabaseType: DatabaseType.POSTGRESQL,
            });

            // Verify getPreferredSynonym was called
            expect(getPreferredSynonymSpy).toHaveBeenCalled();
            expect(getPreferredSynonymSpy).toHaveBeenCalledWith(
                'integer',
                DatabaseType.POSTGRESQL
            );
            expect(getPreferredSynonymSpy).toHaveBeenCalledWith(
                'varchar',
                DatabaseType.POSTGRESQL
            );

            // Verify the resolved types were used in the diagram
            const usersTable = diagram.tables?.find(
                (t: DBTable) => t.name === 'users'
            );
            expect(usersTable).toBeDefined();

            const idField = usersTable?.fields.find(
                (f: DBField) => f.name === 'id'
            );
            expect(idField?.type.id).toBe('int');
            expect(idField?.type.name).toBe('int');

            const nameField = usersTable?.fields.find(
                (f: DBField) => f.name === 'name'
            );
            expect(nameField?.type.id).toBe('varchar');
            expect(nameField?.type.name).toBe('varchar');

            const emailField = usersTable?.fields.find(
                (f: DBField) => f.name === 'email'
            );
            expect(emailField?.type.id).toBe('varchar');
            expect(emailField?.type.name).toBe('varchar');

            // Restore the original implementation
            getPreferredSynonymSpy.mockRestore();
        });
    });
});
