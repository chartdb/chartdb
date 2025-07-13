import { describe, it, expect } from 'vitest';
import { fromMySQLImproved } from '../mysql-improved';
import { fromMySQL } from '../mysql';

describe('MySQL Core Functionality', () => {
    describe('Basic Table Parsing', () => {
        it('should parse a simple table', async () => {
            const sql = `
                CREATE TABLE users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.tables[0].name).toBe('users');
            expect(result.tables[0].columns).toHaveLength(4);

            const idColumn = result.tables[0].columns.find(
                (c) => c.name === 'id'
            );
            expect(idColumn?.primaryKey).toBe(true);
            expect(idColumn?.increment).toBe(true);

            const emailColumn = result.tables[0].columns.find(
                (c) => c.name === 'email'
            );
            expect(emailColumn?.unique).toBe(true);
            expect(emailColumn?.nullable).toBe(false);
        });

        it('should parse tables with backticks', async () => {
            const sql = `
                CREATE TABLE \`user-profiles\` (
                    \`user-id\` INT PRIMARY KEY AUTO_INCREMENT,
                    \`full-name\` VARCHAR(255) NOT NULL,
                    \`bio-text\` TEXT
                );
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.tables[0].name).toBe('user-profiles');
            expect(
                result.tables[0].columns.some((c) => c.name === 'user-id')
            ).toBe(true);
            expect(
                result.tables[0].columns.some((c) => c.name === 'full-name')
            ).toBe(true);
        });

        it('should handle IF NOT EXISTS clause', async () => {
            const sql = `
                CREATE TABLE IF NOT EXISTS products (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL
                );
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.tables[0].name).toBe('products');
        });
    });

    describe('Data Types', () => {
        it('should parse various MySQL data types', async () => {
            const sql = `
                CREATE TABLE data_types_test (
                    col_tinyint TINYINT,
                    col_smallint SMALLINT,
                    col_mediumint MEDIUMINT,
                    col_int INT(11),
                    col_bigint BIGINT,
                    col_decimal DECIMAL(10,2),
                    col_float FLOAT,
                    col_double DOUBLE,
                    col_bit BIT(8),
                    col_char CHAR(10),
                    col_varchar VARCHAR(255),
                    col_binary BINARY(16),
                    col_varbinary VARBINARY(255),
                    col_tinytext TINYTEXT,
                    col_text TEXT,
                    col_mediumtext MEDIUMTEXT,
                    col_longtext LONGTEXT,
                    col_tinyblob TINYBLOB,
                    col_blob BLOB,
                    col_mediumblob MEDIUMBLOB,
                    col_longblob LONGBLOB,
                    col_date DATE,
                    col_datetime DATETIME,
                    col_timestamp TIMESTAMP,
                    col_time TIME,
                    col_year YEAR,
                    col_enum ENUM('small', 'medium', 'large'),
                    col_set SET('read', 'write', 'execute'),
                    col_json JSON,
                    col_geometry GEOMETRY,
                    col_point POINT
                );
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(1);
            const table = result.tables[0];

            expect(table.columns.find((c) => c.name === 'col_int')?.type).toBe(
                'INT'
            );
            expect(
                table.columns.find((c) => c.name === 'col_varchar')?.type
            ).toBe('VARCHAR');
            expect(
                table.columns.find((c) => c.name === 'col_decimal')?.type
            ).toBe('DECIMAL');
            expect(table.columns.find((c) => c.name === 'col_enum')?.type).toBe(
                'ENUM'
            );
            expect(table.columns.find((c) => c.name === 'col_json')?.type).toBe(
                'JSON'
            );
        });
    });

    describe('Constraints', () => {
        it('should parse PRIMARY KEY constraints', async () => {
            const sql = `
                CREATE TABLE pk_test (
                    id INT,
                    code VARCHAR(10),
                    PRIMARY KEY (id, code)
                );
            `;

            const result = await fromMySQLImproved(sql);

            const table = result.tables[0];
            expect(table.columns.find((c) => c.name === 'id')?.primaryKey).toBe(
                true
            );
            expect(
                table.columns.find((c) => c.name === 'code')?.primaryKey
            ).toBe(true);

            expect(
                table.indexes.some(
                    (idx) =>
                        idx.name === 'pk_pk_test' &&
                        idx.columns.includes('id') &&
                        idx.columns.includes('code')
                )
            ).toBe(true);
        });

        it('should parse UNIQUE constraints', async () => {
            const sql = `
                CREATE TABLE unique_test (
                    id INT PRIMARY KEY,
                    email VARCHAR(255),
                    username VARCHAR(100),
                    UNIQUE KEY uk_email (email),
                    UNIQUE KEY uk_username_email (username, email)
                );
            `;

            const result = await fromMySQLImproved(sql);

            const table = result.tables[0];
            expect(
                table.indexes.some(
                    (idx) => idx.name === 'uk_email' && idx.unique === true
                )
            ).toBe(true);

            expect(
                table.indexes.some(
                    (idx) =>
                        idx.name === 'uk_username_email' &&
                        idx.unique === true &&
                        idx.columns.length === 2
                )
            ).toBe(true);
        });

        it('should parse CHECK constraints', async () => {
            const sql = `
                CREATE TABLE check_test (
                    id INT PRIMARY KEY,
                    age INT CHECK (age >= 18),
                    price DECIMAL(10,2) CHECK (price > 0)
                );
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(1);
            expect(result.tables[0].columns).toHaveLength(3);
        });
    });

    describe('Foreign Keys', () => {
        it('should parse inline FOREIGN KEY constraints', async () => {
            const sql = `
                CREATE TABLE departments (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL
                );

                CREATE TABLE employees (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL,
                    department_id INT,
                    FOREIGN KEY (department_id) REFERENCES departments(id)
                );
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(2);
            expect(result.relationships).toHaveLength(1);

            const fk = result.relationships[0];
            expect(fk.sourceTable).toBe('employees');
            expect(fk.sourceColumn).toBe('department_id');
            expect(fk.targetTable).toBe('departments');
            expect(fk.targetColumn).toBe('id');
        });

        it('should parse named FOREIGN KEY constraints', async () => {
            const sql = `
                CREATE TABLE orders (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    customer_id INT NOT NULL,
                    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE
                );

                CREATE TABLE customers (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL
                );
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.relationships).toHaveLength(1);

            const fk = result.relationships[0];
            expect(fk.name).toBe('fk_order_customer');
            expect(fk.deleteAction).toBe('CASCADE');
            expect(fk.updateAction).toBe('CASCADE');
        });

        it('should handle ALTER TABLE ADD FOREIGN KEY', async () => {
            const sql = `
                CREATE TABLE products (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL
                );

                CREATE TABLE reviews (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    product_id INT NOT NULL,
                    rating INT NOT NULL
                );

                ALTER TABLE reviews 
                ADD CONSTRAINT fk_review_product 
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(2);
            expect(result.relationships).toHaveLength(1);

            const fk = result.relationships[0];
            expect(fk.sourceTable).toBe('reviews');
            expect(fk.targetTable).toBe('products');
            expect(fk.deleteAction).toBe('CASCADE');
        });

        it('should handle composite foreign keys', async () => {
            const sql = `
                CREATE TABLE tenants (
                    id INT NOT NULL,
                    region VARCHAR(10) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    PRIMARY KEY (id, region)
                );

                CREATE TABLE tenant_settings (
                    tenant_id INT NOT NULL,
                    tenant_region VARCHAR(10) NOT NULL,
                    setting_key VARCHAR(100) NOT NULL,
                    setting_value TEXT,
                    PRIMARY KEY (tenant_id, tenant_region, setting_key),
                    FOREIGN KEY (tenant_id, tenant_region) REFERENCES tenants(id, region)
                );
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.relationships).toHaveLength(2);

            const fk1 = result.relationships.find(
                (r) => r.sourceColumn === 'tenant_id'
            );
            const fk2 = result.relationships.find(
                (r) => r.sourceColumn === 'tenant_region'
            );

            expect(fk1?.targetColumn).toBe('id');
            expect(fk2?.targetColumn).toBe('region');
        });
    });

    describe('Indexes', () => {
        it('should parse CREATE INDEX statements', async () => {
            const sql = `
                CREATE TABLE products (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL,
                    category VARCHAR(100),
                    price DECIMAL(10,2)
                );

                CREATE INDEX idx_category ON products(category);
                CREATE UNIQUE INDEX idx_name ON products(name);
                CREATE INDEX idx_category_price ON products(category, price);
            `;

            const result = await fromMySQLImproved(sql);

            const table = result.tables[0];
            expect(
                table.indexes.some(
                    (idx) => idx.name === 'idx_category' && !idx.unique
                )
            ).toBe(true);
            expect(
                table.indexes.some(
                    (idx) => idx.name === 'idx_name' && idx.unique
                )
            ).toBe(true);
            expect(
                table.indexes.some(
                    (idx) =>
                        idx.name === 'idx_category_price' &&
                        idx.columns.length === 2
                )
            ).toBe(true);
        });

        it('should parse inline INDEX definitions', async () => {
            const sql = `
                CREATE TABLE users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    email VARCHAR(255) NOT NULL,
                    username VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_email (email),
                    UNIQUE INDEX uk_username (username),
                    INDEX idx_created (created_at DESC)
                );
            `;

            const result = await fromMySQLImproved(sql);

            const table = result.tables[0];
            expect(table.indexes.length).toBeGreaterThan(0);
        });
    });

    describe('Table Options', () => {
        it('should handle ENGINE and CHARSET options', async () => {
            const sql = `
                CREATE TABLE products (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE logs (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    message TEXT
                ) ENGINE=MyISAM DEFAULT CHARSET=latin1;
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(2);
            expect(result.tables[0].name).toBe('products');
            expect(result.tables[1].name).toBe('logs');
        });

        it('should handle AUTO_INCREMENT initial value', async () => {
            const sql = `
                CREATE TABLE orders (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    order_number VARCHAR(50) NOT NULL
                ) AUTO_INCREMENT=1000;
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(1);
            const idColumn = result.tables[0].columns.find(
                (c) => c.name === 'id'
            );
            expect(idColumn?.increment).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should reject inline REFERENCES (PostgreSQL style)', async () => {
            const sql = `
                CREATE TABLE users (
                    id INT PRIMARY KEY,
                    department_id INT REFERENCES departments(id)
                );
            `;

            // Using the original parser which checks for inline REFERENCES
            await expect(fromMySQL(sql)).rejects.toThrow(
                /MySQL\/MariaDB does not support inline REFERENCES/
            );
        });

        it('should handle malformed SQL gracefully', async () => {
            const sql = `
                CREATE TABLE test (
                    id INT PRIMARY KEY
                    name VARCHAR(255) -- missing comma
                );
            `;

            const result = await fromMySQLImproved(sql);

            // Should still create a table with fallback parsing
            expect(result.tables.length).toBeGreaterThan(0);
        });
    });

    describe('Comments and Special Cases', () => {
        it('should handle SQL comments', async () => {
            const sql = `
                -- This is a comment
                CREATE TABLE users (
                    id INT PRIMARY KEY, -- user identifier
                    /* Multi-line comment
                       spanning multiple lines */
                    name VARCHAR(255) NOT NULL
                );
                
                # MySQL-style comment
                CREATE TABLE posts (
                    id INT PRIMARY KEY
                );
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(2);
            expect(result.tables.map((t) => t.name).sort()).toEqual([
                'posts',
                'users',
            ]);
        });

        it('should handle empty or whitespace-only input', async () => {
            const result1 = await fromMySQLImproved('');
            expect(result1.tables).toHaveLength(0);
            expect(result1.relationships).toHaveLength(0);

            const result2 = await fromMySQLImproved('   \n\n   ');
            expect(result2.tables).toHaveLength(0);
            expect(result2.relationships).toHaveLength(0);
        });
    });
});
