import { describe, it, expect, vi } from 'vitest';
import { fixMetadataJson, isStringMetadataJson } from '../utils';

describe('fixMetadataJson', () => {
    describe('escaped quotes', () => {
        it('should fix escaped double quotes (\\") to regular quotes', () => {
            const input = '{\\"name\\": \\"test\\"}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"name": "test"}');
        });

        it('should handle deeply nested escaped quotes', () => {
            const input =
                '{\\"fk_info\\": [], \\"pk_info\\": [{\\"schema\\": \\"public\\", \\"table\\": \\"users\\"}]}';
            const result = fixMetadataJson(input);
            expect(result).toBe(
                '{"fk_info": [], "pk_info": [{"schema": "public", "table": "users"}]}'
            );
        });
    });

    describe('literal escape sequences', () => {
        it('should remove literal \\n (backslash + n) from stringified JSON', () => {
            const input = '{\\n    "name": "test"\\n}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{    "name": "test"}');
        });

        it('should remove literal \\t (backslash + t) from stringified JSON', () => {
            const input = '{\\t"name": "test"}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"name": "test"}');
        });

        it('should remove literal \\r (backslash + r) from stringified JSON', () => {
            const input = '{\\r"name": "test"}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"name": "test"}');
        });

        it('should handle combined literal escape sequences', () => {
            const input = '{\\r\\n\\t"name": "test"\\r\\n}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"name": "test"}');
        });

        it('should handle fully stringified JSON with \\n and \\" combined', () => {
            const input =
                '{\\n    \\"fk_info\\": [],\\n    \\"pk_info\\": []\\n}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{    "fk_info": [],    "pk_info": []}');
        });
    });

    describe('double-double quotes', () => {
        it('should convert :""value"" to :"value" for simple values', () => {
            const input = '{"pk_def": ""PRIMARY KEY (id)""}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"pk_def": "PRIMARY KEY (id)"}');
        });

        it('should convert : ""value"" (with space) to : "value"', () => {
            const input = '{"pk_def": ""PRIMARY KEY (id)""}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"pk_def": "PRIMARY KEY (id)"}');
        });

        it('should handle double-double quotes with complex values containing commas', () => {
            const input =
                '{"pk_def": ""PRIMARY KEY (audit_type_cd, channel_type_cd)""}';
            const result = fixMetadataJson(input);
            expect(result).toBe(
                '{"pk_def": "PRIMARY KEY (audit_type_cd, channel_type_cd)"}'
            );
        });

        it('should handle multiple double-double quoted values in array', () => {
            const input = `{
    "pk_info": [
        {"pk_def": ""PRIMARY KEY (id)""},
        {"pk_def": ""PRIMARY KEY (a, b)""}
    ]
}`;
            const result = fixMetadataJson(input);
            const parsed = JSON.parse(result);
            expect(parsed.pk_info[0].pk_def).toBe('PRIMARY KEY (id)');
            expect(parsed.pk_info[1].pk_def).toBe('PRIMARY KEY (a, b)');
        });
    });

    describe('extra content removal', () => {
        it('should remove content before the first {', () => {
            const input = 'some prefix text {"name": "test"}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"name": "test"}');
        });

        it('should remove content after the last }', () => {
            const input = '{"name": "test"} some suffix text';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"name": "test"}');
        });

        it('should remove both prefix and suffix content', () => {
            const input = 'Result: {"name": "test"} -- end';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"name": "test"}');
        });
    });

    describe('string-wrapped JSON', () => {
        it('should remove surrounding double quotes', () => {
            const input = '"{\\"name\\": \\"test\\"}"';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"name": "test"}');
        });

        it('should remove surrounding single quotes', () => {
            const input = '\'{"name": "test"}\'';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"name": "test"}');
        });
    });

    describe('type conversions', () => {
        it('should convert "precision": "null" to "precision": null', () => {
            const input = '{"precision": "null", "scale": 2}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"precision": null, "scale": 2}');
        });

        it('should convert "nullable": "false" to "nullable": false', () => {
            const input = '{"nullable": "false"}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"nullable": false}');
        });

        it('should convert "nullable": "true" to "nullable": true', () => {
            const input = '{"nullable": "true"}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"nullable": true}');
        });
    });

    describe('quadruple and triple quotes', () => {
        it('should convert """" to ""', () => {
            const input = '{"comment": """"}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"comment": ""}');
        });

        it('should convert """value""" to "value"', () => {
            const input = '{"name": """test"""}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"name": "test"}');
        });
    });

    describe('real newline removal', () => {
        it('should remove actual newline characters', () => {
            const input = '{\n"name": "test"\n}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"name": "test"}');
        });
    });

    describe('escaped backslashes', () => {
        it('should preserve valid JSON with double backslashes as-is', () => {
            // Input: {"path": "C:\\\\Users"} is valid JSON (value is C:\\Users)
            // Valid JSON should be returned unchanged
            const input = '{"path": "C:\\\\\\\\Users"}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"path": "C:\\\\\\\\Users"}');
            const parsed = JSON.parse(result);
            expect(parsed.path).toBe('C:\\\\Users');
        });

        it('should convert double-escaped backslashes in stringified JSON', () => {
            // Stringified JSON with double-escaped backslashes
            const input = '{\\"path\\": \\"C:\\\\\\\\Users\\"}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"path": "C:\\\\Users"}');
            const parsed = JSON.parse(result);
            expect(parsed.path).toBe('C:\\Users');
        });
    });

    describe('complex real-world scenarios', () => {
        it('should handle MySQL smart query output with escaped quotes and newlines', () => {
            const input = `{\\n    \\"fk_info\\": [],\\n    \\"pk_info\\": [\\n        {\\n            \\"schema\\": \\"mydb\\",\\n            \\"table\\": \\"users\\",\\n            \\"column\\": \\"id\\",\\n            \\"pk_def\\": \\"PRIMARY KEY (id)\\"\\n        }\\n    ],\\n    \\"columns\\": [],\\n    \\"indexes\\": [],\\n    \\"tables\\": [],\\n    \\"views\\": [],\\n    \\"database_name\\": \\"mydb\\",\\n    \\"version\\": \\"8.0.39\\"\\n}`;

            const result = fixMetadataJson(input);
            const parsed = JSON.parse(result);

            expect(parsed.fk_info).toEqual([]);
            expect(parsed.pk_info).toHaveLength(1);
            expect(parsed.pk_info[0].schema).toBe('mydb');
            expect(parsed.pk_info[0].table).toBe('users');
            expect(parsed.database_name).toBe('mydb');
            expect(parsed.version).toBe('8.0.39');
        });

        it('should handle MySQL output with double-double quoted pk_def values', () => {
            const input = `{
    "fk_info": [],
    "pk_info": [
        {
            "schema": "mydb",
            "table": "audit_status",
            "column": "audit_type_cd",
            "pk_def": ""PRIMARY KEY (audit_type_cd, channel_type_cd)""
        }
    ],
    "columns": [],
    "indexes": [],
    "tables": [],
    "views": [],
    "database_name": "mydb",
    "version": "8.0.39"
}`;

            const result = fixMetadataJson(input);
            const parsed = JSON.parse(result);

            expect(parsed.pk_info[0].pk_def).toBe(
                'PRIMARY KEY (audit_type_cd, channel_type_cd)'
            );
        });

        it('should handle combination of escaped quotes, literal newlines, and double-double quotes', () => {
            const input = `{\\n    \\"pk_info\\": [\\n        {\\n            \\"pk_def\\": \\"\\"PRIMARY KEY (a, b)\\"\\",\\n            \\"nullable\\": \\"false\\"\\n        }\\n    ]\\n}`;

            const result = fixMetadataJson(input);
            const parsed = JSON.parse(result);

            expect(parsed.pk_info[0].pk_def).toBe('PRIMARY KEY (a, b)');
            expect(parsed.pk_info[0].nullable).toBe(false);
        });
    });

    describe('embedded quotes in values', () => {
        it('should preserve escaped quotes in Snowflake clustering key values', () => {
            const input = `{
    "indexes": [
        {
            "schema": "PUBLIC",
            "table": "snap_lot",
            "name": "snap_lot_cluster",
            "column": "LINEAR(DIV0(\\"snaplot_id\\", 500000))",
            "index_type": "CLUSTERING",
            "cardinality": 0,
            "size": 0,
            "unique": false,
            "column_position": 1,
            "direction": "asc"
        }
    ],
    "fk_info": [],
    "pk_info": [],
    "columns": [],
    "tables": [],
    "views": [],
    "database_name": "test",
    "version": "1.0"
}`;

            const result = fixMetadataJson(input);
            const parsed = JSON.parse(result);
            expect(parsed.indexes[0].column).toBe(
                'LINEAR(DIV0("snaplot_id", 500000))'
            );
        });

        it('should still fix stringified JSON with embedded quotes', () => {
            const input =
                '{\\"column\\": \\"LINEAR(DIV0(\\\\\\"snaplot_id\\\\\\", 500000))\\"}';
            const result = fixMetadataJson(input);
            const parsed = JSON.parse(result);
            expect(parsed.column).toBe('LINEAR(DIV0("snaplot_id", 500000))');
        });
    });

    describe('control characters and trailing junk', () => {
        it('should strip carriage returns inside string values', () => {
            const input =
                '{"fk_info": [], "pk_info": [{"schema": "dbo",\r"table": "Users",\r"column": "id",\r"pk_def": "PRIMARY KEY"}], "columns": [], "indexes": [], "tables": [], "views": [], "database_name": "db", "version": "1.0"}';
            const result = fixMetadataJson(input);
            expect(isStringMetadataJson(result)).toBe(true);
        });

        it('should remove trailing commas in arrays and objects', () => {
            const input = '{"a": [1, 2, 3,], "b": "x",}';
            const result = fixMetadataJson(input);
            expect(JSON.parse(result)).toEqual({ a: [1, 2, 3], b: 'x' });
        });

        it('should remove leading commas in arrays', () => {
            const input = '{"a": [, 1, 2]}';
            const result = fixMetadataJson(input);
            expect(JSON.parse(result)).toEqual({ a: [1, 2] });
        });

        it('should strip terminal box-drawing characters from copy-paste', () => {
            const input = '{   ↴│   "a": 1,   ↳"b": 2}';
            const result = fixMetadataJson(input);
            expect(JSON.parse(result)).toEqual({ a: 1, b: 2 });
        });
    });

    describe('metadata_json_to_import wrapper', () => {
        it('should extract inner JSON from object wrapper', () => {
            // This shape has unescaped quotes inside the wrapper value, making
            // the outer object invalid. We extract the inner object directly.
            const input =
                '{"metadata_json_to_import": "{"fk_info": [], "pk_info": [], "columns": [{"schema": "public", "table": "users", "name": "id", "type": "int", "ordinal_position": 1, "nullable": false}], "indexes": [], "tables": [], "views": [], "database_name": "db", "version": "1.0"}"}';
            const result = fixMetadataJson(input);
            expect(isStringMetadataJson(result)).toBe(true);
            const parsed = JSON.parse(result);
            expect(parsed.columns[0].name).toBe('id');
        });

        it('should extract inner JSON from array wrapper', () => {
            const input =
                '[{"metadata_json_to_import": "{"fk_info": [], "pk_info": [], "columns": [], "indexes": [], "tables": [], "views": [], "database_name": "test_db", "version": "8.0"}"}]';
            const result = fixMetadataJson(input);
            expect(isStringMetadataJson(result)).toBe(true);
            const parsed = JSON.parse(result);
            expect(parsed.database_name).toBe('test_db');
        });
    });

    describe('edge cases', () => {
        it('should handle empty objects', () => {
            const input = '{}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{}');
        });

        it('should handle empty arrays in objects', () => {
            const input = '{"items": []}';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"items": []}');
        });

        it('should handle whitespace-only prefix/suffix', () => {
            const input = '   {"name": "test"}   ';
            const result = fixMetadataJson(input);
            expect(result).toBe('{"name": "test"}');
        });

        it('should handle already valid JSON', () => {
            const validJson =
                '{"fk_info": [], "pk_info": [], "columns": [], "indexes": [], "tables": [], "views": [], "database_name": "test", "version": "1.0"}';
            const result = fixMetadataJson(validJson);
            expect(JSON.parse(result)).toEqual(JSON.parse(validJson));
        });
    });
});

