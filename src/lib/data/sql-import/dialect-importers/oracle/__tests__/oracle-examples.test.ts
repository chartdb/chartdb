import { describe, it, expect } from 'vitest';
import { fromOracle } from '../oracle';

describe('Oracle Real-World Examples Tests', () => {
    it('should parse a typical HR schema', async () => {
        const sql = `
            -- Regions table
            CREATE TABLE hr.regions (
                region_id NUMBER(10) PRIMARY KEY,
                region_name VARCHAR2(25)
            );

            -- Countries table
            CREATE TABLE hr.countries (
                country_id CHAR(2) PRIMARY KEY,
                country_name VARCHAR2(40),
                region_id NUMBER(10),
                CONSTRAINT fk_country_region FOREIGN KEY (region_id) REFERENCES hr.regions(region_id)
            );

            -- Locations table
            CREATE TABLE hr.locations (
                location_id NUMBER(10) PRIMARY KEY,
                street_address VARCHAR2(40),
                postal_code VARCHAR2(12),
                city VARCHAR2(30) NOT NULL,
                state_province VARCHAR2(25),
                country_id CHAR(2),
                CONSTRAINT fk_loc_country FOREIGN KEY (country_id) REFERENCES hr.countries(country_id)
            );

            -- Departments table
            CREATE TABLE hr.departments (
                department_id NUMBER(10) PRIMARY KEY,
                department_name VARCHAR2(30) NOT NULL,
                manager_id NUMBER(10),
                location_id NUMBER(10),
                CONSTRAINT fk_dept_loc FOREIGN KEY (location_id) REFERENCES hr.locations(location_id)
            );

            -- Jobs table
            CREATE TABLE hr.jobs (
                job_id VARCHAR2(10) PRIMARY KEY,
                job_title VARCHAR2(35) NOT NULL,
                min_salary NUMBER(10),
                max_salary NUMBER(10)
            );

            -- Employees table
            CREATE TABLE hr.employees (
                employee_id NUMBER(10) PRIMARY KEY,
                first_name VARCHAR2(20),
                last_name VARCHAR2(25) NOT NULL,
                email VARCHAR2(25) NOT NULL,
                phone_number VARCHAR2(20),
                hire_date DATE NOT NULL,
                job_id VARCHAR2(10) NOT NULL,
                salary NUMBER(10, 2),
                commission_pct NUMBER(2, 2),
                manager_id NUMBER(10),
                department_id NUMBER(10),
                CONSTRAINT fk_emp_job FOREIGN KEY (job_id) REFERENCES hr.jobs(job_id),
                CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES hr.departments(department_id),
                CONSTRAINT fk_emp_mgr FOREIGN KEY (manager_id) REFERENCES hr.employees(employee_id)
            );

            -- Job history table
            CREATE TABLE hr.job_history (
                employee_id NUMBER(10) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                job_id VARCHAR2(10) NOT NULL,
                department_id NUMBER(10),
                CONSTRAINT pk_job_history PRIMARY KEY (employee_id, start_date),
                CONSTRAINT fk_jh_emp FOREIGN KEY (employee_id) REFERENCES hr.employees(employee_id),
                CONSTRAINT fk_jh_job FOREIGN KEY (job_id) REFERENCES hr.jobs(job_id),
                CONSTRAINT fk_jh_dept FOREIGN KEY (department_id) REFERENCES hr.departments(department_id)
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(7);
        expect(result.relationships.length).toBeGreaterThanOrEqual(8);

        // Verify all tables exist
        expect(result.tables.find((t) => t.name === 'regions')).toBeDefined();
        expect(result.tables.find((t) => t.name === 'countries')).toBeDefined();
        expect(result.tables.find((t) => t.name === 'locations')).toBeDefined();
        expect(
            result.tables.find((t) => t.name === 'departments')
        ).toBeDefined();
        expect(result.tables.find((t) => t.name === 'jobs')).toBeDefined();
        expect(result.tables.find((t) => t.name === 'employees')).toBeDefined();
        expect(
            result.tables.find((t) => t.name === 'job_history')
        ).toBeDefined();

        // Verify schema is set
        result.tables.forEach((t) => {
            expect(t.schema).toBe('hr');
        });

        // Verify self-referencing relationship exists
        const selfRefRel = result.relationships.find(
            (r) =>
                r.sourceTable === 'employees' && r.targetTable === 'employees'
        );
        expect(selfRefRel).toBeDefined();
    });

    it('should parse an e-commerce schema', async () => {
        const sql = `
            -- Customers
            CREATE TABLE ecom.customers (
                customer_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                email VARCHAR2(255) NOT NULL UNIQUE,
                password_hash VARCHAR2(255) NOT NULL,
                first_name VARCHAR2(100) NOT NULL,
                last_name VARCHAR2(100) NOT NULL,
                phone VARCHAR2(20),
                created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
                updated_at TIMESTAMP DEFAULT SYSTIMESTAMP
            );

            -- Addresses
            CREATE TABLE ecom.addresses (
                address_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                customer_id NUMBER(10) NOT NULL,
                address_type VARCHAR2(20) NOT NULL,
                street_address VARCHAR2(255) NOT NULL,
                city VARCHAR2(100) NOT NULL,
                state VARCHAR2(100),
                postal_code VARCHAR2(20),
                country VARCHAR2(100) NOT NULL,
                is_default NUMBER(1) DEFAULT 0,
                CONSTRAINT fk_addr_customer FOREIGN KEY (customer_id) REFERENCES ecom.customers(customer_id)
            );

            -- Categories with self-reference for hierarchy
            CREATE TABLE ecom.categories (
                category_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                parent_category_id NUMBER(10),
                name VARCHAR2(100) NOT NULL,
                description CLOB,
                image_url VARCHAR2(500),
                is_active NUMBER(1) DEFAULT 1,
                CONSTRAINT fk_cat_parent FOREIGN KEY (parent_category_id) REFERENCES ecom.categories(category_id)
            );

            -- Products
            CREATE TABLE ecom.products (
                product_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                category_id NUMBER(10) NOT NULL,
                sku VARCHAR2(50) NOT NULL UNIQUE,
                name VARCHAR2(255) NOT NULL,
                description CLOB,
                price NUMBER(10, 2) NOT NULL,
                cost_price NUMBER(10, 2),
                stock_quantity NUMBER(10) DEFAULT 0,
                weight NUMBER(10, 3),
                is_active NUMBER(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
                CONSTRAINT fk_prod_category FOREIGN KEY (category_id) REFERENCES ecom.categories(category_id)
            );

            -- Orders
            CREATE TABLE ecom.orders (
                order_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                customer_id NUMBER(10) NOT NULL,
                shipping_address_id NUMBER(10) NOT NULL,
                billing_address_id NUMBER(10) NOT NULL,
                order_status VARCHAR2(20) DEFAULT 'pending',
                order_date TIMESTAMP DEFAULT SYSTIMESTAMP,
                shipped_date TIMESTAMP,
                total_amount NUMBER(12, 2) NOT NULL,
                notes CLOB,
                CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES ecom.customers(customer_id),
                CONSTRAINT fk_order_ship_addr FOREIGN KEY (shipping_address_id) REFERENCES ecom.addresses(address_id),
                CONSTRAINT fk_order_bill_addr FOREIGN KEY (billing_address_id) REFERENCES ecom.addresses(address_id)
            );

            -- Order items
            CREATE TABLE ecom.order_items (
                order_item_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                order_id NUMBER(10) NOT NULL,
                product_id NUMBER(10) NOT NULL,
                quantity NUMBER(10) NOT NULL,
                unit_price NUMBER(10, 2) NOT NULL,
                discount_amount NUMBER(10, 2) DEFAULT 0,
                CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES ecom.orders(order_id),
                CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES ecom.products(product_id)
            );

            -- Reviews
            CREATE TABLE ecom.reviews (
                review_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                product_id NUMBER(10) NOT NULL,
                customer_id NUMBER(10) NOT NULL,
                rating NUMBER(1) NOT NULL,
                title VARCHAR2(200),
                content CLOB,
                created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
                is_verified NUMBER(1) DEFAULT 0,
                CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES ecom.products(product_id),
                CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) REFERENCES ecom.customers(customer_id)
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(7);
        expect(result.relationships.length).toBeGreaterThanOrEqual(9);

        // Verify customers table structure
        const customersTable = result.tables.find(
            (t) => t.name === 'customers'
        );
        expect(customersTable).toBeDefined();
        expect(customersTable!.columns.length).toBe(8);

        // Verify identity columns
        const customerIdCol = customersTable!.columns.find(
            (c) => c.name === 'customer_id'
        );
        expect(customerIdCol?.increment).toBe(true);

        // Verify category self-reference
        const catSelfRef = result.relationships.find(
            (r) =>
                r.sourceTable === 'categories' && r.targetTable === 'categories'
        );
        expect(catSelfRef).toBeDefined();

        // Verify order has multiple address references
        const orderAddressRels = result.relationships.filter(
            (r) => r.sourceTable === 'orders' && r.targetTable === 'addresses'
        );
        expect(orderAddressRels.length).toBe(2);
    });

    it('should parse a financial services schema with complex relationships', async () => {
        const sql = `
            -- Account types
            CREATE TABLE fin.account_types (
                type_id NUMBER(10) PRIMARY KEY,
                type_name VARCHAR2(50) NOT NULL,
                description VARCHAR2(500),
                min_balance NUMBER(12, 2) DEFAULT 0,
                interest_rate NUMBER(5, 4) DEFAULT 0
            );

            -- Accounts
            CREATE TABLE fin.accounts (
                account_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                account_number VARCHAR2(20) NOT NULL UNIQUE,
                account_type_id NUMBER(10) NOT NULL,
                customer_id NUMBER(10) NOT NULL,
                balance NUMBER(15, 2) DEFAULT 0,
                status VARCHAR2(20) DEFAULT 'active',
                opened_date DATE DEFAULT SYSDATE,
                closed_date DATE,
                CONSTRAINT fk_acc_type FOREIGN KEY (account_type_id) REFERENCES fin.account_types(type_id)
            );

            -- Transactions
            CREATE TABLE fin.transactions (
                transaction_id NUMBER(15) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                from_account_id NUMBER(10),
                to_account_id NUMBER(10),
                transaction_type VARCHAR2(20) NOT NULL,
                amount NUMBER(15, 2) NOT NULL,
                currency CHAR(3) DEFAULT 'USD',
                transaction_date TIMESTAMP DEFAULT SYSTIMESTAMP,
                description VARCHAR2(500),
                reference_number VARCHAR2(50),
                status VARCHAR2(20) DEFAULT 'completed',
                CONSTRAINT fk_trans_from FOREIGN KEY (from_account_id) REFERENCES fin.accounts(account_id),
                CONSTRAINT fk_trans_to FOREIGN KEY (to_account_id) REFERENCES fin.accounts(account_id)
            );

            -- Audit log
            CREATE TABLE fin.audit_log (
                log_id NUMBER(15) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                table_name VARCHAR2(100) NOT NULL,
                record_id NUMBER(15) NOT NULL,
                action VARCHAR2(20) NOT NULL,
                old_values CLOB,
                new_values CLOB,
                changed_by VARCHAR2(100) NOT NULL,
                changed_at TIMESTAMP DEFAULT SYSTIMESTAMP
            );

            -- Indexes
            CREATE INDEX fin.idx_acc_customer ON fin.accounts(customer_id);
            CREATE INDEX fin.idx_acc_type ON fin.accounts(account_type_id);
            CREATE INDEX fin.idx_trans_from ON fin.transactions(from_account_id);
            CREATE INDEX fin.idx_trans_to ON fin.transactions(to_account_id);
            CREATE INDEX fin.idx_trans_date ON fin.transactions(transaction_date);
            CREATE INDEX fin.idx_audit_table ON fin.audit_log(table_name, record_id);
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(4);
        expect(result.relationships).toHaveLength(3);

        // Verify transaction has two account references
        const transAccountRels = result.relationships.filter(
            (r) =>
                r.sourceTable === 'transactions' && r.targetTable === 'accounts'
        );
        expect(transAccountRels.length).toBe(2);

        // Verify indexes were parsed
        const accountsTable = result.tables.find((t) => t.name === 'accounts');
        expect(accountsTable?.indexes.length).toBeGreaterThanOrEqual(1);

        const transactionsTable = result.tables.find(
            (t) => t.name === 'transactions'
        );
        expect(transactionsTable?.indexes.length).toBeGreaterThanOrEqual(1);
    });
});
