export interface SQLiteValidationResult {
    isValid: boolean;
    errors: SQLiteValidationError[];
    warnings: SQLiteValidationWarning[];
}

export interface SQLiteValidationError {
    line?: number;
    column?: number;
    message: string;
    code: string;
    suggestion?: string;
}

export interface SQLiteValidationWarning {
    line?: number;
    message: string;
    code: string;
}

export function validateSQLiteSyntax(sql: string): SQLiteValidationResult {
    const errors: SQLiteValidationError[] = [];
    const warnings: SQLiteValidationWarning[] = [];

    const lines = sql.split('\n');

    // Check for common SQLite syntax issues
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // 1. Check for square brackets (SQL Server style)
        if (/\[[^\]]+\]/.test(line) && !line.includes('--')) {
            warnings.push({
                line: lineNum,
                message:
                    'SQLite supports square brackets but double quotes are preferred for identifiers',
                code: 'SQUARE_BRACKETS',
            });
        }

        // 2. Check for unsupported data types
        const unsupportedTypes = [
            { type: 'DATETIME2', suggestion: 'Use DATETIME or TEXT' },
            { type: 'NVARCHAR', suggestion: 'Use TEXT' },
            { type: 'MONEY', suggestion: 'Use REAL or NUMERIC' },
            { type: 'UNIQUEIDENTIFIER', suggestion: 'Use TEXT' },
            { type: 'XML', suggestion: 'Use TEXT' },
            { type: 'GEOGRAPHY', suggestion: 'Use TEXT or BLOB' },
            { type: 'GEOMETRY', suggestion: 'Use TEXT or BLOB' },
        ];

        for (const { type, suggestion } of unsupportedTypes) {
            const regex = new RegExp(`\\b${type}\\b`, 'i');
            if (regex.test(line)) {
                errors.push({
                    line: lineNum,
                    message: `SQLite does not support ${type} data type`,
                    code: `UNSUPPORTED_TYPE_${type}`,
                    suggestion: suggestion,
                });
            }
        }

        // 3. Check for CASCADE DELETE/UPDATE (limited support)
        if (/ON\s+(DELETE|UPDATE)\s+CASCADE/i.test(line)) {
            warnings.push({
                line: lineNum,
                message:
                    'CASCADE actions require foreign keys to be enabled in SQLite (PRAGMA foreign_keys = ON)',
                code: 'CASCADE_REQUIRES_FK',
            });
        }

        // 4. Check for multiple primary keys in CREATE TABLE
        if (/PRIMARY\s+KEY/i.test(line)) {
            // Check if this is a column-level primary key
            const beforePK = line.substring(0, line.search(/PRIMARY\s+KEY/i));
            if (beforePK.trim() && !beforePK.includes('CONSTRAINT')) {
                // This is likely a column-level PRIMARY KEY
                // Check if there's already been a PRIMARY KEY in this table
                let tableStartLine = i;
                for (let j = i - 1; j >= 0; j--) {
                    if (/CREATE\s+TABLE/i.test(lines[j])) {
                        tableStartLine = j;
                        break;
                    }
                }

                // Count PRIMARY KEY occurrences in this table
                let pkCount = 0;
                for (let j = tableStartLine; j <= i; j++) {
                    if (/PRIMARY\s+KEY/i.test(lines[j])) {
                        pkCount++;
                    }
                }

                if (pkCount > 1) {
                    warnings.push({
                        line: lineNum,
                        message:
                            'Multiple PRIMARY KEY definitions found. Consider using a composite primary key.',
                        code: 'MULTIPLE_PRIMARY_KEYS',
                    });
                }
            }
        }

        // 5. Check for WITH clause (not fully supported)
        if (/\bWITH\s+\(/i.test(line) && /CREATE\s+TABLE/i.test(line)) {
            warnings.push({
                line: lineNum,
                message:
                    'WITH clause in CREATE TABLE has limited support in SQLite',
                code: 'LIMITED_WITH_SUPPORT',
            });
        }
    }

    // Check for unsupported SQLite features in DDL import
    const unsupportedFeatures = [
        { pattern: /CREATE\s+PROCEDURE/i, feature: 'Stored Procedures' },
        { pattern: /CREATE\s+FUNCTION/i, feature: 'User-defined Functions' },
        { pattern: /DECLARE\s+@/i, feature: 'Variables' },
        { pattern: /CREATE\s+VIEW/i, feature: 'Views' },
    ];

    for (const { pattern, feature } of unsupportedFeatures) {
        if (pattern.test(sql)) {
            warnings.push({
                message: `${feature} are not supported and will be ignored during import`,
                code: `UNSUPPORTED_${feature.toUpperCase().replace(' ', '_')}`,
            });
        }
    }

    // SQLite-specific warnings
    if (/ALTER\s+TABLE.*DROP\s+COLUMN/i.test(sql)) {
        warnings.push({
            message: 'ALTER TABLE DROP COLUMN requires SQLite 3.35.0 or later',
            code: 'DROP_COLUMN_VERSION',
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
