import { describe, it, expect } from 'vitest';
import { importDBMLToDiagram } from '../dbml-import';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseType } from '@/lib/domain/database-type';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import { defaultSchemas } from '@/lib/data/default-schemas';

// Type for field map entries
interface FieldMapEntry {
    tableName: string;
    fieldName: string;
}

// Helper function to compare field properties (excluding IDs and timestamps)
function expectFieldsMatch(
    actualFields: DBField[],
    expectedFields: DBField[]
): void {
    expect(actualFields).toHaveLength(expectedFields.length);

    for (let i = 0; i < actualFields.length; i++) {
        const actual = actualFields[i];
        const expected = expectedFields[i];

        // Compare field properties (excluding ID and createdAt)
        expect(actual.name).toBe(expected.name);

        // Handle type comparison (could be string or object with name property)
        if (typeof expected.type === 'object' && expected.type?.name) {
            expect(actual.type?.name).toBe(expected.type.name);
        } else if (typeof expected.type === 'string') {
            expect(actual.type?.name).toBe(expected.type);
        }

        // Boolean flags with defaults
        expect(actual.primaryKey).toBe(expected.primaryKey || false);
        expect(actual.unique).toBe(expected.unique || false);
        expect(actual.nullable).toBe(expected.nullable ?? true);

        // Optional boolean flag
        if (expected.increment !== undefined) {
            expect(actual.increment).toBe(expected.increment);
        }

        // Optional string/number properties
        if (expected.characterMaximumLength !== undefined) {
            expect(actual.characterMaximumLength).toBe(
                expected.characterMaximumLength
            );
        }

        if (expected.precision !== undefined) {
            expect(actual.precision).toBe(expected.precision);
        }

        if (expected.scale !== undefined) {
            expect(actual.scale).toBe(expected.scale);
        }

        if (expected.default !== undefined) {
            expect(actual.default).toBe(expected.default);
        }

        if (expected.collation !== undefined) {
            expect(actual.collation).toBe(expected.collation);
        }

        if (expected.comments !== undefined) {
            expect(actual.comments).toBe(expected.comments);
        }
    }
}

// Helper function to compare table properties (excluding IDs)
function expectTablesMatch(
    actualTables: DBTable[],
    expectedTables: DBTable[],
    databaseType: DatabaseType
): void {
    expect(actualTables).toHaveLength(expectedTables.length);

    // Sort tables by name for consistent comparison
    const sortedActual = [...actualTables].sort((a, b) =>
        a.name.localeCompare(b.name)
    );
    const sortedExpected = [...expectedTables].sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    for (let i = 0; i < sortedActual.length; i++) {
        const actual = sortedActual[i];
        const expected = sortedExpected[i];

        // Compare table properties (excluding ID and position)
        expect(actual.name).toBe(expected.name);

        // Schema comparison - handle differences in how schemas are represented
        if (expected.schema) {
            const defaultSchema = defaultSchemas[databaseType];
            if (defaultSchema && expected.schema === defaultSchema) {
                // DBML parser might not include default schema or might handle it differently
                expect(
                    actual.schema === expected.schema ||
                        actual.schema === '' ||
                        actual.schema === undefined
                ).toBeTruthy();
            } else {
                expect(actual.schema).toBe(expected.schema);
            }
        }

        // Compare fields
        expectFieldsMatch(actual.fields, expected.fields);

        // Check indexes exist for tables with primary keys
        const hasPrimaryKeyField = actual.fields.some((f) => f.primaryKey);
        if (hasPrimaryKeyField) {
            expect(actual.indexes).toBeDefined();
            expect(actual.indexes.length).toBeGreaterThan(0);

            const pkIndex = actual.indexes.find((idx) => idx.isPrimaryKey);
            expect(pkIndex).toBeDefined();
            expect(pkIndex?.unique).toBe(true);
        }

        // Check comments if present
        if (expected.comments !== undefined) {
            expect(actual.comments).toBe(expected.comments);
        }
    }
}

