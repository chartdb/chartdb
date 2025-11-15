import { describe, it, expect } from 'vitest';
import { generateDBMLFromDiagram } from '../dbml-export';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';

describe('DBML Export - Issue Fixes', () => {
    it('should merge field attributes into a single bracket instead of multiple', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'service_tenant',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'tenant_id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: 'table2',
                    name: 'users',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field2',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [
                {
                    id: 'rel1',
                    name: 'fk_users_tenant',
                    sourceTableId: 'table2',
                    sourceFieldId: 'field2',
                    targetTableId: 'table1',
                    targetFieldId: 'field1',
                    sourceCardinality: 'many',
                    targetCardinality: 'one',
                    createdAt: Date.now(),
                },
            ],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Check that inline DBML has merged attributes in a single bracket
        expect(result.inlineDbml).toContain(
            '"id" bigint [pk, not null, ref: < "service_tenant"."tenant_id"]'
        );

        // Should NOT have separate brackets like [pk, not null] [ref: < ...]
        expect(result.inlineDbml).not.toMatch(/\[pk, not null\]\s*\[ref:/);
    });

    it('should handle table names with schema using proper quoted syntax', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'users',
                    schema: 'public',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Should use quoted syntax for schema.table
        expect(result.standardDbml).toContain('Table "public"."users"');

        // Should NOT use bracket syntax like [public].[users]
        expect(result.standardDbml).not.toContain('[public].[users]');
    });

    it('should preserve schema in table references within relationships', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'tenant',
                    schema: 'service',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: 'table2',
                    name: 'users',
                    schema: 'public',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field2',
                            name: 'tenant_id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [
                {
                    id: 'rel1',
                    name: 'fk_users_tenant',
                    sourceTableId: 'table2',
                    sourceFieldId: 'field2',
                    targetTableId: 'table1',
                    targetFieldId: 'field1',
                    sourceCardinality: 'many',
                    targetCardinality: 'one',
                    createdAt: Date.now(),
                },
            ],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Check inline DBML preserves schema in references
        // The foreign key is on the users.tenant_id field, referencing service.tenant.id
        expect(result.inlineDbml).toContain('ref: < "service"."tenant"."id"');
    });

    it('should wrap table and field names with spaces in quotes instead of replacing with underscores', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'user profile',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'user id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                        {
                            id: 'field2',
                            name: 'full name',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            nullable: true,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: '255',
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [
                        {
                            id: 'idx1',
                            name: 'idx user name',
                            unique: false,
                            fieldIds: ['field2'],
                            createdAt: Date.now(),
                        },
                    ],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: 'table2',
                    name: 'order details',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field3',
                            name: 'order id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                        {
                            id: 'field4',
                            name: 'user id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [
                {
                    id: 'rel1',
                    name: 'fk order user',
                    sourceTableId: 'table2',
                    sourceFieldId: 'field4',
                    targetTableId: 'table1',
                    targetFieldId: 'field1',
                    sourceCardinality: 'many',
                    targetCardinality: 'one',
                    createdAt: Date.now(),
                },
            ],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Check that table names with spaces are wrapped in quotes
        expect(result.standardDbml).toContain('Table "user profile"');
        expect(result.standardDbml).toContain('Table "order details"');

        // Check that field names with spaces are wrapped in quotes
        expect(result.standardDbml).toContain('"user id" bigint');
        expect(result.standardDbml).toContain('"full name" varchar(255)');
        expect(result.standardDbml).toContain('"order id" bigint');

        // Check that index names with spaces are wrapped in quotes (in DBML format)
        expect(result.standardDbml).toContain('[name: "idx user name"]');

        // Check that relationship names with spaces are replaced with underscores in constraint names
        expect(result.standardDbml).toContain('Ref "fk_0_fk_order_user"');

        // Verify that spaces are NOT replaced with underscores
        expect(result.standardDbml).not.toContain('user_profile');
        expect(result.standardDbml).not.toContain('user_id');
        expect(result.standardDbml).not.toContain('full_name');
        expect(result.standardDbml).not.toContain('order_details');
        expect(result.standardDbml).not.toContain('order_id');
        expect(result.standardDbml).not.toContain('idx_user_name');

        // Check inline DBML as well - the ref is on the order details table
        expect(result.inlineDbml).toContain(
            '"user id" bigint [not null, ref: < "user profile"."user id"]'
        );
    });

    it('should export table and field comments to DBML for PostgreSQL', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'users',
                    comments: 'Stores user information',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            comments: 'Unique identifier for the user',
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                        {
                            id: 'field2',
                            name: 'email',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            nullable: false,
                            unique: true,
                            comments: 'User email address',
                            collation: null,
                            default: null,
                            characterMaximumLength: '255',
                            createdAt: Date.now(),
                        },
                        {
                            id: 'field3',
                            name: 'created_at',
                            type: { id: 'timestamp', name: 'timestamp' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: 'table2',
                    name: 'posts',
                    comments: 'Blog posts created by users',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field4',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                        {
                            id: 'field5',
                            name: 'user_id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            comments:
                                'Reference to the user who created the post',
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                        {
                            id: 'field6',
                            name: 'title',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: '500',
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [
                {
                    id: 'rel1',
                    name: 'fk_posts_user',
                    sourceTableId: 'table2',
                    sourceFieldId: 'field5',
                    targetTableId: 'table1',
                    targetFieldId: 'field1',
                    sourceCardinality: 'many',
                    targetCardinality: 'one',
                    createdAt: Date.now(),
                },
            ],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Check table comments in standard DBML
        expect(result.standardDbml).toContain('Table "users" {');
        expect(result.standardDbml).toContain(
            "Note: 'Stores user information'"
        );
        expect(result.standardDbml).toContain('Table "posts" {');
        expect(result.standardDbml).toContain(
            "Note: 'Blog posts created by users'"
        );

        // Check field comments in both inline and standard DBML
        // In inline DBML, comments should appear after field definitions
        expect(result.inlineDbml).toContain(
            '"id" bigint [pk, not null, note: \'Unique identifier for the user\']'
        );
        expect(result.inlineDbml).toContain(
            '"email" varchar(255) [unique, not null, note: \'User email address\']'
        );
        expect(result.inlineDbml).toContain(
            '"user_id" bigint [not null, note: \'Reference to the user who created the post\', ref: < "users"."id"]'
        );

        // In standard DBML, field comments should use the note attribute syntax
        expect(result.standardDbml).toContain(
            '"id" bigint [pk, not null, note: \'Unique identifier for the user\']'
        );
        expect(result.standardDbml).toContain(
            '"email" varchar(255) [unique, not null, note: \'User email address\']'
        );
        expect(result.standardDbml).toContain(
            '"user_id" bigint [not null, note: \'Reference to the user who created the post\']'
        );

        // Verify fields without comments don't have note attribute
        expect(result.standardDbml).not.toContain(
            '"created_at" timestamp [not null, note:'
        );
        expect(result.standardDbml).not.toContain(
            '"title" varchar(500) [not null, note:'
        );
    });

    it('should export table and field comments to DBML for MySQL', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.MYSQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'pl_a_cmsn',
                    comments: 'Commission table',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'mandt',
                            type: { id: 'char', name: 'char' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            comments: 'Mandant',
                            collation: null,
                            default: null,
                            characterMaximumLength: '3',
                            createdAt: Date.now(),
                        },
                        {
                            id: 'field2',
                            name: 'policy_no',
                            type: { id: 'char', name: 'char' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            comments: 'Policennummer',
                            collation: null,
                            default: null,
                            characterMaximumLength: '25',
                            createdAt: Date.now(),
                        },
                        {
                            id: 'field3',
                            name: 'validity_from',
                            type: { id: 'date', name: 'date' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            comments: 'Gültigkeitsdatum bis',
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Check table exists in DBML
        expect(result.standardDbml).toContain('Table "pl_a_cmsn" {');

        // Check table comments are preserved for MySQL
        expect(result.standardDbml).toContain("Note: 'Commission table'");

        // Check field comments are preserved with note: syntax
        expect(result.standardDbml).toContain(
            '"mandt" char(3) [pk, not null, note: \'Mandant\']'
        );
        expect(result.standardDbml).toContain(
            '"policy_no" char(25) [not null, note: \'Policennummer\']'
        );
        expect(result.standardDbml).toContain(
            '"validity_from" date [not null, note: \'Gültigkeitsdatum bis\']'
        );

        // Also check inline DBML
        expect(result.inlineDbml).toContain('Table "pl_a_cmsn" {');
        expect(result.inlineDbml).toContain("Note: 'Commission table'");
        expect(result.inlineDbml).toContain(
            '"mandt" char(3) [pk, not null, note: \'Mandant\']'
        );
        expect(result.inlineDbml).toContain(
            '"policy_no" char(25) [not null, note: \'Policennummer\']'
        );
        expect(result.inlineDbml).toContain(
            '"validity_from" date [not null, note: \'Gültigkeitsdatum bis\']'
        );
    });

    it('should handle multiline comments for MySQL tables and fields', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.MYSQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'users',
                    comments:
                        'This is a multiline\ntable comment\nwith multiple lines',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            comments: 'This is a\nmultiline field\ncomment',
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                        {
                            id: 'field2',
                            name: 'description',
                            type: { id: 'text', name: 'text' },
                            primaryKey: false,
                            nullable: true,
                            unique: false,
                            comments:
                                'Field with\n\ntabs\tand\n  spaces  \nand newlines',
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Check that multiline table comment is preserved as single line at the end
        expect(result.standardDbml).toContain('Table "users" {');
        expect(result.standardDbml).toContain(
            "Note: 'This is a multiline table comment with multiple lines'"
        );
        // Note should be at the end of the table, before closing brace
        expect(result.standardDbml).toMatch(
            /Table "users" \{[\s\S]*Note: 'This is a multiline table comment with multiple lines'\s*\}/m
        );

        // Check that multiline field comments are preserved as single line
        expect(result.standardDbml).toContain(
            '"id" bigint [pk, not null, note: \'This is a multiline field comment\']'
        );
        expect(result.standardDbml).toContain(
            '"description" text [note: \'Field with tabs and spaces and newlines\']'
        );

        // Also verify in inline DBML
        expect(result.inlineDbml).toContain(
            "Note: 'This is a multiline table comment with multiple lines'"
        );
        expect(result.inlineDbml).toContain(
            '"id" bigint [pk, not null, note: \'This is a multiline field comment\']'
        );
    });

    it('should handle multiline comments for PostgreSQL tables and fields', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'products',
                    comments: 'Product catalog\nwith detailed\ninformation',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'sku',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            comments: 'Stock Keeping Unit\nUnique identifier',
                            collation: null,
                            default: null,
                            characterMaximumLength: '50',
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Check that multiline comments are flattened for PostgreSQL too
        expect(result.standardDbml).toContain('Table "products" {');
        expect(result.standardDbml).toContain(
            "Note: 'Product catalog with detailed information'"
        );
        // Note should be at the end of the table
        expect(result.standardDbml).toMatch(
            /Table "products" \{[\s\S]*Note: 'Product catalog with detailed information'\s*\}/m
        );
        expect(result.standardDbml).toContain(
            '"sku" varchar(50) [pk, not null, note: \'Stock Keeping Unit Unique identifier\']'
        );
    });

    it('should preserve tables with same name but different schemas', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'users',
                    schema: 'public',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                        {
                            id: 'field2',
                            name: 'email',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            nullable: false,
                            unique: true,
                            collation: null,
                            default: null,
                            characterMaximumLength: '255',
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: 'table2',
                    name: 'users',
                    schema: 'auth',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field3',
                            name: 'id',
                            type: { id: 'uuid', name: 'uuid' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                        {
                            id: 'field4',
                            name: 'username',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            nullable: false,
                            unique: true,
                            collation: null,
                            default: null,
                            characterMaximumLength: '100',
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'green',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: 'table3',
                    name: 'users',
                    schema: 'public',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field5',
                            name: 'duplicate_id',
                            type: { id: 'int', name: 'int' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'red',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Both public.users and auth.users should be present
        expect(result.standardDbml).toContain('Table "public"."users"');
        expect(result.standardDbml).toContain('Table "auth"."users"');

        // Check that public.users table has email field (from table1)
        expect(result.standardDbml).toMatch(
            /Table "public"."users" \{[\s\S]*?"email" varchar\(255\)[\s\S]*?\}/
        );

        // Check that auth.users table has username field (from table2)
        expect(result.standardDbml).toMatch(
            /Table "auth"."users" \{[\s\S]*?"username" varchar\(100\)[\s\S]*?\}/
        );

        // The duplicate public.users (table3) should be removed
        // We should only see one occurrence of public.users table definition
        const publicUsersMatches = result.standardDbml.match(
            /Table "public"."users" \{/g
        );
        expect(publicUsersMatches).toHaveLength(1);

        // Verify that table3's field (duplicate_id) is not present
        expect(result.standardDbml).not.toContain('duplicate_id');
    });

    it('should correctly handle categories tables with public and public_2 schemas', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),

            tables: [
                {
                    id: 'ifi3bjrzp9mnml0l0cfhn753b',
                    name: 'table_1',
                    x: 32.625000000000085,
                    y: 169.125,
                    fields: [
                        {
                            id: 'agxg8ahs72urfqlprmt9dilxq',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753793771079,
                        },
                    ],
                    indexes: [],
                    color: '#8eb7ff',
                    createdAt: 1753793771079,
                    isView: false,
                    order: 0,
                    schema: 'public_2',
                    parentAreaId: null,
                },
                {
                    id: '3htgpyhl8elxx6jczuhbpjtla',
                    name: 'table_1',
                    x: -405.99999999999983,
                    y: -155.24999999999997,
                    fields: [
                        {
                            id: 'xxefc0h5dje2a183qdj6p6rzz',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753793805822,
                        },
                    ],
                    indexes: [],
                    color: '#4dee8a',
                    createdAt: 1753793805822,
                    isView: false,
                    order: 1,
                    schema: 'public',
                    parentAreaId: null,
                },
            ],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Should have both tables with correct schemas
        expect(result.standardDbml).toContain('Table "public"."table_1"');
        expect(result.standardDbml).toContain('Table "public_2"."table_1"');

        // Should not have both tables with the same schema
        const publicMatches = result.standardDbml.match(
            /Table "public"."table_1" \{/g
        );
        const public2Matches = result.standardDbml.match(
            /Table "public_2"."table_1" \{/g
        );

        expect(publicMatches).toHaveLength(1);
        expect(public2Matches).toHaveLength(1);
    });

    it('should only remove tables with both same schema AND same name', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'products',
                    schema: 'store',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'id',
                            type: { id: 'int', name: 'int' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: 'table2',
                    name: 'products',
                    schema: 'warehouse',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field2',
                            name: 'id',
                            type: { id: 'uuid', name: 'uuid' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'green',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: 'table3',
                    name: 'products',
                    schema: 'store',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field3',
                            name: 'duplicate_field',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            nullable: true,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: '50',
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'red',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Both store.products and warehouse.products should be present
        expect(result.standardDbml).toContain('Table "store"."products"');
        expect(result.standardDbml).toContain('Table "warehouse"."products"');

        // Count occurrences - should have exactly one of each
        const storeProductsMatches = result.standardDbml.match(
            /Table "store"."products" \{/g
        );
        const warehouseProductsMatches = result.standardDbml.match(
            /Table "warehouse"."products" \{/g
        );

        expect(storeProductsMatches).toHaveLength(1);
        expect(warehouseProductsMatches).toHaveLength(1);

        // The duplicate store.products (table3) should be removed
        expect(result.standardDbml).not.toContain('duplicate_field');
    });

    it('should export index names correctly in DBML', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'users',
                    schema: 'public',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                        {
                            id: 'field2',
                            name: 'email',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: '255',
                            createdAt: Date.now(),
                        },
                        {
                            id: 'field3',
                            name: 'created_at',
                            type: { id: 'timestamp', name: 'timestamp' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [
                        {
                            id: 'idx1',
                            name: 'idx_email',
                            unique: true,
                            fieldIds: ['field2'],
                            createdAt: Date.now(),
                        },
                        {
                            id: 'idx2',
                            name: 'idx_created_at',
                            unique: false,
                            fieldIds: ['field3'],
                            createdAt: Date.now(),
                        },
                        {
                            id: 'idx3',
                            name: 'idx_email_created',
                            unique: false,
                            fieldIds: ['field2', 'field3'],
                            createdAt: Date.now(),
                        },
                    ],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Check that table is properly formatted with schema
        expect(result.standardDbml).toContain('Table "public"."users"');

        // Check that indexes are properly formatted with names
        // Note: When a table has a schema, index names are prefixed with the schema
        expect(result.standardDbml).toContain(
            'email [unique, name: "idx_email"]'
        );
        expect(result.standardDbml).toContain(
            'created_at [name: "idx_created_at"]'
        );
        expect(result.standardDbml).toContain(
            '(email, created_at) [name: "idx_email_created"]'
        );

        // Verify proper index syntax in the table
        const indexSection = result.standardDbml.match(/Indexes \{[\s\S]*?\}/);
        expect(indexSection).toBeTruthy();
        expect(indexSection![0]).toContain('email [unique, name: "idx_email"]');
        expect(indexSection![0]).toContain(
            'created_at [name: "idx_created_at"]'
        );
        expect(indexSection![0]).toContain(
            '(email, created_at) [name: "idx_email_created"]'
        );
    });

    it('should export in the right format', () => {
        const diagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T16:11:22.554Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: '8ftpn9qn0o2ddrvhzgdjro3zv',
                    name: 'table_1',
                    x: 260,
                    y: 80,
                    fields: [
                        {
                            id: 'w9wlmimvjaci2krhfb4v9bhy0',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753890297335,
                        },
                    ],
                    indexes: [],
                    color: '#4dee8a',
                    createdAt: 1753890297335,
                    isView: false,
                    order: 0,
                    parentAreaId: null,
                },
                {
                    id: 'wofcygo4u9623oueif9k3v734',
                    name: 'table_2',
                    x: -178.62499999999994,
                    y: -244.375,
                    fields: [
                        {
                            id: '6ca6p6lnss4d2top8pjcfsli7',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753891879081,
                        },
                    ],
                    indexes: [],
                    color: '#4dee8a',
                    createdAt: 1753891879081,
                    isView: false,
                    order: 1,
                    parentAreaId: null,
                },
            ],
            relationships: [
                {
                    id: 'o5ynn1x9nxm5ipuugo690doau',
                    name: 'table_2_id_fk',
                    sourceTableId: 'wofcygo4u9623oueif9k3v734',
                    targetTableId: '8ftpn9qn0o2ddrvhzgdjro3zv',
                    sourceFieldId: '6ca6p6lnss4d2top8pjcfsli7',
                    targetFieldId: 'w9wlmimvjaci2krhfb4v9bhy0',
                    sourceCardinality: 'one',
                    targetCardinality: 'one',
                    createdAt: 1753891882554,
                },
            ],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        const result = generateDBMLFromDiagram(diagram);

        const expectedInlineDBML = `Table "table_1" {
  "id" bigint [pk, not null]
}

Table "table_2" {
  "id" bigint [pk, not null, ref: < "table_1"."id"]
}
`;

        const expectedStandardDBML = `Table "table_1" {
  "id" bigint [pk, not null]
}

Table "table_2" {
  "id" bigint [pk, not null]
}

Ref "fk_0_table_2_id_fk":"table_1"."id" < "table_2"."id"
`;

        expect(result.inlineDbml).toBe(expectedInlineDBML);
        expect(result.standardDbml).toBe(expectedStandardDBML);
    });

    it('should handle tables with multiple relationships correctly', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'users',
                    name: 'users',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'users_id',
                            name: 'id',
                            type: { id: 'integer', name: 'integer' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: 'posts',
                    name: 'posts',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'posts_id',
                            name: 'id',
                            type: { id: 'integer', name: 'integer' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                        {
                            id: 'posts_user_id',
                            name: 'user_id',
                            type: { id: 'integer', name: 'integer' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: 'reviews',
                    name: 'reviews',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'reviews_id',
                            name: 'id',
                            type: { id: 'integer', name: 'integer' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                        {
                            id: 'reviews_user_id',
                            name: 'user_id',
                            type: { id: 'integer', name: 'integer' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: 'user_activities',
                    name: 'user_activities',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'activities_id',
                            name: 'id',
                            type: { id: 'integer', name: 'integer' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                        {
                            id: 'activities_entity_id',
                            name: 'entity_id',
                            type: { id: 'integer', name: 'integer' },
                            primaryKey: false,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                        {
                            id: 'activities_type',
                            name: 'activity_type',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            nullable: true,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: '50',
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [
                {
                    id: 'rel1',
                    name: 'fk_posts_user',
                    sourceTableId: 'posts',
                    sourceFieldId: 'posts_user_id',
                    targetTableId: 'users',
                    targetFieldId: 'users_id',
                    sourceCardinality: 'many',
                    targetCardinality: 'one',
                    createdAt: Date.now(),
                },
                {
                    id: 'rel2',
                    name: 'fk_reviews_user',
                    sourceTableId: 'reviews',
                    sourceFieldId: 'reviews_user_id',
                    targetTableId: 'users',
                    targetFieldId: 'users_id',
                    sourceCardinality: 'many',
                    targetCardinality: 'one',
                    createdAt: Date.now(),
                },
                {
                    id: 'rel3',
                    name: 'fk_activities_posts',
                    sourceTableId: 'user_activities',
                    sourceFieldId: 'activities_entity_id',
                    targetTableId: 'posts',
                    targetFieldId: 'posts_id',
                    sourceCardinality: 'many',
                    targetCardinality: 'one',
                    createdAt: Date.now(),
                },
                {
                    id: 'rel4',
                    name: 'fk_activities_reviews',
                    sourceTableId: 'user_activities',
                    sourceFieldId: 'activities_entity_id',
                    targetTableId: 'reviews',
                    targetFieldId: 'reviews_id',
                    sourceCardinality: 'many',
                    targetCardinality: 'one',
                    createdAt: Date.now(),
                },
            ],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Debug output removed
        // console.log('Inline DBML:', result.inlineDbml);

        // Check standard DBML output
        expect(result.standardDbml).toContain('Table "users" {');
        expect(result.standardDbml).toContain('Table "posts" {');
        expect(result.standardDbml).toContain('Table "reviews" {');
        expect(result.standardDbml).toContain('Table "user_activities" {');

        // Check that the entity_id field in user_activities has multiple relationships in inline DBML
        // The field should have both references in a single bracket
        expect(result.inlineDbml).toContain(
            '"entity_id" integer [not null, ref: < "posts"."id", ref: < "reviews"."id"]'
        );

        // Check that standard DBML has separate Ref entries for each relationship
        expect(result.standardDbml).toContain(
            'Ref "fk_0_fk_posts_user":"users"."id" < "posts"."user_id"'
        );
        expect(result.standardDbml).toContain(
            'Ref "fk_1_fk_reviews_user":"users"."id" < "reviews"."user_id"'
        );
        expect(result.standardDbml).toContain(
            'Ref "fk_2_fk_activities_posts":"posts"."id" < "user_activities"."entity_id"'
        );
        expect(result.standardDbml).toContain(
            'Ref "fk_3_fk_activities_reviews":"reviews"."id" < "user_activities"."entity_id"'
        );

        // No automatic comment is added for fields with multiple relationships

        // Check proper formatting - closing brace should be on a new line
        expect(result.inlineDbml).toMatch(
            /Table "user_activities" \{\s*\n\s*"id".*\n\s*"entity_id".*\]\s*\n\s*"activity_type".*\n\s*\}/
        );

        // Ensure no closing brace appears on the same line as a field with inline refs
        expect(result.inlineDbml).not.toMatch(/\[.*ref:.*\]\}/);
    });

    it('should properly format closing brace when table has both indexes and inline refs', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: 'table1',
                    name: 'table_1',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field1',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [
                        {
                            id: 'index1',
                            name: 'index_1',
                            unique: false,
                            fieldIds: ['field1'],
                            createdAt: Date.now(),
                        },
                    ],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
                {
                    id: 'table2',
                    name: 'table_2',
                    x: 0,
                    y: 0,
                    fields: [
                        {
                            id: 'field2',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            collation: null,
                            default: null,
                            characterMaximumLength: null,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [],
                    color: 'blue',
                    isView: false,
                    createdAt: Date.now(),
                },
            ],
            relationships: [
                {
                    id: 'rel1',
                    name: 'table2_id_fkey',
                    sourceTableId: 'table2',
                    sourceFieldId: 'field2',
                    targetTableId: 'table1',
                    targetFieldId: 'field1',
                    sourceCardinality: 'many',
                    targetCardinality: 'one',
                    createdAt: Date.now(),
                },
            ],
        };

        const result = generateDBMLFromDiagram(diagram);

        // Check that the inline DBML has proper indentation
        // Note: indexes on primary key fields should be filtered out
        expect(result.inlineDbml).toContain(`Table "table_1" {
  "id" bigint [pk, not null]
}`);

        expect(result.inlineDbml).toContain(`Table "table_2" {
  "id" bigint [pk, not null, ref: < "table_1"."id"]
}`);

        // The issue was that it would generate:
        // Table "table_1" {
        //   "id" bigint [pk, not null]
        //
        //   Indexes {
        //     id [name: "index_1"]
        //
        // }
        // }

        // Make sure there's no malformed closing brace
        expect(result.inlineDbml).not.toMatch(/\n\s*\n\s*}\s*\n}/);
        expect(result.inlineDbml).not.toMatch(/\s+\n}/);

        // Ensure there's no extra closing brace
        const braceBalance =
            (result.inlineDbml.match(/{/g) || []).length -
            (result.inlineDbml.match(/}/g) || []).length;
        expect(braceBalance).toBe(0);
    });
});
