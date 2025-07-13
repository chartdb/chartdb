export interface MySQLValidationResult {
    isValid: boolean;
    errors: MySQLValidationError[];
    warnings: MySQLValidationWarning[];
    canAutoFix: boolean;
}

export interface MySQLValidationError {
    line?: number;
    column?: number;
    message: string;
    code: string;
    suggestion?: string;
}

export interface MySQLValidationWarning {
    line?: number;
    message: string;
    code: string;
}

export function validateMySQLSyntax(sql: string): MySQLValidationResult {
    const errors: MySQLValidationError[] = [];
    const warnings: MySQLValidationWarning[] = [];
    const canAutoFix = false;

    const lines = sql.split('\n');

    // Check for common MySQL syntax issues
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Skip comment checks if comments are already removed
        // This check is now less relevant since sanitizeSql removes comments first

        // 2. Check for inline REFERENCES (PostgreSQL style)
        if (/\w+\s+\w+\s+(?:PRIMARY\s+KEY\s+)?REFERENCES\s+/i.test(line)) {
            errors.push({
                line: lineNum,
                message:
                    'MySQL/MariaDB does not support inline REFERENCES in column definitions.',
                code: 'INLINE_REFERENCES',
                suggestion:
                    'Use FOREIGN KEY constraint instead:\nFOREIGN KEY (column_name) REFERENCES table_name(column_name)',
            });
        }

        // 3. Check for missing semicolons - be more selective
        const trimmedLine = line.trim();
        // Only check if this looks like the end of a CREATE TABLE statement
        if (
            trimmedLine &&
            trimmedLine.endsWith(')') &&
            !trimmedLine.endsWith(';') &&
            !trimmedLine.endsWith(',') &&
            i + 1 < lines.length
        ) {
            // Look backwards to see if this is part of a CREATE TABLE
            let isCreateTable = false;
            for (let j = i; j >= Math.max(0, i - 20); j--) {
                if (/CREATE\s+TABLE/i.test(lines[j])) {
                    isCreateTable = true;
                    break;
                }
            }

            if (isCreateTable) {
                const nextLine = lines[i + 1].trim();
                // Only warn if next line starts a new statement
                if (
                    nextLine &&
                    nextLine.match(
                        /^(CREATE|DROP|ALTER|INSERT|UPDATE|DELETE)\s+/i
                    )
                ) {
                    warnings.push({
                        line: lineNum,
                        message: 'Statement may be missing a semicolon',
                        code: 'MISSING_SEMICOLON',
                    });
                }
            }
        }

        // Skip JSON comment checks if comments are already removed

        // 5. Check for common typos
        if (line.match(/FOREIGN\s+KEY\s*\(/i) && !line.includes('REFERENCES')) {
            // Check if REFERENCES is on the next line
            if (i + 1 >= lines.length || !lines[i + 1].includes('REFERENCES')) {
                errors.push({
                    line: lineNum,
                    message:
                        'FOREIGN KEY constraint is missing REFERENCES clause',
                    code: 'MISSING_REFERENCES',
                });
            }
        }

        // 6. Check for mismatched quotes - but be smart about it
        // Skip lines that are comments or contain escaped quotes
        if (!line.trim().startsWith('--') && !line.trim().startsWith('#')) {
            // Remove escaped quotes before counting
            const cleanLine = line
                .replace(/\\'/g, '')
                .replace(/\\"/g, '')
                .replace(/\\`/g, '');

            // Also remove quoted strings to avoid false positives
            const withoutStrings = cleanLine
                .replace(/'[^']*'/g, '')
                .replace(/"[^"]*"/g, '')
                .replace(/`[^`]*`/g, '');

            // Now count unmatched quotes
            const singleQuotes = (withoutStrings.match(/'/g) || []).length;
            const doubleQuotes = (withoutStrings.match(/"/g) || []).length;
            const backticks = (withoutStrings.match(/`/g) || []).length;

            if (singleQuotes > 0 || doubleQuotes > 0 || backticks > 0) {
                warnings.push({
                    line: lineNum,
                    message: 'Possible mismatched quotes detected',
                    code: 'MISMATCHED_QUOTES',
                });
            }
        }
    }

    // Check for unsupported MySQL features
    const unsupportedFeatures = [
        { pattern: /CREATE\s+TRIGGER/i, feature: 'Triggers' },
        { pattern: /CREATE\s+PROCEDURE/i, feature: 'Stored Procedures' },
        { pattern: /CREATE\s+FUNCTION/i, feature: 'Functions' },
        { pattern: /CREATE\s+EVENT/i, feature: 'Events' },
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

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        canAutoFix,
    };
}

/**
 * Consolidate duplicate warnings and format them nicely
 */
function consolidateWarnings(warnings: MySQLValidationWarning[]): {
    message: string;
    count: number;
    lines?: number[];
}[] {
    const warningMap = new Map<string, { count: number; lines: number[] }>();

    for (const warning of warnings) {
        const key = warning.code || warning.message;
        if (!warningMap.has(key)) {
            warningMap.set(key, { count: 0, lines: [] });
        }
        const entry = warningMap.get(key)!;
        entry.count++;
        if (warning.line) {
            entry.lines.push(warning.line);
        }
    }

    const consolidated: { message: string; count: number; lines?: number[] }[] =
        [];

    for (const [key, value] of warningMap) {
        // Find the original warning to get the message
        const originalWarning = warnings.find(
            (w) => (w.code || w.message) === key
        )!;
        consolidated.push({
            message: originalWarning.message,
            count: value.count,
            lines: value.lines.length > 0 ? value.lines : undefined,
        });
    }

    // Sort by count (most frequent first)
    return consolidated.sort((a, b) => b.count - a.count);
}

export function formatValidationMessage(result: MySQLValidationResult): string {
    const messages: string[] = [];

    if (!result.isValid) {
        messages.push('❌ MySQL/MariaDB syntax validation failed:\n');

        for (const error of result.errors) {
            messages.push(
                `  Error${error.line ? ` at line ${error.line}` : ''}: ${error.message}`
            );
            if (error.suggestion) {
                messages.push(`    💡 Suggestion: ${error.suggestion}`);
            }
            messages.push('');
        }
    }

    if (result.warnings.length > 0) {
        const consolidated = consolidateWarnings(result.warnings);

        // Only show if there are a reasonable number of warnings
        if (consolidated.length <= 5) {
            messages.push('⚠️  Import Notes:\n');
            for (const warning of consolidated) {
                if (warning.count > 1) {
                    messages.push(
                        `  • ${warning.message} (${warning.count} occurrences)`
                    );
                } else {
                    messages.push(`  • ${warning.message}`);
                }
            }
        } else {
            // For many warnings, just show a summary
            const totalWarnings = result.warnings.length;
            messages.push(
                `⚠️  Import completed with ${totalWarnings} warnings:\n`
            );

            // Show top 3 most common warnings
            const topWarnings = consolidated.slice(0, 3);
            for (const warning of topWarnings) {
                messages.push(`  • ${warning.message} (${warning.count}x)`);
            }

            if (consolidated.length > 3) {
                messages.push(
                    `  • ...and ${consolidated.length - 3} other warning types`
                );
            }
        }
    }

    return messages.join('\n');
}
