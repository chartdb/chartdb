import {
    exportFieldComment,
    escapeSQLComment,
    formatTableComment,
    isFunction,
    isKeyword,
    strHasQuotes,
} from './common';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import { DBCustomTypeKind } from '@/lib/domain/db-custom-type';

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

function exportCustomTypes(customTypes: DBCustomType[]): string {
    if (!customTypes || customTypes.length === 0) {
        return '';
    }

    let typesSql = '';

    // Sort custom types to ensure enums are created before composite types that might use them
    const sortedTypes = [...customTypes].sort((a, b) => {
        if (
            a.kind === DBCustomTypeKind.enum &&
            b.kind === DBCustomTypeKind.composite
        ) {
            return -1;
        }
        if (
            a.kind === DBCustomTypeKind.composite &&
            b.kind === DBCustomTypeKind.enum
        ) {
            return 1;
        }
        return a.name.localeCompare(b.name);
    });

    sortedTypes.forEach((customType) => {
        const typeName = customType.schema
            ? `"${customType.schema}"."${customType.name}"`
            : `"${customType.name}"`;

        if (customType.kind === DBCustomTypeKind.enum) {
            // Export enum type
            if (customType.values && customType.values.length > 0) {
                const enumValues = customType.values
                    .map((value) => `'${value.replace(/'/g, "''")}'`)
                    .join(', ');
                typesSql += `CREATE TYPE ${typeName} AS ENUM (${enumValues});\n`;
            }
        } else if (customType.kind === DBCustomTypeKind.composite) {
            // Export composite type
            if (customType.fields && customType.fields.length > 0) {
                const compositeFields = customType.fields
                    .map((field) => `"${field.field}" ${field.type}`)
                    .join(', ');
                typesSql += `CREATE TYPE ${typeName} AS (${compositeFields});\n`;
            }
        }
    });

    return typesSql ? typesSql + '\n' : '';
}

