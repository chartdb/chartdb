/**
 * Unified SQL Importer
 * Handles SQL import with validation for all database types
 */

import { DatabaseType } from '@/lib/domain/database-type';
import { validateSQL } from './sql-validator';
import { fromPostgresImproved } from './dialect-importers/postgresql/postgresql-improved';
import { fromMySQL } from './dialect-importers/mysql/mysql';
import { fromSQLServer } from './dialect-importers/sqlserver/sqlserver';
import { fromSQLite } from './dialect-importers/sqlite/sqlite';
import type { SQLParserResult } from './common';

export interface ImportResult {
    success: boolean;
    data?: SQLParserResult & { warnings?: string[] };
    error?: {
        message: string;
        details?: string;
        line?: number;
        suggestion?: string;
    };
    validationErrors?: Array<{
        line: number;
        message: string;
        suggestion?: string;
    }>;
}

/**
 * Import SQL with validation and error handling
 * @param sql - The SQL string to import
 * @param databaseType - The source database type
 * @returns ImportResult with parsed data or errors
 */
export async function importSQLWithValidation(
    sql: string,
    databaseType: DatabaseType
): Promise<ImportResult> {
    try {
        // Step 1: Validate SQL syntax
        const validation = validateSQL(sql, databaseType);

        // If there are syntax errors, check if we can auto-fix
        let sqlToImport = sql;
        if (!validation.isValid) {
            if (validation.fixedSQL) {
                // Use auto-fixed SQL
                sqlToImport = validation.fixedSQL;
                console.log('Auto-fixing SQL syntax errors...');
            } else {
                // Return validation errors
                return {
                    success: false,
                    validationErrors: validation.errors.map((e) => ({
                        line: e.line,
                        message: e.message,
                        suggestion: e.suggestion,
                    })),
                };
            }
        }

        // Step 2: Attempt to parse based on database type
        let result: SQLParserResult;

        switch (databaseType) {
            case DatabaseType.POSTGRESQL:
                result = await fromPostgresImproved(sqlToImport);
                break;

            case DatabaseType.MYSQL:
            case DatabaseType.MARIADB:
                result = await fromMySQL(sqlToImport);
                break;

            case DatabaseType.SQL_SERVER:
                result = await fromSQLServer(sqlToImport);
                break;

            case DatabaseType.SQLITE:
                result = await fromSQLite(sqlToImport);
                break;

            default:
                return {
                    success: false,
                    error: {
                        message: `Unsupported database type: ${databaseType}`,
                        details: 'Please select a supported database type',
                    },
                };
        }

        // Step 3: Check if we got meaningful results
        if (!result.tables || result.tables.length === 0) {
            return {
                success: false,
                error: {
                    message: 'No tables found in SQL',
                    details:
                        'The SQL was parsed successfully but no CREATE TABLE statements were found.',
                    suggestion:
                        'Make sure your SQL contains CREATE TABLE statements',
                },
            };
        }

        // Step 4: Add any warnings from validation
        const warnings: string[] = [];
        if (validation.warnings.length > 0) {
            warnings.push(...validation.warnings.map((w) => w.message));
        }
        if (validation.fixedSQL) {
            warnings.push('SQL was auto-corrected to fix syntax errors');
        }

        return {
            success: true,
            data: {
                ...result,
                warnings: warnings.length > 0 ? warnings : undefined,
            },
        };
    } catch (error) {
        // Handle parser errors
        const errorMessage =
            error instanceof Error ? error.message : String(error);

        // Try to extract line number from error message
        const lineMatch = errorMessage.match(/line (\d+)/i);
        const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;

        return {
            success: false,
            error: {
                message: 'Failed to parse SQL',
                details: errorMessage,
                line,
                suggestion: 'Check your SQL syntax and try again',
            },
        };
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use importSQLWithValidation with DatabaseType.POSTGRESQL instead
 */
export async function importPostgreSQLWithValidation(
    sql: string
): Promise<ImportResult> {
    return importSQLWithValidation(sql, DatabaseType.POSTGRESQL);
}
