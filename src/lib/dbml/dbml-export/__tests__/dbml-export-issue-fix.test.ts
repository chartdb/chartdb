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

    it('should export table and field comments to DBML', () => {
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
});
