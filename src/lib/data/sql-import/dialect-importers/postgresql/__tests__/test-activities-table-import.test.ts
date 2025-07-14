import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Activities table import - PostgreSQL specific types', () => {
    it('should correctly parse the activities table with PostgreSQL-specific types', async () => {
        const sql = `
CREATE TABLE public.activities (
  id serial4 NOT NULL,
  user_id int4 NOT NULL,
  workflow_id int4 NULL,
  task_id int4 NULL,
  "action" character varying(50) NOT NULL,
  description text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  is_read bool DEFAULT false NOT NULL,
  CONSTRAINT activities_pkey PRIMARY KEY (id)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);

        const table = result.tables[0];
        expect(table.name).toBe('activities');
        expect(table.columns).toHaveLength(8);

        // Check each column
        const columns = table.columns;

        // id column - serial4 should become INTEGER with auto-increment
        const idCol = columns.find((c) => c.name === 'id');
        expect(idCol).toBeDefined();
        expect(idCol?.type).toBe('INTEGER');
        expect(idCol?.primaryKey).toBe(true);
        expect(idCol?.increment).toBe(true);
        expect(idCol?.nullable).toBe(false);

        // user_id column - int4 should become INTEGER
        const userIdCol = columns.find((c) => c.name === 'user_id');
        expect(userIdCol).toBeDefined();
        expect(userIdCol?.type).toBe('INTEGER');
        expect(userIdCol?.nullable).toBe(false);

        // workflow_id column - int4 NULL
        const workflowIdCol = columns.find((c) => c.name === 'workflow_id');
        expect(workflowIdCol).toBeDefined();
        expect(workflowIdCol?.type).toBe('INTEGER');
        expect(workflowIdCol?.nullable).toBe(true);

        // task_id column - int4 NULL
        const taskIdCol = columns.find((c) => c.name === 'task_id');
        expect(taskIdCol).toBeDefined();
        expect(taskIdCol?.type).toBe('INTEGER');
        expect(taskIdCol?.nullable).toBe(true);

        // action column - character varying(50)
        const actionCol = columns.find((c) => c.name === 'action');
        expect(actionCol).toBeDefined();
        expect(actionCol?.type).toBe('VARCHAR(50)');
        expect(actionCol?.nullable).toBe(false);

        // description column - text
        const descriptionCol = columns.find((c) => c.name === 'description');
        expect(descriptionCol).toBeDefined();
        expect(descriptionCol?.type).toBe('TEXT');
        expect(descriptionCol?.nullable).toBe(false);

        // created_at column - timestamp with default
        const createdAtCol = columns.find((c) => c.name === 'created_at');
        expect(createdAtCol).toBeDefined();
        expect(createdAtCol?.type).toBe('TIMESTAMP');
        expect(createdAtCol?.nullable).toBe(false);
        expect(createdAtCol?.default).toContain('NOW');

        // is_read column - bool with default
        const isReadCol = columns.find((c) => c.name === 'is_read');
        expect(isReadCol).toBeDefined();
        expect(isReadCol?.type).toBe('BOOLEAN');
        expect(isReadCol?.nullable).toBe(false);
        expect(isReadCol?.default).toBe('FALSE');
    });

    it('should handle PostgreSQL type aliases correctly', async () => {
        const sql = `
CREATE TABLE type_test (
    id serial4,
    small_id serial2,
    big_id serial8,
    int_col int4,
    small_int smallint,
    big_int int8,
    bool_col bool,
    boolean_col boolean,
    varchar_col character varying(100),
    char_col character(10),
    text_col text,
    timestamp_col timestamp,
    timestamptz_col timestamptz,
    date_col date,
    time_col time,
    json_col json,
    jsonb_col jsonb
);`;

        const result = await fromPostgres(sql);
        const table = result.tables[0];
        const cols = table.columns;

        // Check serial types
        expect(cols.find((c) => c.name === 'id')?.type).toBe('INTEGER');
        expect(cols.find((c) => c.name === 'id')?.increment).toBe(true);
        expect(cols.find((c) => c.name === 'small_id')?.type).toBe('SMALLINT');
        expect(cols.find((c) => c.name === 'small_id')?.increment).toBe(true);
        expect(cols.find((c) => c.name === 'big_id')?.type).toBe('BIGINT');
        expect(cols.find((c) => c.name === 'big_id')?.increment).toBe(true);

        // Check integer types
        expect(cols.find((c) => c.name === 'int_col')?.type).toBe('INTEGER');
        expect(cols.find((c) => c.name === 'small_int')?.type).toBe('SMALLINT');
        expect(cols.find((c) => c.name === 'big_int')?.type).toBe('BIGINT');

        // Check boolean types
        expect(cols.find((c) => c.name === 'bool_col')?.type).toBe('BOOLEAN');
        expect(cols.find((c) => c.name === 'boolean_col')?.type).toBe(
            'BOOLEAN'
        );

        // Check string types
        expect(cols.find((c) => c.name === 'varchar_col')?.type).toBe(
            'VARCHAR(100)'
        );
        expect(cols.find((c) => c.name === 'char_col')?.type).toBe('CHAR(10)');
        expect(cols.find((c) => c.name === 'text_col')?.type).toBe('TEXT');

        // Check timestamp types
        expect(cols.find((c) => c.name === 'timestamp_col')?.type).toBe(
            'TIMESTAMP'
        );
        expect(cols.find((c) => c.name === 'timestamptz_col')?.type).toBe(
            'TIMESTAMPTZ'
        );

        // Check other types
        expect(cols.find((c) => c.name === 'date_col')?.type).toBe('DATE');
        expect(cols.find((c) => c.name === 'time_col')?.type).toBe('TIME');
        expect(cols.find((c) => c.name === 'json_col')?.type).toBe('JSON');
        expect(cols.find((c) => c.name === 'jsonb_col')?.type).toBe('JSONB');
    });
});
