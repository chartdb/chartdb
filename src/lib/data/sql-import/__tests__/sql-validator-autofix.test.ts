import { describe, it, expect } from 'vitest';
import { validateSQL } from '../sql-validator';
import { DatabaseType } from '@/lib/domain';

describe('SQL Validator Auto-fix', () => {
    it('should provide auto-fix for cast operator errors', () => {
        const sql = `
CREATE TABLE dragons (
    id UUID PRIMARY KEY,
    lair_location GEOGRAPHY(POINT, 4326)
);

-- Problematic queries with cast operator errors
SELECT id: :text FROM dragons;
SELECT ST_X(lair_location: :geometry) AS longitude FROM dragons;
        `;

        const result = validateSQL(sql, DatabaseType.POSTGRESQL);

        // Should detect errors
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);

        // Should provide fixed SQL
        expect(result.fixedSQL).toBeDefined();

        // Fixed SQL should have correct cast operators
        expect(result.fixedSQL).toContain('::text');
        expect(result.fixedSQL).toContain('::geometry');
        expect(result.fixedSQL).not.toContain(': :');

        // The CREATE TABLE should remain intact
        expect(result.fixedSQL).toContain('GEOGRAPHY(POINT, 4326)');
    });

    it('should handle multi-line cast operator errors', () => {
        const sql = `
SELECT AVG(power_level): :DECIMAL(3,
2) FROM enchantments;
        `;

        const result = validateSQL(sql, DatabaseType.POSTGRESQL);

        expect(result.isValid).toBe(false);
        expect(result.fixedSQL).toBeDefined();
        expect(result.fixedSQL).toContain('::DECIMAL(3,');
        expect(result.fixedSQL).not.toContain(': :');
    });

    it('should auto-fix split DECIMAL declarations', () => {
        const sql = `
CREATE TABLE potions (
    id INTEGER PRIMARY KEY,
    strength DECIMAL(10,
    2) NOT NULL,
    effectiveness NUMERIC(5,
    3) DEFAULT 0.000
);`;

        const result = validateSQL(sql, DatabaseType.POSTGRESQL);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);

        // Should provide fixed SQL
        expect(result.fixedSQL).toBeDefined();

        // Fixed SQL should have DECIMAL on one line
        expect(result.fixedSQL).toContain('DECIMAL(10,2)');
        expect(result.fixedSQL).toContain('NUMERIC(5,3)');
        expect(result.fixedSQL).not.toMatch(
            /DECIMAL\s*\(\s*\d+\s*,\s*\n\s*\d+\s*\)/
        );

        // Should have warning about auto-fix
        expect(
            result.warnings.some((w) =>
                w.message.includes('Auto-fixed split DECIMAL/NUMERIC')
            )
        ).toBe(true);
    });

    it('should handle multiple auto-fixes together', () => {
        const sql = `
CREATE TABLE enchantments (
    id INTEGER PRIMARY KEY,
    power_level DECIMAL(10,
    2) NOT NULL,
    magic_type VARCHAR(50)
);

SELECT AVG(power_level): :DECIMAL(3,
2) FROM enchantments;
`;

        const result = validateSQL(sql, DatabaseType.POSTGRESQL);

        expect(result.isValid).toBe(false);
        expect(result.fixedSQL).toBeDefined();

        // Should fix both issues
        expect(result.fixedSQL).toContain('DECIMAL(10,2)');
        expect(result.fixedSQL).toContain('::DECIMAL(3,');
        expect(result.fixedSQL).not.toContain(': :');

        // Should have warnings for both fixes
        expect(
            result.warnings.some((w) =>
                w.message.includes('Auto-fixed cast operator')
            )
        ).toBe(true);
        expect(
            result.warnings.some((w) =>
                w.message.includes('Auto-fixed split DECIMAL/NUMERIC')
            )
        ).toBe(true);
    });

    it('should preserve original SQL when no errors', () => {
        const sql = `
CREATE TABLE wizards (
    id UUID PRIMARY KEY,
    name VARCHAR(100)
);`;

        const result = validateSQL(sql, DatabaseType.POSTGRESQL);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.fixedSQL).toBeUndefined();
    });
});
