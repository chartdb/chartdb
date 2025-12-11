import { describe, it, expect } from 'vitest';
import { importDBMLToDiagram } from '../dbml-import';
import { DatabaseType } from '@/lib/domain/database-type';

describe('DBML Import - Primary Key NOT NULL', () => {
    it('should mark primary key columns as NOT NULL', async () => {
        const dbml = `
Table users {
    id int [pk]
    name varchar(100)
}`;

        const diagram = await importDBMLToDiagram(dbml, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        const usersTable = diagram.tables?.find((t) => t.name === 'users');
        expect(usersTable).toBeDefined();

        const idField = usersTable?.fields.find((f) => f.name === 'id');
        expect(idField?.primaryKey).toBe(true);
        expect(idField?.nullable).toBe(false);

        // Non-PK field should remain nullable by default
        const nameField = usersTable?.fields.find((f) => f.name === 'name');
        expect(nameField?.primaryKey).toBeFalsy();
        expect(nameField?.nullable).toBe(true);
    });

    it('should mark composite primary key columns as NOT NULL', async () => {
        const dbml = `
Table order_items {
    order_id int
    product_id int
    quantity int

    indexes {
        (order_id, product_id) [pk]
    }
}`;

        const diagram = await importDBMLToDiagram(dbml, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        const table = diagram.tables?.find((t) => t.name === 'order_items');
        expect(table).toBeDefined();

        const orderIdField = table?.fields.find((f) => f.name === 'order_id');
        expect(orderIdField?.primaryKey).toBe(true);
        expect(orderIdField?.nullable).toBe(false);

        const productIdField = table?.fields.find(
            (f) => f.name === 'product_id'
        );
        expect(productIdField?.primaryKey).toBe(true);
        expect(productIdField?.nullable).toBe(false);

        // Non-PK field should remain nullable
        const quantityField = table?.fields.find((f) => f.name === 'quantity');
        expect(quantityField?.primaryKey).toBeFalsy();
        expect(quantityField?.nullable).toBe(true);
    });
});
