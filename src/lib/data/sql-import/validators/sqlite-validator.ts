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
    let fixedSQL = sql;

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

    // Check if the SQL contains any valid SQL keywords
    const sqlKeywords =
        /\b(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT|TABLE|INDEX|VIEW|TRIGGER|PRAGMA)\b/i;
    if (!sqlKeywords.test(sql)) {
        errors.push({
            line: 1,
            message: 'No valid SQL statements found',
            type: 'syntax',
            suggestion:
                'Ensure your SQL contains valid statements like CREATE TABLE',
        });
        return {
            isValid: false,
            errors,
            warnings,
            tableCount: 0,
        };
    }

    // Check for common SQLite syntax patterns
    const lines = sql.split('\n');

    // Check for statements without proper termination
    const nonCommentLines = lines.filter((line) => {
        const trimmed = line.trim();
        return (
            trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('/*')
        );
    });

    if (nonCommentLines.length > 0) {
        // Check if SQL has any complete statements (ending with semicolon)
        const hasCompleteStatements =
            /;\s*($|\n|--)/m.test(sql) || sql.trim().endsWith(';');
        if (!hasCompleteStatements && !sql.match(/^\s*--/)) {
            warnings.push({
                message: 'SQL statements should end with semicolons (;)',
                type: 'compatibility',
            });
        }
    }

    // 1. Check for unsupported schema operations
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // SQLite doesn't support CREATE SCHEMA
        if (trimmedLine.match(/CREATE\s+SCHEMA/i)) {
            errors.push({
                line: index + 1,
                message: 'CREATE SCHEMA is not supported in SQLite',
                type: 'unsupported',
                suggestion: 'Remove schema creation statements for SQLite',
            });
        }

        // SQLite doesn't support DROP SCHEMA
        if (trimmedLine.match(/DROP\s+SCHEMA/i)) {
            errors.push({
                line: index + 1,
                message: 'DROP SCHEMA is not supported in SQLite',
                type: 'unsupported',
                suggestion: 'Remove schema drop statements for SQLite',
            });
        }
    });

    // 2. Check for unsupported data types and suggest alternatives
    lines.forEach((line) => {
        const trimmedLine = line.trim();

        // ENUM type not supported
        if (trimmedLine.match(/\bENUM\s*\(/i)) {
            warnings.push({
                message: `ENUM type is not supported in SQLite. Use CHECK constraints instead.`,
                type: 'compatibility',
            });
        }

        // BOOLEAN type - handled in auto-fix section

        // UUID type not natively supported
        if (trimmedLine.match(/\bUUID\b/i)) {
            warnings.push({
                message: `UUID type is not natively supported in SQLite. Will be stored as TEXT.`,
                type: 'compatibility',
            });
        }

        // JSON type (available in SQLite 3.38+)
        if (trimmedLine.match(/\bJSON\b/i)) {
            warnings.push({
                message: `JSON type requires SQLite 3.38 or later. Will be stored as TEXT in older versions.`,
                type: 'compatibility',
            });
        }

        // SERIAL/AUTO_INCREMENT differences - handled in auto-fix section
    });

    // 3. Check for unsupported ALTER TABLE operations
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // ALTER TABLE DROP COLUMN (not supported in older SQLite versions)
        if (trimmedLine.match(/ALTER\s+TABLE.*DROP\s+COLUMN/i)) {
            warnings.push({
                message: `ALTER TABLE DROP COLUMN requires SQLite 3.35.0 or later.`,
                type: 'compatibility',
            });
        }

        // ALTER TABLE ADD CONSTRAINT (limited support)
        if (trimmedLine.match(/ALTER\s+TABLE.*ADD\s+CONSTRAINT/i)) {
            warnings.push({
                message: `ALTER TABLE ADD CONSTRAINT has limited support in SQLite. Consider defining constraints in CREATE TABLE.`,
                type: 'compatibility',
            });
        }

        // ALTER TABLE MODIFY COLUMN (not supported)
        if (trimmedLine.match(/ALTER\s+TABLE.*MODIFY\s+COLUMN/i)) {
            errors.push({
                line: index + 1,
                message: 'ALTER TABLE MODIFY COLUMN is not supported in SQLite',
                type: 'unsupported',
                suggestion:
                    'Use ALTER TABLE RENAME COLUMN or recreate the table',
            });
        }
    });

    // 4. Check for foreign key constraints
    if (/FOREIGN\s+KEY/i.test(sql)) {
        warnings.push({
            message: `Foreign key constraints found. Ensure PRAGMA foreign_keys=ON is set for enforcement.`,
            type: 'compatibility',
        });
    }

    // 5. Check for functions and triggers
    if (/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i.test(sql)) {
        warnings.push({
            message: `Function definitions found. SQLite has limited function support compared to other databases.`,
            type: 'compatibility',
        });
    }

    if (/CREATE\s+TRIGGER/i.test(sql)) {
        warnings.push({
            message: `Trigger definitions found. These will be imported but may have different behavior than other databases.`,
            type: 'compatibility',
        });
    }

    // 6. Check for views
    if (/CREATE\s+(OR\s+REPLACE\s+)?VIEW/i.test(sql)) {
        warnings.push({
            message: `View definitions found. These will be imported as tables in the diagram.`,
            type: 'compatibility',
        });
    }

    // 7. Check for SQLite-specific syntax that might cause issues
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Check for double quotes around identifiers (should use square brackets or backticks in SQLite)
        if (trimmedLine.match(/CREATE\s+TABLE\s+"[^"]+"/i)) {
            warnings.push({
                message: `Double quotes around table names detected. SQLite prefers square brackets [name] or backticks \`name\`.`,
                type: 'compatibility',
            });
        }

        // Check for AUTOINCREMENT without INTEGER PRIMARY KEY
        if (
            trimmedLine.match(/AUTOINCREMENT/i) &&
            !trimmedLine.match(/INTEGER\s+PRIMARY\s+KEY/i)
        ) {
            errors.push({
                line: index + 1,
                message:
                    'AUTOINCREMENT can only be used with INTEGER PRIMARY KEY in SQLite',
                type: 'syntax',
                suggestion: 'Use INTEGER PRIMARY KEY AUTOINCREMENT',
            });
        }
    });

    // 8. Attempt to auto-fix common issues
    let hasAutoFixes = false;

    // Fix SERIAL to INTEGER PRIMARY KEY AUTOINCREMENT
    if (/\bSERIAL\b/i.test(sql)) {
        // Handle both "SERIAL PRIMARY KEY" and standalone "SERIAL"
        fixedSQL = fixedSQL.replace(
            /\bSERIAL\s+PRIMARY\s+KEY\b/gi,
            'INTEGER PRIMARY KEY AUTOINCREMENT'
        );
        fixedSQL = fixedSQL.replace(
            /\bSERIAL\b/gi,
            'INTEGER PRIMARY KEY AUTOINCREMENT'
        );
        hasAutoFixes = true;
        errors.push({
            line:
                sql.split('\n').findIndex((line) => /\bSERIAL\b/i.test(line)) +
                1,
            message: 'SERIAL type is not supported in SQLite',
            type: 'syntax',
            suggestion: 'Use INTEGER PRIMARY KEY AUTOINCREMENT instead',
        });
        warnings.push({
            message:
                'Auto-fixed SERIAL type to INTEGER PRIMARY KEY AUTOINCREMENT.',
            type: 'compatibility',
        });
    }

    // Fix BOOLEAN to INTEGER with CHECK constraint
    const booleanRegex = /(\w+)\s+BOOLEAN/gi;
    if (booleanRegex.test(sql)) {
        const booleanLineIndex = sql
            .split('\n')
            .findIndex((line) => /\bBOOLEAN\b/i.test(line));
        fixedSQL = fixedSQL.replace(
            booleanRegex,
            '$1 INTEGER CHECK($1 IN (0, 1))'
        );
        hasAutoFixes = true;
        errors.push({
            line: booleanLineIndex + 1,
            message: 'BOOLEAN type is not natively supported in SQLite',
            type: 'syntax',
            suggestion: 'Use INTEGER with CHECK constraint instead',
        });
        warnings.push({
            message:
                'Auto-fixed BOOLEAN type to INTEGER with CHECK constraint.',
            type: 'compatibility',
        });
    }

    // Fix CURRENT_DATE to date('now') for SQLite
    if (/DEFAULT\s+CURRENT_DATE/i.test(sql)) {
        fixedSQL = fixedSQL.replace(
            /DEFAULT\s+CURRENT_DATE/gi,
            "DEFAULT (date('now'))"
        );
        hasAutoFixes = true;
        errors.push({
            line:
                sql
                    .split('\n')
                    .findIndex((line) => /DEFAULT\s+CURRENT_DATE/i.test(line)) +
                1,
            message: 'CURRENT_DATE is not supported in SQLite DEFAULT clauses',
            type: 'syntax',
            suggestion: "Use DEFAULT (date('now')) instead",
        });
        warnings.push({
            message: "Auto-fixed CURRENT_DATE to DEFAULT (date('now')).",
            type: 'compatibility',
        });
    }

    // Fix INT to INTEGER for better SQLite compatibility
    if (/\bINT\b(?=\s+REFERENCES)/i.test(sql)) {
        fixedSQL = fixedSQL.replace(/\bINT\b(?=\s+REFERENCES)/gi, 'INTEGER');
        hasAutoFixes = true;
        warnings.push({
            message:
                'Auto-fixed INT to INTEGER for better SQLite compatibility.',
            type: 'compatibility',
        });
    }

    // Add PRAGMA foreign_keys = ON; if foreign keys are used
    if (
        /REFERENCES\s+\w+\s*\(/i.test(sql) &&
        !/PRAGMA\s+foreign_keys/i.test(sql)
    ) {
        fixedSQL = 'PRAGMA foreign_keys = ON;\n\n' + fixedSQL;
        hasAutoFixes = true;
        warnings.push({
            message:
                'Added PRAGMA foreign_keys = ON; to enable foreign key constraints.',
            type: 'compatibility',
        });
    }

    // 9. Check for very large files that might cause performance issues
    const statementCount = (sql.match(/;\s*$/gm) || []).length;
    if (statementCount > 100) {
        warnings.push({
            message: `Large SQL file detected (${statementCount} statements). Import may take some time.`,
            type: 'performance',
        });
    }

    // 10. Check for SQLite-specific PRAGMA statements
    if (/PRAGMA\s+/i.test(sql)) {
        warnings.push({
            message: `PRAGMA statements found. These control SQLite behavior and will not be imported as schema.`,
            type: 'compatibility',
        });
    }

    // 11. Count CREATE TABLE statements
    let tableCount = 0;
    const createTableRegex =
        /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:\[?[^\]\s.]+\]?\.)?[[`"]?[^\]`"\s.()+[\]]+[\]`"]?/gi;
    const matches = sql.match(createTableRegex);
    if (matches) {
        tableCount = matches.length;
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        fixedSQL: hasAutoFixes && fixedSQL !== sql ? fixedSQL : undefined,
        tableCount,
    };
}