describe('isStringMetadataJson', () => {
    it('should return true for valid database metadata JSON', () => {
        const validMetadata = JSON.stringify({
            fk_info: [],
            pk_info: [],
            columns: [],
            indexes: [],
            tables: [],
            views: [],
            database_name: 'test_db',
            version: '1.0',
        });

        expect(isStringMetadataJson(validMetadata)).toBe(true);
    });

    it('should return false for invalid JSON string', () => {
        expect(isStringMetadataJson('not json')).toBe(false);
    });

    it('should return false for valid JSON but missing required fields', () => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        const incompleteMetadata = JSON.stringify({
            fk_info: [],
            pk_info: [],
            // missing other required fields
        });

        expect(isStringMetadataJson(incompleteMetadata)).toBe(false);

        consoleErrorSpy.mockRestore();
    });

    it('should return false for empty string', () => {
        expect(isStringMetadataJson('')).toBe(false);
    });

    it('should return false for null-like values', () => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        expect(isStringMetadataJson('null')).toBe(false);
        expect(isStringMetadataJson('undefined')).toBe(false);

        consoleErrorSpy.mockRestore();
    });
});

describe('CSV-exported Snowflake output', () => {
    it('should handle Snowflake Snowsight CSV export with "" quoting', () => {
        // Simulates CSV export: outer quotes, all " escaped as ""
        const csvInput = `"{ ""fk_info"": [], ""pk_info"": [{ ""schema"": ""PUBLIC"", ""table"": ""users"", ""column"": ""id"", ""pk_def"": ""pk_users"" }], ""columns"": [{ ""schema"": ""PUBLIC"", ""table"": ""users"", ""name"": ""id"", ""type"": ""NUMBER"", ""ordinal_position"": 1, ""nullable"": false, ""character_maximum_length"": null, ""precision"": { ""precision"": 38, ""scale"": 0 }, ""default"": null, ""collation"": null, ""comment"": null, ""is_identity"": true }], ""indexes"": [], ""tables"": [{ ""schema"": ""PUBLIC"", ""table"": ""users"", ""rows"": 100, ""type"": ""BASE TABLE"", ""engine"": """", ""collation"": """", ""comment"": """" }], ""views"": [], ""database_name"": ""MY_DB"", ""version"": ""10.11.1"" }"`;

        const fixed = fixMetadataJson(csvInput);
        expect(isStringMetadataJson(fixed)).toBe(true);
        const parsed = JSON.parse(fixed);
        expect(parsed.database_name).toBe('MY_DB');
        expect(parsed.pk_info[0].schema).toBe('PUBLIC');
        expect(parsed.columns[0].type).toBe('NUMBER');
    });

    it('should handle CSV export with embedded quotes in clustering keys', () => {
        const csvInput = `"{ ""fk_info"": [], ""pk_info"": [], ""columns"": [], ""indexes"": [{ ""schema"": ""PUBLIC"", ""table"": ""snap_lot"", ""name"": ""snap_lot_cluster"", ""column"": ""LINEAR(DIV0(\\""snaplot_id\\"", 500000))"", ""index_type"": ""CLUSTERING"", ""cardinality"": 0, ""size"": 0, ""unique"": false, ""column_position"": 1, ""direction"": ""asc"" }], ""tables"": [], ""views"": [], ""database_name"": ""TEST_DB"", ""version"": ""10.11.1"" }"`;

        const fixed = fixMetadataJson(csvInput);
        const parsed = JSON.parse(fixed);
        expect(parsed.indexes[0].column).toBe(
            'LINEAR(DIV0("snaplot_id", 500000))'
        );
    });
});

describe('fixMetadataJson + isStringMetadataJson integration', () => {
    it('should fix and validate MySQL smart query output', () => {
        const brokenInput = `{\\n    \\"fk_info\\": [],\\n    \\"pk_info\\": [],\\n    \\"columns\\": [],\\n    \\"indexes\\": [],\\n    \\"tables\\": [],\\n    \\"views\\": [],\\n    \\"database_name\\": \\"testdb\\",\\n    \\"version\\": \\"8.0.39\\"\\n}`;

        const fixed = fixMetadataJson(brokenInput);
        expect(isStringMetadataJson(fixed)).toBe(true);
    });

    it('should fix and validate output with double-double quoted values', () => {
        const brokenInput = `{
    "fk_info": [],
    "pk_info": [{"schema": "db", "table": "t", "column": "c", "pk_def": ""PRIMARY KEY (a, b)""}],
    "columns": [],
    "indexes": [],
    "tables": [],
    "views": [],
    "database_name": "testdb",
    "version": "8.0"
}`;

        const fixed = fixMetadataJson(brokenInput);
        expect(isStringMetadataJson(fixed)).toBe(true);
    });
});
