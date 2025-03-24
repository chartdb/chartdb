import {
    exportFieldComment,
    isFunction,
    isKeyword,
    strHasQuotes,
} from './common';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import { DatabaseEdition } from '@/lib/domain/database-edition';

function parseSQLiteDefault(field: DBField): string {
    if (!field.default) {
        return '';
    }

    const defaultValue = field.default.trim();

    // Handle specific SQLite default values
    if (
        defaultValue.toLowerCase() === 'now()' ||
        defaultValue.toLowerCase() === 'current_timestamp'
    ) {
        return 'CURRENT_TIMESTAMP';
    }

    // Handle SQLite auto-increment
    if (
        defaultValue.toLowerCase().includes('identity') ||
        defaultValue.toLowerCase().includes('autoincrement') ||
        defaultValue.includes('nextval')
    ) {
        return ''; // SQLite handles this differently with INTEGER PRIMARY KEY AUTOINCREMENT
    }

    // If it's a function call, convert to SQLite equivalents
    if (isFunction(defaultValue)) {
        // Map common PostgreSQL/MSSQL functions to SQLite equivalents
        if (
            defaultValue.toLowerCase().includes('newid()') ||
            defaultValue.toLowerCase().includes('uuid()')
        ) {
            return 'lower(hex(randomblob(16)))';
        }

        // For functions we can't translate, return as is (SQLite might not support them)
        return defaultValue;
    }

    // If it's a keyword, keep it as is
    if (isKeyword(defaultValue)) {
        return defaultValue;
    }

    // If it already has quotes, keep it as is
    if (strHasQuotes(defaultValue)) {
        return defaultValue;
    }

    // If it's a number, keep it as is
    if (/^-?\d+(\.\d+)?$/.test(defaultValue)) {
        return defaultValue;
    }

    // For other cases, add quotes
    return `'${defaultValue.replace(/'/g, "''")}'`;
}

// Map problematic types to SQLite compatible types
function mapSQLiteType(typeName: string, isPrimaryKey: boolean): string {
    typeName = typeName.toLowerCase();

    // Special handling for primary key integer columns (autoincrement requires INTEGER PRIMARY KEY)
    if (isPrimaryKey && (typeName === 'integer' || typeName === 'int')) {
        return 'INTEGER'; // Must be uppercase for SQLite to recognize it for AUTOINCREMENT
    }

    // Map common types to SQLite's simplified type system
    switch (typeName) {
        case 'int':
        case 'smallint':
        case 'tinyint':
        case 'mediumint':
        case 'bigint':
            return 'INTEGER';

        case 'decimal':
        case 'numeric':
        case 'float':
        case 'double':
        case 'real':
            return 'REAL';

        case 'char':
        case 'nchar':
        case 'varchar':
        case 'nvarchar':
        case 'text':
        case 'ntext':
        case 'character varying':
        case 'character':
            return 'TEXT';

        case 'date':
        case 'datetime':
        case 'timestamp':
        case 'datetime2':
            return 'TEXT'; // SQLite doesn't have dedicated date types

        case 'blob':
        case 'binary':
        case 'varbinary':
        case 'image':
            return 'BLOB';

        case 'bit':
        case 'boolean':
            return 'INTEGER'; // SQLite doesn't have a boolean type, use INTEGER

        case 'user-defined':
        case 'json':
        case 'jsonb':
            return 'TEXT'; // Store as JSON text

        case 'array':
            return 'TEXT'; // Store as serialized array text

        case 'geometry':
        case 'geography':
            return 'BLOB'; // Store spatial data as BLOB in SQLite
    }

    // If type has array notation (ends with []), treat as TEXT
    if (typeName.endsWith('[]')) {
        return 'TEXT';
    }

    // For any other types, default to TEXT
    return typeName;
}

