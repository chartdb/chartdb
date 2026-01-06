import { describe, it, expect } from 'vitest';
import { importDBMLToDiagram } from '../dbml-import';
import { generateDBMLFromDiagram } from '../../dbml-export/dbml-export';
import { DatabaseType } from '@/lib/domain/database-type';

describe('DBML Cardinality Import', () => {
    describe('Inline ref cardinality symbols', () => {
        it('should import many-to-one relationship (ref: >)', async () => {
            // ref: > means "I (FK) reference other (PK)" - many-to-one
            // Parser returns: [referenced_table (one), table_with_ref (many)]
            const dbml = `
Table "orders" {
  "id" int [pk]
  "customer_id" int [ref: > "customers"."id"]
}

Table "customers" {
  "id" int [pk]
  "name" varchar(100)
}
`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.relationships?.length).toBe(1);
            const rel = diagram.relationships![0];

            // source = customers.id (PK/referenced) is one
            // target = orders.customer_id (FK/referencing) is many
            expect(rel.sourceCardinality).toBe('one');
            expect(rel.targetCardinality).toBe('many');
        });

        it('should import one-to-many relationship (ref: <)', async () => {
            // ref: < means "other (FK) references me (PK)" - one-to-many
            // Parser returns: [other_table (many), table_with_ref (one)]
            const dbml = `
Table "customers" {
  "id" int [pk, ref: < "orders"."customer_id"]
  "name" varchar(100)
}

Table "orders" {
  "id" int [pk]
  "customer_id" int
}
`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.relationships?.length).toBe(1);
            const rel = diagram.relationships![0];

            // source = orders.customer_id (the other/FK field) is many
            // target = customers.id (the field with ref/PK) is one
            expect(rel.sourceCardinality).toBe('many');
            expect(rel.targetCardinality).toBe('one');
        });

        it('should import one-to-one relationship (ref: -)', async () => {
            // ref: - means one-to-one relationship
            const dbml = `
Table "users" {
  "id" int [pk]
  "name" varchar(100)
}

Table "user_profiles" {
  "id" int [pk]
  "user_id" int [unique, ref: - "users"."id"]
  "bio" text
}
`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.relationships?.length).toBe(1);
            const rel = diagram.relationships![0];

            // Both sides should be one
            expect(rel.sourceCardinality).toBe('one');
            expect(rel.targetCardinality).toBe('one');
        });

        it('should import many-to-many relationship (ref: <>)', async () => {
            // ref: <> means many-to-many relationship
            const dbml = `
Table "students" {
  "id" int [pk, ref: <> "courses"."id"]
  "name" varchar(100)
}

Table "courses" {
  "id" int [pk]
  "title" varchar(200)
}
`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.relationships?.length).toBe(1);
            const rel = diagram.relationships![0];

            // Both sides should be many
            expect(rel.sourceCardinality).toBe('many');
            expect(rel.targetCardinality).toBe('many');
        });
    });

    describe('Standalone Ref cardinality symbols', () => {
        it('should import many-to-one with standalone Ref >', async () => {
            const dbml = `
Table "orders" {
  "id" int [pk]
  "customer_id" int
}

Table "customers" {
  "id" int [pk]
  "name" varchar(100)
}

Ref: "orders"."customer_id" > "customers"."id"
`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.relationships?.length).toBe(1);
            const rel = diagram.relationships![0];

            // orders.customer_id (source) is many, customers.id (target) is one
            expect(rel.sourceCardinality).toBe('many');
            expect(rel.targetCardinality).toBe('one');
        });

        it('should import one-to-many with standalone Ref <', async () => {
            const dbml = `
Table "customers" {
  "id" int [pk]
  "name" varchar(100)
}

Table "orders" {
  "id" int [pk]
  "customer_id" int
}

Ref: "customers"."id" < "orders"."customer_id"
`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.relationships?.length).toBe(1);
            const rel = diagram.relationships![0];

            // customers.id (source) is one, orders.customer_id (target) is many
            expect(rel.sourceCardinality).toBe('one');
            expect(rel.targetCardinality).toBe('many');
        });

        it('should import one-to-one with standalone Ref -', async () => {
            const dbml = `
Table "users" {
  "id" int [pk]
  "name" varchar(100)
}

Table "profiles" {
  "id" int [pk]
  "user_id" int [unique]
}

Ref: "profiles"."user_id" - "users"."id"
`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.relationships?.length).toBe(1);
            const rel = diagram.relationships![0];

            // Both sides should be one
            expect(rel.sourceCardinality).toBe('one');
            expect(rel.targetCardinality).toBe('one');
        });

        it('should import many-to-many with standalone Ref <>', async () => {
            const dbml = `
Table "students" {
  "id" int [pk]
  "name" varchar(100)
}

Table "courses" {
  "id" int [pk]
  "title" varchar(200)
}

Ref: "students"."id" <> "courses"."id"
`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.relationships?.length).toBe(1);
            const rel = diagram.relationships![0];

            // Both sides should be many
            expect(rel.sourceCardinality).toBe('many');
            expect(rel.targetCardinality).toBe('many');
        });
    });

    describe('Round-trip cardinality preservation', () => {
        it('should preserve many-to-one cardinality through export and re-import', async () => {
            const inputDbml = `
Table "posts" {
  "id" int [pk]
  "author_id" int [ref: > "authors"."id"]
  "title" varchar(200)
}

Table "authors" {
  "id" int [pk]
  "name" varchar(100)
}
`;
            // Import
            const diagram = await importDBMLToDiagram(inputDbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Export
            const exportResult = generateDBMLFromDiagram(diagram);

            // Re-import
            const reimportedDiagram = await importDBMLToDiagram(
                exportResult.inlineDbml,
                { databaseType: DatabaseType.POSTGRESQL }
            );

            // Verify cardinality preserved (source=PK side, target=FK side)
            const rel = reimportedDiagram.relationships![0];
            expect(rel.sourceCardinality).toBe('one');
            expect(rel.targetCardinality).toBe('many');
        });

        it('should preserve one-to-one cardinality through export and re-import', async () => {
            const inputDbml = `
Table "users" {
  "id" int [pk]
}

Table "settings" {
  "id" int [pk]
  "user_id" int [unique, ref: - "users"."id"]
}
`;
            const diagram = await importDBMLToDiagram(inputDbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            const exportResult = generateDBMLFromDiagram(diagram);

            const reimportedDiagram = await importDBMLToDiagram(
                exportResult.inlineDbml,
                { databaseType: DatabaseType.POSTGRESQL }
            );

            const rel = reimportedDiagram.relationships![0];
            expect(rel.sourceCardinality).toBe('one');
            expect(rel.targetCardinality).toBe('one');
        });

        it('should preserve many-to-many cardinality through export and re-import', async () => {
            const inputDbml = `
Table "tags" {
  "id" int [pk, ref: <> "articles"."id"]
  "name" varchar(50)
}

Table "articles" {
  "id" int [pk]
  "title" varchar(200)
}
`;
            const diagram = await importDBMLToDiagram(inputDbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            const exportResult = generateDBMLFromDiagram(diagram);

            const reimportedDiagram = await importDBMLToDiagram(
                exportResult.inlineDbml,
                { databaseType: DatabaseType.POSTGRESQL }
            );

            const rel = reimportedDiagram.relationships![0];
            expect(rel.sourceCardinality).toBe('many');
            expect(rel.targetCardinality).toBe('many');
        });
    });

    describe('Complex cardinality scenarios', () => {
        it('should handle multiple relationships with different cardinalities', async () => {
            const dbml = `
Table "comments" {
  "id" int [pk]
  "post_id" int [ref: > "posts"."id"]
  "user_id" int [ref: > "users"."id"]
  "parent_id" int [ref: > "comments"."id"]
  "content" text
}

Table "posts" {
  "id" int [pk]
  "title" varchar(200)
}

Table "users" {
  "id" int [pk]
  "name" varchar(100)
}
`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.relationships?.length).toBe(3);

            // All should be one-to-many from source perspective (source=PK, target=FK)
            diagram.relationships?.forEach((rel) => {
                expect(rel.sourceCardinality).toBe('one');
                expect(rel.targetCardinality).toBe('many');
            });
        });

        it('should handle self-referencing with correct cardinality', async () => {
            const dbml = `
Table "employees" {
  "id" int [pk]
  "name" varchar(100)
  "manager_id" int [ref: > "employees"."id"]
}
`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.relationships?.length).toBe(1);
            const rel = diagram.relationships![0];

            // Self-referencing: source=id (one), target=manager_id (many)
            expect(rel.sourceCardinality).toBe('one');
            expect(rel.targetCardinality).toBe('many');
            expect(rel.sourceTableId).toBe(rel.targetTableId);
        });

        it('should handle schema-qualified tables with cardinality', async () => {
            const dbml = `
Table "sales"."orders" {
  "id" int [pk]
  "customer_id" int [ref: > "crm"."customers"."id"]
}

Table "crm"."customers" {
  "id" int [pk]
  "name" varchar(100)
}
`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.relationships?.length).toBe(1);
            const rel = diagram.relationships![0];

            // source=customers.id (one), target=orders.customer_id (many)
            expect(rel.sourceCardinality).toBe('one');
            expect(rel.targetCardinality).toBe('many');
        });
    });
});
