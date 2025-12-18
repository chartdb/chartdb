import {
    exportFieldComment,
    formatMSSQLTableComment,
    isFunction,
    isKeyword,
    strHasQuotes,
} from './common';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import type { DBRelationship } from '@/lib/domain/db-relationship';

function parseMSSQLDefault(field: DBField): string {
    if (!field.default) {
        return '';
    }

    let defaultValue = field.default.trim();

    // Remove type casting for SQL Server
    defaultValue = defaultValue.split('::')[0];

    // Handle nextval sequences for SQL Server
    if (defaultValue.includes('nextval')) {
        return 'IDENTITY(1,1)';
    }

    // Special handling for SQL Server DEFAULT values
    if (defaultValue.match(/^\(\(.*\)\)$/)) {
        // Handle ((0)), ((0.00)) style defaults
        return defaultValue.replace(/^\(\(|\)\)$/g, '');
    } else if (defaultValue.match(/^\(N'.*'\)$/)) {
        // Handle (N'value') style defaults
        const innerValue = defaultValue.replace(/^\(N'|'\)$/g, '');
        return `N'${innerValue}'`;
    } else if (defaultValue.match(/^\(NULL\)$/i)) {
        // Handle (NULL) defaults
        return 'NULL';
    } else if (defaultValue.match(/^\(getdate\(\)\)$/i)) {
        // Handle (getdate()) defaults
        return 'getdate()';
    } else if (defaultValue.match(/^\('?\*'?\)$/i) || defaultValue === '*') {
        // Handle ('*') or (*) or * defaults - common for "all" values
        return "N'*'";
    } else if (defaultValue.match(/^\((['"])(.*)\1\)$/)) {
        // Handle ('value') or ("value") style defaults
        const matches = defaultValue.match(/^\((['"])(.*)\1\)$/);
        return matches ? `N'${matches[2]}'` : defaultValue;
    }

    // Handle special characters that could be interpreted as operators
    const sqlServerSpecialChars = /[*+\-/%&|^!=<>~]/;
    if (sqlServerSpecialChars.test(defaultValue)) {
        // If the value contains special characters and isn't already properly quoted
        if (
            !strHasQuotes(defaultValue) &&
            !isFunction(defaultValue) &&
            !isKeyword(defaultValue)
        ) {
            return `N'${defaultValue.replace(/'/g, "''")}'`;
        }
    }

    if (
        strHasQuotes(defaultValue) ||
        isFunction(defaultValue) ||
        isKeyword(defaultValue) ||
        /^-?\d+(\.\d+)?$/.test(defaultValue)
    ) {
        return defaultValue;
    }

    return `'${defaultValue}'`;
}

export function exportMSSQL({
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

    // Create CREATE SCHEMA statements for all schemas
    let sqlScript = '';

    if (!onlyRelationships) {
        const schemas = new Set<string>();

        tables.forEach((table) => {
            if (table.schema) {
                schemas.add(table.schema);
            }
        });

        // Add schema creation statements
        schemas.forEach((schema) => {
            sqlScript += `IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${schema}')\nBEGIN\n    EXEC('CREATE SCHEMA [${schema}]');\nEND;\n`;
        });

        // Generate table creation SQL
        sqlScript += tables
            .map((table: DBTable) => {
                // Skip views
                if (table.isView) {
                    return '';
                }

                const tableName = table.schema
                    ? `[${table.schema}].[${table.name}]`
                    : `[${table.name}]`;

                return `${
                    table.comments
                        ? formatMSSQLTableComment(table.comments)
                        : ''
                }CREATE TABLE ${tableName} (\n${table.fields
                    .map((field: DBField) => {
                        const fieldName = `[${field.name}]`;
                        const typeName = field.type.name;

                        // Handle SQL Server specific type formatting
                        let typeWithSize = typeName;
                        if (field.characterMaximumLength) {
                            if (
                                typeName.toLowerCase() === 'varchar' ||
                                typeName.toLowerCase() === 'nvarchar' ||
                                typeName.toLowerCase() === 'char' ||
                                typeName.toLowerCase() === 'nchar'
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

                        const notNull = field.nullable ? '' : ' NOT NULL';

                        // Check if identity column
                        const identity =
                            field.increment ||
                            field.default?.toLowerCase().includes('identity')
                                ? ' IDENTITY(1,1)'
                                : '';

                        const unique =
                            !field.primaryKey && field.unique ? ' UNIQUE' : '';

                        // Handle default value using SQL Server specific parser
                        const defaultValue =
                            field.default &&
                            !field.increment &&
                            !field.default.toLowerCase().includes('identity')
                                ? ` DEFAULT ${parseMSSQLDefault(field)}`
                                : '';

                        // Do not add PRIMARY KEY as a column constraint - will add as table constraint
                        return `${exportFieldComment(field.comments ?? '')}    ${fieldName} ${typeWithSize}${notNull}${identity}${unique}${defaultValue}`;
                    })
                    .join(',\n')}${
                    table.fields.filter((f) => f.primaryKey).length > 0
                        ? `,\n    ${(() => {
                              // Find PK index to get the constraint name
                              // Only use CONSTRAINT syntax if PK index has a non-empty name
                              const pkIndex = table.indexes.find(
                                  (idx) => idx.isPrimaryKey
                              );
                              return pkIndex?.name
                                  ? `CONSTRAINT [${pkIndex.name}] `
                                  : '';
                          })()}PRIMARY KEY (${table.fields
                              .filter((f) => f.primaryKey)
                              .map((f) => `[${f.name}]`)
                              .join(', ')})`
                        : ''
                }\n);\n${(() => {
                    const validIndexes = table.indexes
                        .map((index) => {
                            // Skip primary key indexes - they're already handled as constraints
                            if (index.isPrimaryKey) {
                                return '';
                            }

                            const indexName = table.schema
                                ? `[${table.schema}_${index.name}]`
                                : `[${index.name}]`;
                            const indexFields = index.fieldIds
                                .map((fieldId) => {
                                    const field = table.fields.find(
                                        (f) => f.id === fieldId
                                    );
                                    return field ? `[${field.name}]` : '';
                                })
                                .filter(Boolean);

                            // SQL Server has a limit of 32 columns in an index
                            if (indexFields.length > 32) {
                                const warningComment = `/* WARNING: This index originally had ${indexFields.length} columns. It has been truncated to 32 columns due to SQL Server's index column limit. */\n`;
                                console.warn(
                                    `Warning: Index ${indexName} on table ${tableName} has ${indexFields.length} columns. SQL Server limits indexes to 32 columns. The index will be truncated.`
                                );
                                indexFields.length = 32;
                                return indexFields.length > 0
                                    ? `${warningComment}CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${indexName}\nON ${tableName} (${indexFields.join(', ')});`
                                    : '';
                            }

                            return indexFields.length > 0
                                ? `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${indexName}\nON ${tableName} (${indexFields.join(', ')});`
                                : '';
                        })
                        .filter(Boolean);

                    return validIndexes.length > 0
                        ? `\n-- Indexes\n${validIndexes.join('\n')}`
                        : '';
                })()}\n`;
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
                    ? `[${fkTable.schema}].[${fkTable.name}]`
                    : `[${fkTable.name}]`;
                const refTableName = refTable.schema
                    ? `[${refTable.schema}].[${refTable.name}]`
                    : `[${refTable.name}]`;

                return {
                    schema: fkTable.schema || 'dbo',
                    sql: `ALTER TABLE ${fkTableName} ADD CONSTRAINT [${r.name}] FOREIGN KEY([${fkField.name}]) REFERENCES ${refTableName}([${refField.name}]);`,
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