export function exportSQLite(diagram: Diagram): string {
    if (!diagram.tables || !diagram.relationships) {
        return '';
    }

    const tables = diagram.tables;
    const relationships = diagram.relationships;

    // Check if this is a Cloudflare D1 diagram
    const isCloudflareD1 =
        diagram.databaseEdition === DatabaseEdition.SQLITE_CLOUDFLARE_D1;

    // Start SQL script - SQLite doesn't use schemas, so we skip schema creation
    let sqlScript = isCloudflareD1
        ? '-- Cloudflare D1 database export\n\n'
        : '-- SQLite database export\n\n';

    // Begin transaction for faster import
    sqlScript += 'BEGIN TRANSACTION;\n\n';

    // SQLite doesn't have sequences, so we skip sequence creation

    // SQLite system tables that should be skipped
    const sqliteSystemTables = [
        'sqlite_sequence',
        'sqlite_stat1',
        'sqlite_stat2',
        'sqlite_stat3',
        'sqlite_stat4',
        'sqlite_master',
    ];

    // Generate table creation SQL
    sqlScript += tables
        .map((table: DBTable) => {
            // Skip system tables and views (views are handled separately)
            if (
                sqliteSystemTables.includes(table.name.toLowerCase()) ||
                table.isView
            ) {
                return '';
            }

            let createTableSQL = `CREATE TABLE IF NOT EXISTS "${table.name}" (\n`;

            // Generate column definitions
            const columnDefinitions = table.fields.map((field: DBField) => {
                let columnDef = `    "${field.name}" `;

                // Map field type to appropriate SQLite type
                columnDef += mapSQLiteType(
                    field.type.name,
                    field.primaryKey,
                    isCloudflareD1
                );

                // Add PRIMARY KEY constraint if needed
                if (field.primaryKey) {
                    columnDef += ' PRIMARY KEY';
                    // For INTEGER PRIMARY KEY fields, add AUTOINCREMENT if it's an auto-incrementing field
                    if (
                        (field.type.name.toLowerCase() === 'integer' ||
                            field.type.name.toLowerCase() === 'int') &&
                        field.default &&
                        (field.default.toLowerCase().includes('identity') ||
                            field.default
                                .toLowerCase()
                                .includes('autoincrement') ||
                            field.default.includes('nextval'))
                    ) {
                        columnDef += ' AUTOINCREMENT';
                    }
                }

                // Add NOT NULL constraint if not nullable
                if (!field.nullable && !field.primaryKey) {
                    // PRIMARY KEY implies NOT NULL
                    columnDef += ' NOT NULL';
                }

                // Add UNIQUE constraint if marked as unique
                if (field.unique && !field.primaryKey) {
                    // PRIMARY KEY implies UNIQUE
                    columnDef += ' UNIQUE';
                }

                // Add DEFAULT values if specified
                if (
                    field.default &&
                    !field.default.toLowerCase().includes('autoincrement')
                ) {
                    const defaultValue = parseSQLiteDefault(field);
                    if (defaultValue) {
                        columnDef += ` DEFAULT ${defaultValue}`;
                    }
                }

                // Add any field comments
                if (field.comments) {
                    columnDef += ` ${exportFieldComment(field.comments)}`;
                }

                return columnDef;
            });

            // Add all foreign key constraints in the CREATE TABLE statement
            // SQLite requires foreign keys to be defined in the CREATE TABLE
            const foreignKeyConstraints = relationships
                .filter(
                    (r: DBRelationship) =>
                        r.sourceTableId === table.id && !table.isView
                )
                .map((r: DBRelationship) => {
                    const targetTable = tables.find(
                        (t) => t.id === r.targetTableId
                    );
                    const sourceField = table.fields.find(
                        (f) => f.id === r.sourceFieldId
                    );
                    const targetField = targetTable?.fields.find(
                        (f) => f.id === r.targetFieldId
                    );

                    if (
                        !targetTable ||
                        !sourceField ||
                        !targetField ||
                        targetTable.isView
                    ) {
                        return '';
                    }

                    return `    FOREIGN KEY ("${sourceField.name}") REFERENCES "${targetTable.name}" ("${targetField.name}")`;
                })
                .filter(Boolean); // Remove empty strings

            // Combine column definitions with foreign key constraints
            createTableSQL += [
                ...columnDefinitions,
                ...foreignKeyConstraints,
            ].join(',\n');

            createTableSQL += '\n);\n';

            // Add any table comments
            if (table.comments) {
                createTableSQL += `-- Table comment: ${table.comments.replace(
                    /\n/g,
                    '\n-- '
                )}\n`;
            }

            // Add CREATE INDEX statements for any indexes
            if (table.indexes && table.indexes.length > 0) {
                createTableSQL += '\n';
                createTableSQL += table.indexes
                    .map((index) => {
                        const fieldNames = index.fieldIds
                            .map((fieldId) => {
                                const field = table.fields.find(
                                    (f) => f.id === fieldId
                                );
                                return field ? `"${field.name}"` : null;
                            })
                            .filter(Boolean) // Remove nulls
                            .join(', ');

                        if (!fieldNames) {
                            return '';
                        }

                        return `CREATE ${
                            index.unique ? 'UNIQUE ' : ''
                        }INDEX IF NOT EXISTS "${index.name}" ON "${
                            table.name
                        }" (${fieldNames});`;
                    })
                    .join('\n');
            }

            return createTableSQL;
        })
        .filter(Boolean) // Remove empty strings (views)
        .join('\n');

    // Generate table constraints and triggers for foreign keys
    // SQLite handles foreign keys differently - we'll add them with CREATE TABLE statements
    // But we'll also provide individual ALTER TABLE statements as comments for reference

    if (relationships.length > 0) {
        sqlScript += '\n-- Foreign key constraints\n';
        sqlScript +=
            '-- Note: SQLite requires foreign_keys pragma to be enabled:\n';
        sqlScript += '-- PRAGMA foreign_keys = ON;\n\n';

        relationships.forEach((r: DBRelationship) => {
            const sourceTable = tables.find((t) => t.id === r.sourceTableId);
            const targetTable = tables.find((t) => t.id === r.targetTableId);

            if (
                !sourceTable ||
                !targetTable ||
                sourceTable.isView ||
                targetTable.isView ||
                sqliteSystemTables.includes(sourceTable.name.toLowerCase()) ||
                sqliteSystemTables.includes(targetTable.name.toLowerCase())
            ) {
                return;
            }

            const sourceField = sourceTable.fields.find(
                (f) => f.id === r.sourceFieldId
            );
            const targetField = targetTable.fields.find(
                (f) => f.id === r.targetFieldId
            );

            if (!sourceField || !targetField) {
                return;
            }

            // Create commented out version of what would be ALTER TABLE statement
            sqlScript += `-- ALTER TABLE "${sourceTable.name}" ADD CONSTRAINT "fk_${sourceTable.name}_${sourceField.name}" FOREIGN KEY("${sourceField.name}") REFERENCES "${targetTable.name}"("${targetField.name}");\n`;
        });
    }

    // Add D1-specific notes
    if (isCloudflareD1) {
        sqlScript += `
-- Cloudflare D1 specific notes:
-- 1. Use 'wrangler d1 execute YOUR_DB_NAME --file=script.sql' to run this script
-- 2. Cloudflare D1 has some limitations compared to standard SQLite:
--    - No user-defined functions
--    - Limited support for some SQL operations
--    - Size limitations on database and transactions
-- 3. For production systems, consider using prepared migrations instead of direct SQL scripts
`;
    }

    // Commit transaction
    sqlScript += '\nCOMMIT;\n';

    return sqlScript;
}
