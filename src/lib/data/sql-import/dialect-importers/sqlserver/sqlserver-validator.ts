export interface SQLServerValidationResult {
    isValid: boolean;
    errors: SQLServerValidationError[];
    warnings: SQLServerValidationWarning[];
}

export interface SQLServerValidationError {
    line?: number;
    column?: number;
    message: string;
    code: string;
    suggestion?: string;
}

export interface SQLServerValidationWarning {
    line?: number;
    message: string;
    code: string;
}

export function validateSQLServerSyntax(
    sql: string
): SQLServerValidationResult {
    const errors: SQLServerValidationError[] = [];
    const warnings: SQLServerValidationWarning[] = [];

    const lines = sql.split('\n');

    // Check for common SQL Server syntax issues
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // 1. Check for MySQL-style backticks (should use square brackets)
        if (line.includes('`')) {
            errors.push({
                line: lineNum,
                message:
                    'SQL Server uses square brackets [name] instead of backticks `name` for identifiers',
                code: 'INVALID_IDENTIFIER_QUOTES',
                suggestion:
                    'Replace backticks with square brackets: `name` → [name]',
            });
        }

        // 2. Check for PostgreSQL-style :: cast operator
        if (line.includes('::')) {
            errors.push({
                line: lineNum,
                message:
                    'SQL Server uses CAST() or CONVERT() instead of :: for type casting',
                code: 'INVALID_CAST_OPERATOR',
                suggestion:
                    'Use CAST(expression AS type) or CONVERT(type, expression)',
            });
        }

        // 3. Check for AUTO_INCREMENT (MySQL style)
        if (/AUTO_INCREMENT/i.test(line)) {
            errors.push({
                line: lineNum,
                message: 'SQL Server uses IDENTITY instead of AUTO_INCREMENT',
                code: 'INVALID_AUTO_INCREMENT',
                suggestion: 'Replace AUTO_INCREMENT with IDENTITY(1,1)',
            });
        }

        // 4. Check for LIMIT clause (not supported in SQL Server)
        if (/\bLIMIT\s+\d+/i.test(line)) {
            errors.push({
                line: lineNum,
                message: 'SQL Server does not support LIMIT clause',
                code: 'UNSUPPORTED_LIMIT',
                suggestion:
                    'Use TOP clause instead: SELECT TOP 10 * FROM table',
            });
        }

        // 5. Check for BOOLEAN type (not native in SQL Server)
        if (/\bBOOLEAN\b/i.test(line)) {
            warnings.push({
                line: lineNum,
                message:
                    'SQL Server does not have a native BOOLEAN type. Use BIT instead.',
                code: 'NO_BOOLEAN_TYPE',
            });
        }
    }

    // Check for unsupported SQL Server features in DDL import
    const unsupportedFeatures = [
        { pattern: /CREATE\s+PROCEDURE/i, feature: 'Stored Procedures' },
        { pattern: /CREATE\s+FUNCTION/i, feature: 'Functions' },
        { pattern: /CREATE\s+TRIGGER/i, feature: 'Triggers' },
        { pattern: /CREATE\s+VIEW/i, feature: 'Views' },
        { pattern: /CREATE\s+ASSEMBLY/i, feature: 'Assemblies' },
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
    };
}
