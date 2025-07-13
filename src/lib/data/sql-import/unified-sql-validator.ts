/**
 * Unified SQL Validator that delegates to appropriate dialect validators
 * Ensures consistent error format with clickable line numbers for all dialects
 */

import { DatabaseType } from '@/lib/domain/database-type';
import {
    validatePostgreSQLSyntax,
    type ValidationResult,
} from './sql-validator';
import { validateMySQLSyntax } from './dialect-importers/mysql/mysql-validator';
import { validateSQLServerSyntax } from './dialect-importers/sqlserver/sqlserver-validator';
import { validateSQLiteSyntax } from './dialect-importers/sqlite/sqlite-validator';

/**
 * Validate SQL based on the database type
 * Returns a unified ValidationResult format for consistent UI display
 */
export function validateSQL(
    sql: string,
    databaseType: DatabaseType
): ValidationResult {
    switch (databaseType) {
        case DatabaseType.POSTGRESQL:
            // PostgreSQL already returns the correct format
            return validatePostgreSQLSyntax(sql);

        case DatabaseType.MYSQL: {
            // Convert MySQL validation result to standard format
            const mysqlResult = validateMySQLSyntax(sql);

            // If there are only warnings (no errors), consolidate them for cleaner display
            let warnings = mysqlResult.warnings.map((warn) => ({
                message: warn.message,
                type: 'compatibility' as const,
            }));

            if (mysqlResult.isValid && mysqlResult.warnings.length > 10) {
                // Too many warnings, just show a summary
                const warningTypes = new Map<string, number>();
                for (const warn of mysqlResult.warnings) {
                    const type = warn.code || 'other';
                    warningTypes.set(type, (warningTypes.get(type) || 0) + 1);
                }

                warnings = [
                    {
                        message: `Import successful. Found ${mysqlResult.warnings.length} minor syntax notes (mostly quote formatting).`,
                        type: 'compatibility' as const,
                    },
                ];
            }

            return {
                isValid: mysqlResult.isValid,
                errors: mysqlResult.errors.map((err) => ({
                    line: err.line || 1,
                    column: err.column,
                    message: err.message,
                    type: 'syntax' as const,
                    suggestion: err.suggestion,
                })),
                warnings,
                fixedSQL: undefined,
                tableCount: undefined,
            };
        }

        case DatabaseType.SQL_SERVER: {
            // Convert SQL Server validation result to standard format
            const sqlServerResult = validateSQLServerSyntax(sql);
            return {
                isValid: sqlServerResult.isValid,
                errors: sqlServerResult.errors.map((err) => ({
                    line: err.line || 1,
                    column: err.column,
                    message: err.message,
                    type: 'syntax' as const,
                    suggestion: err.suggestion,
                })),
                warnings: sqlServerResult.warnings.map((warn) => ({
                    message: warn.message,
                    type: 'compatibility' as const,
                })),
                fixedSQL: undefined,
                tableCount: undefined,
            };
        }

        case DatabaseType.SQLITE: {
            // Convert SQLite validation result to standard format
            const sqliteResult = validateSQLiteSyntax(sql);
            return {
                isValid: sqliteResult.isValid,
                errors: sqliteResult.errors.map((err) => ({
                    line: err.line || 1,
                    column: err.column,
                    message: err.message,
                    type: 'syntax' as const,
                    suggestion: err.suggestion,
                })),
                warnings: sqliteResult.warnings.map((warn) => ({
                    message: warn.message,
                    type: 'compatibility' as const,
                })),
                fixedSQL: undefined,
                tableCount: undefined,
            };
        }

        case DatabaseType.MARIADB:
            // MariaDB uses MySQL validator
            return validateSQL(sql, DatabaseType.MYSQL);

        case DatabaseType.GENERIC:
            // For generic, try to detect the type or use basic validation
            return {
                isValid: true, // Let the parser determine validity
                errors: [],
                warnings: [
                    {
                        message:
                            'Using generic SQL validation. Some dialect-specific issues may not be detected.',
                        type: 'compatibility',
                    },
                ],
            };

        default:
            return {
                isValid: true,
                errors: [],
                warnings: [],
            };
    }
}

/**
 * Extract line number from parser error messages
 * Used as fallback when dialect validators don't catch errors
 */
export function extractLineFromError(errorMessage: string): number | undefined {
    // Common patterns for line numbers in error messages
    const patterns = [
        /line\s+(\d+)/i,
        /Line\s+(\d+)/,
        /at line (\d+)/i,
        /\((\d+):\d+\)/, // (line:column) format
        /row (\d+)/i,
    ];

    for (const pattern of patterns) {
        const match = errorMessage.match(pattern);
        if (match && match[1]) {
            return parseInt(match[1], 10);
        }
    }

    return undefined;
}

/**
 * Format parser errors into ValidationResult format
 * This ensures parser errors can be displayed with clickable line numbers
 */
export function formatParserError(errorMessage: string): ValidationResult {
    const line = extractLineFromError(errorMessage);

    return {
        isValid: false,
        errors: [
            {
                line: line || 1,
                message: errorMessage,
                type: 'parser' as const,
                suggestion: 'Check your SQL syntax near the reported line',
            },
        ],
        warnings: [],
    };
}
