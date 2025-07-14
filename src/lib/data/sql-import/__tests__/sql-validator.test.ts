import { describe, it, expect } from 'vitest';
import { validateSQL } from '../sql-validator';
import { DatabaseType } from '@/lib/domain';

describe('SQL Validator', () => {
    it('should detect cast operator errors (: :)', () => {
        const sql = `
CREATE TABLE wizards (
    id UUID PRIMARY KEY,
    spellbook JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT id: :text FROM wizards;
SELECT COUNT(*): :integer FROM wizards;
        `;

        const result = validateSQL(sql, DatabaseType.POSTGRESQL);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors[0].message).toContain('Invalid cast operator');
        expect(result.errors[0].suggestion).toBe('Replace ": :" with "::"');
        expect(result.fixedSQL).toBeDefined();
        expect(result.fixedSQL).toContain('::text');
        expect(result.fixedSQL).toContain('::integer');
    });

    it('should detect split DECIMAL declarations', () => {
        const sql = `
CREATE TABLE potions (
    id INTEGER PRIMARY KEY,
    power_level DECIMAL(10,
    2) NOT NULL
);`;

        const result = validateSQL(sql, DatabaseType.POSTGRESQL);

        expect(result.isValid).toBe(false);
        expect(
            result.errors.some((e) =>
                e.message.includes('DECIMAL type declaration is split')
            )
        ).toBe(true);
    });

    it('should warn about extensions', () => {
        const sql = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION postgis;
CREATE TABLE dragons (id UUID PRIMARY KEY);
        `;

        const result = validateSQL(sql, DatabaseType.POSTGRESQL);

        expect(
            result.warnings.some((w) => w.message.includes('CREATE EXTENSION'))
        ).toBe(true);
    });

    it('should warn about functions and triggers', () => {
        const sql = `
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wizards_timestamp
BEFORE UPDATE ON wizards
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
        `;

        const result = validateSQL(sql, DatabaseType.POSTGRESQL);

        expect(
            result.warnings.some((w) =>
                w.message.includes('Function definitions')
            )
        ).toBe(true);
        expect(
            result.warnings.some((w) =>
                w.message.includes('Trigger definitions')
            )
        ).toBe(true);
    });

    it('should validate clean SQL as valid', () => {
        const sql = `
CREATE TABLE wizards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    magic_email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE spells (
    id SERIAL PRIMARY KEY,
    wizard_id UUID REFERENCES wizards(id),
    name VARCHAR(200) NOT NULL,
    incantation TEXT
);
        `;

        const result = validateSQL(sql, DatabaseType.POSTGRESQL);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.fixedSQL).toBeUndefined();
    });

    it('should handle the fifth example file issues', () => {
        const sql = `
-- Sample from the problematic file
UPDATE magic_towers 
SET 
    power_average = (
        SELECT AVG(power): :DECIMAL(3,
        2) 
        FROM enchantments 
        WHERE tower_id = NEW.tower_id
    );

SELECT 
    ST_X(t.location: :geometry) AS longitude,
    ST_Y(t.location: :geometry) AS latitude
FROM towers t;
        `;

        const result = validateSQL(sql, DatabaseType.POSTGRESQL);

        expect(result.isValid).toBe(false);
        // Should find multiple cast operator errors
        expect(
            result.errors.filter((e) =>
                e.message.includes('Invalid cast operator')
            ).length
        ).toBeGreaterThan(0);
        expect(result.fixedSQL).toBeDefined();
        expect(result.fixedSQL).not.toContain(': :');
        expect(result.fixedSQL).toContain('::DECIMAL');
        expect(result.fixedSQL).toContain('::geometry');
    });
});
