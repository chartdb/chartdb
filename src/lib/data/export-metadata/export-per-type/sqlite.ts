import {
    exportFieldComment,
    formatTableComment,
    isFunction,
    isKeyword,
    strHasQuotes,
} from './common';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import type { DBRelationship } from '@/lib/domain/db-relationship';

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

export function exportSQLite({
    diagram,
    onlyRelationships = false,
}: {
    diagram: Diagram;
    onlyRelationships?: boolean;
}): string {
    if (!diagram.tables || !diagram.relationships) {
        return '';
    }

    const tables = diagram.tables;
    const relationships = diagram.relationships;

    // Start SQL script - SQLite doesn't use schemas, so we skip schema creation
    let sqlScript = '-- SQLite database export\n';

    // Add PRAGMA foreign_keys = ON if there are relationships
    if (relationships && relationships.length > 0) {
        sqlScript += 'PRAGMA foreign_keys = ON;\n\n';
    }

    // Begin transaction for faster import
    sqlScript += 'BEGIN TRANSACTION;\n';

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

    if (!onlyRelationships) {
        // Generate table creation SQL
        sqlScript += tables
            .map((table: DBTable) => {
                // Skip views
                if (table.isView) {
                    return '';
                }

                // Skip SQLite system tables
                if (sqliteSystemTables.includes(table.name.toLowerCase())) {
                    return `-- Skipping SQLite system table: "${table.name}"\n`;
                }

                // SQLite doesn't use schema prefixes, so we use just the table name
                // Include the schema in a comment if it exists
                const schemaComment = table.schema
                    ? `-- Original schema: ${table.schema}\n`
                    : '';
                const tableName = `"${table.name}"`;

                // Get primary key fields
                const primaryKeyFields = table.fields.filter(
                    (f) => f.primaryKey
                );

                // Check if this is a single-column INTEGER PRIMARY KEY (for AUTOINCREMENT)
                const singleIntegerPrimaryKey =
                    primaryKeyFields.length === 1 &&
                    (primaryKeyFields[0].type.name.toLowerCase() ===
                        'integer' ||
                        primaryKeyFields[0].type.name.toLowerCase() === 'int');

                // Collect foreign key constraints for this table
                const tableForeignKeys: string[] = [];
                relationships.forEach((r: DBRelationship) => {
                    const sourceTable = tables.find(
                        (t) => t.id === r.sourceTableId
                    );
                    const targetTable = tables.find(
                        (t) => t.id === r.targetTableId
                    );

                    if (
                        !sourceTable ||
                        !targetTable ||
                        sourceTable.isView ||
                        targetTable.isView ||
                        sqliteSystemTables.includes(
                            sourceTable.name.toLowerCase()
                        ) ||
                        sqliteSystemTables.includes(
                            targetTable.name.toLowerCase()
                        )
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

                    // Determine which table should have the foreign key based on cardinality
                    let fkTable, fkField, refTable, refField;

                    if (
                        r.sourceCardinality === 'one' &&
                        r.targetCardinality === 'many'
                    ) {
                        // FK goes on target table
                        fkTable = targetTable;
                        fkField = targetField;
                        refTable = sourceTable;
                        refField = sourceField;
                    } else if (
                        r.sourceCardinality === 'many' &&
                        r.targetCardinality === 'one'
                    ) {
                        // FK goes on source table
                        fkTable = sourceTable;
                        fkField = sourceField;
                        refTable = targetTable;
                        refField = targetField;
                    } else if (
                        r.sourceCardinality === 'one' &&
                        r.targetCardinality === 'one'
                    ) {
                        // For 1:1, FK can go on either side, but typically goes on the table that references the other
                        // We'll keep the current behavior for 1:1
                        fkTable = sourceTable;
                        fkField = sourceField;
                        refTable = targetTable;
                        refField = targetField;
                    } else {
                        // Many-to-many relationships need a junction table, skip for now
                        return;
                    }

                    // If this foreign key belongs to the current table, add it
                    if (fkTable.id === table.id) {
                        tableForeignKeys.push(
                            `    FOREIGN KEY("${fkField.name}") REFERENCES "${refTable.name}"("${refField.name}")`
                        );
                    }
                });

                return `${schemaComment}${
                    table.comments ? formatTableComment(table.comments) : ''
                }CREATE TABLE IF NOT EXISTS ${tableName} (\n${table.fields
                    .map((field: DBField) => {
                        const fieldName = `"${field.name}"`;

                        // Handle type name - map to SQLite compatible types
                        const typeName = mapSQLiteType(
                            field.type.name,
                            field.primaryKey
                        );

                        // SQLite ignores length specifiers, so we don't add them
                        // We'll keep this simple without size info
                        const typeWithoutSize = typeName;

                        const notNull = field.nullable ? '' : ' NOT NULL';

                        // Handle autoincrement - only works with INTEGER PRIMARY KEY
                        let autoIncrement = '';
                        if (
                            field.primaryKey &&
                            singleIntegerPrimaryKey &&
                            (field.default
                                ?.toLowerCase()
                                .includes('identity') ||
                                field.default
                                    ?.toLowerCase()
                                    .includes('autoincrement') ||
                                field.default?.includes('nextval'))
                        ) {
                            autoIncrement = ' AUTOINCREMENT';
                        }

                        // Only add UNIQUE constraint if the field is not part of the primary key
                        const unique =
                            !field.primaryKey && field.unique ? ' UNIQUE' : '';

                        // Handle default value - Special handling for datetime() function
                        let defaultValue = '';
                        if (
                            field.default &&
                            !field.default.toLowerCase().includes('identity') &&
                            !field.default
                                .toLowerCase()
                                .includes('autoincrement') &&
                            !field.default.includes('nextval')
                        ) {
                            // Special handling for quoted functions like 'datetime(\'\'now\'\')' - remove extra quotes
                            if (field.default.includes("datetime(''now'')")) {
                                defaultValue = ' DEFAULT CURRENT_TIMESTAMP';
                            } else {
                                defaultValue = ` DEFAULT ${parseSQLiteDefault(field)}`;
                            }
                        }

                        // Add PRIMARY KEY inline only for single INTEGER primary key
                        const primaryKey =
                            field.primaryKey && singleIntegerPrimaryKey
                                ? ' PRIMARY KEY' + autoIncrement
                                : '';

                        return `${exportFieldComment(field.comments ?? '')}    ${fieldName} ${typeWithoutSize}${primaryKey}${notNull}${unique}${defaultValue}`;
                    })
                    .join(',\n')}${
                    // Add PRIMARY KEY as table constraint for composite primary keys or non-INTEGER primary keys
                    primaryKeyFields.length > 0 && !singleIntegerPrimaryKey
                        ? `,\n    PRIMARY KEY (${primaryKeyFields
                              .map((f) => `"${f.name}"`)
                              .join(', ')})`
                        : ''
                }${
                    // Add foreign key constraints
                    tableForeignKeys.length > 0
                        ? ',\n' + tableForeignKeys.join(',\n')
                        : ''
                }\n);\n${
                    // Add indexes - SQLite doesn't support indexes in CREATE TABLE
                    (() => {
                        const validIndexes = table.indexes
                            .map((index) => {
                                // Skip indexes that exactly match the primary key
                                const indexFields = index.fieldIds
                                    .map((fieldId) => {
                                        const field = table.fields.find(
                                            (f) => f.id === fieldId
                                        );
                                        return field ? field : null;
                                    })
                                    .filter(Boolean);

                                // Get the properly quoted field names
                                const indexFieldNames = indexFields
                                    .map((field) =>
                                        field ? `"${field.name}"` : ''
                                    )
                                    .filter(Boolean);

                                // Skip if this index exactly matches the primary key fields
                                if (
                                    primaryKeyFields.length ===
                                        indexFields.length &&
                                    primaryKeyFields.every((pk) =>
                                        indexFields.some(
                                            (field) =>
                                                field && field.id === pk.id
                                        )
                                    )
                                ) {
                                    return '';
                                }

                                // Create safe index name
                                const safeIndexName =
                                    `${table.name}_${index.name}`
                                        .replace(/[^a-zA-Z0-9_]/g, '_')
                                        .substring(0, 60);

                                return indexFieldNames.length > 0
                                    ? `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS "${safeIndexName}"\nON ${tableName} (${indexFieldNames.join(', ')});`
                                    : '';
                            })
                            .filter(Boolean);

                        return validIndexes.length > 0
                            ? `\n-- Indexes\n${validIndexes.join('\n')}`
                            : '';
                    })()
                }\n`;
            })
            .filter(Boolean) // Remove empty strings (views)
            .join('\n');
    }
    // Foreign keys are now included inline in CREATE TABLE statements
    // No need for separate ALTER TABLE statements in SQLite

    // Commit transaction
    sqlScript += '\nCOMMIT;\n';

    return sqlScript;
}
