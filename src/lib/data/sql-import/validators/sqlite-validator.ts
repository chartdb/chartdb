/**
 * SQLite SQL Validator
 * Validates SQLite SQL syntax and provides helpful error messages
 */

import type {
    ValidationResult,
    ValidationError,
    ValidationWarning,
} from './postgresql-validator';

/**
 * Validates SQLite SQL syntax
 * @param sql - The SQLite SQL to validate
 * @returns ValidationResult with errors, warnings, and optional fixed SQL
 */
export function validateSQLiteDialect(sql: string): ValidationResult {
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

    // TODO: Implement SQLite-specific validation
    // For now, just do basic checks

    // Check for common SQLite syntax patterns
    const lines = sql.split('\n');
    let tableCount = 0;

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Count CREATE TABLE statements
        if (trimmedLine.match(/^\s*CREATE\s+TABLE/i)) {
            tableCount++;
        }

        // Check for syntax from other databases that won't work in SQLite
        if (trimmedLine.match(/CREATE\s+SCHEMA/i)) {
            errors.push({
                line: index + 1,
                message: 'CREATE SCHEMA is not supported in SQLite',
                type: 'unsupported',
                suggestion: 'Remove schema creation statements for SQLite',
            });
        }

        if (trimmedLine.includes('ENUM(')) {
            warnings.push({
                message: `Line ${index + 1}: ENUM type is not supported in SQLite. Use CHECK constraints instead.`,
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
