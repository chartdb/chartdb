/**
 * MySQL SQL Validator
 * Validates MySQL SQL syntax and provides helpful error messages
 */

import type {
    ValidationResult,
    ValidationError,
    ValidationWarning,
} from './postgresql-validator';

/**
 * Validates MySQL SQL syntax
 * @param sql - The MySQL SQL to validate
 * @returns ValidationResult with errors, warnings, and optional fixed SQL
 */
export function validateMySQLDialect(sql: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // First check if the SQL is empty or just whitespace
    if (!sql || !sql.trim()) {
        errors.push({
            line: 1,
            message: 'SQL script is empty',
            type: 'syntax',
            suggestion: 'Add CREATE TABLE statements to import',
        });
        return {
            isValid: false,
            errors,
            warnings,
            tableCount: 0,
        };
    }

    // TODO: Implement MySQL-specific validation
    // For now, just do basic checks

    // Check for common MySQL syntax patterns
    const lines = sql.split('\n');
    let tableCount = 0;

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Count CREATE TABLE statements
        if (trimmedLine.match(/^\s*CREATE\s+TABLE/i)) {
            tableCount++;
        }

        // Check for PostgreSQL-specific syntax that won't work in MySQL
        if (trimmedLine.includes('SERIAL')) {
            warnings.push({
                message: `Line ${index + 1}: SERIAL is PostgreSQL syntax. Use AUTO_INCREMENT in MySQL.`,
                type: 'compatibility',
            });
        }

        if (trimmedLine.match(/\[\w+\]/)) {
            warnings.push({
                message: `Line ${index + 1}: Square brackets are SQL Server syntax. Use backticks (\`) in MySQL.`,
                type: 'compatibility',
            });
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        tableCount,
    };
}
