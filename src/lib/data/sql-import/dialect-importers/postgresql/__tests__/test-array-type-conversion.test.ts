import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';
import { convertToChartDBDiagram } from '../../../common';
import { DatabaseType } from '@/lib/domain/database-type';

describe('Array Type Conversion', () => {
    it('should correctly parse and convert array types with isArray flag', async () => {
        const sql = `
CREATE TABLE test_arrays (
    id bigint NOT NULL PRIMARY KEY,
    int_array int[],
    text_array text[],
    varchar_array varchar(255)[],
    jsonb_data jsonb,
    regular_int int
);

CREATE INDEX idx_int_array ON test_arrays USING GIN (int_array);
`;

        // Parse SQL
        const parserResult = await fromPostgres(sql);

        // Verify parser correctly captures array notation in type string
        const intArrayCol = parserResult.tables[0].columns.find(
            (c) => c.name === 'int_array'
        );
        // The parser normalizes int to integer, but should preserve []
        expect(intArrayCol?.type).toMatch(/\[\]$/);

        const textArrayCol = parserResult.tables[0].columns.find(
            (c) => c.name === 'text_array'
        );
        expect(textArrayCol?.type).toBe('text[]');

        const varcharArrayCol = parserResult.tables[0].columns.find(
            (c) => c.name === 'varchar_array'
        );
        expect(varcharArrayCol?.type).toBe('varchar(255)[]');

        // Convert to diagram
        const diagram = convertToChartDBDiagram(
            parserResult,
            DatabaseType.POSTGRESQL,
            DatabaseType.POSTGRESQL
        );

        const table = diagram.tables?.find((t) => t.name === 'test_arrays');
        expect(table).toBeDefined();

        // Check int[] field - should have isArray=true and base type (PostgreSQL uses 'int' as the canonical form)
        const intArrayField = table!.fields.find((f) => f.name === 'int_array');
        expect(intArrayField).toBeDefined();
        expect(intArrayField!.isArray).toBe(true);
        expect(intArrayField!.type.id).toBe('int');

        // Check text[] field - should have isArray=true and type=text
        const textArrayField = table!.fields.find(
            (f) => f.name === 'text_array'
        );
        expect(textArrayField).toBeDefined();
        expect(textArrayField!.isArray).toBe(true);
        expect(textArrayField!.type.id).toBe('text');

        // Check varchar[] field - should have isArray=true and type=varchar
        const varcharArrayField = table!.fields.find(
            (f) => f.name === 'varchar_array'
        );
        expect(varcharArrayField).toBeDefined();
        expect(varcharArrayField!.isArray).toBe(true);
        expect(varcharArrayField!.type.id).toBe('varchar');

        // Check regular jsonb field - should NOT have isArray
        const jsonbField = table!.fields.find((f) => f.name === 'jsonb_data');
        expect(jsonbField).toBeDefined();
        expect(jsonbField!.isArray).toBeUndefined();
        expect(jsonbField!.type.id).toBe('jsonb');

        // Check regular int field - should NOT have isArray (PostgreSQL uses 'int' as the canonical form)
        const regularIntField = table!.fields.find(
            (f) => f.name === 'regular_int'
        );
        expect(regularIntField).toBeDefined();
        expect(regularIntField!.isArray).toBeUndefined();
        expect(regularIntField!.type.id).toBe('int');
    });

    it('should handle multi-dimensional arrays', async () => {
        const sql = `
CREATE TABLE matrix_data (
    id serial PRIMARY KEY,
    matrix int[][]
);
`;

        const parserResult = await fromPostgres(sql);

        // Check parser captures the type with array notation
        const matrixCol = parserResult.tables[0].columns.find(
            (c) => c.name === 'matrix'
        );
        // Multi-dimensional arrays should still have array notation
        expect(matrixCol?.type).toMatch(/\[\]/);
    });

    it('should correctly parse GIN index type from USING clause', async () => {
        const sql = `
CREATE TABLE test_gin_index (
    id bigint NOT NULL PRIMARY KEY,
    tags text[]
);

CREATE INDEX idx_tags ON test_gin_index USING GIN (tags);
CREATE INDEX idx_tags_btree ON test_gin_index USING BTREE (id);
CREATE INDEX idx_tags_hash ON test_gin_index USING HASH (id);
`;

        // Parse SQL
        const parserResult = await fromPostgres(sql);

        // Check that the parser captures the index type
        const table = parserResult.tables[0];
        expect(table.indexes).toHaveLength(3);

        const ginIndex = table.indexes.find((idx) => idx.name === 'idx_tags');
        expect(ginIndex).toBeDefined();
        expect(ginIndex!.type).toBe('gin');

        const btreeIndex = table.indexes.find(
            (idx) => idx.name === 'idx_tags_btree'
        );
        expect(btreeIndex).toBeDefined();
        expect(btreeIndex!.type).toBe('btree');

        const hashIndex = table.indexes.find(
            (idx) => idx.name === 'idx_tags_hash'
        );
        expect(hashIndex).toBeDefined();
        expect(hashIndex!.type).toBe('hash');

        // Convert to diagram and verify index types are preserved
        const diagram = convertToChartDBDiagram(
            parserResult,
            DatabaseType.POSTGRESQL,
            DatabaseType.POSTGRESQL
        );

        const diagramTable = diagram.tables?.find(
            (t) => t.name === 'test_gin_index'
        );
        expect(diagramTable).toBeDefined();

        const diagramGinIndex = diagramTable!.indexes.find(
            (idx) => idx.name === 'idx_tags'
        );
        expect(diagramGinIndex).toBeDefined();
        expect(diagramGinIndex!.type).toBe('gin');

        const diagramBtreeIndex = diagramTable!.indexes.find(
            (idx) => idx.name === 'idx_tags_btree'
        );
        expect(diagramBtreeIndex).toBeDefined();
        expect(diagramBtreeIndex!.type).toBe('btree');

        const diagramHashIndex = diagramTable!.indexes.find(
            (idx) => idx.name === 'idx_tags_hash'
        );
        expect(diagramHashIndex).toBeDefined();
        expect(diagramHashIndex!.type).toBe('hash');
    });
});