export function exportPostgreSQL({
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
    const customTypes = diagram.customTypes || [];

    // Create CREATE SCHEMA statements for all schemas
    let sqlScript = '';
    if (!onlyRelationships) {
        const schemas = new Set<string>();

        tables.forEach((table) => {
            if (table.schema) {
                schemas.add(table.schema);
            }
        });

        // Also collect schemas from custom types
        customTypes.forEach((customType) => {
            if (customType.schema) {
                schemas.add(customType.schema);
            }
        });

        // Add schema creation statements
        schemas.forEach((schema) => {
            sqlScript += `CREATE SCHEMA IF NOT EXISTS "${schema}";\n`;
        });
        if (schemas.size > 0) {
            sqlScript += '\n';
        }

        // Add custom types (enums and composite types)
        sqlScript += exportCustomTypes(customTypes);

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
        if (sequences.size > 0) {
            sqlScript += '\n';
        }

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
                const primaryKeyFields = table.fields.filter(
                    (f) => f.primaryKey
                );

                return `${
                    table.comments ? formatTableComment(table.comments) : ''
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
                                typeName.toLowerCase() ===
                                    'character varying' ||
                                typeName.toLowerCase() === 'char' ||
                                typeName.toLowerCase() === 'character'
                            ) {
                                typeWithSize = `${typeName}(${field.characterMaximumLength})`;
                            }
                        }
                        if (field.precision && field.scale) {
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

                        // Handle array types (check if isArray flag or if type name ends with '[]')
                        if (field.isArray || typeName.endsWith('[]')) {
                            // Remove any existing [] notation
                            const baseTypeWithoutArray = typeWithSize.replace(
                                /\[\]$/,
                                ''
                            );
                            typeWithSize = baseTypeWithoutArray + '[]';
                        }

                        const notNull = field.nullable ? '' : ' NOT NULL';

                        // Handle identity generation
                        let identity = '';
                        if (
                            field.default &&
                            field.default.includes('nextval')
                        ) {
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
                        ? `,\n    ${(() => {
                              // Find PK index to get the constraint name
                              // Only use CONSTRAINT syntax if PK index has a non-empty name
                              const pkIndex = table.indexes.find(
                                  (idx) => idx.isPrimaryKey
                              );
                              return pkIndex?.name
                                  ? `CONSTRAINT "${pkIndex.name}" `
                                  : '';
                          })()}PRIMARY KEY (${primaryKeyFields
                              .map((f) => `"${f.name}"`)
                              .join(', ')})`
                        : ''
                }\n);${
                    // Add table comments
                    table.comments
                        ? `\nCOMMENT ON TABLE ${tableName} IS '${escapeSQLComment(table.comments)}';`
                        : ''
                }${
                    // Add column comments
                    table.fields
                        .filter((f) => f.comments)
                        .map(
                            (f) =>
                                `\nCOMMENT ON COLUMN ${tableName}."${f.name}" IS '${escapeSQLComment(f.comments || '')}';`
                        )
                        .join('')
                }${
                    // Add indexes only for non-primary key fields or composite indexes
                    // This avoids duplicate indexes on primary key columns
                    (() => {
                        const validIndexes = table.indexes
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
                                    .map((field) =>
                                        field ? `"${field.name}"` : ''
                                    )
                                    .filter(Boolean);

                                return indexFieldNames.length > 0
                                    ? `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName}${index.type && index.type !== 'btree' ? ` USING ${index.type.toUpperCase()}` : ''} (${indexFieldNames.join(', ')});`
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

    // Generate foreign keys
    if (relationships.length > 0) {
        sqlScript += '\n-- Foreign key constraints\n';

        // Process all relationships and create FK objects with schema info
        const foreignKeys = relationships
            .map((r: DBRelationship) => {
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
                    return '';
                }

                const fkTableName = fkTable.schema
                    ? `"${fkTable.schema}"."${fkTable.name}"`
                    : `"${fkTable.name}"`;
                const refTableName = refTable.schema
                    ? `"${refTable.schema}"."${refTable.name}"`
                    : `"${refTable.name}"`;

                // Create a unique constraint name by combining table and field names
                // Ensure it stays within PostgreSQL's 63-character limit for identifiers
                // and doesn't get truncated in a way that breaks SQL syntax
                const baseName = `fk_${fkTable.name}_${fkField.name}_${refTable.name}_${refField.name}`;
                // Limit to 60 chars (63 minus quotes) to ensure the whole identifier stays within limits
                const safeConstraintName =
                    baseName.length > 60
                        ? baseName
                              .substring(0, 60)
                              .replace(/[^a-zA-Z0-9_]/g, '_')
                        : baseName.replace(/[^a-zA-Z0-9_]/g, '_');

                const constraintName = `"${safeConstraintName}"`;

                return {
                    schema: fkTable.schema || 'public',
                    sql: `ALTER TABLE ${fkTableName} ADD CONSTRAINT ${constraintName} FOREIGN KEY("${fkField.name}") REFERENCES ${refTableName}("${refField.name}");`,
                };
            })
            .filter(Boolean); // Remove empty objects

        // Group foreign keys by schema
        const fksBySchema = foreignKeys.reduce(
            (acc, fk) => {
                if (!fk) return acc;
                const schema = fk.schema;
                if (!acc[schema]) {
                    acc[schema] = [];
                }
                acc[schema].push(fk.sql);
                return acc;
            },
            {} as Record<string, string[]>
        );

        // Sort schemas and generate SQL with separators
        const sortedSchemas = Object.keys(fksBySchema).sort();
        const fkSql = sortedSchemas
            .map((schema, index) => {
                const schemaFks = fksBySchema[schema].join('\n');
                if (index === 0) {
                    return `-- Schema: ${schema}\n${schemaFks}`;
                } else {
                    return `\n-- Schema: ${schema}\n${schemaFks}`;
                }
            })
            .join('\n');

        sqlScript += fkSql;
    }

    return sqlScript;
}
