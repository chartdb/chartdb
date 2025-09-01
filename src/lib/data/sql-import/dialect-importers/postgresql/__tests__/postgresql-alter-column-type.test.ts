import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL ALTER TABLE ALTER COLUMN TYPE', () => {
    it('should handle ALTER TABLE ALTER COLUMN TYPE statements', async () => {
        const sql = `
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "public"."table_12" (
    "id" SERIAL,
    "field1" varchar(200),
    "field2" varchar(200),
    "field3" varchar(200),
    PRIMARY KEY ("id")
);

ALTER TABLE table_12 ALTER COLUMN field1 TYPE VARCHAR(254);
ALTER TABLE table_12 ALTER COLUMN field2 TYPE VARCHAR(254);
ALTER TABLE table_12 ALTER COLUMN field3 TYPE VARCHAR(254);
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        const table = result.tables[0];

        expect(table.name).toBe('table_12');
        expect(table.columns).toHaveLength(4); // id, field1, field2, field3

        // Check that the columns have the updated type
        const field1 = table.columns.find((col) => col.name === 'field1');
        expect(field1).toBeDefined();
        expect(field1?.type).toBe('VARCHAR(254)'); // Should be updated from 200 to 254

        const field2 = table.columns.find((col) => col.name === 'field2');
        expect(field2).toBeDefined();
        expect(field2?.type).toBe('VARCHAR(254)');

        const field3 = table.columns.find((col) => col.name === 'field3');
        expect(field3).toBeDefined();
        expect(field3?.type).toBe('VARCHAR(254)');
    });

    it('should handle various ALTER COLUMN TYPE scenarios', async () => {
        const sql = `
CREATE TABLE test_table (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50),
    age SMALLINT,
    score NUMERIC(5,2)
);

-- Change varchar length
ALTER TABLE test_table ALTER COLUMN name TYPE VARCHAR(100);

-- Change numeric type
ALTER TABLE test_table ALTER COLUMN age TYPE INTEGER;

-- Change precision
ALTER TABLE test_table ALTER COLUMN score TYPE NUMERIC(10,4);
        `;

        const result = await fromPostgres(sql);

        const table = result.tables[0];

        const nameCol = table.columns.find((col) => col.name === 'name');
        expect(nameCol?.type).toBe('VARCHAR(100)');

        const ageCol = table.columns.find((col) => col.name === 'age');
        expect(ageCol?.type).toBe('INTEGER');

        const scoreCol = table.columns.find((col) => col.name === 'score');
        expect(scoreCol?.type).toBe('NUMERIC(10,4)');
    });

    it('should handle multiple type changes on the same column', async () => {
        const sql = `
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "public"."table_12" (
    "id" SERIAL,
    "field1" varchar(200),
    "field2" varchar(200),
    "field3" varchar(200),
    PRIMARY KEY ("id")
);

ALTER TABLE table_12 ALTER COLUMN field1 TYPE VARCHAR(254);
ALTER TABLE table_12 ALTER COLUMN field2 TYPE VARCHAR(254);
ALTER TABLE table_12 ALTER COLUMN field3 TYPE VARCHAR(254);
ALTER TABLE table_12 ALTER COLUMN field1 TYPE BIGINT;
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        const table = result.tables[0];

        expect(table.name).toBe('table_12');
        expect(table.schema).toBe('public');
        expect(table.columns).toHaveLength(4);

        // Check that field1 has the final type (BIGINT), not the intermediate VARCHAR(254)
        const field1 = table.columns.find((col) => col.name === 'field1');
        expect(field1).toBeDefined();
        expect(field1?.type).toBe('BIGINT'); // Should be BIGINT, not VARCHAR(254)

        // Check that field2 and field3 still have VARCHAR(254)
        const field2 = table.columns.find((col) => col.name === 'field2');
        expect(field2).toBeDefined();
        expect(field2?.type).toBe('VARCHAR(254)');

        const field3 = table.columns.find((col) => col.name === 'field3');
        expect(field3).toBeDefined();
        expect(field3?.type).toBe('VARCHAR(254)');
    });
});