// Helper function to compare relationships (excluding IDs)
function expectRelationshipsMatch(
    actualRelationships: DBRelationship[],
    expectedRelationships: DBRelationship[],
    actualTables: DBTable[],
    expectedTables: DBTable[]
): void {
    expect(actualRelationships).toHaveLength(expectedRelationships.length);

    // Create lookup maps for table and field names by ID
    const expectedTableMap = new Map(expectedTables.map((t) => [t.id, t.name]));
    const actualTableMap = new Map(actualTables.map((t) => [t.id, t.name]));

    const expectedFieldMap = new Map<string, FieldMapEntry>();
    const actualFieldMap = new Map<string, FieldMapEntry>();

    expectedTables.forEach((table) => {
        table.fields.forEach((field) => {
            expectedFieldMap.set(field.id, {
                tableName: table.name,
                fieldName: field.name,
            });
        });
    });

    actualTables.forEach((table) => {
        table.fields.forEach((field) => {
            actualFieldMap.set(field.id, {
                tableName: table.name,
                fieldName: field.name,
            });
        });
    });

    // Sort relationships for consistent comparison
    const sortRelationships = (
        rels: DBRelationship[],
        tableMap: Map<string, string>,
        fieldMap: Map<string, FieldMapEntry>
    ) => {
        return [...rels].sort((a, b) => {
            const aSourceTable = tableMap.get(a.sourceTableId) || '';
            const bSourceTable = tableMap.get(b.sourceTableId) || '';
            const aTargetTable = tableMap.get(a.targetTableId) || '';
            const bTargetTable = tableMap.get(b.targetTableId) || '';

            const tableCompare =
                aSourceTable.localeCompare(bSourceTable) ||
                aTargetTable.localeCompare(bTargetTable);
            if (tableCompare !== 0) return tableCompare;

            const aSourceField = fieldMap.get(a.sourceFieldId)?.fieldName || '';
            const bSourceField = fieldMap.get(b.sourceFieldId)?.fieldName || '';
            const aTargetField = fieldMap.get(a.targetFieldId)?.fieldName || '';
            const bTargetField = fieldMap.get(b.targetFieldId)?.fieldName || '';

            return (
                aSourceField.localeCompare(bSourceField) ||
                aTargetField.localeCompare(bTargetField)
            );
        });
    };

    const sortedActual = sortRelationships(
        actualRelationships,
        actualTableMap,
        actualFieldMap
    );
    const sortedExpected = sortRelationships(
        expectedRelationships,
        expectedTableMap,
        expectedFieldMap
    );

    for (let i = 0; i < sortedActual.length; i++) {
        const actual = sortedActual[i];
        const expected = sortedExpected[i];

        // Get table and field names for comparison
        const actualSourceTable = actualTableMap.get(actual.sourceTableId);
        const actualTargetTable = actualTableMap.get(actual.targetTableId);
        const expectedSourceTable = expectedTableMap.get(
            expected.sourceTableId
        );
        const expectedTargetTable = expectedTableMap.get(
            expected.targetTableId
        );

        const actualSourceField = actualFieldMap.get(actual.sourceFieldId);
        const actualTargetField = actualFieldMap.get(actual.targetFieldId);
        const expectedSourceField = expectedFieldMap.get(
            expected.sourceFieldId
        );
        const expectedTargetField = expectedFieldMap.get(
            expected.targetFieldId
        );

        // Compare relationship by table and field names
        expect(actualSourceTable).toBe(expectedSourceTable);
        expect(actualTargetTable).toBe(expectedTargetTable);
        expect(actualSourceField?.fieldName).toBe(
            expectedSourceField?.fieldName
        );
        expect(actualTargetField?.fieldName).toBe(
            expectedTargetField?.fieldName
        );

        // Compare cardinality
        expect(actual.sourceCardinality).toBe(expected.sourceCardinality);
        expect(actual.targetCardinality).toBe(expected.targetCardinality);

        // Compare relationship name if present
        if (expected.name !== undefined) {
            expect(actual.name).toBe(expected.name);
        }
    }
}

// Main test helper function
async function testDBMLImportCase(caseNumber: string): Promise<void> {
    // Read the DBML file
    const dbmlPath = path.join(__dirname, 'cases', `${caseNumber}.dbml`);
    const dbmlContent = fs.readFileSync(dbmlPath, 'utf-8');

    // Read the expected JSON file
    const jsonPath = path.join(__dirname, 'cases', `${caseNumber}.json`);
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const expectedData = JSON.parse(jsonContent);

    // Import DBML to diagram
    const result = await importDBMLToDiagram(dbmlContent, {
        databaseType: expectedData.databaseType || DatabaseType.POSTGRESQL,
    });

    // Check basic diagram properties
    expect(result.name).toBe('DBML Import'); // Name is always 'DBML Import'
    expect(result.databaseType).toBe(expectedData.databaseType);

    // Check tables and fields
    expectTablesMatch(
        result.tables || [],
        expectedData.tables || [],
        expectedData.databaseType || DatabaseType.POSTGRESQL
    );

    // Check relationships
    expectRelationshipsMatch(
        result.relationships || [],
        expectedData.relationships || [],
        result.tables || [],
        expectedData.tables || []
    );
}

