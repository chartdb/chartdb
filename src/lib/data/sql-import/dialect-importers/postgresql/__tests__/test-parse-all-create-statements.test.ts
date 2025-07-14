import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Table Count Validation', () => {
    it('should parse all CREATE TABLE statements without missing any', async () => {
        const sql = `
-- Table 1 comment
CREATE TABLE table1 (id INTEGER PRIMARY KEY);

/* Multi-line comment
   for table 2 */
CREATE TABLE table2 (id INTEGER PRIMARY KEY);

CREATE TABLE IF NOT EXISTS table3 (id INTEGER PRIMARY KEY);

-- Junction table
CREATE TABLE table1_table2 (
    table1_id INTEGER REFERENCES table1(id),
    table2_id INTEGER REFERENCES table2(id),
    PRIMARY KEY (table1_id, table2_id)
);

CREATE TABLE "quoted_table" (id INTEGER PRIMARY KEY);

CREATE TABLE schema1.table_with_schema (id INTEGER PRIMARY KEY);`;

        const result = await fromPostgres(sql);

        // Count CREATE TABLE statements in the SQL
        const createTableCount = (sql.match(/CREATE TABLE/gi) || []).length;

        console.log(`\nValidation:`);
        console.log(`- CREATE TABLE statements in SQL: ${createTableCount}`);
        console.log(`- Tables parsed: ${result.tables.length}`);
        console.log(
            `- Table names: ${result.tables.map((t) => t.name).join(', ')}`
        );

        // All CREATE TABLE statements should result in a parsed table
        expect(result.tables).toHaveLength(createTableCount);

        // Verify specific tables
        const expectedTables = [
            'table1',
            'table2',
            'table3',
            'table1_table2',
            'quoted_table',
            'table_with_schema',
        ];
        const actualTables = result.tables.map((t) => t.name).sort();
        expect(actualTables).toEqual(expectedTables.sort());
    });

    it('should handle edge cases that might cause tables to be missed', async () => {
        const sql = `
-- This tests various edge cases

-- 1. Table with only foreign key columns (no regular columns)
CREATE TABLE only_fks (
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- 2. Table with no PRIMARY KEY
CREATE TABLE no_pk (
    data TEXT NOT NULL
);

-- 3. Empty table (pathological case)
CREATE TABLE empty_table ();

-- 4. Table with complex constraints
CREATE TABLE complex_constraints (
    id INTEGER,
    CONSTRAINT pk_complex PRIMARY KEY (id),
    CONSTRAINT chk_positive CHECK (id > 0)
);`;

        const result = await fromPostgres(sql);

        const createTableCount = (sql.match(/CREATE TABLE/gi) || []).length;

        console.log(`\nEdge case validation:`);
        console.log(`- CREATE TABLE statements: ${createTableCount}`);
        console.log(`- Tables parsed: ${result.tables.length}`);
        console.log(
            `- Expected tables: only_fks, no_pk, empty_table, complex_constraints`
        );
        console.log(
            `- Actual tables: ${result.tables.map((t) => t.name).join(', ')}`
        );
        result.tables.forEach((t) => {
            console.log(`- ${t.name}: ${t.columns.length} columns`);
        });

        // Even edge cases should be parsed
        expect(result.tables).toHaveLength(createTableCount);
    });
});
