import { describe, it, expect } from 'vitest';
import { importDBMLToDiagram } from '../../../dbml-import';
import { DatabaseType } from '../../../domain/database-type';

describe('DBML Type Mapping', () => {
    it('should map DBML types to PostgreSQL types', async () => {
        const dbml = `Table users {
  id int [pk]
  name varchar
  active bool
  created_at timestamp
  score number
  description text
}`;

        const diagram = await importDBMLToDiagram(
            dbml,
            undefined,
            DatabaseType.POSTGRESQL
        );
        const table = diagram.tables?.[0];
        expect(table).toBeDefined();

        const fields = table?.fields || [];
        const idField = fields.find((f) => f.name === 'id');
        const nameField = fields.find((f) => f.name === 'name');
        const activeField = fields.find((f) => f.name === 'active');
        const createdAtField = fields.find((f) => f.name === 'created_at');
        const scoreField = fields.find((f) => f.name === 'score');
        const descriptionField = fields.find((f) => f.name === 'description');

        // Verify type mappings
        expect(idField?.type.id).toBe('integer'); // int -> integer
        expect(nameField?.type.id).toBe('varchar');
        expect(activeField?.type.id).toBe('boolean'); // bool -> boolean
        expect(createdAtField?.type.id).toBe('timestamp');
        expect(scoreField?.type.id).toBe('numeric'); // number -> numeric
        expect(descriptionField?.type.id).toBe('text');
    });

    it('should map DBML types to MySQL types', async () => {
        const dbml = `Table users {
  id int [pk]
  name varchar
  active bool
  created_at timestamp
  score number
}`;

        const diagram = await importDBMLToDiagram(
            dbml,
            undefined,
            DatabaseType.MYSQL
        );
        const table = diagram.tables?.[0];
        expect(table).toBeDefined();

        const fields = table?.fields || [];
        const idField = fields.find((f) => f.name === 'id');
        const activeField = fields.find((f) => f.name === 'active');

        // MySQL has 'int' type available
        expect(idField?.type.id).toBe('int');
        // MySQL has boolean type
        expect(activeField?.type.id).toBe('boolean');
    });

    it('should use generic types when database type is not specified', async () => {
        const dbml = `Table users {
  id int [pk]
  name varchar
  active bool
}`;

        const diagram = await importDBMLToDiagram(dbml);
        expect(diagram.databaseType).toBe(DatabaseType.GENERIC);

        const table = diagram.tables?.[0];
        const fields = table?.fields || [];
        const idField = fields.find((f) => f.name === 'id');

        // Should use generic type mapping (generic has 'int' not 'integer')
        expect(idField?.type.id).toBe('int');
    });

    it('should handle unknown types gracefully', async () => {
        const dbml = `Table users {
  id customtype [pk]
  data jsonb
}`;

        const diagram = await importDBMLToDiagram(
            dbml,
            undefined,
            DatabaseType.POSTGRESQL
        );
        const table = diagram.tables?.[0];
        const fields = table?.fields || [];

        const idField = fields.find((f) => f.name === 'id');
        const dataField = fields.find((f) => f.name === 'data');

        // Unknown type should default to varchar
        expect(idField?.type.id).toBe('varchar');
        // jsonb is a valid PostgreSQL type
        expect(dataField?.type.id).toBe('jsonb');
    });
});
