import { describe, it, expect } from 'vitest';
import { exportPostgreSQLToMySQL } from '../export-per-type/postgresql-to-mysql';
import { exportPostgreSQLToMSSQL } from '../export-per-type/postgresql-to-mssql';
import { exportBaseSQL } from '../export-sql-script';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import {
    type DBCustomType,
    DBCustomTypeKind,
} from '@/lib/domain/db-custom-type';

describe('Cross-Dialect Export Tests', () => {
    let idCounter = 0;
    const testId = () => `test-id-${++idCounter}`;
    const testTime = Date.now();

    const createField = (overrides: Partial<DBField>): DBField =>
        ({
            id: testId(),
            name: 'field',
            type: { id: 'text', name: 'text' },
            primaryKey: false,
            nullable: true,
            unique: false,
            createdAt: testTime,
            ...overrides,
        }) as DBField;

    const createTable = (overrides: Partial<DBTable>): DBTable =>
        ({
            id: testId(),
            name: 'table',
            fields: [],
            indexes: [],
            createdAt: testTime,
            x: 0,
            y: 0,
            width: 200,
            ...overrides,
        }) as DBTable;

    const createDiagram = (overrides: Partial<Diagram>): Diagram =>
        ({
            id: testId(),
            name: 'diagram',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [],
            relationships: [],
            createdAt: testTime,
            updatedAt: testTime,
            ...overrides,
        }) as Diagram;

    describe('PostgreSQL to MySQL Export', () => {
        describe('Type Conversions', () => {
            it('should convert basic integer types', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'users',
                            fields: [
                                createField({
                                    name: 'id',
                                    type: { id: 'int', name: 'int' },
                                    primaryKey: true,
                                    nullable: false,
                                }),
                                createField({
                                    name: 'count',
                                    type: { id: 'bigint', name: 'bigint' },
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('`id` INT NOT NULL');
                expect(result).toContain('`count` BIGINT');
            });

            it('should convert boolean to TINYINT(1)', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'flags',
                            fields: [
                                createField({
                                    name: 'is_active',
                                    type: { id: 'boolean', name: 'boolean' },
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('TINYINT(1)');
            });

            it('should convert UUID to CHAR(36) with comment', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'entities',
                            fields: [
                                createField({
                                    name: 'external_id',
                                    type: { id: 'uuid', name: 'uuid' },
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('CHAR(36)');
                expect(result).toContain('-- Was: uuid');
            });

            it('should convert JSONB to JSON with inline comment', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'documents',
                            fields: [
                                createField({
                                    name: 'data',
                                    type: { id: 'jsonb', name: 'jsonb' },
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('JSON');
                expect(result).toContain('-- Was: jsonb');
            });

            it('should convert array types to JSON', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'posts',
                            fields: [
                                createField({
                                    name: 'tags',
                                    type: { id: 'text[]', name: 'text[]' },
                                    isArray: true,
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('JSON');
                expect(result).toContain('PostgreSQL array');
            });

            it('should convert SERIAL to INT AUTO_INCREMENT', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'items',
                            fields: [
                                createField({
                                    name: 'id',
                                    type: { id: 'serial', name: 'serial' },
                                    primaryKey: true,
                                    nullable: false,
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('INT');
                expect(result).toContain('AUTO_INCREMENT');
            });

            it('should convert nextval default to AUTO_INCREMENT', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'items',
                            fields: [
                                createField({
                                    name: 'id',
                                    type: { id: 'int', name: 'int' },
                                    primaryKey: true,
                                    nullable: false,
                                    default:
                                        "nextval('items_id_seq'::regclass)",
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('AUTO_INCREMENT');
                expect(result).not.toContain('nextval');
            });

            it('should convert timestamptz to DATETIME with warning', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'events',
                            fields: [
                                createField({
                                    name: 'occurred_at',
                                    type: {
                                        id: 'timestamptz',
                                        name: 'timestamptz',
                                    },
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('DATETIME');
                expect(result).toContain('-- Was: timestamptz');
            });

            it('should convert inet to VARCHAR(45)', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'connections',
                            fields: [
                                createField({
                                    name: 'ip_address',
                                    type: { id: 'inet', name: 'inet' },
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('VARCHAR(45)');
            });
        });

        describe('ENUM Types', () => {
            it('should convert ENUM to VARCHAR with values comment', () => {
                const customTypes: DBCustomType[] = [
                    {
                        id: testId(),
                        name: 'status_type',
                        kind: DBCustomTypeKind.enum,
                        values: ['pending', 'active', 'closed'],
                    },
                ];

                const diagram = createDiagram({
                    customTypes,
                    tables: [
                        createTable({
                            name: 'tickets',
                            fields: [
                                createField({
                                    name: 'status',
                                    type: {
                                        id: 'status_type',
                                        name: 'status_type',
                                    },
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('VARCHAR');
                expect(result).toContain("'pending', 'active', 'closed'");
            });
        });

        describe('Schema Handling', () => {
            it('should convert PostgreSQL schema to MySQL database', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'users',
                            schema: 'app',
                            fields: [
                                createField({
                                    name: 'id',
                                    type: { id: 'int', name: 'int' },
                                    primaryKey: true,
                                    nullable: false,
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('CREATE DATABASE IF NOT EXISTS `app`');
                expect(result).toContain('`app`.`users`');
            });
        });

        describe('Default Values', () => {
            it('should convert now() to CURRENT_TIMESTAMP', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'logs',
                            fields: [
                                createField({
                                    name: 'created_at',
                                    type: {
                                        id: 'timestamp',
                                        name: 'timestamp',
                                    },
                                    default: 'now()',
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('DEFAULT CURRENT_TIMESTAMP');
            });

            it('should convert gen_random_uuid() to UUID()', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'entities',
                            fields: [
                                createField({
                                    name: 'id',
                                    type: { id: 'uuid', name: 'uuid' },
                                    default: 'gen_random_uuid()',
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('DEFAULT (UUID())');
            });
        });

        describe('Warnings Header', () => {
            it('should include conversion notes header', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'test',
                            fields: [
                                createField({
                                    name: 'data',
                                    type: { id: 'jsonb', name: 'jsonb' },
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMySQL({ diagram });

                expect(result).toContain('-- PostgreSQL to MySQL conversion');
                expect(result).toContain('-- Generated by ChartDB');
            });
        });
    });

    describe('PostgreSQL to SQL Server Export', () => {
        describe('Type Conversions', () => {
            it('should convert boolean to BIT', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'flags',
                            fields: [
                                createField({
                                    name: 'is_active',
                                    type: { id: 'boolean', name: 'boolean' },
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMSSQL({ diagram });

                expect(result).toContain('BIT');
            });

            it('should convert UUID to UNIQUEIDENTIFIER', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'entities',
                            fields: [
                                createField({
                                    name: 'id',
                                    type: { id: 'uuid', name: 'uuid' },
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMSSQL({ diagram });

                expect(result).toContain('UNIQUEIDENTIFIER');
            });

            it('should convert TEXT to NVARCHAR(MAX)', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'articles',
                            fields: [
                                createField({
                                    name: 'content',
                                    type: { id: 'text', name: 'text' },
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMSSQL({ diagram });

                expect(result).toContain('NVARCHAR(MAX)');
            });

            it('should convert SERIAL to INT IDENTITY', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'items',
                            fields: [
                                createField({
                                    name: 'id',
                                    type: { id: 'serial', name: 'serial' },
                                    primaryKey: true,
                                    nullable: false,
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMSSQL({ diagram });

                expect(result).toContain('INT');
                expect(result).toContain('IDENTITY(1,1)');
            });

            it('should convert timestamptz to DATETIMEOFFSET', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'events',
                            fields: [
                                createField({
                                    name: 'occurred_at',
                                    type: {
                                        id: 'timestamptz',
                                        name: 'timestamptz',
                                    },
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMSSQL({ diagram });

                expect(result).toContain('DATETIMEOFFSET');
            });

            it('should convert JSON/JSONB to NVARCHAR(MAX)', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'documents',
                            fields: [
                                createField({
                                    name: 'data',
                                    type: { id: 'jsonb', name: 'jsonb' },
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMSSQL({ diagram });

                expect(result).toContain('NVARCHAR(MAX)');
            });
        });

        describe('Default Values', () => {
            it('should convert now() to GETDATE()', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'logs',
                            fields: [
                                createField({
                                    name: 'created_at',
                                    type: {
                                        id: 'timestamp',
                                        name: 'timestamp',
                                    },
                                    default: 'now()',
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMSSQL({ diagram });

                expect(result).toContain('DEFAULT GETDATE()');
            });

            it('should convert gen_random_uuid() to NEWID()', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'entities',
                            fields: [
                                createField({
                                    name: 'id',
                                    type: { id: 'uuid', name: 'uuid' },
                                    default: 'gen_random_uuid()',
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMSSQL({ diagram });

                expect(result).toContain('DEFAULT NEWID()');
            });

            it('should convert true/false to 1/0', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'settings',
                            fields: [
                                createField({
                                    name: 'is_enabled',
                                    type: { id: 'boolean', name: 'boolean' },
                                    default: 'true',
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMSSQL({ diagram });

                expect(result).toContain('DEFAULT 1');
            });
        });

        describe('Schema Handling', () => {
            it('should create SQL Server schema', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'users',
                            schema: 'app',
                            fields: [
                                createField({
                                    name: 'id',
                                    type: { id: 'int', name: 'int' },
                                    primaryKey: true,
                                    nullable: false,
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMSSQL({ diagram });

                expect(result).toContain(
                    "SELECT * FROM sys.schemas WHERE name = 'app'"
                );
                expect(result).toContain('[app].[users]');
            });
        });

        describe('Comments via Extended Properties', () => {
            it('should add table comments as extended properties', () => {
                const diagram = createDiagram({
                    tables: [
                        createTable({
                            name: 'users',
                            comments: 'User accounts table',
                            fields: [
                                createField({
                                    name: 'id',
                                    type: { id: 'int', name: 'int' },
                                    primaryKey: true,
                                    nullable: false,
                                }),
                            ],
                        }),
                    ],
                });

                const result = exportPostgreSQLToMSSQL({ diagram });

                expect(result).toContain('sp_addextendedproperty');
                expect(result).toContain('User accounts table');
            });
        });
    });

    describe('Export Routing via exportBaseSQL', () => {
        it('should route PostgreSQL to MySQL through deterministic exporter', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        name: 'test',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                            }),
                        ],
                    }),
                ],
            });

            const result = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.MYSQL,
            });

            // Should use deterministic export (CHAR(36) for UUID)
            expect(result).toContain('CHAR(36)');
            expect(result).toContain('-- PostgreSQL to MySQL conversion');
        });

        it('should route PostgreSQL to SQL Server through deterministic exporter', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        name: 'test',
                        fields: [
                            createField({
                                name: 'id',
                                type: { id: 'uuid', name: 'uuid' },
                            }),
                        ],
                    }),
                ],
            });

            const result = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.SQL_SERVER,
            });

            // Should use deterministic export (UNIQUEIDENTIFIER for UUID)
            expect(result).toContain('UNIQUEIDENTIFIER');
            expect(result).toContain('-- PostgreSQL to SQL Server conversion');
        });

        it('should route PostgreSQL to MariaDB through MySQL deterministic exporter', () => {
            const diagram = createDiagram({
                databaseType: DatabaseType.POSTGRESQL,
                tables: [
                    createTable({
                        name: 'test',
                        fields: [
                            createField({
                                name: 'active',
                                type: { id: 'boolean', name: 'boolean' },
                            }),
                        ],
                    }),
                ],
            });

            const result = exportBaseSQL({
                diagram,
                targetDatabaseType: DatabaseType.MARIADB,
            });

            // Should use MySQL-style conversion (TINYINT(1) for boolean)
            expect(result).toContain('TINYINT(1)');
        });
    });

    describe('Index Handling', () => {
        it('should downgrade GIN index to BTREE for MySQL', () => {
            const fieldId = testId();
            const diagram = createDiagram({
                tables: [
                    createTable({
                        name: 'documents',
                        fields: [
                            createField({
                                id: fieldId,
                                name: 'data',
                                type: { id: 'jsonb', name: 'jsonb' },
                            }),
                        ],
                        indexes: [
                            {
                                id: testId(),
                                name: 'idx_data',
                                unique: false,
                                fieldIds: [fieldId],
                                createdAt: testTime,
                                type: 'gin',
                            },
                        ],
                    }),
                ],
            });

            const result = exportPostgreSQLToMySQL({ diagram });

            expect(result).toContain('CREATE INDEX');
            expect(result).toContain('-- GIN index downgraded to BTREE');
        });

        it('should add prefix length for JSON indexes in MySQL', () => {
            const fieldId = testId();
            const diagram = createDiagram({
                tables: [
                    createTable({
                        name: 'documents',
                        fields: [
                            createField({
                                id: fieldId,
                                name: 'data',
                                type: { id: 'jsonb', name: 'jsonb' },
                            }),
                        ],
                        indexes: [
                            {
                                id: testId(),
                                name: 'idx_data',
                                unique: false,
                                fieldIds: [fieldId],
                                createdAt: testTime,
                            },
                        ],
                    }),
                ],
            });

            const result = exportPostgreSQLToMySQL({ diagram });

            // JSON columns in MySQL need prefix length for indexing
            expect(result).toContain('(255)');
        });
    });

    describe('Foreign Key Handling', () => {
        it('should generate foreign keys with MySQL syntax', () => {
            const sourceFieldId = testId();
            const targetFieldId = testId();
            const sourceTableId = testId();
            const targetTableId = testId();

            const diagram = createDiagram({
                tables: [
                    createTable({
                        id: sourceTableId,
                        name: 'orders',
                        fields: [
                            createField({
                                id: sourceFieldId,
                                name: 'user_id',
                                type: { id: 'int', name: 'int' },
                            }),
                        ],
                    }),
                    createTable({
                        id: targetTableId,
                        name: 'users',
                        fields: [
                            createField({
                                id: targetFieldId,
                                name: 'id',
                                type: { id: 'int', name: 'int' },
                                primaryKey: true,
                            }),
                        ],
                    }),
                ],
                relationships: [
                    {
                        id: testId(),
                        name: 'fk_orders_users',
                        sourceTableId,
                        targetTableId,
                        sourceFieldId,
                        targetFieldId,
                        sourceCardinality: 'many',
                        targetCardinality: 'one',
                        createdAt: testTime,
                    },
                ],
            });

            const result = exportPostgreSQLToMySQL({ diagram });

            expect(result).toContain('ALTER TABLE');
            expect(result).toContain('ADD CONSTRAINT');
            expect(result).toContain('FOREIGN KEY');
            expect(result).toContain('REFERENCES');
        });
    });
});
