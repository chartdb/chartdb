import type { Diagram } from '@/lib/domain';
import { DatabaseType } from '@/lib/domain';
import { describe, it, expect } from 'vitest';
import { applyDBMLChanges } from '../apply-dbml';

describe('Apply DBML Changes - single table', () => {
    it('should remove table field', () => {
        const sourceDiagram: Diagram = {
            id: 'mqqwkkodxdtm',
            name: 'Diagram 6',
            createdAt: new Date('2025-07-30T14:26:10.598Z'),
            updatedAt: new Date('2025-07-30T14:26:20.697Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'x9locbp9cvh0x4jsw0wsk0fj0',
                    name: 'table_1',
                    schema: 'public',
                    x: 282.5,
                    y: -321.25,
                    fields: [
                        {
                            id: 'qt4tyzv5kbofxm3gxlzzc1r2s',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753885573671,
                        },
                        {
                            id: 'uj0iunox0m079jtfvz2dywval',
                            name: 'field_2',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: false,
                            nullable: true,
                            primaryKey: false,
                            createdAt: 1753885580611,
                        },
                    ],
                    indexes: [],
                    color: '#42e0c0',
                    createdAt: 1753885573671,
                    isView: false,
                    order: 0,
                    parentAreaId: null,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        const targetDiagram: Diagram = {
            id: 'mqqwkkodxdtm',
            name: 'Diagram 6',
            createdAt: new Date('2025-07-30T14:26:10.598Z'),
            updatedAt: new Date('2025-07-30T14:26:20.697Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'w2twxnd7b7gmcaqldcxr8pbcc',
                    name: 'table_1',
                    schema: 'public',
                    order: 0,
                    fields: [
                        {
                            id: '4tt7pn2i5rol4hjdw2k7lctsq',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: true,
                            createdAt: 1753885706239,
                        },
                    ],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#c05dcf',
                    isView: false,
                    createdAt: 1753885706239,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
        };

        const expectedResult: Diagram = {
            id: 'mqqwkkodxdtm',
            name: 'Diagram 6',
            createdAt: new Date('2025-07-30T14:26:10.598Z'),
            updatedAt: new Date('2025-07-30T14:26:20.697Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'x9locbp9cvh0x4jsw0wsk0fj0',
                    name: 'table_1',
                    schema: 'public',
                    x: 282.5,
                    y: -321.25,
                    fields: [
                        {
                            id: 'qt4tyzv5kbofxm3gxlzzc1r2s',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753885573671,
                        },
                    ],
                    indexes: [],
                    color: '#42e0c0',
                    createdAt: 1753885573671,
                    isView: false,
                    order: 0,
                    parentAreaId: null,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        const result = applyDBMLChanges({
            sourceDiagram,
            targetDiagram,
        });

        // Check that the new field is added correctly
        expect(result).toEqual(expectedResult);
    });

    it('should add table field', () => {
        const sourceDiagram: Diagram = {
            id: 'mqqwkkodxdtm',
            name: 'Diagram 6',
            createdAt: new Date('2025-07-30T14:26:10.598Z'),
            updatedAt: new Date('2025-07-30T14:26:20.697Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'x9locbp9cvh0x4jsw0wsk0fj0',
                    name: 'table_1',
                    schema: 'public',
                    x: 282.5,
                    y: -321.25,
                    fields: [
                        {
                            id: 'qt4tyzv5kbofxm3gxlzzc1r2s',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753885573671,
                        },
                    ],
                    indexes: [],
                    color: '#42e0c0',
                    createdAt: 1753885573671,
                    isView: false,
                    order: 0,
                    parentAreaId: null,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        const targetDiagram: Diagram = {
            id: 'mqqwkkodxdtm',
            name: 'Diagram 6',
            createdAt: new Date('2025-07-30T14:26:10.598Z'),
            updatedAt: new Date('2025-07-30T14:26:20.697Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'w2twxnd7b7gmcaqldcxr8pbcc',
                    name: 'table_1',
                    schema: 'public',
                    order: 0,
                    fields: [
                        {
                            id: '4tt7pn2i5rol4hjdw2k7lctsq',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: true,
                            createdAt: 1753885706239,
                        },
                        {
                            id: 'uj0iunox0m079jtfvz2dywval',
                            name: 'field_2',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: false,
                            nullable: true,
                            primaryKey: false,
                            createdAt: 1753885580611,
                        },
                    ],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#c05dcf',
                    isView: false,
                    createdAt: 1753885706239,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
        };

        const expectedResult: Diagram = {
            id: 'mqqwkkodxdtm',
            name: 'Diagram 6',
            createdAt: new Date('2025-07-30T14:26:10.598Z'),
            updatedAt: new Date('2025-07-30T14:26:20.697Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'x9locbp9cvh0x4jsw0wsk0fj0',
                    name: 'table_1',
                    schema: 'public',
                    x: 282.5,
                    y: -321.25,
                    fields: [
                        {
                            id: 'qt4tyzv5kbofxm3gxlzzc1r2s',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753885573671,
                        },
                        {
                            id: 'uj0iunox0m079jtfvz2dywval',
                            name: 'field_2',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: false,
                            nullable: true,
                            primaryKey: false,
                            createdAt: 1753885580611,
                        },
                    ],
                    indexes: [],
                    color: '#42e0c0',
                    createdAt: 1753885573671,
                    isView: false,
                    order: 0,
                    parentAreaId: null,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        const result = applyDBMLChanges({
            sourceDiagram,
            targetDiagram,
        });

        // Check that the new field is added correctly
        expect(result).toEqual(expectedResult);
    });

    it('should not add schema if not exists', () => {
        const sourceDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T15:44:57.673Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: '8ftpn9qn0o2ddrvhzgdjro3z2',
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
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        const targetDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T15:44:57.673Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'y6l0c0d3xvqr3sppbwi9xh0vv',
                    name: 'table_1',
                    schema: 'public',
                    order: 0,
                    fields: [
                        {
                            id: '3lce6xuscxr0ao1qypkyqzrb0',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: true,
                            primaryKey: true,
                            unique: false,
                            createdAt: 1753891061125,
                        },
                    ],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#c05dcf',
                    isView: false,
                    createdAt: 1753891061125,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
        };

        const expectedResult: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T15:44:57.673Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: '8ftpn9qn0o2ddrvhzgdjro3z2',
                    name: 'table_1',
                    order: 0,
                    fields: [
                        {
                            id: 'w9wlmimvjaci2krhfb4v9bhy0',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: true,
                            primaryKey: true,
                            unique: false,
                            createdAt: 1753890297335,
                        },
                    ],
                    indexes: [],
                    x: 260,
                    y: 80,
                    color: '#4dee8a',
                    isView: false,
                    createdAt: 1753890297335,
                    parentAreaId: null,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        const result = applyDBMLChanges({
            sourceDiagram,
            targetDiagram,
        });

        // Check that the new field is added correctly
        expect(result).toEqual(expectedResult);
    });

    it('should create table', () => {
        const sourceDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T17:14:58.664Z'),
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
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        const targetDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T17:14:58.664Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'vjl2o4jtl88r5snzfb29x87o2',
                    name: 'table_1',
                    schema: 'public',
                    order: 0,
                    fields: [
                        {
                            id: 'lf8tupywalwykjtp14ecggdv5',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            createdAt: 1753896522978,
                        },
                    ],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#7175fa',
                    isView: false,
                    createdAt: 1753896522978,
                },
                {
                    id: 'jf9vve4vybt8zcnkfjnlcc3ly',
                    name: 'table_2',
                    schema: 'public',
                    order: 1,
                    fields: [
                        {
                            id: 'rl1vu81wwhz91fi05lkbqjapy',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            createdAt: 1753896522978,
                        },
                        {
                            id: '059m6dg1gf4bwqkzgnyc7bvho',
                            name: 'name',
                            type: { name: 'text', id: 'text' },
                            primaryKey: false,
                            nullable: true,
                            unique: false,
                            createdAt: 1753896522978,
                        },
                        {
                            id: 'rylo3c8or454ci1f6xovh3c0l',
                            name: 'family_name',
                            type: { name: 'text', id: 'text' },
                            primaryKey: false,
                            nullable: true,
                            unique: false,
                            createdAt: 1753896522978,
                        },
                    ],
                    indexes: [],
                    x: 300,
                    y: 0,
                    color: '#7175fa',
                    isView: false,
                    createdAt: 1753896522978,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
        };

        const expectedResult: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T17:14:58.664Z'),
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
                            primaryKey: true,
                            nullable: false,
                            unique: false,
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
                    id: 'jf9vve4vybt8zcnkfjnlcc3ly',
                    name: 'table_2',
                    schema: 'public',
                    order: 1,
                    fields: [
                        {
                            id: 'rl1vu81wwhz91fi05lkbqjapy',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            primaryKey: true,
                            nullable: false,
                            unique: false,
                            createdAt: 1753896522978,
                        },
                        {
                            id: '059m6dg1gf4bwqkzgnyc7bvho',
                            name: 'name',
                            type: { name: 'text', id: 'text' },
                            primaryKey: false,
                            nullable: true,
                            unique: false,
                            createdAt: 1753896522978,
                        },
                        {
                            id: 'rylo3c8or454ci1f6xovh3c0l',
                            name: 'family_name',
                            type: { name: 'text', id: 'text' },
                            primaryKey: false,
                            nullable: true,
                            unique: false,
                            createdAt: 1753896522978,
                        },
                    ],
                    indexes: [],
                    x: 300,
                    y: 0,
                    color: '#7175fa',
                    isView: false,
                    createdAt: 1753896522978,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        const result = applyDBMLChanges({
            sourceDiagram,
            targetDiagram,
        });

        // Check that the new field is added correctly
        expect(result).toEqual(expectedResult);
    });

    it('should preserve index name', () => {
        const sourceDiagram: Diagram = {
            id: 'mqqwkkod9jb8',
            name: 'buckle_db',
            createdAt: new Date('2025-12-04T16:00:06.463Z'),
            updatedAt: new Date('2025-12-04T16:06:49.070Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'r1rp4f64dtpifw7mub089bxy8',
                    name: 'buckle_diagrams_history',
                    schema: 'public',
                    x: 100,
                    y: 300,
                    fields: [
                        {
                            id: '0t0b4e7irmvw53w4qyz99zqm1',
                            name: 'rownum',
                            type: {
                                id: 'int',
                                name: 'int',
                            },
                            primaryKey: false,
                            unique: false,
                            nullable: false,
                            increment: true,
                            isArray: false,
                            createdAt: 1764864006454,
                        },
                        {
                            id: 'hugwwfirbk609ejryqqsvw3be',
                            name: 'id',
                            type: {
                                id: 'uuid',
                                name: 'uuid',
                            },
                            primaryKey: true,
                            unique: true,
                            nullable: false,
                            increment: false,
                            isArray: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'd9sw9l864y0s6b9bc990y7ebi',
                            name: 'action_type',
                            type: {
                                id: 'varchar',
                                name: 'varchar',
                            },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            characterMaximumLength: '50',
                            increment: false,
                            isArray: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'tref4xugo95u21hd02j3s5q67',
                            name: 'diagram_id',
                            type: {
                                id: 'uuid',
                                name: 'uuid',
                            },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            increment: false,
                            isArray: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'v3g2bkhtozhthlnhs3bhu6s4h',
                            name: 'diagram_name',
                            type: {
                                id: 'varchar',
                                name: 'varchar',
                            },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            characterMaximumLength: '2500',
                            increment: false,
                            isArray: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: '79jq9oamvjw7j5i081pplb4ii',
                            name: 'database_type',
                            type: {
                                id: 'varchar',
                                name: 'varchar',
                            },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            characterMaximumLength: '50',
                            increment: false,
                            isArray: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'dd05cmr4ntvwu5aaeir6s4bco',
                            name: 'database_edition',
                            type: {
                                id: 'varchar',
                                name: 'varchar',
                            },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            characterMaximumLength: '50',
                            increment: false,
                            isArray: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: '7589goqn7n2xk3rg5gny817bb',
                            name: 'diagram_json',
                            type: {
                                id: 'json',
                                name: 'json',
                            },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            increment: false,
                            isArray: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'i5zaobzgwbyn8g9xdcskq4qc8',
                            name: 'changed_by_user_id',
                            type: {
                                id: 'uuid',
                                name: 'uuid',
                            },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            increment: false,
                            isArray: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'u9uana25zrknsc5g7t8sinegm',
                            name: 'account_id',
                            type: {
                                id: 'uuid',
                                name: 'uuid',
                            },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            increment: false,
                            isArray: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'jy29dbbfcr4zn5l585y75tob1',
                            name: 'created_at',
                            type: {
                                id: 'timestamp',
                                name: 'timestamp',
                            },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            increment: false,
                            isArray: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'k5jdbgind50qitigvmpuk00n3',
                            name: 'updated_at',
                            type: {
                                id: 'timestamp',
                                name: 'timestamp',
                            },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            increment: false,
                            isArray: false,
                            createdAt: 1764864006455,
                        },
                    ],
                    indexes: [
                        {
                            id: 'drzp2kp4a74ceiwh0jl8fvuy7',
                            name: 'index_diagrams_history_on_changed_by_user_id',
                            unique: false,
                            fieldIds: ['i5zaobzgwbyn8g9xdcskq4qc8'],
                            createdAt: 1764864006455,
                            type: 'btree',
                        },
                        {
                            id: 'r3gc7sxg5dv8o6ur2z2jen8vf',
                            name: 'index_diagrams_history_on_diagram_id',
                            unique: false,
                            fieldIds: ['tref4xugo95u21hd02j3s5q67'],
                            createdAt: 1764864006455,
                            type: 'btree',
                        },
                        {
                            id: '7v78ps9i99hkwt086wos3dywa',
                            name: 'index_diagrams_history_on_account_id',
                            unique: false,
                            fieldIds: ['u9uana25zrknsc5g7t8sinegm'],
                            createdAt: 1764864006455,
                            type: 'btree',
                        },
                        {
                            id: 'jzv2yaggsmorqfczz6g60s22y',
                            name: 'buckle_diagrams_history_new_pkey',
                            unique: true,
                            fieldIds: ['hugwwfirbk609ejryqqsvw3be'],
                            createdAt: 1764864006455,
                            isPrimaryKey: true,
                        },
                    ],
                    color: '#8eb7ff',
                    isView: false,
                    isMaterializedView: false,
                    createdAt: 1764864006455,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
            notes: [],
        };

        const targetDiagram: Diagram = {
            id: 'mqqwkkod9jb8',
            name: 'buckle_db',
            createdAt: new Date('2025-12-04T16:00:06.463Z'),
            updatedAt: new Date('2025-12-04T16:06:49.070Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'lexrean4b8pm5lg15ppmkywsv',
                    name: 'buckle_diagrams_history',
                    schema: '',
                    order: 0,
                    fields: [
                        {
                            id: '45z2qw9van4yyowwnbs21m767',
                            name: 'rownum',
                            type: {
                                name: 'int',
                                id: 'int',
                            },
                            nullable: false,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864417835,
                            increment: true,
                        },
                        {
                            id: 'rdef7ta48s1wd1tjjoozaw1lv',
                            name: 'id',
                            type: {
                                name: 'uuid',
                                id: 'uuid',
                            },
                            nullable: false,
                            primaryKey: true,
                            unique: true,
                            createdAt: 1764864417835,
                        },
                        {
                            id: '2mthge4c8s5yt1qe6zp2slsop',
                            name: 'action_type',
                            type: {
                                name: 'varchar',
                                id: 'varchar',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864417835,
                            characterMaximumLength: '50',
                        },
                        {
                            id: '8zpgr6s9whcuf43klrbjhaamg',
                            name: 'diagram_id',
                            type: {
                                name: 'uuid',
                                id: 'uuid',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864417835,
                        },
                        {
                            id: '2rxqewro66448l3i7qo79f22d',
                            name: 'diagram_name',
                            type: {
                                name: 'varchar',
                                id: 'varchar',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864417835,
                            characterMaximumLength: '2500',
                        },
                        {
                            id: 'khvw72ifx0s1abkj70vn09gsy',
                            name: 'database_type',
                            type: {
                                name: 'varchar',
                                id: 'varchar',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864417835,
                            characterMaximumLength: '50',
                        },
                        {
                            id: 'vjle9bee169krs44qhr0xqnz8',
                            name: 'database_edition',
                            type: {
                                name: 'varchar',
                                id: 'varchar',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864417835,
                            characterMaximumLength: '50',
                        },
                        {
                            id: 'd6n910e7qnsc32lymsk02die3',
                            name: 'diagram_json',
                            type: {
                                name: 'json',
                                id: 'json',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864417835,
                        },
                        {
                            id: 'za4nagw0bx1824awleviede7b',
                            name: 'changed_by_user_id',
                            type: {
                                name: 'uuid',
                                id: 'uuid',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864417835,
                        },
                        {
                            id: 'cspop4m5whpw8ckq51aafe58a',
                            name: 'account_id',
                            type: {
                                name: 'uuid',
                                id: 'uuid',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864417835,
                        },
                        {
                            id: '2z2sixnpkv243xx7nuh2ki0fw',
                            name: 'created_at',
                            type: {
                                name: 'timestamp',
                                id: 'timestamp',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864417835,
                        },
                        {
                            id: '5jeve2jfv557ijuvwfv5j1t8m',
                            name: 'updated_at',
                            type: {
                                name: 'timestamp',
                                id: 'timestamp',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864417835,
                        },
                    ],
                    indexes: [
                        {
                            id: '3fsk7qhy0xosg4gr6dcul5t01',
                            name: 'pk_buckle_diagrams_history_id',
                            fieldIds: ['rdef7ta48s1wd1tjjoozaw1lv'],
                            unique: true,
                            isPrimaryKey: true,
                            createdAt: 1764864417836,
                        },
                        {
                            id: 'iujj3p438ueo1vpbv08szxln3',
                            name: 'index_diagrams_history_on_changed_by_user_id',
                            fieldIds: ['za4nagw0bx1824awleviede7b'],
                            unique: false,
                            createdAt: 1764864417836,
                        },
                        {
                            id: 'mq0eh23rt98izx8zhwg5rl0tf',
                            name: 'index_diagrams_history_on_diagram_id',
                            fieldIds: ['8zpgr6s9whcuf43klrbjhaamg'],
                            unique: false,
                            createdAt: 1764864417836,
                        },
                        {
                            id: '57wcn3nl6nxeaq0uuptoolo48',
                            name: 'index_diagrams_history_on_account_id',
                            fieldIds: ['cspop4m5whpw8ckq51aafe58a'],
                            unique: false,
                            createdAt: 1764864417836,
                        },
                    ],
                    x: 0,
                    y: 0,
                    color: '#8eb7ff',
                    isView: false,
                    createdAt: 1764864417836,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
            notes: [],
        };

        const expectedResult: Diagram = {
            id: 'mqqwkkod9jb8',
            name: 'buckle_db',
            createdAt: new Date('2025-12-04T16:00:06.463Z'),
            updatedAt: new Date('2025-12-04T16:06:49.070Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'r1rp4f64dtpifw7mub089bxy8',
                    name: 'buckle_diagrams_history',
                    schema: 'public',
                    x: 100,
                    y: 300,
                    fields: [
                        {
                            id: '0t0b4e7irmvw53w4qyz99zqm1',
                            name: 'rownum',
                            type: {
                                name: 'int',
                                id: 'int',
                            },
                            nullable: false,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864006454,
                            increment: true,
                        },
                        {
                            id: 'hugwwfirbk609ejryqqsvw3be',
                            name: 'id',
                            type: {
                                name: 'uuid',
                                id: 'uuid',
                            },
                            nullable: false,
                            primaryKey: true,
                            unique: true,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'd9sw9l864y0s6b9bc990y7ebi',
                            name: 'action_type',
                            type: {
                                name: 'varchar',
                                id: 'varchar',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864006455,
                            characterMaximumLength: '50',
                        },
                        {
                            id: 'tref4xugo95u21hd02j3s5q67',
                            name: 'diagram_id',
                            type: {
                                name: 'uuid',
                                id: 'uuid',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'v3g2bkhtozhthlnhs3bhu6s4h',
                            name: 'diagram_name',
                            type: {
                                name: 'varchar',
                                id: 'varchar',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864006455,
                            characterMaximumLength: '2500',
                        },
                        {
                            id: '79jq9oamvjw7j5i081pplb4ii',
                            name: 'database_type',
                            type: {
                                name: 'varchar',
                                id: 'varchar',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864006455,
                            characterMaximumLength: '50',
                        },
                        {
                            id: 'dd05cmr4ntvwu5aaeir6s4bco',
                            name: 'database_edition',
                            type: {
                                name: 'varchar',
                                id: 'varchar',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864006455,
                            characterMaximumLength: '50',
                        },
                        {
                            id: '7589goqn7n2xk3rg5gny817bb',
                            name: 'diagram_json',
                            type: {
                                name: 'json',
                                id: 'json',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'i5zaobzgwbyn8g9xdcskq4qc8',
                            name: 'changed_by_user_id',
                            type: {
                                name: 'uuid',
                                id: 'uuid',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'u9uana25zrknsc5g7t8sinegm',
                            name: 'account_id',
                            type: {
                                name: 'uuid',
                                id: 'uuid',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'jy29dbbfcr4zn5l585y75tob1',
                            name: 'created_at',
                            type: {
                                name: 'timestamp',
                                id: 'timestamp',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'k5jdbgind50qitigvmpuk00n3',
                            name: 'updated_at',
                            type: {
                                name: 'timestamp',
                                id: 'timestamp',
                            },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1764864006455,
                        },
                    ],
                    indexes: [
                        {
                            id: 'jzv2yaggsmorqfczz6g60s22y',
                            name: 'buckle_diagrams_history_new_pkey',
                            fieldIds: ['hugwwfirbk609ejryqqsvw3be'],
                            unique: true,
                            createdAt: 1764864006455,
                            isPrimaryKey: true,
                        },
                        {
                            id: 'drzp2kp4a74ceiwh0jl8fvuy7',
                            name: 'index_diagrams_history_on_changed_by_user_id',
                            fieldIds: ['i5zaobzgwbyn8g9xdcskq4qc8'],
                            unique: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: 'r3gc7sxg5dv8o6ur2z2jen8vf',
                            name: 'index_diagrams_history_on_diagram_id',
                            fieldIds: ['tref4xugo95u21hd02j3s5q67'],
                            unique: false,
                            createdAt: 1764864006455,
                        },
                        {
                            id: '7v78ps9i99hkwt086wos3dywa',
                            name: 'index_diagrams_history_on_account_id',
                            fieldIds: ['u9uana25zrknsc5g7t8sinegm'],
                            unique: false,
                            createdAt: 1764864006455,
                        },
                    ],
                    color: '#8eb7ff',
                    isView: false,
                    isMaterializedView: false,
                    createdAt: 1764864006455,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
            notes: [],
        };

        const result = applyDBMLChanges({
            sourceDiagram,
            targetDiagram,
        });

        // Check that the new field is added correctly
        expect(result).toEqual(expectedResult);
    });
});

describe('Apply DBML Changes - relationships', () => {
    it('should preserve relationships when table change', () => {
        const sourceDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
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
                    id: 'km6d66gzzsihmyg9v04ppcets',
                    name: 'table_2',
                    x: -163.75,
                    y: -5,
                    fields: [
                        {
                            id: 'a9apya3ihmzfa1ponbeuy4znf',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753899478715,
                        },
                    ],
                    indexes: [],
                    color: '#9ef07a',
                    createdAt: 1753899478715,
                    isView: false,
                    order: 1,
                    parentAreaId: null,
                },
            ],
            relationships: [
                {
                    id: 'snsf2455bwr0iegdsfwwwbzj9',
                    name: 'table_2_id_fk',
                    sourceTableId: 'km6d66gzzsihmyg9v04ppcets',
                    targetTableId: '8ftpn9qn0o2ddrvhzgdjro3zv',
                    sourceFieldId: 'a9apya3ihmzfa1ponbeuy4znf',
                    targetFieldId: 'w9wlmimvjaci2krhfb4v9bhy0',
                    sourceCardinality: 'one',
                    targetCardinality: 'one',
                    createdAt: 1753899482016,
                },
            ],
            dependencies: [],
            areas: [],
            customTypes: [],
        };
        const targetDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'l6mvwq8ynw9glgf87ysslafjv',
                    name: 'table_1',
                    schema: 'public',
                    order: 0,
                    fields: [
                        {
                            id: 'wehbg9d2y04xnt0jb2wrdm3v5',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: false,
                            createdAt: 1753899628831,
                        },
                        {
                            id: 'pg8z55iuk7ppbrb6fp9n3n2md',
                            name: 'name',
                            type: { name: 'int', id: 'int' },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1753899628831,
                        },
                    ],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#b067e9',
                    isView: false,
                    createdAt: 1753899628831,
                },
                {
                    id: '8kmv3noehjay988rp57ed69ff',
                    name: 'table_2',
                    schema: 'public',
                    order: 1,
                    fields: [
                        {
                            id: 'dqc01ynfl1gmg5nqctem2dqlq',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: false,
                            createdAt: 1753899628831,
                        },
                    ],
                    indexes: [],
                    x: 300,
                    y: 0,
                    color: '#ff9f74',
                    isView: false,
                    createdAt: 1753899628831,
                },
            ],
            relationships: [
                {
                    id: 'm7i7u56hf7xw2tfz9g5bi2w1u',
                    name: 'table_1_id_table_2_id',
                    sourceSchema: 'public',
                    targetSchema: 'public',
                    sourceTableId: 'l6mvwq8ynw9glgf87ysslafjv',
                    targetTableId: '8kmv3noehjay988rp57ed69ff',
                    sourceFieldId: 'wehbg9d2y04xnt0jb2wrdm3v5',
                    targetFieldId: 'dqc01ynfl1gmg5nqctem2dqlq',
                    sourceCardinality: 'one',
                    targetCardinality: 'one',
                    createdAt: 1753899628831,
                },
            ],
            dependencies: [],
            areas: [],
        };
        const expectedResult: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
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
                            nullable: false,
                            primaryKey: true,
                            unique: false,
                            createdAt: 1753890297335,
                        },
                        {
                            id: 'pg8z55iuk7ppbrb6fp9n3n2md',
                            name: 'name',
                            type: { name: 'int', id: 'int' },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1753899628831,
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
                    id: 'km6d66gzzsihmyg9v04ppcets',
                    name: 'table_2',
                    x: -163.75,
                    y: -5,
                    fields: [
                        {
                            id: 'a9apya3ihmzfa1ponbeuy4znf',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: false,
                            createdAt: 1753899478715,
                        },
                    ],
                    indexes: [],
                    color: '#9ef07a',
                    createdAt: 1753899478715,
                    isView: false,
                    order: 1,
                    parentAreaId: null,
                },
            ],
            relationships: [
                {
                    id: 'snsf2455bwr0iegdsfwwwbzj9',
                    name: 'table_2_id_fk',
                    sourceTableId: 'km6d66gzzsihmyg9v04ppcets',
                    targetTableId: '8ftpn9qn0o2ddrvhzgdjro3zv',
                    sourceFieldId: 'a9apya3ihmzfa1ponbeuy4znf',
                    targetFieldId: 'w9wlmimvjaci2krhfb4v9bhy0',
                    sourceCardinality: 'one',
                    targetCardinality: 'one',
                    createdAt: 1753899482016,
                },
            ],
            dependencies: [],
            areas: [],
            customTypes: [],
        };
        const result = applyDBMLChanges({
            sourceDiagram,
            targetDiagram,
        });
        // Check that the new field is added correctly
        expect(result).toEqual(expectedResult);
    });

    it('should remove relationship', () => {
        const sourceDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
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
                    id: 'km6d66gzzsihmyg9v04ppcets',
                    name: 'table_2',
                    x: -163.75,
                    y: -5,
                    fields: [
                        {
                            id: 'a9apya3ihmzfa1ponbeuy4znf',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753899478715,
                        },
                    ],
                    indexes: [],
                    color: '#9ef07a',
                    createdAt: 1753899478715,
                    isView: false,
                    order: 1,
                    parentAreaId: null,
                },
            ],
            relationships: [
                {
                    id: 'snsf2455bwr0iegdsfwwwbzj9',
                    name: 'table_2_id_fk',
                    sourceTableId: 'km6d66gzzsihmyg9v04ppcets',
                    targetTableId: '8ftpn9qn0o2ddrvhzgdjro3zv',
                    sourceFieldId: 'a9apya3ihmzfa1ponbeuy4znf',
                    targetFieldId: 'w9wlmimvjaci2krhfb4v9bhy0',
                    sourceCardinality: 'one',
                    targetCardinality: 'one',
                    createdAt: 1753899482016,
                },
            ],
            dependencies: [],
            areas: [],
            customTypes: [],
        };
        const targetDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'l6mvwq8ynw9glgf87ysslafjv',
                    name: 'table_1',
                    schema: 'public',
                    order: 0,
                    fields: [
                        {
                            id: 'wehbg9d2y04xnt0jb2wrdm3v5',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: false,
                            createdAt: 1753899628831,
                        },
                    ],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#b067e9',
                    isView: false,
                    createdAt: 1753899628831,
                },
                {
                    id: '8kmv3noehjay988rp57ed69ff',
                    name: 'table_2',
                    schema: 'public',
                    order: 1,
                    fields: [
                        {
                            id: 'dqc01ynfl1gmg5nqctem2dqlq',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: false,
                            createdAt: 1753899628831,
                        },
                    ],
                    indexes: [],
                    x: 300,
                    y: 0,
                    color: '#ff9f74',
                    isView: false,
                    createdAt: 1753899628831,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
        };
        const expectedResult: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
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
                            nullable: false,
                            primaryKey: true,
                            unique: false,
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
                    id: 'km6d66gzzsihmyg9v04ppcets',
                    name: 'table_2',
                    x: -163.75,
                    y: -5,
                    fields: [
                        {
                            id: 'a9apya3ihmzfa1ponbeuy4znf',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: false,
                            createdAt: 1753899478715,
                        },
                    ],
                    indexes: [],
                    color: '#9ef07a',
                    createdAt: 1753899478715,
                    isView: false,
                    order: 1,
                    parentAreaId: null,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
        };
        const result = applyDBMLChanges({
            sourceDiagram,
            targetDiagram,
        });
        // Check that the new field is added correctly
        expect(result).toEqual(expectedResult);
    });

    it('should add relationship', () => {
        const sourceDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'l6mvwq8ynw9glgf87ysslafjv',
                    name: 'table_1',
                    schema: 'public',
                    order: 0,
                    fields: [
                        {
                            id: 'wehbg9d2y04xnt0jb2wrdm3v5',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: false,
                            createdAt: 1753899628831,
                        },
                    ],
                    indexes: [],
                    x: 100,
                    y: 20,
                    color: '#b067e9',
                    isView: false,
                    createdAt: 1753899628831,
                },
                {
                    id: '8kmv3noehjay988rp57ed69ff',
                    name: 'table_2',
                    schema: 'public',
                    order: 1,
                    fields: [
                        {
                            id: 'dqc01ynfl1gmg5nqctem2dqlq',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: false,
                            createdAt: 1753899628831,
                        },
                    ],
                    indexes: [],
                    x: 300,
                    y: 580,
                    color: '#b067e9',
                    isView: false,
                    createdAt: 1753899628831,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
        };

        const targetDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
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
                    color: '0',
                    createdAt: 1753890297335,
                    isView: false,
                    order: 0,
                    parentAreaId: null,
                },
                {
                    id: 'km6d66gzzsihmyg9v04ppcets',
                    name: 'table_2',
                    x: -163.75,
                    y: -5,
                    fields: [
                        {
                            id: 'a9apya3ihmzfa1ponbeuy4znf',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753899478715,
                        },
                    ],
                    indexes: [],
                    color: '0',
                    createdAt: 1753899478715,
                    isView: false,
                    order: 1,
                    parentAreaId: null,
                },
            ],
            relationships: [
                {
                    id: 'snsf2455bwr0iegdsfwwwbzj9',
                    name: 'table_2_id_fk',
                    sourceTableId: 'km6d66gzzsihmyg9v04ppcets',
                    targetTableId: '8ftpn9qn0o2ddrvhzgdjro3zv',
                    sourceFieldId: 'a9apya3ihmzfa1ponbeuy4znf',
                    targetFieldId: 'w9wlmimvjaci2krhfb4v9bhy0',
                    sourceCardinality: 'one',
                    targetCardinality: 'one',
                    createdAt: 1753899482016,
                },
            ],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        const expectedResult: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'l6mvwq8ynw9glgf87ysslafjv',
                    name: 'table_1',
                    schema: 'public',
                    order: 0,
                    fields: [
                        {
                            id: 'wehbg9d2y04xnt0jb2wrdm3v5',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753899628831,
                        },
                    ],
                    indexes: [],
                    x: 100,
                    y: 20,
                    color: '#b067e9',
                    isView: false,
                    createdAt: 1753899628831,
                },
                {
                    id: '8kmv3noehjay988rp57ed69ff',
                    name: 'table_2',
                    schema: 'public',
                    order: 1,
                    fields: [
                        {
                            id: 'dqc01ynfl1gmg5nqctem2dqlq',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753899628831,
                        },
                    ],
                    indexes: [],
                    x: 300,
                    y: 580,
                    color: '#b067e9',
                    isView: false,
                    createdAt: 1753899628831,
                },
            ],
            relationships: [
                {
                    id: 'snsf2455bwr0iegdsfwwwbzj9',
                    name: 'table_2_id_fk',
                    sourceTableId: '8kmv3noehjay988rp57ed69ff',
                    targetTableId: 'l6mvwq8ynw9glgf87ysslafjv',
                    sourceFieldId: 'dqc01ynfl1gmg5nqctem2dqlq',
                    targetFieldId: 'wehbg9d2y04xnt0jb2wrdm3v5',
                    sourceCardinality: 'one',
                    targetCardinality: 'one',
                    createdAt: 1753899482016,
                },
            ],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        const result = applyDBMLChanges({
            sourceDiagram,
            targetDiagram,
        });
        // Check that the new field is added correctly
        expect(result).toEqual(expectedResult);
    });

    it('should handle cardinality update when relationship direction is reversed', () => {
        // Source has relationship: table_2.id -> table_1.id (one-to-one)
        // Target has relationship: table_1.id -> table_2.id (one-to-many) - reversed direction
        // Result should: preserve source direction but swap cardinalities from target
        const sourceDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'table1-source-id',
                    name: 'table_1',
                    schema: 'public',
                    x: 260,
                    y: 80,
                    fields: [
                        {
                            id: 'field1-source-id',
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
                },
                {
                    id: 'table2-source-id',
                    name: 'table_2',
                    schema: 'public',
                    x: -163.75,
                    y: -5,
                    fields: [
                        {
                            id: 'field2-source-id',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753899478715,
                        },
                    ],
                    indexes: [],
                    color: '#9ef07a',
                    createdAt: 1753899478715,
                    isView: false,
                    order: 1,
                },
            ],
            relationships: [
                {
                    id: 'rel-source-id',
                    name: 'table_2_id_fk',
                    sourceTableId: 'table2-source-id',
                    targetTableId: 'table1-source-id',
                    sourceFieldId: 'field2-source-id',
                    targetFieldId: 'field1-source-id',
                    sourceCardinality: 'one',
                    targetCardinality: 'one',
                    createdAt: 1753899482016,
                },
            ],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        // Target has the relationship in reverse direction with different cardinalities
        const targetDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'table1-target-id',
                    name: 'table_1',
                    schema: 'public',
                    order: 0,
                    fields: [
                        {
                            id: 'field1-target-id',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: true,
                            createdAt: 1753899628831,
                        },
                    ],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#b067e9',
                    isView: false,
                    createdAt: 1753899628831,
                },
                {
                    id: 'table2-target-id',
                    name: 'table_2',
                    schema: 'public',
                    order: 1,
                    fields: [
                        {
                            id: 'field2-target-id',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: true,
                            createdAt: 1753899628831,
                        },
                    ],
                    indexes: [],
                    x: 300,
                    y: 0,
                    color: '#ff9f74',
                    isView: false,
                    createdAt: 1753899628831,
                },
            ],
            relationships: [
                {
                    // Relationship defined in reverse direction: table_1 -> table_2
                    // with cardinalities: source='one', target='many'
                    id: 'rel-target-id',
                    name: 'table_1_id_table_2_id',
                    sourceSchema: 'public',
                    targetSchema: 'public',
                    sourceTableId: 'table1-target-id',
                    targetTableId: 'table2-target-id',
                    sourceFieldId: 'field1-target-id',
                    targetFieldId: 'field2-target-id',
                    sourceCardinality: 'one',
                    targetCardinality: 'many',
                    createdAt: 1753899628831,
                },
            ],
            dependencies: [],
            areas: [],
        };

        const result = applyDBMLChanges({
            sourceDiagram,
            targetDiagram,
        });

        // Result should preserve source's direction (table_2 -> table_1)
        // but with SWAPPED cardinalities from target
        // Target: table_1(source='one') -> table_2(target='many')
        // After swap for reverse match: table_2(source='many') -> table_1(target='one')
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships![0].id).toBe('rel-source-id');
        expect(result.relationships![0].sourceTableId).toBe('table2-source-id');
        expect(result.relationships![0].targetTableId).toBe('table1-source-id');
        expect(result.relationships![0].sourceCardinality).toBe('many');
        expect(result.relationships![0].targetCardinality).toBe('one');
    });

    it('should update cardinality when relationship direction matches (direct match)', () => {
        // Source has relationship: table_2.id -> table_1.id (one-to-one)
        // Target has same direction with different cardinalities (many-to-one)
        // Result should: preserve source IDs with updated cardinalities from target
        const sourceDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'table1-source-id',
                    name: 'table_1',
                    schema: 'public',
                    x: 260,
                    y: 80,
                    fields: [
                        {
                            id: 'field1-source-id',
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
                },
                {
                    id: 'table2-source-id',
                    name: 'table_2',
                    schema: 'public',
                    x: -163.75,
                    y: -5,
                    fields: [
                        {
                            id: 'field2-source-id',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: false,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753899478715,
                        },
                    ],
                    indexes: [],
                    color: '#9ef07a',
                    createdAt: 1753899478715,
                    isView: false,
                    order: 1,
                },
            ],
            relationships: [
                {
                    id: 'rel-source-id',
                    name: 'table_2_id_fk',
                    sourceTableId: 'table2-source-id',
                    targetTableId: 'table1-source-id',
                    sourceFieldId: 'field2-source-id',
                    targetFieldId: 'field1-source-id',
                    sourceCardinality: 'one',
                    targetCardinality: 'one',
                    createdAt: 1753899482016,
                },
            ],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        // Target has same direction with different cardinalities
        const targetDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'table1-target-id',
                    name: 'table_1',
                    schema: 'public',
                    order: 0,
                    fields: [
                        {
                            id: 'field1-target-id',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: true,
                            createdAt: 1753899628831,
                        },
                    ],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#b067e9',
                    isView: false,
                    createdAt: 1753899628831,
                },
                {
                    id: 'table2-target-id',
                    name: 'table_2',
                    schema: 'public',
                    order: 1,
                    fields: [
                        {
                            id: 'field2-target-id',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: false,
                            createdAt: 1753899628831,
                        },
                    ],
                    indexes: [],
                    x: 300,
                    y: 0,
                    color: '#ff9f74',
                    isView: false,
                    createdAt: 1753899628831,
                },
            ],
            relationships: [
                {
                    // Same direction as source: table_2 -> table_1
                    // with different cardinalities: source='many', target='one'
                    id: 'rel-target-id',
                    name: 'table_2_id_table_1_id',
                    sourceSchema: 'public',
                    targetSchema: 'public',
                    sourceTableId: 'table2-target-id',
                    targetTableId: 'table1-target-id',
                    sourceFieldId: 'field2-target-id',
                    targetFieldId: 'field1-target-id',
                    sourceCardinality: 'many',
                    targetCardinality: 'one',
                    createdAt: 1753899628831,
                },
            ],
            dependencies: [],
            areas: [],
        };

        const result = applyDBMLChanges({
            sourceDiagram,
            targetDiagram,
        });

        // Result should preserve source's IDs and direction
        // with cardinalities directly from target (no swap needed)
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships![0].id).toBe('rel-source-id');
        expect(result.relationships![0].sourceTableId).toBe('table2-source-id');
        expect(result.relationships![0].targetTableId).toBe('table1-source-id');
        expect(result.relationships![0].sourceCardinality).toBe('many');
        expect(result.relationships![0].targetCardinality).toBe('one');
    });

    it('should preserve cardinalities for new relationships', () => {
        // Source has no relationships
        // Target has a new relationship with specific cardinalities
        const sourceDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'table1-source-id',
                    name: 'orders',
                    schema: 'public',
                    x: 260,
                    y: 80,
                    fields: [
                        {
                            id: 'orders-id-source',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753890297335,
                        },
                        {
                            id: 'orders-customer-id-source',
                            name: 'customer_id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: false,
                            nullable: true,
                            primaryKey: false,
                            createdAt: 1753890297336,
                        },
                    ],
                    indexes: [],
                    color: '#4dee8a',
                    createdAt: 1753890297335,
                    isView: false,
                    order: 0,
                },
                {
                    id: 'table2-source-id',
                    name: 'customers',
                    schema: 'public',
                    x: -163.75,
                    y: -5,
                    fields: [
                        {
                            id: 'customers-id-source',
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            unique: true,
                            nullable: false,
                            primaryKey: true,
                            createdAt: 1753899478715,
                        },
                    ],
                    indexes: [],
                    color: '#9ef07a',
                    createdAt: 1753899478715,
                    isView: false,
                    order: 1,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
        };

        // Target has a new many-to-one relationship
        const targetDiagram: Diagram = {
            id: 'mqqwkkodrxxd',
            name: 'Diagram 9',
            createdAt: new Date('2025-07-30T15:44:53.967Z'),
            updatedAt: new Date('2025-07-30T18:18:02.016Z'),
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'table1-target-id',
                    name: 'orders',
                    schema: 'public',
                    order: 0,
                    fields: [
                        {
                            id: 'orders-id-target',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: true,
                            createdAt: 1753899628831,
                        },
                        {
                            id: 'orders-customer-id-target',
                            name: 'customer_id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: true,
                            primaryKey: false,
                            unique: false,
                            createdAt: 1753899628832,
                        },
                    ],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#b067e9',
                    isView: false,
                    createdAt: 1753899628831,
                },
                {
                    id: 'table2-target-id',
                    name: 'customers',
                    schema: 'public',
                    order: 1,
                    fields: [
                        {
                            id: 'customers-id-target',
                            name: 'id',
                            type: { name: 'bigint', id: 'bigint' },
                            nullable: false,
                            primaryKey: true,
                            unique: true,
                            createdAt: 1753899628831,
                        },
                    ],
                    indexes: [],
                    x: 300,
                    y: 0,
                    color: '#ff9f74',
                    isView: false,
                    createdAt: 1753899628831,
                },
            ],
            relationships: [
                {
                    // New relationship: customers.id (one) <- orders.customer_id (many)
                    id: 'new-rel-id',
                    name: 'orders_customer_id_fk',
                    sourceSchema: 'public',
                    targetSchema: 'public',
                    sourceTableId: 'table2-target-id',
                    targetTableId: 'table1-target-id',
                    sourceFieldId: 'customers-id-target',
                    targetFieldId: 'orders-customer-id-target',
                    sourceCardinality: 'one',
                    targetCardinality: 'many',
                    createdAt: 1753899628831,
                },
            ],
            dependencies: [],
            areas: [],
        };

        const result = applyDBMLChanges({
            sourceDiagram,
            targetDiagram,
        });

        // Result should have the new relationship with correct cardinalities
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships![0].sourceCardinality).toBe('one');
        expect(result.relationships![0].targetCardinality).toBe('many');
        // IDs should be mapped to source IDs
        expect(result.relationships![0].sourceTableId).toBe('table2-source-id');
        expect(result.relationships![0].targetTableId).toBe('table1-source-id');
    });
});
