import { describe, it, expect } from 'vitest';
import { fromOracle } from '../oracle';

describe('Oracle Core Parser Tests', () => {
    it('should parse basic tables', async () => {
        const sql = `
            CREATE TABLE employees (
                id NUMBER(10) PRIMARY KEY,
                name VARCHAR2(255) NOT NULL
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('employees');
        expect(result.tables[0].columns).toHaveLength(2);
    });

    it('should parse tables with schemas', async () => {
        const sql = `
            CREATE TABLE hr.departments (
                id NUMBER(10) PRIMARY KEY,
                name VARCHAR2(100) NOT NULL,
                location VARCHAR2(200)
            );

            CREATE TABLE sales.orders (
                id NUMBER(10) PRIMARY KEY,
                order_date DATE NOT NULL
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(2);
        expect(
            result.tables.find((t) => t.name === 'departments')
        ).toBeDefined();
        expect(
            result.tables.find((t) => t.name === 'departments')?.schema
        ).toBe('hr');
        expect(result.tables.find((t) => t.name === 'orders')?.schema).toBe(
            'sales'
        );
    });

    it('should parse foreign key relationships', async () => {
        const sql = `
            CREATE TABLE departments (id NUMBER(10) PRIMARY KEY);
            CREATE TABLE employees (
                id NUMBER(10) PRIMARY KEY,
                department_id NUMBER(10) REFERENCES departments(id)
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships[0].sourceTable).toBe('employees');
        expect(result.relationships[0].targetTable).toBe('departments');
        expect(result.relationships[0].sourceColumn).toBe('department_id');
        expect(result.relationships[0].targetColumn).toBe('id');
    });

    it('should parse foreign keys with schema references', async () => {
        const sql = `
            CREATE TABLE hr.departments (
                id NUMBER(10) PRIMARY KEY,
                name VARCHAR2(100) NOT NULL
            );

            CREATE TABLE hr.employees (
                id NUMBER(10) PRIMARY KEY,
                department_id NUMBER(10) NOT NULL,
                name VARCHAR2(100) NOT NULL,
                CONSTRAINT FK_emp_dept FOREIGN KEY (department_id) REFERENCES hr.departments(id)
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships[0].sourceTable).toBe('employees');
        expect(result.relationships[0].targetTable).toBe('departments');
        expect(result.relationships[0].sourceSchema).toBe('hr');
        expect(result.relationships[0].targetSchema).toBe('hr');
    });

    it('should handle Oracle-specific data types correctly', async () => {
        const sql = `
            CREATE TABLE data_types_test (
                id NUMBER(10) NOT NULL,
                name VARCHAR2(255) NOT NULL,
                description CLOB,
                amount NUMBER(18, 2) NOT NULL,
                is_active NUMBER(1) NOT NULL,
                created_at TIMESTAMP NOT NULL,
                birth_date DATE,
                photo BLOB,
                small_number INTEGER,
                precise_value BINARY_DOUBLE,
                xml_data XMLTYPE,
                PRIMARY KEY (id)
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        const columns = result.tables[0].columns;

        expect(columns.find((c) => c.name === 'id')?.type).toBe('number');
        expect(columns.find((c) => c.name === 'name')?.type).toBe('varchar2');
        expect(columns.find((c) => c.name === 'description')?.type).toBe(
            'clob'
        );
        expect(columns.find((c) => c.name === 'amount')?.type).toBe('number');
        expect(columns.find((c) => c.name === 'is_active')?.type).toBe(
            'number'
        );
        expect(columns.find((c) => c.name === 'created_at')?.type).toBe(
            'timestamp'
        );
        expect(columns.find((c) => c.name === 'birth_date')?.type).toBe('date');
        expect(columns.find((c) => c.name === 'photo')?.type).toBe('blob');
        expect(columns.find((c) => c.name === 'small_number')?.type).toBe(
            'integer'
        );
        expect(columns.find((c) => c.name === 'precise_value')?.type).toBe(
            'binary_double'
        );
        expect(columns.find((c) => c.name === 'xml_data')?.type).toBe(
            'xmltype'
        );
    });

    it('should handle GENERATED AS IDENTITY columns', async () => {
        const sql = `
            CREATE TABLE products (
                id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                name VARCHAR2(100) NOT NULL,
                price NUMBER(10, 2) NOT NULL
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        const idColumn = result.tables[0].columns.find((c) => c.name === 'id');
        expect(idColumn?.increment).toBe(true);
    });

    it('should parse composite primary keys', async () => {
        const sql = `
            CREATE TABLE order_items (
                order_id NUMBER(10) NOT NULL,
                product_id NUMBER(10) NOT NULL,
                quantity NUMBER(10) NOT NULL,
                CONSTRAINT pk_order_items PRIMARY KEY (order_id, product_id)
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        const table = result.tables[0];
        expect(table.columns.filter((c) => c.primaryKey)).toHaveLength(2);
        expect(
            table.columns.find((c) => c.name === 'order_id')?.primaryKey
        ).toBe(true);
        expect(
            table.columns.find((c) => c.name === 'product_id')?.primaryKey
        ).toBe(true);
    });

    it('should handle unique constraints', async () => {
        const sql = `
            CREATE TABLE users (
                id NUMBER(10) NOT NULL PRIMARY KEY,
                email VARCHAR2(255) NOT NULL,
                username VARCHAR2(50) NOT NULL,
                CONSTRAINT uq_users_email UNIQUE (email)
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].indexes).toHaveLength(1);
        expect(result.tables[0].indexes[0].name).toBe('uq_users_email');
        expect(result.tables[0].indexes[0].unique).toBe(true);
        expect(result.tables[0].indexes[0].columns).toContain('email');
    });

    it('should handle default values', async () => {
        const sql = `
            CREATE TABLE audit_log (
                id NUMBER(10) NOT NULL,
                action VARCHAR2(100) NOT NULL,
                is_active NUMBER(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
                updated_at DATE DEFAULT SYSDATE,
                status VARCHAR2(20) DEFAULT 'pending',
                PRIMARY KEY (id)
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        const columns = result.tables[0].columns;

        expect(columns.find((c) => c.name === 'is_active')?.default).toBe('1');
        expect(
            columns.find((c) => c.name === 'created_at')?.default
        ).toBeDefined();
        expect(
            columns.find((c) => c.name === 'updated_at')?.default
        ).toBeDefined();
        expect(columns.find((c) => c.name === 'status')?.default).toBe(
            "'pending'"
        );
    });

    it('should parse indexes created separately', async () => {
        const sql = `
            CREATE TABLE customers (
                id NUMBER(10) NOT NULL PRIMARY KEY,
                first_name VARCHAR2(100) NOT NULL,
                last_name VARCHAR2(100) NOT NULL,
                email VARCHAR2(255) NOT NULL
            );

            CREATE INDEX idx_customers_name ON customers (last_name, first_name);
            CREATE UNIQUE INDEX idx_customers_email ON customers (email);
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].indexes).toHaveLength(2);

        const nameIndex = result.tables[0].indexes.find(
            (i) => i.name === 'idx_customers_name'
        );
        expect(nameIndex?.unique).toBe(false);
        expect(nameIndex?.columns).toContain('last_name');
        expect(nameIndex?.columns).toContain('first_name');

        const emailIndex = result.tables[0].indexes.find(
            (i) => i.name === 'idx_customers_email'
        );
        expect(emailIndex?.unique).toBe(true);
        expect(emailIndex?.columns).toContain('email');
    });

    it('should handle nullable and not null columns correctly', async () => {
        const sql = `
            CREATE TABLE test_nullability (
                id NUMBER(10) NOT NULL PRIMARY KEY,
                required_field VARCHAR2(100) NOT NULL,
                optional_field VARCHAR2(100),
                another_optional CLOB
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        const columns = result.tables[0].columns;

        expect(columns.find((c) => c.name === 'id')?.nullable).toBe(false);
        expect(columns.find((c) => c.name === 'required_field')?.nullable).toBe(
            false
        );
        expect(columns.find((c) => c.name === 'optional_field')?.nullable).toBe(
            true
        );
        expect(
            columns.find((c) => c.name === 'another_optional')?.nullable
        ).toBe(true);
    });

    it('should handle quoted identifiers', async () => {
        const sql = `
            CREATE TABLE "Order" (
                "Id" NUMBER(10) NOT NULL PRIMARY KEY,
                "Order Date" DATE NOT NULL,
                "Customer ID" NUMBER(10) NOT NULL
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('Order');
        expect(result.tables[0].columns).toHaveLength(3);
        expect(
            result.tables[0].columns.find((c) => c.name === 'Id')
        ).toBeDefined();
    });

    describe('Primary Key Uniqueness', () => {
        it('should mark single-column primary key field as unique', async () => {
            const sql = `
CREATE TABLE table_1 (
    id NUMBER(19) NOT NULL,
    CONSTRAINT pk_table_1_id PRIMARY KEY (id)
);
            `;

            const result = await fromOracle(sql);

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
    id NUMBER(19) NOT NULL,
    field_2 NUMBER(19) NOT NULL,
    CONSTRAINT pk_table_1_id PRIMARY KEY (id, field_2)
);
            `;

            const result = await fromOracle(sql);

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
