/**
 * SQL Server SQL Validator
 * Validates SQL Server (T-SQL) syntax and provides helpful error messages
 */

import type {
    ValidationResult,
    ValidationError,
    ValidationWarning,
} from './postgresql-validator';

/**
 * Validates SQL Server SQL syntax
 * @param sql - The SQL Server SQL to validate
 * @returns ValidationResult with errors, warnings, and optional fixed SQL
 */
export function validateSQLServerDialect(sql: string): ValidationResult {
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

    // TODO: Implement SQL Server-specific validation
    // For now, just do basic checks

    // Check for common SQL Server syntax patterns
    const lines = sql.split('\n');
    let tableCount = 0;

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Count CREATE TABLE statements
        if (trimmedLine.match(/^\s*CREATE\s+TABLE/i)) {
            tableCount++;
        }

        // Check for syntax from other databases that won't work in SQL Server
        if (trimmedLine.includes('AUTO_INCREMENT')) {
            warnings.push({
                message: `Line ${index + 1}: AUTO_INCREMENT is MySQL syntax. Use IDENTITY in SQL Server.`,
                type: 'compatibility',
            });
        }

        if (trimmedLine.includes('SERIAL')) {
            warnings.push({
                message: `Line ${index + 1}: SERIAL is PostgreSQL syntax. Use IDENTITY in SQL Server.`,
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
