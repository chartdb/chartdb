import { describe, it, expect } from 'vitest';
import {
    validateMySQLSyntax,
    formatValidationMessage,
} from '../mysql-validator';

describe('MySQL Validator', () => {
    it('should pass valid MySQL after comments are removed', () => {
        // In the new flow, comments are removed before validation
        // So this SQL would have comments stripped and be valid
        const sql = `CREATE TABLE packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    badge_text VARCHAR(50),
    color_code VARCHAR(7)
);`;

        const result = validateMySQLSyntax(sql);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should validate clean SQL without comments', () => {
        // Comments would be removed before validation
        const sql = `CREATE TABLE product_vserver (
    id INT AUTO_INCREMENT PRIMARY KEY,
    available_os JSON
);`;

        const result = validateMySQLSyntax(sql);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should detect inline REFERENCES', () => {
        const sql = `CREATE TABLE users (
    id INT PRIMARY KEY,
    profile_id INT REFERENCES profiles(id)
);`;

        const result = validateMySQLSyntax(sql);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('INLINE_REFERENCES');
        expect(result.errors[0].line).toBe(3);
    });

    it('should pass valid MySQL', () => {
        const sql = `CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE
);

CREATE TABLE posts (
    id INT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200),
    FOREIGN KEY (user_id) REFERENCES users(id)
);`;

        const result = validateMySQLSyntax(sql);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should validate a fantasy-themed MySQL schema', () => {
        // Test with already sanitized SQL (comments removed)
        const sql = `
CREATE TABLE magic_schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    element_type VARCHAR(50),
    forbidden_spells JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wizards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    magic_school_id INT REFERENCES magic_schools(id),  -- Inline REFERENCES (PostgreSQL style)
    power_level INT DEFAULT 1
);`;

        const result = validateMySQLSyntax(sql);

        console.log('\n=== Fantasy Schema Validation ===');
        console.log(`Valid: ${result.isValid}`);
        console.log(`Errors: ${result.errors.length}`);
        console.log(`Warnings: ${result.warnings.length}`);

        // Should only have inline REFERENCES error now
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBe(1);
        expect(result.errors[0].code).toBe('INLINE_REFERENCES');
    });

    it('should format validation messages nicely', () => {
        const sql = `CREATE TABLE test (
    id INT PRIMARY KEY,
    ref_id INT REFERENCES other(id)
);`;

        const result = validateMySQLSyntax(sql);
        const message = formatValidationMessage(result);

        console.log('\nFormatted validation message:');
        console.log(message);

        expect(message).toContain('❌ MySQL/MariaDB syntax validation failed');
        expect(message).toContain('Error at line 3');
        expect(message).toContain('💡 Suggestion');
    });
});
