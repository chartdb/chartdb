import { describe, it, expect } from 'vitest';
import { importDBMLToDiagram } from '../dbml-import';
import { exportPostgreSQL } from '@/lib/data/sql-export/export-per-type/postgresql';
import { exportMySQL } from '@/lib/data/sql-export/export-per-type/mysql';
import { exportMSSQL } from '@/lib/data/sql-export/export-per-type/mssql';
import { DatabaseType } from '@/lib/domain/database-type';

describe('Composite Primary Key with Name', () => {
    it('should preserve composite primary key name in DBML import and SQL export', async () => {
        const dbmlContent = `
Table "landlord"."users_master_table" {
  "master_user_id" bigint [not null]
  "tenant_id" bigint [not null]
  "tenant_user_id" bigint [not null]
  "enabled" boolean

  Indexes {
    (master_user_id, tenant_id, tenant_user_id) [pk, name: "idx_users_master_table_master_user_id_tenant_id_tenant_user_id"]
    (tenant_id, tenant_user_id) [unique, name: "index_1"]
  }
}
`;

        // Import DBML
        const diagram = await importDBMLToDiagram(dbmlContent, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        // Check that the composite PK name was captured
        expect(diagram.tables).toBeDefined();
        const table = diagram.tables![0];

        // Check for the PK index
        const pkIndex = table.indexes.find((idx) => idx.isPrimaryKey);
        expect(pkIndex).toBeDefined();
        expect(pkIndex!.name).toBe(
            'idx_users_master_table_master_user_id_tenant_id_tenant_user_id'
        );

        // Check that fields are marked as primary keys
        const pkFields = table.fields.filter((f) => f.primaryKey);
        expect(pkFields).toHaveLength(3);
        expect(pkFields.map((f) => f.name)).toEqual([
            'master_user_id',
            'tenant_id',
            'tenant_user_id',
        ]);

        // Check that we have both the PK index and the unique index
        expect(table.indexes).toHaveLength(2);
        const uniqueIndex = table.indexes.find((idx) => !idx.isPrimaryKey);
        expect(uniqueIndex!.name).toBe('index_1');
        expect(uniqueIndex!.unique).toBe(true);
    });

    it('should export composite primary key with CONSTRAINT name in PostgreSQL', async () => {
        const dbmlContent = `
Table "users" {
  "id" bigint [not null]
  "tenant_id" bigint [not null]
  
  Indexes {
    (id, tenant_id) [pk, name: "pk_users_composite"]
  }
}
`;

        const diagram = await importDBMLToDiagram(dbmlContent, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        const sqlScript = exportPostgreSQL({ diagram });

        // Check that the SQL contains the named constraint
        expect(sqlScript).toContain(
            'CONSTRAINT "pk_users_composite" PRIMARY KEY ("id", "tenant_id")'
        );
        expect(sqlScript).not.toContain('PRIMARY KEY ("id", "tenant_id"),'); // Should not have unnamed PK
    });

    it('should export composite primary key with CONSTRAINT name in MySQL', async () => {
        const dbmlContent = `
Table "orders" {
  "order_id" int [not null]
  "product_id" int [not null]
  
  Indexes {
    (order_id, product_id) [pk, name: "orders_order_product_pk"]
  }
}
`;

        const diagram = await importDBMLToDiagram(dbmlContent, {
            databaseType: DatabaseType.MYSQL,
        });

        const sqlScript = exportMySQL({ diagram });

        // Check that the SQL contains the named constraint
        expect(sqlScript).toContain(
            'CONSTRAINT `orders_order_product_pk` PRIMARY KEY (`order_id`, `product_id`)'
        );
    });

    it('should export composite primary key with CONSTRAINT name in MSSQL', async () => {
        const dbmlContent = `
Table "products" {
  "category_id" int [not null]
  "product_id" int [not null]
  
  Indexes {
    (category_id, product_id) [pk, name: "pk_products"]
  }
}
`;

        const diagram = await importDBMLToDiagram(dbmlContent, {
            databaseType: DatabaseType.SQL_SERVER,
        });

        const sqlScript = exportMSSQL({ diagram });

        // Check that the SQL contains the named constraint
        expect(sqlScript).toContain(
            'CONSTRAINT [pk_products] PRIMARY KEY ([category_id], [product_id])'
        );
    });

    it('should merge duplicate PK index with name', async () => {
        const dbmlContent = `
Table "test" {
  "a" int [not null]
  "b" int [not null]
  
  Indexes {
    (a, b) [pk]
    (a, b) [name: "test_pk_name"]
  }
}
`;

        const diagram = await importDBMLToDiagram(dbmlContent, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        expect(diagram.tables).toBeDefined();
        const table = diagram.tables![0];

        // Should capture the name from the duplicate index
        const pkIndex = table.indexes.find((idx) => idx.isPrimaryKey);
        expect(pkIndex).toBeDefined();
        expect(pkIndex!.name).toBe('test_pk_name');

        // Should only have the PK index
        expect(table.indexes).toHaveLength(1);

        // Fields should be marked as primary keys
        expect(table.fields.filter((f) => f.primaryKey)).toHaveLength(2);
    });

    it('should handle composite PK without name', async () => {
        const dbmlContent = `
Table "simple" {
  "x" int [not null]
  "y" int [not null]
  
  Indexes {
    (x, y) [pk]
  }
}
`;

        const diagram = await importDBMLToDiagram(dbmlContent, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        expect(diagram.tables).toBeDefined();
        const table = diagram.tables![0];

        // PK index should exist but with empty name (auto-generated)
        const pkIndex = table.indexes.find((idx) => idx.isPrimaryKey);
        expect(pkIndex).toBeDefined();
        expect(pkIndex!.name).toBe('');

        const sqlScript = exportPostgreSQL({ diagram });

        // Should have unnamed PRIMARY KEY (no CONSTRAINT for auto-generated PK index)
        expect(sqlScript).toContain('PRIMARY KEY ("x", "y")');
        expect(sqlScript).not.toContain('CONSTRAINT');
    });
});
