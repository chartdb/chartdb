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
});
