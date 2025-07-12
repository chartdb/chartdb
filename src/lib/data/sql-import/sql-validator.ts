/**
 * SQL Validator for pre-import validation
 * Provides user-friendly error messages for common SQL syntax issues
 */

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    fixedSQL?: string;
}

export interface ValidationError {
    line: number;
    column?: number;
    message: string;
    type: 'syntax' | 'unsupported' | 'parser';
    suggestion?: string;
}

export interface ValidationWarning {
    message: string;
    type: 'compatibility' | 'data_loss' | 'performance';
}

/**
 * Pre-validates SQL before attempting to parse
 * Detects common syntax errors and provides helpful feedback
 */
export function validatePostgreSQLSyntax(sql: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let fixedSQL = sql;

    // Check for common PostgreSQL syntax errors
    const lines = sql.split('\n');

    // 1. Check for malformed cast operators (: : instead of ::)
    const castOperatorRegex = /:\s+:/g;
    lines.forEach((line, index) => {
        const matches = line.matchAll(castOperatorRegex);
        for (const match of matches) {
            errors.push({
                line: index + 1,
                column: match.index,
                message: `Invalid cast operator ": :" found. PostgreSQL uses "::" for type casting.`,
                type: 'syntax',
                suggestion: 'Replace ": :" with "::"',
            });
        }
    });

    // 2. Check for split DECIMAL declarations
    const decimalSplitRegex = /DECIMAL\s*\(\s*\d+\s*,\s*$/i;
    lines.forEach((line, index) => {
        if (decimalSplitRegex.test(line) && index < lines.length - 1) {
            const nextLine = lines[index + 1].trim();
            if (/^\d+\s*\)/.test(nextLine)) {
                errors.push({
                    line: index + 1,
                    message: `DECIMAL type declaration is split across lines. This may cause parsing errors.`,
                    type: 'syntax',
                    suggestion:
                        'Keep DECIMAL(precision, scale) on a single line',
                });
            }
        }
    });

    // 3. Check for unsupported PostgreSQL extensions
    const extensionRegex =
        /CREATE\s+EXTENSION\s+.*?(postgis|uuid-ossp|pgcrypto)/i;
    const extensionMatches = sql.match(extensionRegex);
    if (extensionMatches) {
        warnings.push({
            message: `CREATE EXTENSION statements found. These will be skipped during import.`,
            type: 'compatibility',
        });
    }

    // 4. Check for functions and triggers
    if (/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i.test(sql)) {
        warnings.push({
            message: `Function definitions found. These will not be imported.`,
            type: 'compatibility',
        });
    }

    if (/CREATE\s+TRIGGER/i.test(sql)) {
        warnings.push({
            message: `Trigger definitions found. These will not be imported.`,
            type: 'compatibility',
        });
    }

    // 5. Check for views
    if (/CREATE\s+(OR\s+REPLACE\s+)?VIEW/i.test(sql)) {
        warnings.push({
            message: `View definitions found. These will not be imported.`,
            type: 'compatibility',
        });
    }

    // 6. Attempt to auto-fix common issues
    let hasAutoFixes = false;

    // Fix cast operator errors
    if (errors.some((e) => e.message.includes('": :"'))) {
        fixedSQL = fixedSQL.replace(/:\s+:/g, '::');
        hasAutoFixes = true;
        warnings.push({
            message: 'Auto-fixed cast operator syntax errors (": :" → "::").',
            type: 'compatibility',
        });
    }

    // Fix split DECIMAL declarations
    if (
        errors.some((e) =>
            e.message.includes('DECIMAL type declaration is split')
        )
    ) {
        // Fix DECIMAL(precision,\nscale) pattern
        fixedSQL = fixedSQL.replace(
            /DECIMAL\s*\(\s*(\d+)\s*,\s*\n\s*(\d+)\s*\)/gi,
            'DECIMAL($1,$2)'
        );
        // Also fix other numeric types that might be split
        fixedSQL = fixedSQL.replace(
            /NUMERIC\s*\(\s*(\d+)\s*,\s*\n\s*(\d+)\s*\)/gi,
            'NUMERIC($1,$2)'
        );
        hasAutoFixes = true;
        warnings.push({
            message: 'Auto-fixed split DECIMAL/NUMERIC type declarations.',
            type: 'compatibility',
        });
    }

    // 7. Check for very large files that might cause performance issues
    const statementCount = (sql.match(/;\s*$/gm) || []).length;
    if (statementCount > 100) {
        warnings.push({
            message: `Large SQL file detected (${statementCount} statements). Import may take some time.`,
            type: 'performance',
        });
    }

    // 8. Check for PostGIS-specific types that might not render properly
    if (/GEOGRAPHY\s*\(/i.test(sql) || /GEOMETRY\s*\(/i.test(sql)) {
        warnings.push({
            message:
                'PostGIS geographic types detected. These will be imported but may not display geometric data.',
            type: 'data_loss',
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        fixedSQL: hasAutoFixes && fixedSQL !== sql ? fixedSQL : undefined,
    };
}

/**
 * Format validation results for display to user
 */
export function formatValidationMessage(result: ValidationResult): string {
    let message = '';

    if (result.errors.length > 0) {
        message += '❌ SQL Syntax Errors Found:\n\n';

        // Group errors by type
        const syntaxErrors = result.errors.filter((e) => e.type === 'syntax');
        if (syntaxErrors.length > 0) {
            message += 'Syntax Issues:\n';
            syntaxErrors.slice(0, 5).forEach((error) => {
                message += `• Line ${error.line}: ${error.message}\n`;
                if (error.suggestion) {
                    message += `  → ${error.suggestion}\n`;
                }
            });
            if (syntaxErrors.length > 5) {
                message += `  ... and ${syntaxErrors.length - 5} more syntax errors\n`;
            }
        }
    }

    if (result.warnings.length > 0) {
        if (message) message += '\n';
        message += '⚠️  Warnings:\n';
        result.warnings.forEach((warning) => {
            message += `• ${warning.message}\n`;
        });
    }

    if (result.fixedSQL) {
        message +=
            '\n💡 Auto-fix available: The syntax errors can be automatically corrected.';
    }

    return message || '✅ SQL syntax appears valid.';
}

/**
 * Quick validation that can be run as user types
 */
export function quickValidate(sql: string): {
    hasErrors: boolean;
    errorCount: number;
} {
    // Just check for the most common error (cast operators)
    const castOperatorMatches = (sql.match(/:\s+:/g) || []).length;

    return {
        hasErrors: castOperatorMatches > 0,
        errorCount: castOperatorMatches,
    };
}
