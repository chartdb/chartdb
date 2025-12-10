import { describe, it, expect } from 'vitest';
import { fromOracle } from '../oracle';

describe('Oracle Data Types Tests', () => {
    it('should parse character data types', async () => {
        const sql = `
            CREATE TABLE char_types (
                id NUMBER(10) PRIMARY KEY,
                var_char VARCHAR2(100),
                n_var_char NVARCHAR2(100),
                fixed_char CHAR(10),
                n_fixed_char NCHAR(10),
                large_text CLOB,
                n_large_text NCLOB,
                legacy_text LONG
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        const columns = result.tables[0].columns;

        expect(columns.find((c) => c.name === 'var_char')?.type).toBe(
            'varchar2'
        );
        expect(columns.find((c) => c.name === 'n_var_char')?.type).toBe(
            'nvarchar2'
        );
        expect(columns.find((c) => c.name === 'fixed_char')?.type).toBe('char');
        expect(columns.find((c) => c.name === 'n_fixed_char')?.type).toBe(
            'nchar'
        );
        expect(columns.find((c) => c.name === 'large_text')?.type).toBe('clob');
        expect(columns.find((c) => c.name === 'n_large_text')?.type).toBe(
            'nclob'
        );
        expect(columns.find((c) => c.name === 'legacy_text')?.type).toBe(
            'long'
        );
    });

    it('should parse numeric data types', async () => {
        const sql = `
            CREATE TABLE numeric_types (
                id NUMBER(10) PRIMARY KEY,
                plain_number NUMBER,
                precise_number NUMBER(18, 2),
                int_val INTEGER,
                small_int SMALLINT,
                float_val FLOAT,
                real_val REAL,
                bin_float BINARY_FLOAT,
                bin_double BINARY_DOUBLE
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        const columns = result.tables[0].columns;

        expect(columns.find((c) => c.name === 'plain_number')?.type).toBe(
            'number'
        );
        expect(columns.find((c) => c.name === 'precise_number')?.type).toBe(
            'number'
        );
        expect(columns.find((c) => c.name === 'int_val')?.type).toBe('integer');
        expect(columns.find((c) => c.name === 'small_int')?.type).toBe(
            'smallint'
        );
        expect(columns.find((c) => c.name === 'float_val')?.type).toBe('float');
        expect(columns.find((c) => c.name === 'real_val')?.type).toBe('real');
        expect(columns.find((c) => c.name === 'bin_float')?.type).toBe(
            'binary_float'
        );
        expect(columns.find((c) => c.name === 'bin_double')?.type).toBe(
            'binary_double'
        );
    });

    it('should parse date and time data types', async () => {
        const sql = `
            CREATE TABLE datetime_types (
                id NUMBER(10) PRIMARY KEY,
                simple_date DATE,
                time_stamp TIMESTAMP,
                time_stamp_tz TIMESTAMP,
                created_at TIMESTAMP NOT NULL
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        const columns = result.tables[0].columns;

        expect(columns.find((c) => c.name === 'simple_date')?.type).toBe(
            'date'
        );
        expect(columns.find((c) => c.name === 'time_stamp')?.type).toBe(
            'timestamp'
        );
        expect(columns.find((c) => c.name === 'created_at')?.type).toBe(
            'timestamp'
        );
    });

    it('should parse binary data types', async () => {
        const sql = `
            CREATE TABLE binary_types (
                id NUMBER(10) PRIMARY KEY,
                binary_data BLOB,
                raw_data RAW(100),
                file_ref BFILE
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        const columns = result.tables[0].columns;

        expect(columns.find((c) => c.name === 'binary_data')?.type).toBe(
            'blob'
        );
        expect(columns.find((c) => c.name === 'raw_data')?.type).toBe('raw');
        expect(columns.find((c) => c.name === 'file_ref')?.type).toBe('bfile');
    });

    it('should parse special Oracle data types', async () => {
        const sql = `
            CREATE TABLE special_types (
                id NUMBER(10) PRIMARY KEY,
                row_identifier ROWID,
                xml_content XMLTYPE,
                json_content JSON
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        const columns = result.tables[0].columns;

        expect(columns.find((c) => c.name === 'row_identifier')?.type).toBe(
            'rowid'
        );
        expect(columns.find((c) => c.name === 'xml_content')?.type).toBe(
            'xmltype'
        );
        expect(columns.find((c) => c.name === 'json_content')?.type).toBe(
            'json'
        );
    });

    it('should preserve type arguments for NUMBER types', async () => {
        const sql = `
            CREATE TABLE number_precision (
                id NUMBER(10) PRIMARY KEY,
                amount NUMBER(18, 2) NOT NULL,
                percentage NUMBER(5, 4) NOT NULL,
                quantity NUMBER(10) NOT NULL
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        const columns = result.tables[0].columns;

        const amountCol = columns.find((c) => c.name === 'amount');
        expect(amountCol?.typeArgs).toBeDefined();
        if (
            typeof amountCol?.typeArgs === 'object' &&
            !Array.isArray(amountCol.typeArgs)
        ) {
            expect(amountCol.typeArgs.precision).toBe(18);
            expect(amountCol.typeArgs.scale).toBe(2);
        }

        const percentCol = columns.find((c) => c.name === 'percentage');
        expect(percentCol?.typeArgs).toBeDefined();
        if (
            typeof percentCol?.typeArgs === 'object' &&
            !Array.isArray(percentCol.typeArgs)
        ) {
            expect(percentCol.typeArgs.precision).toBe(5);
            expect(percentCol.typeArgs.scale).toBe(4);
        }
    });

    it('should preserve type arguments for VARCHAR2 types', async () => {
        const sql = `
            CREATE TABLE varchar_lengths (
                id NUMBER(10) PRIMARY KEY,
                short_text VARCHAR2(50) NOT NULL,
                medium_text VARCHAR2(255) NOT NULL,
                long_text VARCHAR2(4000)
            );
        `;

        const result = await fromOracle(sql);

        expect(result.tables).toHaveLength(1);
        const columns = result.tables[0].columns;

        const shortCol = columns.find((c) => c.name === 'short_text');
        expect(shortCol?.typeArgs).toBeDefined();
        if (
            typeof shortCol?.typeArgs === 'object' &&
            !Array.isArray(shortCol.typeArgs)
        ) {
            expect(shortCol.typeArgs.length).toBe(50);
        }

        const longCol = columns.find((c) => c.name === 'long_text');
        expect(longCol?.typeArgs).toBeDefined();
        if (
            typeof longCol?.typeArgs === 'object' &&
            !Array.isArray(longCol.typeArgs)
        ) {
            expect(longCol.typeArgs.length).toBe(4000);
        }
    });
});
