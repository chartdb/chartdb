import { describe, it, expect } from 'vitest';
import { importDBMLToDiagram } from '../dbml-import';
import { generateDBMLFromDiagram } from '../../dbml-export/dbml-export';
import { DatabaseType } from '@/lib/domain/database-type';

describe('DBML Character Varying Length Preservation', () => {
    it('should preserve character varying length when quoted', async () => {
        const inputDBML = `
Table "finance"."general_ledger" {
  "ledger_id" integer [pk]
  "currency_code" "character varying(3)"
  "reference_number" "character varying(50)"
  "description" text
}
`;

        const diagram = await importDBMLToDiagram(inputDBML, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        // Check that the lengths were captured
        const table = diagram.tables?.find((t) => t.name === 'general_ledger');
        expect(table).toBeDefined();

        const currencyField = table?.fields.find(
            (f) => f.name === 'currency_code'
        );
        const referenceField = table?.fields.find(
            (f) => f.name === 'reference_number'
        );

        expect(currencyField?.characterMaximumLength).toBe('3');
        expect(referenceField?.characterMaximumLength).toBe('50');

        // Export and verify lengths are preserved
        const exportResult = generateDBMLFromDiagram(diagram);

        // Should contain the character varying with lengths
        expect(exportResult.inlineDbml).toMatch(
            /"currency_code".*(?:character varying|varchar)\(3\)/
        );
        expect(exportResult.inlineDbml).toMatch(
            /"reference_number".*(?:character varying|varchar)\(50\)/
        );
    });

    it('should preserve varchar length without quotes', async () => {
        const inputDBML = `
Table "users" {
  "id" int [pk]
  "username" varchar(100)
  "email" varchar(255)
  "bio" text
}
`;

        const diagram = await importDBMLToDiagram(inputDBML, {
            databaseType: DatabaseType.MYSQL,
        });

        const table = diagram.tables?.find((t) => t.name === 'users');
        expect(table).toBeDefined();

        const usernameField = table?.fields.find((f) => f.name === 'username');
        const emailField = table?.fields.find((f) => f.name === 'email');

        expect(usernameField?.characterMaximumLength).toBe('100');
        expect(emailField?.characterMaximumLength).toBe('255');

        // Export and verify
        const exportResult = generateDBMLFromDiagram(diagram);
        expect(exportResult.inlineDbml).toContain('varchar(100)');
        expect(exportResult.inlineDbml).toContain('varchar(255)');
    });

    it('should handle complex quoted types with schema and length', async () => {
        const inputDBML = `
Enum "public"."transaction_type" {
    "debit"
    "credit"
}

Table "finance"."general_ledger" {
  "ledger_id" integer [pk, not null]
  "transaction_date" date [not null]
  "account_id" integer
  "transaction_type" transaction_type
  "amount" numeric(15,2) [not null]
  "currency_code" "character varying(3)"
  "exchange_rate" numeric(10,6)
  "reference_number" "character varying(50)"
  "description" text
  "posted_by" integer
  "posting_date" timestamp
  "is_reversed" boolean
  "reversal_id" integer [ref: < "finance"."general_ledger"."ledger_id"]
}
`;

        const diagram = await importDBMLToDiagram(inputDBML, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        const table = diagram.tables?.find((t) => t.name === 'general_ledger');
        expect(table).toBeDefined();

        // Check all field types are preserved
        const currencyField = table?.fields.find(
            (f) => f.name === 'currency_code'
        );
        const referenceField = table?.fields.find(
            (f) => f.name === 'reference_number'
        );
        const amountField = table?.fields.find((f) => f.name === 'amount');
        const exchangeRateField = table?.fields.find(
            (f) => f.name === 'exchange_rate'
        );

        expect(currencyField?.characterMaximumLength).toBe('3');
        expect(referenceField?.characterMaximumLength).toBe('50');
        expect(amountField?.precision).toBe(15);
        expect(amountField?.scale).toBe(2);
        expect(exchangeRateField?.precision).toBe(10);
        expect(exchangeRateField?.scale).toBe(6);

        // Export and verify all types are preserved correctly
        const exportResult = generateDBMLFromDiagram(diagram);

        // Check that numeric types have their precision/scale
        expect(exportResult.inlineDbml).toMatch(/numeric\(15,\s*2\)/);
        expect(exportResult.inlineDbml).toMatch(/numeric\(10,\s*6\)/);

        // Check that character varying has lengths
        expect(exportResult.inlineDbml).toMatch(
            /(?:character varying|varchar)\(3\)/
        );
        expect(exportResult.inlineDbml).toMatch(
            /(?:character varying|varchar)\(50\)/
        );
    });

    it('should handle char types with length', async () => {
        const inputDBML = `
Table "products" {
  "product_code" char(5) [pk]
  "category" "char(2)"
  "status" character(1)
  "description" varchar
}
`;

        const diagram = await importDBMLToDiagram(inputDBML, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        const table = diagram.tables?.find((t) => t.name === 'products');

        const productCodeField = table?.fields.find(
            (f) => f.name === 'product_code'
        );
        const categoryField = table?.fields.find((f) => f.name === 'category');
        const statusField = table?.fields.find((f) => f.name === 'status');
        const descriptionField = table?.fields.find(
            (f) => f.name === 'description'
        );

        expect(productCodeField?.characterMaximumLength).toBe('5');
        expect(categoryField?.characterMaximumLength).toBe('2');
        expect(statusField?.characterMaximumLength).toBe('1');
        expect(descriptionField?.characterMaximumLength).toBeUndefined(); // varchar without length
    });
});
