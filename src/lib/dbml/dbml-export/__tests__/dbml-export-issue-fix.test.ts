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
});
