import { validatePostgreSQLSyntax } from '../../../sql-validator';
import { fromPostgres } from '../postgresql';
import type { SQLParserResult } from '../../../common';

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
 * Import PostgreSQL with validation and error handling
 */
export async function importPostgreSQLWithValidation(
    sql: string
): Promise<ImportResult> {
    try {
        // Step 1: Validate SQL syntax
        const validation = validatePostgreSQLSyntax(sql);

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

        // Step 2: Attempt to parse
        const result = await fromPostgres(sqlToImport);

        // Step 3: Check if we got meaningful results
        if (!result.tables || result.tables.length === 0) {
            return {
                success: false,
                error: {
                    message: 'No tables found in SQL',
                    details:
                        'The SQL was parsed successfully but no tables were found. Please check your SQL contains CREATE TABLE statements.',
                    suggestion:
                        'Ensure your SQL contains valid CREATE TABLE statements',
                },
            };
        }

        // Step 4: Return successful result with any warnings
        return {
            success: true,
            data: {
                ...result,
                warnings: [
                    ...(result.warnings || []),
                    ...(validation.warnings?.map((w) => w.message) || []),
                ],
            },
        };
    } catch (error) {
        // Step 5: Handle parsing errors
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

        // Try to extract line number from parser error
        const lineMatch = errorMessage.match(/line (\d+)/i);
        const line = lineMatch ? parseInt(lineMatch[1]) : undefined;

        // Provide helpful error messages based on common issues
        let suggestion: string | undefined;
        if (errorMessage.includes('Unexpected token')) {
            suggestion =
                'Check for missing semicolons, unclosed quotes, or invalid syntax';
        } else if (errorMessage.includes('Expected')) {
            suggestion = 'Check for incomplete statements or missing keywords';
        } else if (errorMessage.includes('syntax error')) {
            suggestion =
                'Review the SQL syntax, especially around special PostgreSQL features';
        }

        return {
            success: false,
            error: {
                message: 'Failed to parse SQL',
                details: errorMessage,
                line,
                suggestion,
            },
        };
    }
}

/**
 * Quick check if SQL is likely to import successfully
 */
export function canImportSQL(sql: string): {
    canImport: boolean;
    reason?: string;
} {
    if (!sql || !sql.trim()) {
        return { canImport: false, reason: 'SQL is empty' };
    }

    // Check for at least one CREATE TABLE statement
    if (!/CREATE\s+TABLE/i.test(sql)) {
        return { canImport: false, reason: 'No CREATE TABLE statements found' };
    }

    // Quick syntax check
    const validation = validatePostgreSQLSyntax(sql);
    if (!validation.isValid && !validation.fixedSQL) {
        return {
            canImport: false,
            reason: 'SQL contains syntax errors that cannot be auto-fixed',
        };
    }

    return { canImport: true };
}
