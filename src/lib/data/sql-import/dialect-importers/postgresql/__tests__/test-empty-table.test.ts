import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Empty table parsing', () => {
    it('should parse empty tables', async () => {
        const sql = `CREATE TABLE empty_table ();`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('empty_table');
        expect(result.tables[0].columns).toHaveLength(0);
    });

    it('should parse mix of empty and non-empty tables', async () => {
        const sql = `
CREATE TABLE normal_table (
    id INTEGER PRIMARY KEY
);

CREATE TABLE empty_table ();

CREATE TABLE another_table (
    name VARCHAR(100)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(3);
        const tableNames = result.tables.map((t) => t.name).sort();
        expect(tableNames).toEqual([
            'another_table',
            'empty_table',
            'normal_table',
        ]);
    });
});
