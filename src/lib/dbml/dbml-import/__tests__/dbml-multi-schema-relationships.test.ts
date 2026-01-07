import { describe, it, expect } from 'vitest';
import { importDBMLToDiagram } from '../dbml-import';
import { DatabaseType } from '@/lib/domain/database-type';

describe('DBML Multi-Schema Relationships', () => {
    /**
     * When importing DBML with multiple schemas that have tables with the same name,
     * relationships must be correctly matched to the table in the specified schema.
     *
     * For example, if we have:
     *   - "sales"."products" (schema=sales, name=products)
     *   - "inventory"."products" (schema=inventory, name=products)
     *
     * And a relationship references "inventory"."products", it should NOT incorrectly
     * match to "sales"."products".
     *
     * The fix: Use the schemaName property from the DBML parser's endpoint objects
     * to correctly match tables by both name AND schema.
     */

    describe('Inline Ref Syntax', () => {
        it('should correctly match relationship to table in specified schema when same table name exists in multiple schemas', async () => {
            // This DBML has:
            // - sales.products (different schema)
            // - inventory.product_suppliers (references inventory.products)
            // - inventory.products (same schema as the FK table)
            //
            // The inline ref should point to inventory.products, NOT sales.products
            const dbmlContent = `
Table "sales"."products" {
  "id" bigint [pk, not null]
  "store_id" bigint [not null]
  "category_id" bigint
  "metadata" jsonb
}

Table "inventory"."product_suppliers" {
  "id" bigint [pk, not null]
  "product_id" bigint [not null, ref: > "inventory"."products"."id"]
  "supplier_id" bigint [not null]
  "unit_cost" bigint
  "lead_time_days" bigint
}

Table "inventory"."products" {
  "id" bigint [pk, not null]
  "warehouse_id" bigint [not null]
  "category" varchar(500) [not null]
  "subcategory" varchar(500) [not null]
  "sku" varchar(500)
  "name" varchar(500) [not null]
  "description" bigint
  "unit_price" numeric(38,18) [not null, default: 0]
  "wholesale_price" numeric(38,18) [not null, default: 0]
  "quantity" bigint [not null, default: 1]
  "created_at" timestamp [not null]
  "updated_at" timestamp [not null]
  "supplier_ref" bigint
}
`;

            const diagram = await importDBMLToDiagram(dbmlContent, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Verify tables are imported correctly
            expect(diagram.tables).toHaveLength(3);

            const salesProducts = diagram.tables?.find(
                (t) => t.name === 'products' && t.schema === 'sales'
            );
            const inventoryProducts = diagram.tables?.find(
                (t) => t.name === 'products' && t.schema === 'inventory'
            );
            const productSuppliers = diagram.tables?.find(
                (t) =>
                    t.name === 'product_suppliers' && t.schema === 'inventory'
            );

            expect(salesProducts).toBeDefined();
            expect(inventoryProducts).toBeDefined();
            expect(productSuppliers).toBeDefined();

            // Verify the relationship exists
            expect(diagram.relationships).toHaveLength(1);
            const relationship = diagram.relationships![0];

            // The DBML parser returns endpoints in order based on the ref syntax.
            // For inline ref: `ref: > "inventory"."products"."id"` on product_id field:
            // - endpoints[0]: inventory.products.id (PK side, relation: '1')
            // - endpoints[1]: inventory.product_suppliers.product_id (FK side, relation: '*')
            //
            // The CRITICAL check: both endpoints should use inventory schema tables,
            // NOT sales schema. The relationship should connect:
            // - inventory.products (NOT sales.products)
            // - inventory.product_suppliers

            // Both schemas should be inventory (not sales)
            expect(relationship.sourceSchema).toBe('inventory');
            expect(relationship.targetSchema).toBe('inventory');

            // The relationship should involve inventory.products and product_suppliers
            const relationshipTableIds = [
                relationship.sourceTableId,
                relationship.targetTableId,
            ];
            expect(relationshipTableIds).toContain(inventoryProducts!.id);
            expect(relationshipTableIds).toContain(productSuppliers!.id);

            // CRITICAL: sales.products should NOT be part of this relationship
            expect(relationshipTableIds).not.toContain(salesProducts!.id);

            // Verify the fields are from the correct tables
            const productIdField = productSuppliers?.fields.find(
                (f) => f.name === 'product_id'
            );
            const inventoryProductsIdField = inventoryProducts?.fields.find(
                (f) => f.name === 'id'
            );

            expect(productIdField).toBeDefined();
            expect(inventoryProductsIdField).toBeDefined();

            const relationshipFieldIds = [
                relationship.sourceFieldId,
                relationship.targetFieldId,
            ];
            expect(relationshipFieldIds).toContain(productIdField!.id);
            expect(relationshipFieldIds).toContain(
                inventoryProductsIdField!.id
            );
        });
    });

    describe('Standalone Ref Syntax', () => {
        it('should correctly match relationship using explicit Ref statement with schema-qualified names', async () => {
            // Same scenario but with standalone Ref syntax instead of inline ref
            // The explicit Ref uses fully qualified names: "schema"."table"."field"
            const dbmlContent = `
Table "sales"."products" {
  "id" bigint [pk, not null]
  "store_id" bigint [not null]
  "category_id" bigint
  "metadata" jsonb
}

Table "inventory"."product_suppliers" {
  "id" bigint [pk, not null]
  "product_id" bigint [not null]
  "supplier_id" bigint [not null]
  "unit_cost" bigint
  "lead_time_days" bigint
}

Table "inventory"."products" {
  "id" bigint [pk, not null]
  "warehouse_id" bigint [not null]
  "category" varchar(500) [not null]
  "subcategory" varchar(500) [not null]
  "sku" varchar(500)
  "name" varchar(500) [not null]
  "description" bigint
  "unit_price" numeric(38,18) [not null, default: 0]
  "wholesale_price" numeric(38,18) [not null, default: 0]
  "quantity" bigint [not null, default: 1]
  "created_at" timestamp [not null]
  "updated_at" timestamp [not null]
  "supplier_ref" bigint
}

Ref "fk_products_product_suppliers":"inventory"."products"."id" < "inventory"."product_suppliers"."product_id"
`;

            const diagram = await importDBMLToDiagram(dbmlContent, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Verify tables are imported correctly
            expect(diagram.tables).toHaveLength(3);

            const salesProducts = diagram.tables?.find(
                (t) => t.name === 'products' && t.schema === 'sales'
            );
            const inventoryProducts = diagram.tables?.find(
                (t) => t.name === 'products' && t.schema === 'inventory'
            );
            const productSuppliers = diagram.tables?.find(
                (t) =>
                    t.name === 'product_suppliers' && t.schema === 'inventory'
            );

            expect(salesProducts).toBeDefined();
            expect(inventoryProducts).toBeDefined();
            expect(productSuppliers).toBeDefined();

            // Verify the relationship exists
            expect(diagram.relationships).toHaveLength(1);
            const relationship = diagram.relationships![0];

            // The Ref syntax is: "inventory"."products"."id" < "inventory"."product_suppliers"."product_id"
            // Both endpoints explicitly reference the inventory schema.
            //
            // The CRITICAL check: both endpoints should be matched to inventory schema tables,
            // NOT sales schema.

            // Both schemas should be inventory (not sales)
            expect(relationship.sourceSchema).toBe('inventory');
            expect(relationship.targetSchema).toBe('inventory');

            // The relationship should involve inventory.products and product_suppliers
            const relationshipTableIds = [
                relationship.sourceTableId,
                relationship.targetTableId,
            ];
            expect(relationshipTableIds).toContain(inventoryProducts!.id);
            expect(relationshipTableIds).toContain(productSuppliers!.id);

            // CRITICAL: sales.products should NOT be part of this relationship
            expect(relationshipTableIds).not.toContain(salesProducts!.id);

            // Verify the fields are from the correct tables
            const productIdField = productSuppliers?.fields.find(
                (f) => f.name === 'product_id'
            );
            const inventoryProductsIdField = inventoryProducts?.fields.find(
                (f) => f.name === 'id'
            );

            expect(productIdField).toBeDefined();
            expect(inventoryProductsIdField).toBeDefined();

            const relationshipFieldIds = [
                relationship.sourceFieldId,
                relationship.targetFieldId,
            ];
            expect(relationshipFieldIds).toContain(productIdField!.id);
            expect(relationshipFieldIds).toContain(
                inventoryProductsIdField!.id
            );

            // Verify the relationship name is preserved from the Ref definition
            expect(relationship.name).toBeDefined();
        });
    });
});
