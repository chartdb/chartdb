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

export function exportMSSQL(diagram: Diagram): string {
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
        sqlScript += `IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${schema}')\nBEGIN\n    EXEC('CREATE SCHEMA [${schema}]');\nEND;\n\n`;
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
                table.comments ? `/**\n${table.comments}\n*/\n` : ''
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

                    const notNull = field.nullable ? '' : ' NOT NULL';

                    // Check if identity column
                    const identity = field.default
                        ?.toLowerCase()
                        .includes('identity')
                        ? ' IDENTITY(1,1)'
                        : '';

                    const unique =
                        !field.primaryKey && field.unique ? ' UNIQUE' : '';

                    // Handle default value using SQL Server specific parser
                    const defaultValue =
                        field.default &&
                        !field.default.toLowerCase().includes('identity')
                            ? ` DEFAULT ${parseMSSQLDefault(field)}`
                            : '';

                    // Do not add PRIMARY KEY as a column constraint - will add as table constraint
                    return `${exportFieldComment(field.comments ?? '')}    ${fieldName} ${typeWithSize}${notNull}${identity}${unique}${defaultValue}`;
                })
                .join(',\n')}${
                table.fields.filter((f) => f.primaryKey).length > 0
                    ? `,\n    PRIMARY KEY (${table.fields
                          .filter((f) => f.primaryKey)
                          .map((f) => `[${f.name}]`)
                          .join(', ')})`
                    : ''
            }\n);\n\n${table.indexes
                .map((index) => {
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
                            ? `${warningComment}CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${indexName}\nON ${tableName} (${indexFields.join(', ')});\n\n`
                            : '';
                    }

                    return indexFields.length > 0
                        ? `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${indexName}\nON ${tableName} (${indexFields.join(', ')});\n\n`
                        : '';
                })
                .join('')}`;
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
                ? `[${sourceTable.schema}].[${sourceTable.name}]`
                : `[${sourceTable.name}]`;
            const targetTableName = targetTable.schema
                ? `[${targetTable.schema}].[${targetTable.name}]`
                : `[${targetTable.name}]`;

            return `ALTER TABLE ${sourceTableName}\nADD CONSTRAINT [${r.name}] FOREIGN KEY([${sourceField.name}]) REFERENCES ${targetTableName}([${targetField.name}]);\n`;
        })
        .filter(Boolean) // Remove empty strings
        .join('\n')}`;

    return sqlScript;
}
