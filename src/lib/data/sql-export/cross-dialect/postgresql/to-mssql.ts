/**
 * Deterministic exporter for PostgreSQL diagrams to SQL Server DDL.
 * Converts PostgreSQL-specific types and features to SQL Server equivalents,
 * with comments for features that cannot be fully converted.
 */

import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import {
    exportFieldComment,
    formatMSSQLTableComment,
    isFunction,
    isKeyword,
    strHasQuotes,
} from '../common';
import {
    postgresqlIndexTypeToSQLServer,
    getTypeMapping,
    getFallbackTypeMapping,
} from './type-mappings';
import {
    detectUnsupportedFeatures,
    formatWarningsHeader,
    getIndexInlineComment,
} from '../unsupported-features';
import { DatabaseType } from '@/lib/domain/database-type';

/**
 * Convert a PostgreSQL default value to SQL Server equivalent
 */
function convertPostgresDefaultToMSSQL(field: DBField): string {
    if (!field.default) {
        return '';
    }

    const defaultValue = field.default.trim();
    const defaultLower = defaultValue.toLowerCase();

    // Handle sequences (nextval) - these become IDENTITY, no default needed
    if (defaultLower.includes('nextval')) {
        return '';
    }

    // Handle PostgreSQL now() -> SQL Server GETDATE()
    if (defaultLower === 'now()' || defaultLower === 'current_timestamp') {
        return 'GETDATE()';
    }

    // Handle UUID generation functions
    if (
        defaultLower.includes('gen_random_uuid') ||
        defaultLower.includes('uuid_generate')
    ) {
        return 'NEWID()';
    }

    // Handle JSONB/JSON functions
    if (
        defaultLower.includes('json_build_object') ||
        defaultLower.includes('jsonb_build_object')
    ) {
        return "N'{}'";
    }
    if (
        defaultLower.includes('json_build_array') ||
        defaultLower.includes('jsonb_build_array')
    ) {
        return "N'[]'";
    }

    // Handle empty array defaults
    if (
        defaultLower === "'{}'::text[]" ||
        defaultLower.match(/'\{\}'::.*\[\]/)
    ) {
        return "N'[]'";
    }

    // Handle array literals
    if (defaultLower.startsWith('array[')) {
        const content = defaultValue.match(/ARRAY\[(.*?)\]/i)?.[1] || '';
        return `N'[${content}]'`;
    }

    // Handle PostgreSQL true/false -> SQL Server 1/0
    if (defaultLower === 'true') {
        return '1';
    }
    if (defaultLower === 'false') {
        return '0';
    }

    // Strip PostgreSQL type casts
    const withoutCast = defaultValue.split('::')[0].trim();

    // Handle SQL Server specific syntax for wrapped defaults
    if (withoutCast.match(/^\(\(.*\)\)$/)) {
        return withoutCast.replace(/^\(\(|\)\)$/g, '');
    }

    // If it's a function call, try to map to SQL Server
    if (isFunction(withoutCast)) {
        return withoutCast;
    }

    // If it's a keyword, keep it
    if (isKeyword(withoutCast)) {
        return withoutCast;
    }

    // If already quoted, convert to N'' style
    if (strHasQuotes(withoutCast)) {
        // Convert single quotes to N'' style
        if (withoutCast.startsWith("'") && withoutCast.endsWith("'")) {
            return `N${withoutCast}`;
        }
        return withoutCast;
    }

    // If it's a number, keep it
    if (/^-?\d+(\.\d+)?$/.test(withoutCast)) {
        return withoutCast;
    }

    // For other cases, wrap in N''
    return `N'${withoutCast.replace(/'/g, "''")}'`;
}

/**
 * Check if a field type matches a custom enum or composite type
 */
function findCustomType(
    fieldTypeName: string,
    customTypes: DBCustomType[]
): DBCustomType | undefined {
    const normalizedName = fieldTypeName.toLowerCase();
    return customTypes.find((ct) => {
        const ctName = ct.schema ? `${ct.schema}.${ct.name}` : ct.name;
        return (
            ctName.toLowerCase() === normalizedName ||
            ct.name.toLowerCase() === normalizedName
        );
    });
}