/**
 * Format validation results for display to user
 */
export function formatSQLiteValidationMessage(
    result: ValidationResult
): string {
    let message = '';

    if (result.errors.length > 0) {
        message += '❌ SQLite SQL Syntax Errors Found:\n\n';

        // Group errors by type
        const syntaxErrors = result.errors.filter((e) => e.type === 'syntax');
        const unsupportedErrors = result.errors.filter(
            (e) => e.type === 'unsupported'
        );

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

        if (unsupportedErrors.length > 0) {
            if (syntaxErrors.length > 0) message += '\n';
            message += 'Unsupported Features:\n';
            unsupportedErrors.slice(0, 5).forEach((error) => {
                message += `• Line ${error.line}: ${error.message}\n`;
                if (error.suggestion) {
                    message += `  → ${error.suggestion}\n`;
                }
            });
            if (unsupportedErrors.length > 5) {
                message += `  ... and ${unsupportedErrors.length - 5} more unsupported features\n`;
            }
        }
    }

    if (result.warnings.length > 0) {
        if (message) message += '\n';
        message += '⚠️  SQLite Compatibility Warnings:\n';
        result.warnings.forEach((warning) => {
            message += `• ${warning.message}\n`;
        });
    }

    if (result.fixedSQL) {
        message +=
            '\n💡 Auto-fix available: Some compatibility issues can be automatically corrected for SQLite.';
    }

    return message || '✅ SQL syntax appears compatible with SQLite.';
}

/**
 * Quick validation that can be run as user types
 */
export function quickSQLiteValidate(sql: string): {
    hasErrors: boolean;
    errorCount: number;
} {
    // Check for the most common SQLite incompatibilities
    const schemaMatches = (sql.match(/CREATE\s+SCHEMA/gi) || []).length;
    const modifyColumnMatches = (
        sql.match(/ALTER\s+TABLE.*MODIFY\s+COLUMN/gi) || []
    ).length;

    // Check for AUTOINCREMENT without INTEGER PRIMARY KEY
    const autoIncrementIssues = sql.split('\n').filter((line) => {
        const trimmed = line.trim();
        return (
            trimmed.match(/AUTOINCREMENT/i) &&
            !trimmed.match(/INTEGER\s+PRIMARY\s+KEY/i)
        );
    }).length;

    const totalErrors =
        schemaMatches + autoIncrementIssues + modifyColumnMatches;

    return {
        hasErrors: totalErrors > 0,
        errorCount: totalErrors,
    };
}