describe('DBML Import cases', () => {
    it('should handle case 1 - simple table with pk and unique', async () => {
        await testDBMLImportCase('1');
    });

    it('should handle case 2 - tables with relationships', async () => {
        await testDBMLImportCase('2');
    });

    it('should handle table with default values', async () => {
        const dbmlContent = `Table "public"."products" {
  "id" bigint [pk, not null]
  "name" varchar(255) [not null]
  "price" decimal(10,2) [not null, default: 0]
  "is_active" boolean [not null, default: true]
  "status" varchar(50) [not null, default: "deprecated"]
  "description" varchar(100) [default: \`complex "value" with quotes\`]
  "created_at" timestamp [not null, default: "now()"]

  Indexes {
    (name) [name: "idx_products_name"]
  }
}`;

        const result = await importDBMLToDiagram(dbmlContent, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        expect(result.tables).toHaveLength(1);
        const table = result.tables![0];
        expect(table.name).toBe('products');
        expect(table.fields).toHaveLength(7);

        // Check numeric default (0)
        const priceField = table.fields.find((f) => f.name === 'price');
        expect(priceField?.default).toBe('0');

        // Check boolean default (true)
        const isActiveField = table.fields.find((f) => f.name === 'is_active');
        expect(isActiveField?.default).toBe('true');

        // Check string default with all quotes removed
        const statusField = table.fields.find((f) => f.name === 'status');
        expect(statusField?.default).toBe('deprecated');

        // Check backtick string - all quotes removed
        const descField = table.fields.find((f) => f.name === 'description');
        expect(descField?.default).toBe('complex value with quotes');

        // Check function default with all quotes removed
        const createdAtField = table.fields.find(
            (f) => f.name === 'created_at'
        );
        expect(createdAtField?.default).toBe('now()');
    });

    it('should handle auto-increment fields correctly', async () => {
        const dbmlContent = `Table "public"."table_1" {
  "id" integer [pk, not null, increment]
  "field_2" bigint [increment]
  "field_3" serial [increment]
  "field_4" varchar(100) [not null]
}`;

        const result = await importDBMLToDiagram(dbmlContent, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        expect(result.tables).toHaveLength(1);
        const table = result.tables![0];
        expect(table.name).toBe('table_1');
        expect(table.fields).toHaveLength(4);

        // field with [pk, not null, increment] - should be not null and increment
        const idField = table.fields.find((f) => f.name === 'id');
        expect(idField?.increment).toBe(true);
        expect(idField?.nullable).toBe(false);
        expect(idField?.primaryKey).toBe(true);

        // field with [increment] only - should be not null and increment
        // (auto-increment requires NOT NULL even if not explicitly stated)
        const field2 = table.fields.find((f) => f.name === 'field_2');
        expect(field2?.increment).toBe(true);
        expect(field2?.nullable).toBe(false); // CRITICAL: must be false!

        // SERIAL type with [increment] - should be not null and increment
        const field3 = table.fields.find((f) => f.name === 'field_3');
        expect(field3?.increment).toBe(true);
        expect(field3?.nullable).toBe(false);
        expect(field3?.type?.name).toBe('serial');

        // Regular field with [not null] - should be not null, no increment
        const field4 = table.fields.find((f) => f.name === 'field_4');
        expect(field4?.increment).toBeUndefined();
        expect(field4?.nullable).toBe(false);
    });

    it('should handle SERIAL types without increment attribute', async () => {
        const dbmlContent = `Table "public"."test_table" {
  "id" serial [pk]
  "counter" bigserial
  "small_counter" smallserial
  "regular" integer
}`;

        const result = await importDBMLToDiagram(dbmlContent, {
            databaseType: DatabaseType.POSTGRESQL,
        });

        expect(result.tables).toHaveLength(1);
        const table = result.tables![0];
        expect(table.fields).toHaveLength(4);

        // SERIAL type without [increment] - should STILL be not null (type requires it)
        const idField = table.fields.find((f) => f.name === 'id');
        expect(idField?.type?.name).toBe('serial');
        expect(idField?.nullable).toBe(false); // CRITICAL: Type requires NOT NULL
        expect(idField?.primaryKey).toBe(true);

        // BIGSERIAL without [increment] - should be not null
        const counterField = table.fields.find((f) => f.name === 'counter');
        expect(counterField?.type?.name).toBe('bigserial');
        expect(counterField?.nullable).toBe(false); // CRITICAL: Type requires NOT NULL

        // SMALLSERIAL without [increment] - should be not null
        const smallCounterField = table.fields.find(
            (f) => f.name === 'small_counter'
        );
        expect(smallCounterField?.type?.name).toBe('smallserial');
        expect(smallCounterField?.nullable).toBe(false); // CRITICAL: Type requires NOT NULL

        // Regular INTEGER - should be nullable by default
        const regularField = table.fields.find((f) => f.name === 'regular');
        expect(regularField?.type?.name).toBe('int');
        expect(regularField?.nullable).toBe(true); // No NOT NULL constraint
    });
});
