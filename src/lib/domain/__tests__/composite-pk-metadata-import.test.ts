import { describe, it, expect } from 'vitest';
import { createTablesFromMetadata } from '@/lib/data/import-metadata/import/tables';
import { DatabaseType } from '../database-type';
import type { DatabaseMetadata } from '@/lib/data/import-metadata/metadata-types/database-metadata';

describe('Composite Primary Key Name from Metadata Import', () => {
    it('should capture composite primary key name from metadata indexes', () => {
        const metadata: DatabaseMetadata = {
            database_name: 'test_db',
            version: '',
            fk_info: [],
            pk_info: [
                {
                    schema: 'landlord',
                    table: 'users_master_table',
                    column: 'master_user_id',
                    pk_def: 'PRIMARY KEY (master_user_id, tenant_id, tenant_user_id)',
                },
                {
                    schema: 'landlord',
                    table: 'users_master_table',
                    column: 'tenant_id',
                    pk_def: 'PRIMARY KEY (master_user_id, tenant_id, tenant_user_id)',
                },
                {
                    schema: 'landlord',
                    table: 'users_master_table',
                    column: 'tenant_user_id',
                    pk_def: 'PRIMARY KEY (master_user_id, tenant_id, tenant_user_id)',
                },
            ],
            columns: [
                {
                    schema: 'landlord',
                    table: 'users_master_table',
                    name: 'master_user_id',
                    ordinal_position: 1,
                    type: 'bigint',
                    character_maximum_length: null,
                    precision: null,
                    nullable: false,
                    default: '',
                    collation: '',
                    comment: '',
                },
                {
                    schema: 'landlord',
                    table: 'users_master_table',
                    name: 'tenant_id',
                    ordinal_position: 2,
                    type: 'bigint',
                    character_maximum_length: null,
                    precision: null,
                    nullable: false,
                    default: '',
                    collation: '',
                    comment: '',
                },
                {
                    schema: 'landlord',
                    table: 'users_master_table',
                    name: 'tenant_user_id',
                    ordinal_position: 3,
                    type: 'bigint',
                    character_maximum_length: null,
                    precision: null,
                    nullable: false,
                    default: '',
                    collation: '',
                    comment: '',
                },
                {
                    schema: 'landlord',
                    table: 'users_master_table',
                    name: 'enabled',
                    ordinal_position: 4,
                    type: 'boolean',
                    character_maximum_length: null,
                    precision: null,
                    nullable: true,
                    default: '',
                    collation: '',
                    comment: '',
                },
            ],
            indexes: [
                // The composite PK index named "moshe"
                {
                    schema: 'landlord',
                    table: 'users_master_table',
                    name: 'moshe',
                    column: 'master_user_id',
                    index_type: 'btree',
                    cardinality: 0,
                    size: 8192,
                    unique: true,
                    column_position: 1,
                    direction: 'asc',
                },
                {
                    schema: 'landlord',
                    table: 'users_master_table',
                    name: 'moshe',
                    column: 'tenant_id',
                    index_type: 'btree',
                    cardinality: 0,
                    size: 8192,
                    unique: true,
                    column_position: 2,
                    direction: 'asc',
                },
                {
                    schema: 'landlord',
                    table: 'users_master_table',
                    name: 'moshe',
                    column: 'tenant_user_id',
                    index_type: 'btree',
                    cardinality: 0,
                    size: 8192,
                    unique: true,
                    column_position: 3,
                    direction: 'asc',
                },
                // Another unique index
                {
                    schema: 'landlord',
                    table: 'users_master_table',
                    name: 'users_master_table_index_1',
                    column: 'tenant_id',
                    index_type: 'btree',
                    cardinality: 0,
                    size: 8192,
                    unique: true,
                    column_position: 1,
                    direction: 'asc',
                },
                {
                    schema: 'landlord',
                    table: 'users_master_table',
                    name: 'users_master_table_index_1',
                    column: 'tenant_user_id',
                    index_type: 'btree',
                    cardinality: 0,
                    size: 8192,
                    unique: true,
                    column_position: 2,
                    direction: 'asc',
                },
            ],
            tables: [
                {
                    schema: 'landlord',
                    table: 'users_master_table',
                    rows: 0,
                    type: 'BASE TABLE',
                    engine: '',
                    collation: '',
                    comment: '',
                },
            ],
            views: [],
            custom_types: [],
        };

        const tables = createTablesFromMetadata({
            databaseMetadata: metadata,
            databaseType: DatabaseType.POSTGRESQL,
        });

        expect(tables).toHaveLength(1);
        const table = tables[0];

        // Check that the composite PK name was captured as "moshe" in the PK index
        const pkIndex = table.indexes.find((idx) => idx.isPrimaryKey);
        expect(pkIndex).toBeDefined();
        expect(pkIndex!.name).toBe('moshe');

        // Check that primary key fields are marked correctly
        const pkFields = table.fields.filter((f) => f.primaryKey);
        expect(pkFields).toHaveLength(3);
        expect(pkFields.map((f) => f.name).sort()).toEqual([
            'master_user_id',
            'tenant_id',
            'tenant_user_id',
        ]);

        // Check that we have both the PK index and the unique index
        expect(table.indexes).toHaveLength(2);
        const uniqueIndex = table.indexes.find((idx) => !idx.isPrimaryKey);
        expect(uniqueIndex!.name).toBe('users_master_table_index_1');
    });
});
