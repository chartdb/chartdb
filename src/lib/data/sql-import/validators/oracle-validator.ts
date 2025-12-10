/**
 * Oracle SQL Validator
 * Validates Oracle SQL syntax and provides helpful error messages
 */

import type {
    ValidationResult,
    ValidationError,
    ValidationWarning,
} from './postgresql-validator';

/**
 * Validates Oracle SQL syntax
 * @param sql - The Oracle SQL to validate
 * @returns ValidationResult with errors, warnings, and optional fixed SQL
 */
export function validateOracleDialect(sql: string): ValidationResult {
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

    // Check for common Oracle syntax patterns
    const lines = sql.split('\n');
    let tableCount = 0;

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Count CREATE TABLE statements
        if (trimmedLine.match(/^\s*CREATE\s+TABLE/i)) {
            tableCount++;
        }

        // Check for syntax from other databases that won't work in Oracle
        if (trimmedLine.includes('AUTO_INCREMENT')) {
            warnings.push({
                message: `Line ${index + 1}: AUTO_INCREMENT is MySQL syntax. Use GENERATED AS IDENTITY in Oracle.`,
                type: 'compatibility',
            });
        }

        if (trimmedLine.includes('SERIAL')) {
            warnings.push({
                message: `Line ${index + 1}: SERIAL is PostgreSQL syntax. Use GENERATED AS IDENTITY in Oracle.`,
                type: 'compatibility',
            });
        }

        if (trimmedLine.match(/\bIDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)/i)) {
            warnings.push({
                message: `Line ${index + 1}: IDENTITY(seed, increment) is SQL Server syntax. Use GENERATED AS IDENTITY in Oracle.`,
                type: 'compatibility',
            });
        }

        // Check for MySQL-specific types
        if (trimmedLine.match(/\bTINYINT\b/i)) {
            warnings.push({
                message: `Line ${index + 1}: TINYINT is not an Oracle type. Consider using NUMBER(3) instead.`,
                type: 'compatibility',
            });
        }

        if (trimmedLine.match(/\bMEDIUMINT\b/i)) {
            warnings.push({
                message: `Line ${index + 1}: MEDIUMINT is not an Oracle type. Consider using NUMBER(7) instead.`,
                type: 'compatibility',
            });
        }

        // Check for SQL Server-specific types
        if (trimmedLine.match(/\bNVARCHAR\s*\(\s*max\s*\)/i)) {
            warnings.push({
                message: `Line ${index + 1}: NVARCHAR(max) is SQL Server syntax. Use NCLOB in Oracle.`,
                type: 'compatibility',
            });
        }

        if (trimmedLine.match(/\bVARCHAR\s*\(\s*max\s*\)/i)) {
            warnings.push({
                message: `Line ${index + 1}: VARCHAR(max) is SQL Server syntax. Use CLOB in Oracle.`,
                type: 'compatibility',
            });
        }

        if (trimmedLine.match(/\bUNIQUEIDENTIFIER\b/i)) {
            warnings.push({
                message: `Line ${index + 1}: UNIQUEIDENTIFIER is SQL Server syntax. Use RAW(16) or SYS_GUID() in Oracle.`,
                type: 'compatibility',
            });
        }

        if (trimmedLine.match(/\bDATETIME2\b/i)) {
            warnings.push({
                message: `Line ${index + 1}: DATETIME2 is SQL Server syntax. Use TIMESTAMP in Oracle.`,
                type: 'compatibility',
            });
        }

        // Check for PostgreSQL-specific syntax
        if (trimmedLine.match(/\bJSONB\b/i)) {
            warnings.push({
                message: `Line ${index + 1}: JSONB is PostgreSQL syntax. Use JSON in Oracle 21c+ or CLOB for older versions.`,
                type: 'compatibility',
            });
        }

        if (trimmedLine.match(/::/)) {
            warnings.push({
                message: `Line ${index + 1}: :: cast syntax is PostgreSQL specific. Use CAST() in Oracle.`,
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
