import { describe, it, expect } from 'vitest';
import { DatabaseType } from '@/lib/domain/database-type';
import { importDBMLToDiagram } from '@/lib/dbml/dbml-import/dbml-import';

// This test verifies the DBML integration without UI components
describe('DBML Integration Tests', () => {
    it('should handle DBML import in create diagram flow', async () => {
        const dbmlContent = `
Table users {
  id uuid [pk, not null]
  email varchar [unique, not null]
  created_at timestamp
}

Table posts {
  id uuid [pk]
  title varchar
  content text
  user_id uuid [ref: > users.id]
  created_at timestamp
}

Table comments {
  id uuid [pk]
  content text
  post_id uuid [ref: > posts.id]
  user_id uuid [ref: > users.id]
}

// This will be ignored
TableGroup "Content" {
  posts
  comments
}

// This will be ignored too
Note test_note {
  'This is a test note'
}`;

        const diagram = await importDBMLToDiagram(dbmlContent, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        // Verify basic structure
        expect(diagram).toBeDefined();
        expect(diagram.tables).toHaveLength(3);
        expect(diagram.relationships).toHaveLength(3);

        // Verify tables
        const tableNames = diagram.tables?.map((t) => t.name).sort();
        expect(tableNames).toEqual(['comments', 'posts', 'users']);

        // Verify users table
        const usersTable = diagram.tables?.find((t) => t.name === 'users');
        expect(usersTable).toBeDefined();
        expect(usersTable?.fields).toHaveLength(3);

        const emailField = usersTable?.fields.find((f) => f.name === 'email');
        expect(emailField?.unique).toBe(true);
        expect(emailField?.nullable).toBe(false);

        // Verify relationships
        // There should be 3 relationships total
        expect(diagram.relationships).toHaveLength(3);

        // Find the relationship from users to posts (DBML ref is: posts.user_id > users.id)
        // This creates a relationship FROM users TO posts (one user has many posts)
        const postsTable = diagram.tables?.find((t) => t.name === 'posts');
        const usersTableId = usersTable?.id;

        const userPostRelation = diagram.relationships?.find(
            (r) =>
                r.sourceTableId === usersTableId &&
                r.targetTableId === postsTable?.id
        );

        expect(userPostRelation).toBeDefined();
        expect(userPostRelation?.sourceCardinality).toBe('one');
        expect(userPostRelation?.targetCardinality).toBe('many');
    });

    it('should handle DBML with special features', async () => {
        const dbmlContent = `
// Enum will be converted to varchar
Table users {
  id int [pk]
  status enum
  tags text[] // Array will be converted to text
  favorite_product_id int
}

Table products [headercolor: #FF0000] {
  id int [pk]
  name varchar
  price decimal(10,2)
}

Ref: products.id < users.favorite_product_id`;

        const diagram = await importDBMLToDiagram(dbmlContent, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        expect(diagram.tables).toHaveLength(2);

        // Check enum conversion
        const usersTable = diagram.tables?.find((t) => t.name === 'users');
        const statusField = usersTable?.fields.find((f) => f.name === 'status');
        expect(statusField?.type.id).toBe('varchar');

        // Check array type conversion
        const tagsField = usersTable?.fields.find((f) => f.name === 'tags');
        expect(tagsField?.type.id).toBe('text');

        // Check that header color was removed
        const productsTable = diagram.tables?.find(
            (t) => t.name === 'products'
        );
        expect(productsTable).toBeDefined();
        expect(productsTable?.name).toBe('products');
    });

    it('should handle empty or invalid DBML gracefully', async () => {
        // Empty DBML
        const emptyDiagram = await importDBMLToDiagram('', {
            databaseType: DatabaseType.POSTGRESQL,
        });
        expect(emptyDiagram.tables).toHaveLength(0);
        expect(emptyDiagram.relationships).toHaveLength(0);

        // Only comments
        const commentDiagram = await importDBMLToDiagram('// Just a comment', {
            databaseType: DatabaseType.POSTGRESQL,
        });
        expect(commentDiagram.tables).toHaveLength(0);
        expect(commentDiagram.relationships).toHaveLength(0);
    });

    it('should preserve diagram metadata when importing DBML', async () => {
        const dbmlContent = `Table test {
  id int [pk]
}`;
        const diagram = await importDBMLToDiagram(dbmlContent, {
            databaseType: DatabaseType.GENERIC,
        });

        // Default values
        expect(diagram.name).toBe('DBML Import');
        expect(diagram.databaseType).toBe(DatabaseType.GENERIC);

        // These can be overridden by the dialog
        diagram.name = 'My Custom Diagram';
        diagram.databaseType = DatabaseType.POSTGRESQL;

        expect(diagram.name).toBe('My Custom Diagram');
        expect(diagram.databaseType).toBe(DatabaseType.POSTGRESQL);
    });
});
