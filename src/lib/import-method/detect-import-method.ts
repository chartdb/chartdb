import type { ImportMethod } from './import-method';

export const detectImportMethod = (content: string): ImportMethod | null => {
    if (!content || content.trim().length === 0) return null;

    const upperContent = content.toUpperCase();

    // Check for DBML patterns first (case sensitive)
    const dbmlPatterns = [
        /^Table\s+\w+\s*{/m,
        /^Ref:\s*\w+/m,
        /^Enum\s+\w+\s*{/m,
        /^TableGroup\s+/m,
        /^Note\s+\w+\s*{/m,
        /\[pk\]/,
        /\[ref:\s*[<>-]/,
    ];

    const hasDBMLPatterns = dbmlPatterns.some((pattern) =>
        pattern.test(content)
    );
    if (hasDBMLPatterns) return 'dbml';

    // Common SQL DDL keywords
    const ddlKeywords = [
        'CREATE TABLE',
        'ALTER TABLE',
        'DROP TABLE',
        'CREATE INDEX',
        'CREATE VIEW',
        'CREATE PROCEDURE',
        'CREATE FUNCTION',
        'CREATE SCHEMA',
        'CREATE DATABASE',
    ];

    // Check for SQL DDL patterns
    const hasDDLKeywords = ddlKeywords.some((keyword) =>
        upperContent.includes(keyword)
    );
    if (hasDDLKeywords) return 'ddl';

    // Check if it looks like JSON
    try {
        // Just check structure, don't need full parse for detection
        if (
            (content.trim().startsWith('{') && content.trim().endsWith('}')) ||
            (content.trim().startsWith('[') && content.trim().endsWith(']'))
        ) {
            return 'query';
        }
    } catch (error) {
        // Not valid JSON, might be partial
        console.error('Error detecting content type:', error);
    }

    // If we can't confidently detect, return null
    return null;
};
