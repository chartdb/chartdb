import { describe, it, expect } from 'vitest';
import { generateDBMLFromDiagram } from '../dbml-export';
import { importDBMLToDiagram } from '../../dbml-import/dbml-import';
import { DatabaseType } from '@/lib/domain/database-type';

describe('DBML Self-Referencing Relationships', () => {
    it('should preserve self-referencing relationships in DBML export', async () => {
        // Create a DBML with self-referencing relationship (general_ledger example)
        const inputDBML = `
Table "finance"."general_ledger" {
  "ledger_id" bigint [pk]
  "account_name" varchar(100)
  "amount" decimal(10,2)
  "reversal_id" bigint [ref: > "finance"."general_ledger"."ledger_id"]
  "created_at" timestamp
}
`;

        // Import the DBML
        const diagram = await importDBMLToDiagram(inputDBML, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        // Verify the relationship was imported
        expect(diagram.relationships).toBeDefined();
        expect(diagram.relationships?.length).toBe(1);

        // Verify it's a self-referencing relationship
        const relationship = diagram.relationships![0];
        expect(relationship.sourceTableId).toBe(relationship.targetTableId);

        // Export back to DBML
        const exportResult = generateDBMLFromDiagram(diagram);

        // Check inline format
        expect(exportResult.inlineDbml).toContain('reversal_id');
        // The DBML parser correctly interprets FK as: target < source
        expect(exportResult.inlineDbml).toMatch(
            /ref:\s*<\s*"finance"\."general_ledger"\."ledger_id"/
        );

        // Check standard format
        expect(exportResult.standardDbml).toContain('Ref ');
        expect(exportResult.standardDbml).toMatch(
            /"finance"\."general_ledger"\."ledger_id"\s*<\s*"finance"\."general_ledger"\."reversal_id"/
        );
    });

    it('should handle self-referencing relationships in employee hierarchy', async () => {
        // Create an employee table with manager relationship
        const inputDBML = `
Table "employees" {
  "id" int [pk]
  "name" varchar(100)
  "manager_id" int [ref: > "employees"."id"]
  "department" varchar(50)
}
`;

        const diagram = await importDBMLToDiagram(inputDBML, {
            databaseType: DatabaseType.MYSQL,
        });

        // Verify the relationship
        expect(diagram.relationships?.length).toBe(1);
        const rel = diagram.relationships![0];
        expect(rel.sourceTableId).toBe(rel.targetTableId);

        // Export and verify
        const exportResult = generateDBMLFromDiagram(diagram);

        // Check that the self-reference is preserved
        expect(exportResult.inlineDbml).toContain('manager_id');
        // The DBML parser correctly interprets FK as: target < source
        expect(exportResult.inlineDbml).toMatch(/ref:\s*<\s*"employees"\."id"/);
    });

    it('should handle multiple self-referencing relationships', async () => {
        // Create a category table with parent-child relationships
        const inputDBML = `
Table "categories" {
  "id" int [pk]
  "name" varchar(100)
  "parent_id" int [ref: > "categories"."id"]
  "related_id" int [ref: > "categories"."id"]
  "description" text
}
`;

        const diagram = await importDBMLToDiagram(inputDBML, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        // Should have 2 self-referencing relationships
        expect(diagram.relationships?.length).toBe(2);

        // Both should be self-referencing
        diagram.relationships?.forEach((rel) => {
            expect(rel.sourceTableId).toBe(rel.targetTableId);
        });

        // Export and verify both relationships are preserved
        const exportResult = generateDBMLFromDiagram(diagram);

        expect(exportResult.inlineDbml).toContain('parent_id');
        expect(exportResult.inlineDbml).toContain('related_id');

        // Count the number of ref: statements
        // The DBML parser correctly interprets FK as: target < source
        const refMatches = exportResult.inlineDbml.match(/ref:\s*</g);
        expect(refMatches?.length).toBe(2);
    });

    it('should handle self-referencing with schemas', async () => {
        // Test with explicit schema names
        const inputDBML = `
Table "hr"."staff" {
  "staff_id" int [pk]
  "name" varchar(100)
  "supervisor_id" int [ref: > "hr"."staff"."staff_id"]
  "level" int
}
`;

        const diagram = await importDBMLToDiagram(inputDBML, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        expect(diagram.relationships?.length).toBe(1);

        const exportResult = generateDBMLFromDiagram(diagram);

        // Should preserve the schema in the reference
        // The DBML parser correctly interprets FK as: target < source
        expect(exportResult.inlineDbml).toMatch(
            /ref:\s*<\s*"hr"\."staff"\."staff_id"/
        );
    });

    it('should handle circular references in graph structures', async () => {
        // Create a node table for graph structures
        const inputDBML = `
Table "graph_nodes" {
  "node_id" bigint [pk]
  "value" varchar(100)
  "next_node_id" bigint [ref: > "graph_nodes"."node_id"]
  "prev_node_id" bigint [ref: > "graph_nodes"."node_id"]
}
`;

        const diagram = await importDBMLToDiagram(inputDBML, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        // Should have 2 self-referencing relationships
        expect(diagram.relationships?.length).toBe(2);

        const exportResult = generateDBMLFromDiagram(diagram);

        // Both references should be preserved
        expect(exportResult.inlineDbml).toContain('next_node_id');
        expect(exportResult.inlineDbml).toContain('prev_node_id');

        // Verify no lines are commented out
        expect(exportResult.standardDbml).not.toContain('-- ALTER TABLE');
        expect(exportResult.inlineDbml).not.toContain('-- ALTER TABLE');
    });
});
