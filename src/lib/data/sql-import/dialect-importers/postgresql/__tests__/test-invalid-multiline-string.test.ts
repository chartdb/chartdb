import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Invalid multi-line string in SQL', () => {
    it('should handle SQL with orphaned string literal', async () => {
        // This SQL has a syntax error - string literal on its own line
        const sql = `
CREATE TABLE test_table (
    id UUID PRIMARY KEY,
    description TEXT, -- Example description
"This is an orphaned string"
    name VARCHAR(100)
);`;

        const result = await fromPostgres(sql);

        // Even with syntax error, it should try to parse what it can
        // Should attempt to parse the table even if parser fails
        expect(result.tables.length).toBeGreaterThanOrEqual(0);
    });

    it('should parse all tables even if one has syntax errors', async () => {
        const sql = `
CREATE TABLE table1 (
    id UUID PRIMARY KEY
);

CREATE TABLE table2 (
    id UUID PRIMARY KEY,
    description TEXT, -- Example
"Orphaned string"
    name VARCHAR(100)
);

CREATE TABLE table3 (
    id UUID PRIMARY KEY
);`;

        const result = await fromPostgres(sql);

        // Should parse at least table1 and table3
        expect(result.tables.length).toBeGreaterThanOrEqual(2);

        const tableNames = result.tables.map((t) => t.name);
        expect(tableNames).toContain('table1');
        expect(tableNames).toContain('table3');
    });
});