/**
 * Map a PostgreSQL type to SQL Server type with size/precision handling
 * @param field - The field to map
 * @param customTypes - Custom types defined in the schema
 * @param isIndexed - Whether this field is used in an index (affects MAX type handling)
 */
function mapPostgresTypeToMSSQL(
    field: DBField,
    customTypes: DBCustomType[],
    isIndexed: boolean = false
): {
    typeName: string;
    inlineComment: string | null;
} {
    const originalType = field.type.name.toLowerCase();
    let inlineComment: string | null = null;

    // SQL Server has a 900-byte limit for index keys. NVARCHAR uses 2 bytes per char,
    // so 450 chars is the max for indexed NVARCHAR columns.
    const indexSafeNvarcharSize = 'NVARCHAR(450)';

    // Handle array types
    if (field.isArray || originalType.endsWith('[]')) {
        // Arrays used in indexes need bounded size (though this is unusual)
        const arrayType = isIndexed ? indexSafeNvarcharSize : 'NVARCHAR(MAX)';
        return {
            typeName: arrayType,
            inlineComment: `Was: ${field.type.name} (PostgreSQL array${isIndexed ? ', size limited for index' : ', stored as JSON'})`,
        };
    }

    // Check for custom types (ENUM or composite)
    const customType = findCustomType(field.type.name, customTypes);
    if (customType) {
        if (customType.kind === 'enum') {
            // ENUMs become NVARCHAR(255)
            return {
                typeName: 'NVARCHAR(255)',
                inlineComment: null, // Inline comment handled separately via getEnumValuesComment
            };
        } else if (customType.kind === 'composite') {
            // Composite types become NVARCHAR(MAX) as JSON (shouldn't be indexed normally)
            const compositeType = isIndexed
                ? indexSafeNvarcharSize
                : 'NVARCHAR(MAX)';
            return {
                typeName: compositeType,
                inlineComment: `Was: ${field.type.name} (PostgreSQL composite type${isIndexed ? ', size limited for index' : ''})`,
            };
        }
    }

    // Look up mapping
    const mapping = getTypeMapping(originalType, 'sqlserver');
    const effectiveMapping = mapping || getFallbackTypeMapping('sqlserver');

    let typeName = effectiveMapping.targetType;

    // If indexed and type contains (MAX), replace with bounded size for index compatibility
    // SQL Server cannot use MAX types as index keys
    if (isIndexed && typeName.includes('(MAX)')) {
        typeName = typeName.replace('(MAX)', '(450)');
        inlineComment = `Was: ${field.type.name} (size limited for index)`;
    }

    // Handle size/precision
    if (field.characterMaximumLength) {
        if (
            typeName === 'VARCHAR' ||
            typeName === 'NVARCHAR' ||
            typeName === 'CHAR' ||
            typeName === 'NCHAR' ||
            typeName === 'VARBINARY'
        ) {
            typeName = `${typeName}(${field.characterMaximumLength})`;
        }
    } else if (effectiveMapping.defaultLength) {
        if (
            typeName === 'VARCHAR' ||
            typeName === 'NVARCHAR' ||
            typeName === 'CHAR' ||
            typeName === 'NCHAR'
        ) {
            typeName = `${typeName}(${effectiveMapping.defaultLength})`;
        }
    }

    if (field.precision !== undefined && field.scale !== undefined) {
        if (
            typeName === 'DECIMAL' ||
            typeName === 'NUMERIC' ||
            typeName === 'DATETIME2' ||
            typeName === 'DATETIMEOFFSET'
        ) {
            if (typeName === 'DATETIME2' || typeName === 'DATETIMEOFFSET') {
                // For datetime types, only precision applies (fractional seconds)
                if (field.precision !== null && field.precision <= 7) {
                    typeName = `${typeName}(${field.precision})`;
                }
            } else {
                typeName = `${typeName}(${field.precision}, ${field.scale})`;
            }
        }
    } else if (field.precision !== undefined) {
        if (typeName === 'DECIMAL' || typeName === 'NUMERIC') {
            typeName = `${typeName}(${field.precision})`;
        }
    } else if (
        effectiveMapping.defaultPrecision &&
        (typeName === 'DECIMAL' || typeName === 'NUMERIC')
    ) {
        typeName = `${typeName}(${effectiveMapping.defaultPrecision}, ${effectiveMapping.defaultScale || 0})`;
    }

    // Set inline comment if conversion note exists (but don't override index-related comment)
    if (effectiveMapping.includeInlineComment && !inlineComment) {
        inlineComment = `Was: ${field.type.name}`;
    }

    return { typeName, inlineComment };
}

