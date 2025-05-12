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

function parsePostgresDefault(field: DBField): string {
    if (!field.default || typeof field.default !== 'string') {
        return '';
    }

    const defaultValue = field.default.trim();

    // Handle specific PostgreSQL default values
    if (defaultValue.toLowerCase() === 'now()') {
        return 'CURRENT_TIMESTAMP';
    }

    // Handle PostgreSQL functions for JSON/JSONB types
    if (
        (field.type.name.toLowerCase() === 'json' ||
            field.type.name.toLowerCase() === 'jsonb') &&
        (defaultValue.includes('json_build_object') ||
            defaultValue.includes('jsonb_build_object') ||
            defaultValue.includes('json_build_array') ||
            defaultValue.includes('jsonb_build_array') ||
            defaultValue.includes('to_json') ||
            defaultValue.includes('to_jsonb'))
    ) {
        // Remove any enclosing quotes and return the function call as is
        return defaultValue.replace(/^'(.*)'$/, '$1').replace(/''/, "'");
    }

    // Handle nextval sequences for PostgreSQL
    if (defaultValue.includes('nextval')) {
        return defaultValue; // Keep it as is for PostgreSQL
    }

    // If it's a function call, keep it as is
    if (isFunction(defaultValue)) {
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

// Map problematic types to PostgreSQL compatible types
function mapPostgresType(typeName: string, fieldName: string): string {
    typeName = typeName.toLowerCase();
    fieldName = fieldName.toLowerCase();

    // Handle known problematic types
    if (typeName === 'user-defined') {
        return 'jsonb'; // Default fallback for user-defined types
    }

    // Handle generic "array" type (when not specified as array of what)
    if (typeName === 'array') {
        return 'text[]'; // Default to text array
    }

    // Handle array type notation
    if (typeName.endsWith('[]')) {
        const baseType = mapPostgresType(typeName.slice(0, -2), fieldName);
        return `${baseType}[]`;
    }

    // Default case: return the type as is
    return typeName;
}

export function exportPostgreSQL(diagram: Diagram): string {
    if (!diagram.tables || !diagram.relationships) {
        return '';
    }

    const tables = diagram.tables;
    const relationships = diagram.relationships;

    // Create CREATE SCHEMA statements for all schemas
    let sqlScript = '';
    const schemas = new Set<string>();

    tables.forEach((table) => {
        if (table.schema) {
            schemas.add(table.schema);
        }
    });

    // Add schema creation statements
    schemas.forEach((schema) => {
        sqlScript += `CREATE SCHEMA IF NOT EXISTS "${schema}";\n`;
    });
    sqlScript += '\n';

    // Add sequence creation statements
    const sequences = new Set<string>();

    tables.forEach((table) => {
        table.fields.forEach((field) => {
            if (field.default) {
                // Match nextval('schema.sequence_name') or nextval('sequence_name')
                const match = field.default.match(
                    /nextval\('([^']+)'(?:::[^)]+)?\)/
                );
                if (match) {
                    sequences.add(match[1]);
                }
            }
        });
    });

    sequences.forEach((sequence) => {
        sqlScript += `CREATE SEQUENCE IF NOT EXISTS ${sequence};\n`;
    });
    sqlScript += '\n';

    // Generate table creation SQL
    sqlScript += tables
        .map((table: DBTable) => {
            // Skip views
            if (table.isView) {
                return '';
            }

            const tableName = table.schema
                ? `"${table.schema}"."${table.name}"`
                : `"${table.name}"`;

            // Get primary key fields
            const primaryKeyFields = table.fields.filter((f) => f.primaryKey);

            return `${
                table.comments ? `-- ${table.comments}\n` : ''
            }CREATE TABLE ${tableName} (\n${table.fields
                .map((field: DBField) => {
                    const fieldName = `"${field.name}"`;

                    // Handle type name - map problematic types to PostgreSQL compatible types
                    const typeName = mapPostgresType(
                        field.type.name,
                        field.name
                    );

                    // Handle PostgreSQL specific type formatting
                    let typeWithSize = typeName;
                    let serialType = null;

                    if (field.increment && !field.nullable) {
                        if (
                            typeName.toLowerCase() === 'integer' ||
                            typeName.toLowerCase() === 'int'
                        ) {
                            serialType = 'SERIAL';
                        } else if (typeName.toLowerCase() === 'bigint') {
                            serialType = 'BIGSERIAL';
                        } else if (typeName.toLowerCase() === 'smallint') {
                            serialType = 'SMALLSERIAL';
                        }
                    }

                    if (field.characterMaximumLength) {
                        if (
                            typeName.toLowerCase() === 'varchar' ||
                            typeName.toLowerCase() === 'character varying' ||
                            typeName.toLowerCase() === 'char' ||
                            typeName.toLowerCase() === 'character'
                        ) {
                            typeWithSize = `${typeName}(${field.characterMaximumLength})`;
                        }
                    } else if (field.precision && field.scale) {
                        if (
                            typeName.toLowerCase() === 'decimal' ||
                            typeName.toLowerCase() === 'numeric'
                        ) {
                            typeWithSize = `${typeName}(${field.precision}, ${field.scale})`;
                        }
                    } else if (field.precision) {
                        if (
                            typeName.toLowerCase() === 'decimal' ||
                            typeName.toLowerCase() === 'numeric'
                        ) {
                            typeWithSize = `${typeName}(${field.precision})`;
                        }
                    }

                    // Handle array types (check if the type name ends with '[]')
                    if (typeName.endsWith('[]')) {
                        typeWithSize = typeWithSize.replace('[]', '') + '[]';
                    }

                    const notNull = field.nullable ? '' : ' NOT NULL';

                    // Handle identity generation
                    let identity = '';
                    if (field.default && field.default.includes('nextval')) {
                        // PostgreSQL already handles this with DEFAULT nextval()
                    } else if (
                        field.default &&
                        field.default.toLowerCase().includes('identity')
                    ) {
                        identity = ' GENERATED BY DEFAULT AS IDENTITY';
                    }

                    // Only add UNIQUE constraint if the field is not part of the primary key
                    // This avoids redundant uniqueness constraints
                    const unique =
                        !field.primaryKey && field.unique ? ' UNIQUE' : '';

                    // Handle default value using PostgreSQL specific parser
                    const defaultValue =
                        field.default &&
                        !field.default.toLowerCase().includes('identity')
                            ? ` DEFAULT ${parsePostgresDefault(field)}`
                            : '';

                    // Do not add PRIMARY KEY as a column constraint - will add as table constraint
                    return `${exportFieldComment(field.comments ?? '')}    ${fieldName} ${serialType || typeWithSize}${serialType ? '' : notNull}${identity}${unique}${defaultValue}`;
                })
                .join(',\n')}${
                primaryKeyFields.length > 0
                    ? `,\n    PRIMARY KEY (${primaryKeyFields
                          .map((f) => `"${f.name}"`)
                          .join(', ')})`
                    : ''
            }\n);\n\n${
                // Add table comments
                table.comments
                    ? `COMMENT ON TABLE ${tableName} IS '${table.comments.replace(/'/g, "''")}';\n\n`
                    : ''
            }${
                // Add column comments
                table.fields
                    .filter((f) => f.comments)
                    .map(
                        (f) =>
                            `COMMENT ON COLUMN ${tableName}."${f.name}" IS '${f.comments?.replace(/'/g, "''")}';\n`
                    )
                    .join('')
            }\n${
                // Add indexes only for non-primary key fields or composite indexes
                // This avoids duplicate indexes on primary key columns
                table.indexes
                    .map((index) => {
                        // Get the list of fields for this index
                        const indexFields = index.fieldIds
                            .map((fieldId) => {
                                const field = table.fields.find(
                                    (f) => f.id === fieldId
                                );
                                return field ? field : null;
                            })
                            .filter(Boolean);

                        // Skip if this index exactly matches the primary key fields
                        // This prevents creating redundant indexes
                        if (
                            primaryKeyFields.length === indexFields.length &&
                            primaryKeyFields.every((pk) =>
                                indexFields.some(
                                    (field) => field && field.id === pk.id
                                )
                            )
                        ) {
                            return '';
                        }

                        // Create unique index name using table name and index name
                        // This ensures index names are unique across the database
                        const safeTableName = table.name.replace(
                            /[^a-zA-Z0-9_]/g,
                            '_'
                        );
                        const safeIndexName = index.name.replace(
                            /[^a-zA-Z0-9_]/g,
                            '_'
                        );

                        // Limit index name length to avoid PostgreSQL's 63-character identifier limit
                        let combinedName = `${safeTableName}_${safeIndexName}`;
                        if (combinedName.length > 60) {
                            // If too long, use just the index name or a truncated version
                            combinedName =
                                safeIndexName.length > 60
                                    ? safeIndexName.substring(0, 60)
                                    : safeIndexName;
                        }

                        const indexName = `"${combinedName}"`;

                        // Get the properly quoted field names
                        const indexFieldNames = indexFields
                            .map((field) => (field ? `"${field.name}"` : ''))
                            .filter(Boolean);

                        return indexFieldNames.length > 0
                            ? `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${indexName}\nON ${tableName} (${indexFieldNames.join(', ')});\n\n`
                            : '';
                    })
                    .filter(Boolean)
                    .join('')
            }`;
        })
        .filter(Boolean) // Remove empty strings (views)
        .join('\n');

    // Generate foreign keys
    sqlScript += `\n${relationships
        .map((r: DBRelationship) => {
            const sourceTable = tables.find((t) => t.id === r.sourceTableId);
            const targetTable = tables.find((t) => t.id === r.targetTableId);

            if (
                !sourceTable ||
                !targetTable ||
                sourceTable.isView ||
                targetTable.isView
            ) {
                return '';
            }

            const sourceField = sourceTable.fields.find(
                (f) => f.id === r.sourceFieldId
            );
            const targetField = targetTable.fields.find(
                (f) => f.id === r.targetFieldId
            );

            if (!sourceField || !targetField) {
                return '';
            }

            const sourceTableName = sourceTable.schema
                ? `"${sourceTable.schema}"."${sourceTable.name}"`
                : `"${sourceTable.name}"`;
            const targetTableName = targetTable.schema
                ? `"${targetTable.schema}"."${targetTable.name}"`
                : `"${targetTable.name}"`;

            // Create a unique constraint name by combining table and field names
            // Ensure it stays within PostgreSQL's 63-character limit for identifiers
            // and doesn't get truncated in a way that breaks SQL syntax
            const baseName = `fk_${sourceTable.name}_${sourceField.name}_${targetTable.name}_${targetField.name}`;
            // Limit to 60 chars (63 minus quotes) to ensure the whole identifier stays within limits
            const safeConstraintName =
                baseName.length > 60
                    ? baseName.substring(0, 60).replace(/[^a-zA-Z0-9_]/g, '_')
                    : baseName.replace(/[^a-zA-Z0-9_]/g, '_');

            const constraintName = `"${safeConstraintName}"`;

            return `ALTER TABLE ${sourceTableName}\nADD CONSTRAINT ${constraintName} FOREIGN KEY("${sourceField.name}") REFERENCES ${targetTableName}("${targetField.name}");\n`;
        })
        .filter(Boolean) // Remove empty strings
        .join('\n')}`;

    return sqlScript;
}
