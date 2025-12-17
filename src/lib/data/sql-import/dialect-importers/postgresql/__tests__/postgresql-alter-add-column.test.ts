import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL ALTER TABLE ADD COLUMN Tests', () => {
    it('should handle ALTER TABLE ADD COLUMN statements', async () => {
        const sql = `
            CREATE SCHEMA IF NOT EXISTS "public";

            CREATE TABLE "public"."location" (
                "id" bigint NOT NULL,
                CONSTRAINT "pk_table_7_id" PRIMARY KEY ("id")
            );

            -- Add new fields to existing location table
            ALTER TABLE location ADD COLUMN country_id INT;
            ALTER TABLE location ADD COLUMN state_id INT;
            ALTER TABLE location ADD COLUMN location_type_id INT;
            ALTER TABLE location ADD COLUMN city_id INT;
            ALTER TABLE location ADD COLUMN street TEXT;
            ALTER TABLE location ADD COLUMN block TEXT;
            ALTER TABLE location ADD COLUMN building TEXT;
            ALTER TABLE location ADD COLUMN floor TEXT;
            ALTER TABLE location ADD COLUMN apartment TEXT;
            ALTER TABLE location ADD COLUMN lat INT;
            ALTER TABLE location ADD COLUMN long INT;
            ALTER TABLE location ADD COLUMN elevation INT;
            ALTER TABLE location ADD COLUMN erp_site_id INT;
            ALTER TABLE location ADD COLUMN is_active TEXT;
            ALTER TABLE location ADD COLUMN remarks TEXT;
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        const locationTable = result.tables[0];

        expect(locationTable.name).toBe('location');
        expect(locationTable.schema).toBe('public');

        // Should have the original id column plus all the added columns
        expect(locationTable.columns).toHaveLength(16);

        // Check that the id column is present
        const idColumn = locationTable.columns.find((col) => col.name === 'id');
        expect(idColumn).toBeDefined();
        expect(idColumn?.type).toBe('BIGINT');
        expect(idColumn?.primaryKey).toBe(true);

        // Check some of the added columns
        const countryIdColumn = locationTable.columns.find(
            (col) => col.name === 'country_id'
        );
        expect(countryIdColumn).toBeDefined();
        expect(countryIdColumn?.type).toBe('INTEGER');

        const streetColumn = locationTable.columns.find(
            (col) => col.name === 'street'
        );
        expect(streetColumn).toBeDefined();
        expect(streetColumn?.type).toBe('TEXT');

        const remarksColumn = locationTable.columns.find(
            (col) => col.name === 'remarks'
        );
        expect(remarksColumn).toBeDefined();
        expect(remarksColumn?.type).toBe('TEXT');
    });

    it('should handle ALTER TABLE ADD COLUMN with schema qualification', async () => {
        const sql = `
            CREATE TABLE public.users (
                id INTEGER PRIMARY KEY
            );

            ALTER TABLE public.users ADD COLUMN email VARCHAR(255);
            ALTER TABLE public.users ADD COLUMN created_at TIMESTAMP;
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        const usersTable = result.tables[0];

        expect(usersTable.columns).toHaveLength(3);

        const emailColumn = usersTable.columns.find(
            (col) => col.name === 'email'
        );
        expect(emailColumn).toBeDefined();
        expect(emailColumn?.type).toBe('VARCHAR(255)');

        const createdAtColumn = usersTable.columns.find(
            (col) => col.name === 'created_at'
        );
        expect(createdAtColumn).toBeDefined();
        expect(createdAtColumn?.type).toBe('TIMESTAMP');
    });

    it('should handle ALTER TABLE ADD COLUMN with constraints', async () => {
        const sql = `
            CREATE TABLE products (
                id SERIAL PRIMARY KEY
            );

            ALTER TABLE products ADD COLUMN name VARCHAR(100) NOT NULL;
            ALTER TABLE products ADD COLUMN sku VARCHAR(50) UNIQUE;
            ALTER TABLE products ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        const productsTable = result.tables[0];

        expect(productsTable.columns).toHaveLength(4);

        const nameColumn = productsTable.columns.find(
            (col) => col.name === 'name'
        );
        expect(nameColumn).toBeDefined();
        expect(nameColumn?.nullable).toBe(false);

        const skuColumn = productsTable.columns.find(
            (col) => col.name === 'sku'
        );
        expect(skuColumn).toBeDefined();
        expect(skuColumn?.unique).toBe(true);

        const priceColumn = productsTable.columns.find(
            (col) => col.name === 'price'
        );
        expect(priceColumn).toBeDefined();
        expect(priceColumn?.default).toBe('0.00');
    });

    it('should not add duplicate columns', async () => {
        const sql = `
            CREATE TABLE items (
                id INTEGER PRIMARY KEY,
                name VARCHAR(100)
            );

            ALTER TABLE items ADD COLUMN description TEXT;
            ALTER TABLE items ADD COLUMN name VARCHAR(200); -- Should not be added as duplicate
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        const itemsTable = result.tables[0];

        // Should only have 3 columns: id, name (original), and description
        expect(itemsTable.columns).toHaveLength(3);

        const nameColumns = itemsTable.columns.filter(
            (col) => col.name === 'name'
        );
        expect(nameColumns).toHaveLength(1);
        expect(nameColumns[0].type).toBe('VARCHAR(100)'); // Should keep original type
    });

    it('should use default schema when not specified', async () => {
        const sql = `
            CREATE TABLE test_table (
                id INTEGER PRIMARY KEY
            );

            ALTER TABLE test_table ADD COLUMN value TEXT;
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        const testTable = result.tables[0];

        expect(testTable.schema).toBe('public');
        expect(testTable.columns).toHaveLength(2);

        const valueColumn = testTable.columns.find(
            (col) => col.name === 'value'
        );
        expect(valueColumn).toBeDefined();
    });

    it('should handle quoted identifiers in ALTER TABLE ADD COLUMN', async () => {
        const sql = `
            CREATE TABLE "my-table" (
                "id" INTEGER PRIMARY KEY
            );

            ALTER TABLE "my-table" ADD COLUMN "my-column" VARCHAR(50);
            ALTER TABLE "my-table" ADD COLUMN "another-column" INTEGER;
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        const myTable = result.tables[0];

        expect(myTable.name).toBe('my-table');
        expect(myTable.columns).toHaveLength(3);

        const myColumn = myTable.columns.find(
            (col) => col.name === 'my-column'
        );
        expect(myColumn).toBeDefined();
        expect(myColumn?.type).toBe('VARCHAR(50)');

        const anotherColumn = myTable.columns.find(
            (col) => col.name === 'another-column'
        );
        expect(anotherColumn).toBeDefined();
        expect(anotherColumn?.type).toBe('INTEGER');
    });
});
