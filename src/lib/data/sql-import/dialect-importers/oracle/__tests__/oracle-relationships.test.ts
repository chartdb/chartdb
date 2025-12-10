import { describe, it, expect } from 'vitest';
import { fromOracle } from '../oracle';

describe('Oracle Foreign Key Relationship Tests', () => {
    it('should properly link foreign key relationships with correct table IDs', async () => {
        const sql = `
            CREATE TABLE hr.departments (
                id NUMBER(10) PRIMARY KEY,
                name VARCHAR2(100) NOT NULL
            );

            CREATE TABLE hr.employees (
                id NUMBER(10) PRIMARY KEY,
                department_id NUMBER(10) NOT NULL,
                name VARCHAR2(100) NOT NULL
            );

            ALTER TABLE hr.employees ADD CONSTRAINT fk_emp_dept
            FOREIGN KEY (department_id) REFERENCES hr.departments(id);
        `;

        const result = await fromOracle(sql);

        // Check tables are parsed
        expect(result.tables).toHaveLength(2);
        const deptTable = result.tables.find((t) => t.name === 'departments');
        const empTable = result.tables.find((t) => t.name === 'employees');
        expect(deptTable).toBeDefined();
        expect(empTable).toBeDefined();

        // Check relationship is parsed
        expect(result.relationships).toHaveLength(1);
        const rel = result.relationships[0];

        // Verify the relationship has proper table IDs
        expect(rel.sourceTableId).toBe(empTable!.id);
        expect(rel.targetTableId).toBe(deptTable!.id);

        // Verify other relationship properties
        expect(rel.sourceTable).toBe('employees');
        expect(rel.targetTable).toBe('departments');
        expect(rel.sourceColumn).toBe('department_id');
        expect(rel.targetColumn).toBe('id');
        expect(rel.sourceSchema).toBe('hr');
        expect(rel.targetSchema).toBe('hr');
    });

    it('should handle cross-schema foreign key relationships', async () => {
        const sql = `
            CREATE TABLE finance.accounts (
                id NUMBER(10) PRIMARY KEY,
                account_number VARCHAR2(50) NOT NULL
            );

            CREATE TABLE sales.transactions (
                id NUMBER(10) PRIMARY KEY,
                account_id NUMBER(10) NOT NULL
            );

            ALTER TABLE sales.transactions ADD CONSTRAINT fk_trans_account
            FOREIGN KEY (account_id) REFERENCES finance.accounts(id);
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);

        const rel = result.relationships[0];
        const accountsTable = result.tables.find(
            (t) => t.name === 'accounts' && t.schema === 'finance'
        );
        const transactionsTable = result.tables.find(
            (t) => t.name === 'transactions' && t.schema === 'sales'
        );

        // Verify cross-schema relationship IDs are properly linked
        expect(rel.sourceTableId).toBe(transactionsTable!.id);
        expect(rel.targetTableId).toBe(accountsTable!.id);
    });

    it('should parse complex foreign keys from enterprise database with proper table IDs', async () => {
        const sql = `
            -- Inventory schema
            CREATE TABLE inventory.products (
                id NUMBER(10) NOT NULL,
                name VARCHAR2(255) NOT NULL,
                category VARCHAR2(100) NOT NULL,
                price NUMBER(10, 2) NOT NULL,
                description CLOB,
                CONSTRAINT pk_products PRIMARY KEY (id)
            );

            -- Purchase orders
            CREATE TABLE inventory.purchase_orders (
                id NUMBER(10) NOT NULL,
                product_id NUMBER(10) NOT NULL,
                supplier_id NUMBER(10) NOT NULL,
                order_date DATE NOT NULL,
                quantity NUMBER(10) NOT NULL,
                total_amount NUMBER(12, 2) NOT NULL,
                CONSTRAINT pk_purchase_orders PRIMARY KEY (id)
            );

            -- Suppliers schema
            CREATE TABLE suppliers.suppliers (
                id NUMBER(10) NOT NULL,
                name VARCHAR2(255) NOT NULL,
                contact_name VARCHAR2(100),
                email VARCHAR2(255),
                CONSTRAINT pk_suppliers PRIMARY KEY (id)
            );

            -- Employee purchases
            CREATE TABLE hr.employee_purchases (
                id NUMBER(10) NOT NULL,
                employee_id NUMBER(10) NOT NULL,
                manager_id NUMBER(10) NOT NULL,
                purchase_date DATE NOT NULL,
                CONSTRAINT pk_employee_purchases PRIMARY KEY (id)
            );

            -- HR employees
            CREATE TABLE hr.employees (
                id NUMBER(10) NOT NULL,
                name VARCHAR2(255) NOT NULL,
                title VARCHAR2(100),
                hire_date DATE NOT NULL,
                CONSTRAINT pk_employees PRIMARY KEY (id)
            );

            -- Add foreign key constraints
            ALTER TABLE inventory.purchase_orders
                ADD CONSTRAINT fk_po_product
                FOREIGN KEY (product_id)
                REFERENCES inventory.products(id);

            ALTER TABLE inventory.purchase_orders
                ADD CONSTRAINT fk_po_supplier
                FOREIGN KEY (supplier_id)
                REFERENCES suppliers.suppliers(id);

            ALTER TABLE hr.employee_purchases
                ADD CONSTRAINT fk_ep_employee
                FOREIGN KEY (employee_id)
                REFERENCES hr.employees(id);

            ALTER TABLE hr.employee_purchases
                ADD CONSTRAINT fk_ep_manager
                FOREIGN KEY (manager_id)
                REFERENCES hr.employees(id);
        `;

        const result = await fromOracle(sql);

        // Check if we have the expected number of tables and relationships
        expect(result.tables).toHaveLength(5);
        expect(result.relationships).toHaveLength(4);

        // Check a specific relationship we know should exist
        const poProductRel = result.relationships.find(
            (r) =>
                r.sourceTable === 'purchase_orders' &&
                r.targetTable === 'products' &&
                r.sourceColumn === 'product_id'
        );

        expect(poProductRel).toBeDefined();

        // Find the corresponding tables
        const productsTable = result.tables.find(
            (t) => t.name === 'products' && t.schema === 'inventory'
        );
        const poTable = result.tables.find(
            (t) => t.name === 'purchase_orders' && t.schema === 'inventory'
        );

        // Verify the IDs are properly linked
        expect(poProductRel!.sourceTableId).toBeTruthy();
        expect(poProductRel!.targetTableId).toBeTruthy();
        expect(poProductRel!.sourceTableId).toBe(poTable!.id);
        expect(poProductRel!.targetTableId).toBe(productsTable!.id);

        // Check the employee self-referencing relationships
        const epEmployeeRel = result.relationships.find(
            (r) =>
                r.sourceTable === 'employee_purchases' &&
                r.targetTable === 'employees' &&
                r.sourceColumn === 'employee_id'
        );

        const epManagerRel = result.relationships.find(
            (r) =>
                r.sourceTable === 'employee_purchases' &&
                r.targetTable === 'employees' &&
                r.sourceColumn === 'manager_id'
        );

        expect(epEmployeeRel).toBeDefined();
        expect(epManagerRel).toBeDefined();

        // Check that all relationships have valid table IDs
        const relationshipsWithMissingIds = result.relationships.filter(
            (r) =>
                !r.sourceTableId ||
                !r.targetTableId ||
                r.sourceTableId === '' ||
                r.targetTableId === ''
        );

        expect(relationshipsWithMissingIds).toHaveLength(0);
    });

    it('should handle inline foreign key references', async () => {
        const sql = `
            CREATE TABLE categories (
                id NUMBER(10) PRIMARY KEY,
                name VARCHAR2(100) NOT NULL
            );

            CREATE TABLE products (
                id NUMBER(10) PRIMARY KEY,
                category_id NUMBER(10) REFERENCES categories(id),
                name VARCHAR2(100) NOT NULL
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);

        const rel = result.relationships[0];
        expect(rel.sourceTable).toBe('products');
        expect(rel.targetTable).toBe('categories');
        expect(rel.sourceColumn).toBe('category_id');
        expect(rel.targetColumn).toBe('id');
    });

    it('should handle multiple foreign keys in a single table', async () => {
        const sql = `
            CREATE TABLE users (id NUMBER(10) PRIMARY KEY, name VARCHAR2(100));
            CREATE TABLE products (id NUMBER(10) PRIMARY KEY, name VARCHAR2(100));

            CREATE TABLE reviews (
                id NUMBER(10) PRIMARY KEY,
                user_id NUMBER(10) NOT NULL,
                product_id NUMBER(10) NOT NULL,
                rating NUMBER(1) NOT NULL,
                CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id),
                CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES products(id)
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(3);
        expect(result.relationships).toHaveLength(2);

        const userRel = result.relationships.find(
            (r) => r.targetTable === 'users'
        );
        const productRel = result.relationships.find(
            (r) => r.targetTable === 'products'
        );

        expect(userRel).toBeDefined();
        expect(productRel).toBeDefined();
        expect(userRel!.sourceTable).toBe('reviews');
        expect(productRel!.sourceTable).toBe('reviews');
    });

    it('should handle ALTER TABLE with quoted identifiers', async () => {
        const sql = `
            CREATE TABLE "table_1" (
                "id" number NOT NULL,
                "field_2" number,
                "field_3" number,
                CONSTRAINT "pk_table_1_id" PRIMARY KEY ("id")
            );

            CREATE TABLE "table_2" (
                "id" number NOT NULL,
                "field_2" number,
                "field_3" number,
                CONSTRAINT "pk_table_2_id" PRIMARY KEY ("id")
            );

            ALTER TABLE "table_1" ADD CONSTRAINT "fk_table_1_id_table_2_field_3" FOREIGN KEY("id") REFERENCES "table_2"("field_3");
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(2);
        const table1 = result.tables.find((t) => t.name === 'table_1');
        const table2 = result.tables.find((t) => t.name === 'table_2');
        expect(table1).toBeDefined();
        expect(table2).toBeDefined();

        // Check primary key columns for table_1
        const table1IdCol = table1!.columns.find((c) => c.name === 'id');
        expect(table1IdCol).toBeDefined();
        expect(table1IdCol!.primaryKey).toBe(true);
        expect(table1IdCol!.nullable).toBe(false);

        // Check primary key columns for table_2
        const table2IdCol = table2!.columns.find((c) => c.name === 'id');
        expect(table2IdCol).toBeDefined();
        expect(table2IdCol!.primaryKey).toBe(true);
        expect(table2IdCol!.nullable).toBe(false);

        // Check relationship
        expect(result.relationships).toHaveLength(1);
        const rel = result.relationships[0];

        expect(rel.sourceTable).toBe('table_1');
        expect(rel.targetTable).toBe('table_2');
        expect(rel.sourceColumn).toBe('id');
        expect(rel.targetColumn).toBe('field_3');
        expect(rel.sourceTableId).toBe(table1!.id);
        expect(rel.targetTableId).toBe(table2!.id);
    });
});
