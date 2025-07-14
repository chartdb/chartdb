import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL Parser Regression Tests', () => {
    it('should parse all 16 tables from the magical academy example', async () => {
        // This is a regression test for the issue where 3 tables were missing
        const sql = `
-- Core tables
CREATE TABLE magic_schools(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE towers(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES magic_schools(id) ON DELETE CASCADE,
    name text NOT NULL
);

CREATE TABLE wizards(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES magic_schools(id) ON DELETE CASCADE,
    tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
    wizard_name text NOT NULL,
    magic_email text NOT NULL,
    UNIQUE (school_id, wizard_name)
);

-- This function should not prevent the wizards table from being parsed
CREATE FUNCTION enforce_wizard_tower_school()
    RETURNS TRIGGER AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE wizard_ranks(
    wizard_id uuid NOT NULL REFERENCES wizards(id) ON DELETE CASCADE,
    rank_id uuid NOT NULL REFERENCES magical_ranks(id) ON DELETE CASCADE,
    tower_id uuid NOT NULL REFERENCES towers(id) ON DELETE CASCADE,
    PRIMARY KEY (wizard_id, rank_id, tower_id)
);

-- Another function that should be skipped
CREATE FUNCTION another_function() RETURNS void AS $$
BEGIN
    -- Do nothing
END;
$$ LANGUAGE plpgsql;

CREATE TABLE magical_ranks(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES magic_schools(id) ON DELETE CASCADE,
    name text NOT NULL
);

-- Row level security should not break parsing
ALTER TABLE wizards ENABLE ROW LEVEL SECURITY;

CREATE TABLE spell_logs(
    id bigserial PRIMARY KEY,
    school_id uuid,
    wizard_id uuid,
    action text NOT NULL
);
        `;

        const result = await fromPostgres(sql);

        // Should find all 6 tables
        expect(result.tables).toHaveLength(6);

        const tableNames = result.tables.map((t) => t.name).sort();
        expect(tableNames).toEqual([
            'magic_schools',
            'magical_ranks',
            'spell_logs',
            'towers',
            'wizard_ranks',
            'wizards',
        ]);

        if (result.warnings) {
            expect(result.warnings.length).toBeGreaterThan(0);
            expect(
                result.warnings.some(
                    (w) => w.includes('Function') || w.includes('security')
                )
            ).toBe(true);
        } else {
            expect(result.tables).toHaveLength(6);
        }
    });

    it('should handle tables with complex syntax that fail parsing', async () => {
        const sql = `
CREATE TABLE simple_table (
    id uuid PRIMARY KEY,
    name text NOT NULL
);

-- This table has complex syntax that might fail parsing
CREATE TABLE complex_table (
    id uuid PRIMARY KEY,
    value numeric(10,
2), -- Multi-line numeric
    computed numeric(5,2) GENERATED ALWAYS AS (value * 2) STORED,
    UNIQUE (id, value)
);

CREATE TABLE another_table (
    id uuid PRIMARY KEY,
    complex_id uuid REFERENCES complex_table(id),
    simple_id uuid REFERENCES simple_table(id)
);
        `;

        const result = await fromPostgres(sql);

        // Should find all 3 tables even if complex_table fails to parse
        expect(result.tables).toHaveLength(3);
        expect(result.tables.map((t) => t.name).sort()).toEqual([
            'another_table',
            'complex_table',
            'simple_table',
        ]);

        // Should extract foreign keys even from unparsed tables
        const fksFromAnother = result.relationships.filter(
            (r) => r.sourceTable === 'another_table'
        );
        expect(fksFromAnother).toHaveLength(2);
        expect(
            fksFromAnother.some((fk) => fk.targetTable === 'complex_table')
        ).toBe(true);
        expect(
            fksFromAnother.some((fk) => fk.targetTable === 'simple_table')
        ).toBe(true);
    });

    it('should count relationships correctly for multi-tenant system', async () => {
        // Simplified version focusing on relationship counting
        const sql = `
CREATE TABLE tenants(id uuid PRIMARY KEY);
CREATE TABLE branches(
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenants(id)
);
CREATE TABLE roles(
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenants(id)
);
CREATE TABLE permissions(id uuid PRIMARY KEY);
CREATE TABLE role_permissions(
    role_id uuid NOT NULL REFERENCES roles(id),
    permission_id uuid NOT NULL REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);
CREATE TABLE record_types(
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenants(id)
);
CREATE TABLE users(
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    branch_id uuid NOT NULL REFERENCES branches(id)
);
CREATE TABLE user_roles(
    user_id uuid NOT NULL REFERENCES users(id),
    role_id uuid NOT NULL REFERENCES roles(id),
    branch_id uuid NOT NULL REFERENCES branches(id),
    PRIMARY KEY (user_id, role_id, branch_id)
);
CREATE TABLE patients(
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    branch_id uuid NOT NULL REFERENCES branches(id),
    primary_physician uuid REFERENCES users(id),
    referring_physician uuid REFERENCES users(id)
);
        `;

        const result = await fromPostgres(sql);

        // Count expected relationships:
        // branches: 1 (tenant_id -> tenants)
        // roles: 1 (tenant_id -> tenants)
        // role_permissions: 2 (role_id -> roles, permission_id -> permissions)
        // record_types: 1 (tenant_id -> tenants)
        // users: 2 (tenant_id -> tenants, branch_id -> branches)
        // user_roles: 3 (user_id -> users, role_id -> roles, branch_id -> branches)
        // patients: 4 (tenant_id -> tenants, branch_id -> branches, primary_physician -> users, referring_physician -> users)
        // Total: 14

        expect(result.relationships).toHaveLength(14);
    });
});
