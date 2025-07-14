import { describe, it, expect } from 'vitest';
import { DatabaseType } from '@/lib/domain';
import { validateSQL } from '../../../sql-validator';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL Import - Split DECIMAL Handling', () => {
    it('should successfully import tables with split DECIMAL declarations using auto-fix', async () => {
        const sql = `
CREATE TABLE financial_records (
    id SERIAL PRIMARY KEY,
    account_balance DECIMAL(15,
    2) NOT NULL,
    interest_rate NUMERIC(5,
    4) DEFAULT 0.0000,
    transaction_fee DECIMAL(10,
    2) DEFAULT 0.00
);

CREATE TABLE market_data (
    id INTEGER PRIMARY KEY,
    price DECIMAL(18,
    8) NOT NULL,
    volume NUMERIC(20,
    0) NOT NULL
);
`;

        const validationResult = validateSQL(sql, DatabaseType.POSTGRESQL);

        // Validation should detect issues but provide auto-fix
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.fixedSQL).toBeDefined();

        // Parse the fixed SQL
        const diagramResult = await fromPostgres(validationResult.fixedSQL!);

        expect(diagramResult).toBeDefined();
        expect(diagramResult?.tables).toHaveLength(2);

        // Check first table
        const financialTable = diagramResult?.tables.find(
            (t) => t.name === 'financial_records'
        );
        expect(financialTable).toBeDefined();
        expect(financialTable?.columns).toHaveLength(4);

        // Check that DECIMAL columns were parsed correctly
        const balanceColumn = financialTable?.columns.find(
            (c) => c.name === 'account_balance'
        );
        expect(balanceColumn?.type).toMatch(/DECIMAL|NUMERIC/i);

        const interestColumn = financialTable?.columns.find(
            (c) => c.name === 'interest_rate'
        );
        expect(interestColumn?.type).toMatch(/DECIMAL|NUMERIC/i);

        // Check second table
        const marketTable = diagramResult?.tables.find(
            (t) => t.name === 'market_data'
        );
        expect(marketTable).toBeDefined();
        expect(marketTable?.columns).toHaveLength(3);

        // Verify warnings about auto-fix
        expect(validationResult.warnings).toBeDefined();
        expect(
            validationResult.warnings?.some((w) =>
                w.message.includes('Auto-fixed split DECIMAL/NUMERIC')
            )
        ).toBe(true);
    });

    it('should handle complex SQL with multiple issues including split DECIMAL', async () => {
        const sql = `
-- Financial system with various data types
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balance DECIMAL(20,
    2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Query with cast operator issues
SELECT 
    id: :text AS account_id,
    balance: :DECIMAL(10,
    2) AS rounded_balance
FROM accounts;

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_id UUID REFERENCES accounts(id),
    amount DECIMAL(15,
    2) NOT NULL,
    fee NUMERIC(10,
    4) DEFAULT 0.0000
);
`;

        const validationResult = validateSQL(sql, DatabaseType.POSTGRESQL);

        // Validation should detect issues but provide auto-fix
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.fixedSQL).toBeDefined();

        // Parse the fixed SQL
        const diagramResult = await fromPostgres(validationResult.fixedSQL!);

        expect(diagramResult).toBeDefined();
        expect(diagramResult?.tables).toHaveLength(2);

        // Verify both types of fixes were applied
        expect(validationResult?.warnings).toBeDefined();
        expect(
            validationResult?.warnings?.some((w) =>
                w.message.includes('Auto-fixed cast operator')
            )
        ).toBe(true);
        expect(
            validationResult?.warnings?.some((w) =>
                w.message.includes('Auto-fixed split DECIMAL/NUMERIC')
            )
        ).toBe(true);

        // Check foreign key relationship was preserved
        expect(diagramResult?.relationships).toHaveLength(1);
        const fk = diagramResult?.relationships[0];
        expect(fk?.sourceTable).toBe('transactions');
        expect(fk?.targetTable).toBe('accounts');
    });

    it('should fallback to regex extraction for tables with split DECIMAL that cause parser errors', async () => {
        const sql = `
CREATE TABLE complex_table (
    id INTEGER PRIMARY KEY,
    -- This might cause parser issues
    weird_decimal DECIMAL(10,
    2) ARRAY NOT NULL,
    normal_column VARCHAR(100),
    another_decimal NUMERIC(5,
    3) CHECK (another_decimal > 0)
);
`;

        const validationResult = validateSQL(sql, DatabaseType.POSTGRESQL);

        // Validation should detect issues but provide auto-fix
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.fixedSQL).toBeDefined();

        // Parse the fixed SQL
        const diagramResult = await fromPostgres(validationResult.fixedSQL!);

        // Even if parser fails, should still import with regex fallback
        expect(diagramResult?.tables).toHaveLength(1);

        const table = diagramResult?.tables[0];
        expect(table?.name).toBe('complex_table');
        expect(table?.columns.length).toBeGreaterThanOrEqual(3);
    });
});
