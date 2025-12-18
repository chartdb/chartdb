import { describe, it, expect } from 'vitest';
import { fromSQLite } from '../sqlite';

describe('SQLite Import Tests', () => {
    it('should parse SQLite script with sqlite_sequence table and all relationships', async () => {
        const sql = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  age INTEGER
);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  price REAL
);
CREATE TABLE user_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
        `;

        const result = await fromSQLite(sql);

        // ============= CHECK TOTAL COUNTS =============
        // Should have exactly 4 tables
        expect(result.tables).toHaveLength(4);

        // Should have exactly 2 foreign key relationships
        expect(result.relationships).toHaveLength(2);

        // ============= CHECK USERS TABLE =============
        const usersTable = result.tables.find((t) => t.name === 'users');
        expect(usersTable).toBeDefined();
        expect(usersTable?.columns).toHaveLength(3); // id, name, age

        // Check each column in users table
        expect(usersTable?.columns[0]).toMatchObject({
            name: 'id',
            type: 'INTEGER',
            primaryKey: true,
            increment: true,
            nullable: false,
        });
        expect(usersTable?.columns[1]).toMatchObject({
            name: 'name',
            type: 'TEXT',
            primaryKey: false,
            nullable: true,
        });
        expect(usersTable?.columns[2]).toMatchObject({
            name: 'age',
            type: 'INTEGER',
            primaryKey: false,
            nullable: true,
        });

        // ============= CHECK SQLITE_SEQUENCE TABLE =============
        const sqliteSequenceTable = result.tables.find(
            (t) => t.name === 'sqlite_sequence'
        );
        expect(sqliteSequenceTable).toBeDefined();
        expect(sqliteSequenceTable?.columns).toHaveLength(2); // name, seq

        // Check columns in sqlite_sequence table
        expect(sqliteSequenceTable?.columns[0]).toMatchObject({
            name: 'name',
            type: 'TEXT', // Should default to TEXT when no type specified
            primaryKey: false,
            nullable: true,
        });
        expect(sqliteSequenceTable?.columns[1]).toMatchObject({
            name: 'seq',
            type: 'TEXT', // Should default to TEXT when no type specified
            primaryKey: false,
            nullable: true,
        });

        // ============= CHECK PRODUCTS TABLE =============
        const productsTable = result.tables.find((t) => t.name === 'products');
        expect(productsTable).toBeDefined();
        expect(productsTable?.columns).toHaveLength(3); // id, name, price

        // Check each column in products table
        expect(productsTable?.columns[0]).toMatchObject({
            name: 'id',
            type: 'INTEGER',
            primaryKey: true,
            increment: true,
            nullable: false,
        });
        expect(productsTable?.columns[1]).toMatchObject({
            name: 'name',
            type: 'TEXT',
            primaryKey: false,
            nullable: true,
        });
        expect(productsTable?.columns[2]).toMatchObject({
            name: 'price',
            type: 'REAL',
            primaryKey: false,
            nullable: true,
        });

        // ============= CHECK USER_PRODUCTS TABLE =============
        const userProductsTable = result.tables.find(
            (t) => t.name === 'user_products'
        );
        expect(userProductsTable).toBeDefined();
        expect(userProductsTable?.columns).toHaveLength(4); // id, user_id, product_id, purchased_at

        // Check each column in user_products table
        expect(userProductsTable?.columns[0]).toMatchObject({
            name: 'id',
            type: 'INTEGER',
            primaryKey: true,
            increment: true,
            nullable: false,
        });
        expect(userProductsTable?.columns[1]).toMatchObject({
            name: 'user_id',
            type: 'INTEGER',
            primaryKey: false,
            nullable: false, // NOT NULL constraint
        });
        expect(userProductsTable?.columns[2]).toMatchObject({
            name: 'product_id',
            type: 'INTEGER',
            primaryKey: false,
            nullable: false, // NOT NULL constraint
        });
        expect(userProductsTable?.columns[3]).toMatchObject({
            name: 'purchased_at',
            type: 'TIMESTAMP', // DATETIME should map to TIMESTAMP
            primaryKey: false,
            nullable: true,
            default: 'CURRENT_TIMESTAMP',
        });

        // ============= CHECK FOREIGN KEY RELATIONSHIPS =============
        // FK 1: user_products.user_id -> users.id
        const userIdFK = result.relationships.find(
            (r) =>
                r.sourceTable === 'user_products' &&
                r.sourceColumn === 'user_id' &&
                r.targetTable === 'users' &&
                r.targetColumn === 'id'
        );
        expect(userIdFK).toBeDefined();
        expect(userIdFK).toMatchObject({
            sourceTable: 'user_products',
            sourceColumn: 'user_id',
            targetTable: 'users',
            targetColumn: 'id',
        });

        // FK 2: user_products.product_id -> products.id
        const productIdFK = result.relationships.find(
            (r) =>
                r.sourceTable === 'user_products' &&
                r.sourceColumn === 'product_id' &&
                r.targetTable === 'products' &&
                r.targetColumn === 'id'
        );
        expect(productIdFK).toBeDefined();
        expect(productIdFK).toMatchObject({
            sourceTable: 'user_products',
            sourceColumn: 'product_id',
            targetTable: 'products',
            targetColumn: 'id',
        });
    });

    describe('Primary Key Uniqueness', () => {
        it('should mark single-column primary key field as unique', async () => {
            const sql = `
CREATE TABLE table_1 (
    id INTEGER NOT NULL,
    CONSTRAINT pk_table_1_id PRIMARY KEY (id)
);
            `;

            const result = await fromSQLite(sql);

            expect(result.tables).toHaveLength(1);
            const table = result.tables[0];
            expect(table.name).toBe('table_1');

            const idColumn = table.columns.find((c) => c.name === 'id');
            expect(idColumn).toBeDefined();
            expect(idColumn?.primaryKey).toBe(true);
            expect(idColumn?.unique).toBe(true);
        });

        it('should not mark composite primary key fields as unique individually', async () => {
            const sql = `
CREATE TABLE table_1 (
    id INTEGER NOT NULL,
    field_2 INTEGER NOT NULL,
    CONSTRAINT pk_table_1_id PRIMARY KEY (id, field_2)
);
            `;

            const result = await fromSQLite(sql);

            expect(result.tables).toHaveLength(1);
            const table = result.tables[0];
            expect(table.name).toBe('table_1');

            const idColumn = table.columns.find((c) => c.name === 'id');
            expect(idColumn).toBeDefined();
            expect(idColumn?.primaryKey).toBe(true);
            expect(idColumn?.unique).toBe(false);

            const field2Column = table.columns.find(
                (c) => c.name === 'field_2'
            );
            expect(field2Column).toBeDefined();
            expect(field2Column?.primaryKey).toBe(true);
            expect(field2Column?.unique).toBe(false);
        });
    });
});
