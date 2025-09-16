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
});
