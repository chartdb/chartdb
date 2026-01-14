/**
 * Shared utilities for detecting SQL dialect-specific syntax
 * Used across all validators to identify incompatible SQL dialects
 */

import type { ValidationError } from './postgresql-validator';

interface DialectDetectionResult {
    detected: boolean;
    dialect: string;
    lines: number[];
    features: string[];
}

/**
 * Detect Oracle-specific SQL syntax in the given SQL content
 */
export function detectOracleSQL(lines: string[]): DialectDetectionResult {
    const oracleTypeLines: number[] = [];
    const detectedFeatures = new Set<string>();

    lines.forEach((line, index) => {
        const upperLine = line.trim().toUpperCase();

        // Check for Oracle-specific data types
        if (upperLine.includes('VARCHAR2')) {
            detectedFeatures.add('VARCHAR2');
            oracleTypeLines.push(index + 1);
        }

        if (
            upperLine.match(/\bNUMBER\s*\(/i) ||
            upperLine.match(/\bNUMBER\b(?!\s*\()/i)
        ) {
            detectedFeatures.add('NUMBER');
            oracleTypeLines.push(index + 1);
        }

        // Could add more Oracle-specific features in the future:
        // - CLOB, BLOB data types
        // - ROWNUM pseudo-column
        // - CONNECT BY for hierarchical queries
        // - MINUS set operator (vs EXCEPT in other DBs)
    });

    return {
        detected: oracleTypeLines.length > 0,
        dialect: 'Oracle',
        lines: oracleTypeLines,
        features: Array.from(detectedFeatures),
    };
}

/**
 * Create an Oracle SQL error for the target database type
 */
export function createOracleError(
    detection: DialectDetectionResult,
    targetDatabase: 'MySQL' | 'PostgreSQL' | 'SQL Server' | 'SQLite'
): ValidationError {
    const lineList = detection.lines.slice(0, 5).join(', ');
    const moreLines =
        detection.lines.length > 5
            ? ` and ${detection.lines.length - 5} more locations`
            : '';

    const featuresText = detection.features.join(', ');

    // Database-specific conversion suggestions
    const conversionMap = {
        MySQL: 'VARCHAR2 → VARCHAR, NUMBER → INT/DECIMAL/NUMERIC',
        PostgreSQL: 'VARCHAR2 → VARCHAR, NUMBER → NUMERIC/INTEGER',
        'SQL Server': 'VARCHAR2 → VARCHAR, NUMBER → INT/DECIMAL/NUMERIC',
        SQLite: 'VARCHAR2 → TEXT, NUMBER → INTEGER/REAL',
    };

    return {
        line: detection.lines[0],
        message: `Oracle SQL syntax detected (${featuresText} types found on lines: ${lineList}${moreLines})`,
        type: 'syntax',
        suggestion: `This appears to be Oracle SQL. Please convert to ${targetDatabase} syntax: ${conversionMap[targetDatabase]}`,
    };
}

/**
 * Detect any foreign SQL dialect in the given content
 * Returns null if no foreign dialect is detected
 */
export function detectForeignDialect(
    lines: string[],
    targetDatabase: 'MySQL' | 'PostgreSQL' | 'SQL Server' | 'SQLite'
): ValidationError | null {
    // Check for Oracle SQL
    const oracleDetection = detectOracleSQL(lines);
    if (oracleDetection.detected) {
        return createOracleError(oracleDetection, targetDatabase);
    }

    // Future: Could add detection for other dialects
    // - DB2 specific syntax
    // - Teradata specific syntax
    // - etc.

    return null;
}
