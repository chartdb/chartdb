import { describe, it, expect } from 'vitest';
import { fromMySQL } from '../mysql';

describe('MySQL Core Parser Tests', () => {
    describe('Primary Key Uniqueness', () => {
        it('should mark single-column primary key field as unique', async () => {
            const sql = `
CREATE TABLE \`table_1\` (
    \`id\` BIGINT NOT NULL,
    CONSTRAINT \`pk_table_1_id\` PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
            `;

            const result = await fromMySQL(sql);

            expect(result.tables).toHaveLength(1);
            const table = result.tables[0];
            expect(table.name).toBe('table_1');

            const idColumn = table.columns.find((c) => c.name === 'id');
            expect(idColumn).toBeDefined();
            expect(idColumn?.primaryKey).toBe(true);
            expect(idColumn?.unique).toBe(true);
        });

        it('should not mark composite primary key fields as unique individually', async () => {
            const sql = `
CREATE TABLE \`table_1\` (
    \`id\` BIGINT NOT NULL,
    \`field_2\` BIGINT NOT NULL,
    CONSTRAINT \`pk_table_1_id\` PRIMARY KEY (\`id\`, \`field_2\`)
) ENGINE=InnoDB;
            `;

            const result = await fromMySQL(sql);

            expect(result.tables).toHaveLength(1);
            const table = result.tables[0];
            expect(table.name).toBe('table_1');

            const idColumn = table.columns.find((c) => c.name === 'id');
            expect(idColumn).toBeDefined();
            expect(idColumn?.primaryKey).toBe(true);
            expect(idColumn?.unique).toBe(false);

            const field2Column = table.columns.find(
                (c) => c.name === 'field_2'
            );
            expect(field2Column).toBeDefined();
            expect(field2Column?.primaryKey).toBe(true);
            expect(field2Column?.unique).toBe(false);
        });
    });
});