/**
 * Check if a field should have IDENTITY
 */
function isIdentity(field: DBField): boolean {
    // Check increment flag
    if (field.increment) {
        return true;
    }

    // Check for serial types
    const typeLower = field.type.name.toLowerCase();
    if (
        typeLower === 'serial' ||
        typeLower === 'smallserial' ||
        typeLower === 'bigserial'
    ) {
        return true;
    }

    // Check for nextval in default
    if (field.default?.toLowerCase().includes('nextval')) {
        return true;
    }

    return false;
}

/**
 * Build enum value comment for custom enum types
 */
function getEnumValuesComment(
    fieldTypeName: string,
    customTypes: DBCustomType[]
): string | null {
    const enumType = customTypes.find((ct) => {
        const ctName = ct.schema ? `${ct.schema}.${ct.name}` : ct.name;
        return (
            ctName.toLowerCase() === fieldTypeName.toLowerCase() ||
            ct.name.toLowerCase() === fieldTypeName.toLowerCase()
        );
    });

    if (enumType?.kind === 'enum' && enumType.values?.length) {
        return `PostgreSQL ENUM: '${enumType.values.join("', '")}'`;
    }

    return null;
}

/**
 * Main export function: PostgreSQL diagram to SQL Server DDL
 */
export function exportPostgreSQLToMSSQL({
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

    // Detect unsupported features for warnings header
    const unsupportedFeatures = detectUnsupportedFeatures(
        diagram,
        DatabaseType.SQL_SERVER
    );

    // Build output
    let sqlScript = formatWarningsHeader(
        unsupportedFeatures,
        'PostgreSQL',
        'SQL Server'
    );

    if (!onlyRelationships) {
        // Create schemas if they don't exist
        const schemas = new Set<string>();
        tables.forEach((table) => {
            if (table.schema) {
                schemas.add(table.schema);
            }
        });

        schemas.forEach((schema) => {
            sqlScript += `IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${schema}')\nBEGIN\n    EXEC('CREATE SCHEMA [${schema}]');\nEND;\nGO\n`;
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

                const tableName = table.schema
                    ? `[${table.schema}].[${table.name}]`
                    : `[${table.name}]`;

                // Get primary key fields
                const primaryKeyFields = table.fields.filter(
                    (f) => f.primaryKey
                );

                // Check if we have following constraints (for comma placement)
                const validCheckConstraints = (
                    table.checkConstraints ?? []
                ).filter((c) => c.expression && c.expression.trim());
                const hasFollowingConstraints =
                    primaryKeyFields.length > 0 ||
                    validCheckConstraints.length > 0;

                // Compute which fields are used in indexes (for type size limiting)
                // SQL Server has a 900-byte limit for index keys
                const indexedFieldIds = new Set<string>();
                table.indexes.forEach((idx) => {
                    idx.fieldIds.forEach((fieldId) => {
                        indexedFieldIds.add(fieldId);
                    });
                });
                // Also add primary key fields as they are indexed
                primaryKeyFields.forEach((f) => {
                    indexedFieldIds.add(f.id);
                });
                // Also add unique fields as they create implicit indexes
                table.fields.forEach((f) => {
                    if (f.unique) {
                        indexedFieldIds.add(f.id);
                    }
                });

                const fieldDefinitions = table.fields.map(
                    (field: DBField, index: number, allFields: DBField[]) => {
                        const fieldName = `[${field.name}]`;

                        // Check if this field is used in an index
                        const isIndexed = indexedFieldIds.has(field.id);

                        // Map type to SQL Server
                        const { typeName, inlineComment } =
                            mapPostgresTypeToMSSQL(
                                field,
                                customTypes,
                                isIndexed
                            );

                        // Check for enum type and get values
                        const enumComment = getEnumValuesComment(
                            field.type.name,
                            customTypes
                        );

                        // Combine inline comments
                        const fullInlineComment = enumComment || inlineComment;

                        const notNull = field.nullable ? '' : ' NOT NULL';

                        // Handle IDENTITY
                        const identity = isIdentity(field)
                            ? ' IDENTITY(1,1)'
                            : '';

                        // Only add UNIQUE constraint if not primary key
                        const unique =
                            !field.primaryKey && field.unique ? ' UNIQUE' : '';

                        // Handle default value
                        const convertedDefault =
                            convertPostgresDefaultToMSSQL(field);
                        const defaultValue =
                            convertedDefault && !identity
                                ? ` DEFAULT ${convertedDefault}`
                                : '';

                        // Build inline SQL comment for conversion notes
                        const sqlInlineComment = fullInlineComment
                            ? ` -- ${fullInlineComment}`
                            : '';

                        // Determine if this field needs a trailing comma
                        const isLastField = index === allFields.length - 1;
                        const needsComma =
                            !isLastField || hasFollowingConstraints;

                        return `${exportFieldComment(field.comments ?? '')}    ${fieldName} ${typeName}${notNull}${identity}${unique}${defaultValue}${needsComma ? ',' : ''}${sqlInlineComment}`;
                    }
                );

                return `${
                    table.comments
                        ? formatMSSQLTableComment(table.comments)
                        : ''
                }CREATE TABLE ${tableName} (\n${fieldDefinitions.join('\n')}${
                    // Add PRIMARY KEY as table constraint
                    primaryKeyFields.length > 0
                        ? `\n    PRIMARY KEY (${primaryKeyFields
                              .map((f) => `[${f.name}]`)
                              .join(
                                  ', '
                              )})${validCheckConstraints.length > 0 ? ',' : ''}`
                        : ''
                }${
                    // Add check constraints (already computed above as validCheckConstraints)
                    validCheckConstraints.length > 0
                        ? validCheckConstraints
                              .map(
                                  (constraint, index) =>
                                      `${index > 0 ? ',' : ''}\n    CHECK (${constraint.expression})`
                              )
                              .join('')
                        : ''
                }\n);\nGO${
                    // Add indexes
                    (() => {
                        const validIndexes = table.indexes
                            .map((index) => {
                                // Skip primary key indexes
                                if (index.isPrimaryKey) {
                                    return '';
                                }

                                // Get the list of fields for this index
                                const indexFields = index.fieldIds
                                    .map((fieldId) => {
                                        const field = table.fields.find(
                                            (f) => f.id === fieldId
                                        );
                                        return field ? field : null;
                                    })
                                    .filter(Boolean);

                                // Skip if matches primary key
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

                                // Get index type conversion
                                const indexType = (
                                    index.type || 'btree'
                                ).toLowerCase();
                                const indexTypeMapping =
                                    postgresqlIndexTypeToSQLServer[indexType];
                                const indexInlineComment =
                                    getIndexInlineComment(index, 'sqlserver');

                                const indexName = table.schema
                                    ? `[${table.schema}_${index.name}]`
                                    : `[${index.name}]`;

                                const indexFieldNames = indexFields
                                    .map((field) =>
                                        field ? `[${field.name}]` : ''
                                    )
                                    .filter(Boolean);

                                // SQL Server has 32 column limit
                                if (indexFieldNames.length > 32) {
                                    console.warn(
                                        `Warning: Index ${indexName} has ${indexFieldNames.length} columns. Truncating to 32.`
                                    );
                                    indexFieldNames.length = 32;
                                }

                                const commentStr = indexInlineComment
                                    ? ` -- ${indexInlineComment}`
                                    : '';

                                return indexFieldNames.length > 0
                                    ? `CREATE ${index.unique ? 'UNIQUE ' : ''}${indexTypeMapping?.targetType === 'CLUSTERED' ? 'CLUSTERED ' : 'NONCLUSTERED '}INDEX ${indexName} ON ${tableName} (${indexFieldNames.join(', ')});${commentStr}`
                                    : '';
                            })
                            .filter(Boolean)
                            .sort((a, b) => a.localeCompare(b));

                        return validIndexes.length > 0
                            ? `\n-- Indexes\n${validIndexes.join('\nGO\n')}\nGO`
                            : '';
                    })()
                }`;
            })
            .filter(Boolean)
            .join('\n');

        // Add extended properties for table/column comments
        const commentStatements: string[] = [];
        for (const table of tables) {
            if (table.isView) continue;

            const schemaName = table.schema || 'dbo';

            if (table.comments) {
                commentStatements.push(
                    `EXEC sp_addextendedproperty @name=N'MS_Description', @value=N'${table.comments.replace(/'/g, "''")}', @level0type=N'SCHEMA', @level0name=N'${schemaName}', @level1type=N'TABLE', @level1name=N'${table.name}';`
                );
            }

            for (const field of table.fields) {
                if (field.comments) {
                    commentStatements.push(
                        `EXEC sp_addextendedproperty @name=N'MS_Description', @value=N'${field.comments.replace(/'/g, "''")}', @level0type=N'SCHEMA', @level0name=N'${schemaName}', @level1type=N'TABLE', @level1name=N'${table.name}', @level2type=N'COLUMN', @level2name=N'${field.name}';`
                    );
                }
            }
        }

        if (commentStatements.length > 0) {
            sqlScript += '\n-- Table and column descriptions\n';
            sqlScript += commentStatements.join('\nGO\n');
            sqlScript += '\nGO\n';
        }
    }

    // Generate foreign keys
    if (relationships.length > 0) {
        sqlScript += '\n-- Foreign key constraints\n';

        // Process relationships and group by schema
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
                    return null;
                }

                const sourceField = sourceTable.fields.find(
                    (f) => f.id === r.sourceFieldId
                );
                const targetField = targetTable.fields.find(
                    (f) => f.id === r.targetFieldId
                );

                if (!sourceField || !targetField) {
                    return null;
                }

                // Determine FK placement based on cardinality
                // - FK goes on the "many" side when cardinalities differ
                // - FK goes on target when cardinalities are the same (one:one, many:many)
                let fkTable, fkField, refTable, refField;

                if (
                    r.sourceCardinality === 'many' &&
                    r.targetCardinality === 'many'
                ) {
                    // Many-to-many relationships need a junction table, skip
                    return null;
                } else if (
                    r.sourceCardinality === 'many' &&
                    r.targetCardinality === 'one'
                ) {
                    // FK goes on source table (the many side)
                    fkTable = sourceTable;
                    fkField = sourceField;
                    refTable = targetTable;
                    refField = targetField;
                } else {
                    // All other cases: FK goes on target table
                    fkTable = targetTable;
                    fkField = targetField;
                    refTable = sourceTable;
                    refField = sourceField;
                }

                const fkTableName = fkTable.schema
                    ? `[${fkTable.schema}].[${fkTable.name}]`
                    : `[${fkTable.name}]`;
                const refTableName = refTable.schema
                    ? `[${refTable.schema}].[${refTable.name}]`
                    : `[${refTable.name}]`;

                return {
                    schema: fkTable.schema || 'dbo',
                    sql: `ALTER TABLE ${fkTableName} ADD CONSTRAINT [${r.name || `fk_${fkTable.name}_${fkField.name}`}] FOREIGN KEY([${fkField.name}]) REFERENCES ${refTableName}([${refField.name}]);`,
                };
            })
            .filter(Boolean) as { schema: string; sql: string }[];

        // Group by schema
        const fksBySchema = foreignKeys.reduce(
            (acc, fk) => {
                if (!acc[fk.schema]) {
                    acc[fk.schema] = [];
                }
                acc[fk.schema].push(fk.sql);
                return acc;
            },
            {} as Record<string, string[]>
        );

        // Sort schemas and output
        const sortedSchemas = Object.keys(fksBySchema).sort();
        const fkSql = sortedSchemas
            .map((schema, index) => {
                const schemaFks = fksBySchema[schema].join('\nGO\n');
                if (index === 0) {
                    return `-- Schema: ${schema}\n${schemaFks}`;
                } else {
                    return `\n-- Schema: ${schema}\n${schemaFks}`;
                }
            })
            .join('\n');

        sqlScript += fkSql;
        sqlScript += '\nGO\n';
    }

    return sqlScript;
}
