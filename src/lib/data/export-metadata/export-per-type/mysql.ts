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

function parseMySQLDefault(field: DBField): string {
    if (!field.default) {
        return '';
    }

    const defaultValue = field.default.trim();

    // Handle specific MySQL default values
    if (
        defaultValue.toLowerCase() === 'now()' ||
        defaultValue.toLowerCase() === 'current_timestamp'
    ) {
        return 'CURRENT_TIMESTAMP';
    }

    // Handle MySQL auto-increment, which is handled via AUTO_INCREMENT
    if (
        defaultValue.toLowerCase().includes('identity') ||
        defaultValue.toLowerCase().includes('autoincrement') ||
        defaultValue.includes('nextval')
    ) {
        return ''; // MySQL handles this with AUTO_INCREMENT
    }

    // If it's a function call, convert to MySQL equivalents
    if (isFunction(defaultValue)) {
        // Map common PostgreSQL/MSSQL functions to MySQL equivalents
        if (
            defaultValue.toLowerCase().includes('newid()') ||
            defaultValue.toLowerCase().includes('uuid()')
        ) {
            return 'UUID()';
        }

        // For functions we can't translate, return as is (MySQL might not support them)
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

// Map problematic types to MySQL compatible types
function mapMySQLType(typeName: string): string {
    typeName = typeName.toLowerCase();

    // Map common types to MySQL type system
    switch (typeName) {
        case 'int':
        case 'integer':
            return 'INT';

        case 'smallint':
            return 'SMALLINT';

        case 'bigint':
            return 'BIGINT';

        case 'decimal':
        case 'numeric':
            return 'DECIMAL';

        case 'float':
            return 'FLOAT';

        case 'double':
        case 'real':
            return 'DOUBLE';

        case 'char':
        case 'character':
            return 'CHAR';

        case 'varchar':
        case 'character varying':
        case 'nvarchar':
            return 'VARCHAR';

        case 'text':
        case 'ntext':
            return 'TEXT';

        case 'longtext':
            return 'LONGTEXT';

        case 'mediumtext':
            return 'MEDIUMTEXT';

        case 'tinytext':
            return 'TINYTEXT';

        case 'date':
            return 'DATE';

        case 'datetime':
        case 'timestamp':
        case 'datetime2':
            return 'DATETIME';

        case 'time':
            return 'TIME';

        case 'blob':
        case 'binary':
            return 'BLOB';

        case 'varbinary':
            return 'VARBINARY';

        case 'bit':
            return 'BIT';

        case 'boolean':
        case 'bool':
            return 'TINYINT(1)'; // MySQL uses TINYINT(1) for boolean

        case 'enum':
            return 'VARCHAR(50)'; // Convert ENUM to VARCHAR instead of assuming values

        case 'json':
        case 'jsonb':
            return 'JSON'; // MySQL has JSON type since 5.7.8

        case 'uuid':
            return 'CHAR(36)'; // MySQL doesn't have a UUID type, use CHAR(36)

        case 'geometry':
        case 'geography':
            return 'GEOMETRY'; // If MySQL has spatial extensions

        case 'array':
        case 'user-defined':
            return 'JSON'; // Use JSON for complex types like arrays or user-defined
    }

    // If type has array notation (ends with []), treat as JSON
    if (typeName.endsWith('[]')) {
        return 'JSON';
    }

    // For any other types, default to original type
    return typeName;
}

export function exportMySQL(diagram: Diagram): string {
    if (!diagram.tables || !diagram.relationships) {
        return '';
    }

    const tables = diagram.tables;
    const relationships = diagram.relationships;

    // Start SQL script
    let sqlScript = '-- MySQL database export\n\n';

    // MySQL doesn't really use transactions for DDL statements but we'll add it for consistency
    sqlScript += 'START TRANSACTION;\n\n';

    // Create databases (schemas) if they don't exist
    const schemas = new Set<string>();
    tables.forEach((table) => {
        if (table.schema) {
            schemas.add(table.schema);
        }
    });

    schemas.forEach((schema) => {
        sqlScript += `CREATE DATABASE IF NOT EXISTS \`${schema}\`;\n`;
    });

    if (schemas.size > 0) {
        sqlScript += '\n';
    }

    // Generate table creation SQL
    sqlScript += tables
        .map((table: DBTable) => {
            // Skip views
            if (table.isView) {
                return '';
            }

            // Use schema prefix if available
            const tableName = table.schema
                ? `\`${table.schema}\`.\`${table.name}\``
                : `\`${table.name}\``;

            // Get primary key fields
            const primaryKeyFields = table.fields.filter((f) => f.primaryKey);

            return `${
                table.comments ? `-- ${table.comments}\n` : ''
            }CREATE TABLE IF NOT EXISTS ${tableName} (\n${table.fields
                .map((field: DBField) => {
                    const fieldName = `\`${field.name}\``;

                    // Handle type name - map to MySQL compatible types
                    const typeName = mapMySQLType(field.type.name);

                    // Handle MySQL specific type formatting
                    let typeWithSize = typeName;
                    if (field.characterMaximumLength) {
                        if (
                            typeName.toLowerCase() === 'varchar' ||
                            typeName.toLowerCase() === 'char' ||
                            typeName.toLowerCase() === 'varbinary'
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

                    // Set a default size for VARCHAR columns if not specified
                    if (
                        typeName.toLowerCase() === 'varchar' &&
                        !field.characterMaximumLength
                    ) {
                        typeWithSize = `${typeName}(255)`;
                    }

                    const notNull = field.nullable ? '' : ' NOT NULL';

                    // Handle auto_increment - MySQL uses AUTO_INCREMENT keyword
                    let autoIncrement = '';
                    if (
                        field.primaryKey &&
                        (field.default?.toLowerCase().includes('identity') ||
                            field.default
                                ?.toLowerCase()
                                .includes('autoincrement') ||
                            field.default?.includes('nextval'))
                    ) {
                        autoIncrement = ' AUTO_INCREMENT';
                    }

                    // Only add UNIQUE constraint if the field is not part of the primary key
                    const unique =
                        !field.primaryKey && field.unique ? ' UNIQUE' : '';

                    // Handle default value
                    const defaultValue =
                        field.default &&
                        !field.default.toLowerCase().includes('identity') &&
                        !field.default
                            .toLowerCase()
                            .includes('autoincrement') &&
                        !field.default.includes('nextval')
                            ? ` DEFAULT ${parseMySQLDefault(field)}`
                            : '';

                    // MySQL supports inline comments
                    const comment = field.comments
                        ? ` COMMENT '${field.comments.replace(/'/g, "''")}'`
                        : '';

                    return `${exportFieldComment(field.comments ?? '')}    ${fieldName} ${typeWithSize}${notNull}${autoIncrement}${unique}${defaultValue}${comment}`;
                })
                .join(',\n')}${
                // Add PRIMARY KEY as table constraint
                primaryKeyFields.length > 0
                    ? `,\n    PRIMARY KEY (${primaryKeyFields
                          .map((f) => `\`${f.name}\``)
                          .join(', ')})`
                    : ''
            }\n)${
                // MySQL supports table comments
                table.comments
                    ? ` COMMENT='${table.comments.replace(/'/g, "''")}'`
                    : ''
            };\n\n${
                // Add indexes - MySQL creates them separately from the table definition
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

                        // Create a unique index name by combining table name, field names, and a unique/non-unique indicator
                        const fieldNamesForIndex = indexFields
                            .map((field) => field?.name || '')
                            .join('_');
                        const uniqueIndicator = index.unique ? '_unique' : '';
                        const indexName = `\`idx_${table.name}_${fieldNamesForIndex}${uniqueIndicator}\``;

                        // Get the properly quoted field names
                        const indexFieldNames = indexFields
                            .map((field) => (field ? `\`${field.name}\`` : ''))
                            .filter(Boolean);

                        // Check for text/blob fields that need special handling
                        const hasTextOrBlob = indexFields.some((field) => {
                            const typeName =
                                field?.type.name.toLowerCase() || '';
                            return (
                                typeName === 'text' ||
                                typeName === 'mediumtext' ||
                                typeName === 'longtext' ||
                                typeName === 'blob'
                            );
                        });

                        // If there are TEXT/BLOB fields, need to add prefix length
                        const indexFieldsWithPrefix = hasTextOrBlob
                            ? indexFieldNames.map((name) => {
                                  const field = indexFields.find(
                                      (f) => `\`${f?.name}\`` === name
                                  );
                                  if (!field) return name;

                                  const typeName =
                                      field.type.name.toLowerCase();
                                  if (
                                      typeName === 'text' ||
                                      typeName === 'mediumtext' ||
                                      typeName === 'longtext' ||
                                      typeName === 'blob'
                                  ) {
                                      // Add a prefix length for TEXT/BLOB fields (required in MySQL)
                                      return `${name}(255)`;
                                  }
                                  return name;
                              })
                            : indexFieldNames;

                        return indexFieldNames.length > 0
                            ? `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${indexName}\nON ${tableName} (${indexFieldsWithPrefix.join(', ')});\n`
                            : '';
                    })
                    .filter(Boolean)
                    .join('\n')
            }`;
        })
        .filter(Boolean) // Remove empty strings (views)
        .join('\n');

    // Generate foreign keys
    if (relationships.length > 0) {
        sqlScript += '\n-- Foreign key constraints\n\n';

        sqlScript += relationships
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

                const sourceTableName = sourceTable.schema
                    ? `\`${sourceTable.schema}\`.\`${sourceTable.name}\``
                    : `\`${sourceTable.name}\``;
                const targetTableName = targetTable.schema
                    ? `\`${targetTable.schema}\`.\`${targetTable.name}\``
                    : `\`${targetTable.name}\``;

                // Create a descriptive constraint name
                const constraintName = `\`fk_${sourceTable.name}_${sourceField.name}\``;

                // MySQL supports ON DELETE and ON UPDATE actions
                return `ALTER TABLE ${sourceTableName}\nADD CONSTRAINT ${constraintName} FOREIGN KEY(\`${sourceField.name}\`) REFERENCES ${targetTableName}(\`${targetField.name}\`)\nON UPDATE CASCADE ON DELETE RESTRICT;\n`;
            })
            .filter(Boolean) // Remove empty strings
            .join('\n');
    }

    // Commit transaction
    sqlScript += '\nCOMMIT;\n';

    return sqlScript;
}
