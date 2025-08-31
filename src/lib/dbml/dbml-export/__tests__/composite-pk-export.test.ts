import { describe, it, expect } from 'vitest';
import { generateDBMLFromDiagram } from '../dbml-export';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import { generateId } from '@/lib/utils';

describe('Composite Primary Key Name Export', () => {
    it('should export composite primary key with name in DBML', () => {
        const diagram: Diagram = {
            id: generateId(),
            name: 'Test',
            databaseType: DatabaseType.POSTGRESQL,
            createdAt: new Date(),
            updatedAt: new Date(),
            tables: [
                {
                    id: generateId(),
                    name: 'users_master_table',
                    schema: 'landlord',
                    x: 0,
                    y: 0,
                    color: '#FFF',
                    isView: false,
                    createdAt: Date.now(),
                    fields: [
                        {
                            id: generateId(),
                            name: 'master_user_id',
                            type: { id: 'bigint', name: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: false,
                            createdAt: Date.now(),
                        },
                        {
                            id: generateId(),
                            name: 'tenant_id',
                            type: { id: 'bigint', name: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: false,
                            createdAt: Date.now(),
                        },
                        {
                            id: generateId(),
                            name: 'tenant_user_id',
                            type: { id: 'bigint', name: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: false,
                            createdAt: Date.now(),
                        },
                        {
                            id: generateId(),
                            name: 'enabled',
                            type: { id: 'boolean', name: 'boolean' },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: Date.now(),
                        },
                    ],
                    indexes: [
                        {
                            id: generateId(),
                            name: 'users_master_table_index_1',
                            unique: true,
                            fieldIds: ['dummy1', 'dummy2'], // Will be replaced
                            createdAt: Date.now(),
                        },
                    ],
                },
            ],
            relationships: [],
        };

        // Fix field IDs in the index and add PK index
        const table = diagram.tables![0];
        const masterUserIdField = table.fields.find(
            (f) => f.name === 'master_user_id'
        );
        const tenantIdField = table.fields.find((f) => f.name === 'tenant_id');
        const tenantUserIdField = table.fields.find(
            (f) => f.name === 'tenant_user_id'
        );
        table.indexes[0].fieldIds = [tenantIdField!.id, tenantUserIdField!.id];

        // Add the PK index with name
        table.indexes.push({
            id: generateId(),
            name: 'moshe',
            unique: true,
            isPrimaryKey: true,
            fieldIds: [
                masterUserIdField!.id,
                tenantIdField!.id,
                tenantUserIdField!.id,
            ],
            createdAt: Date.now(),
        });

        const result = generateDBMLFromDiagram(diagram);

        // Check that the DBML contains the composite PK with name
        expect(result.standardDbml).toContain(
            '(master_user_id, tenant_id, tenant_user_id) [pk, name: "moshe"]'
        );

        // Check that the unique index is also present
        expect(result.standardDbml).toContain(
            '(tenant_id, tenant_user_id) [unique, name: "users_master_table_index_1"]'
        );
    });
});
