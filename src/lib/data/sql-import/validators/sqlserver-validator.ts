/**
 * SQL Server SQL Validator
 * Validates SQL Server (T-SQL) syntax and provides helpful error messages
 */

import type {
    ValidationResult,
    ValidationError,
    ValidationWarning,
} from './postgresql-validator';
import { detectForeignDialect } from './dialect-detection';

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

    // Check for common SQL Server syntax patterns
    const lines = sql.split('\n');
    let tableCount = 0;
    let viewCount = 0;

    // Check for foreign SQL dialects
    const foreignDialectError = detectForeignDialect(lines, 'SQL Server');
    if (foreignDialectError) {
        errors.push(foreignDialectError);
    }

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Count CREATE TABLE statements
        if (trimmedLine.match(/^\s*CREATE\s+TABLE/i)) {
            tableCount++;
        }

        // Count CREATE VIEW statements
        if (trimmedLine.match(/^\s*CREATE\s+(OR\s+ALTER\s+)?VIEW/i)) {
            viewCount++;
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

    // Add import summary message
    if (tableCount > 0 || viewCount > 0) {
        const parts: string[] = [];
        if (tableCount > 0) {
            parts.push(`${tableCount} table${tableCount !== 1 ? 's' : ''}`);
        }
        if (viewCount > 0) {
            parts.push(`${viewCount} view${viewCount !== 1 ? 's' : ''}`);
        }
        warnings.unshift({
            message: `Found ${parts.join(' and ')} to import.`,
            type: 'compatibility',
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        tableCount,
        viewCount,
    };
}
