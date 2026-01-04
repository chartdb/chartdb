/**
 * Deterministic exporter for PostgreSQL diagrams to MySQL DDL.
 * Converts PostgreSQL-specific types and features to MySQL equivalents,
 * with comments for features that cannot be fully converted.
 */

import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import {
    exportFieldComment,
    escapeSQLComment,
    formatTableComment,
    isFunction,
    isKeyword,
    strHasQuotes,
} from '../common';
import {
    postgresqlIndexTypeToMySQL,
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
 * Convert a PostgreSQL default value to MySQL equivalent
 */
function convertPostgresDefaultToMySQL(field: DBField): string {
    if (!field.default) {
        return '';
    }

    const defaultValue = field.default.trim();
    const defaultLower = defaultValue.toLowerCase();

    // Handle sequences (nextval) - these become AUTO_INCREMENT, no default needed
    if (defaultLower.includes('nextval')) {
        return '';
    }

    // Handle PostgreSQL now() -> MySQL CURRENT_TIMESTAMP
    if (defaultLower === 'now()' || defaultLower === 'current_timestamp') {
        return 'CURRENT_TIMESTAMP';
    }

    // Handle UUID generation functions
    if (
        defaultLower.includes('gen_random_uuid') ||
        defaultLower.includes('uuid_generate')
    ) {
        return '(UUID())';
    }

    // Handle JSONB/JSON functions
    if (
        defaultLower.includes('json_build_object') ||
        defaultLower.includes('jsonb_build_object')
    ) {
        return "'{}'";
    }
    if (
        defaultLower.includes('json_build_array') ||
        defaultLower.includes('jsonb_build_array')
    ) {
        return "'[]'";
    }

    // Handle empty array defaults
    if (
        defaultLower === "'{}'::text[]" ||
        defaultLower.match(/'\{\}'::.*\[\]/)
    ) {
        return "'[]'";
    }

    // Handle array literals like ARRAY[1,2,3]
    if (defaultLower.startsWith('array[')) {
        const content = defaultValue.match(/ARRAY\[(.*?)\]/i)?.[1] || '';
        return `'[${content}]'`;
    }

    // Strip PostgreSQL type casts
    const withoutCast = defaultValue.split('::')[0].trim();

    // If it's a function call, keep it (MySQL might support it)
    if (isFunction(withoutCast)) {
        return withoutCast;
    }

    // If it's a keyword, keep it
    if (isKeyword(withoutCast)) {
        return withoutCast;
    }

    // If already quoted, keep it
    if (strHasQuotes(withoutCast)) {
        return withoutCast;
    }

    // If it's a number, keep it
    if (/^-?\d+(\.\d+)?$/.test(withoutCast)) {
        return withoutCast;
    }

    // For other cases, add quotes
    return `'${withoutCast.replace(/'/g, "''")}'`;
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
 * Map a PostgreSQL type to MySQL type with size/precision handling
 */
function mapPostgresTypeToMySQL(
    field: DBField,
    customTypes: DBCustomType[]
): {
    typeName: string;
    inlineComment: string | null;
} {
    const originalType = field.type.name.toLowerCase();
    let inlineComment: string | null = null;

    // Handle array types
    if (field.isArray || originalType.endsWith('[]')) {
        return {
            typeName: 'JSON',
            inlineComment: `Was: ${field.type.name} (PostgreSQL array)`,
        };
    }

    // Check for custom types (ENUM or composite)
    const customType = findCustomType(field.type.name, customTypes);
    if (customType) {
        if (customType.kind === 'enum') {
            // ENUMs become VARCHAR(255)
            return {
                typeName: 'VARCHAR(255)',
                inlineComment: null, // Inline comment handled separately via getEnumValuesComment
            };
        } else if (customType.kind === 'composite') {
            // Composite types become JSON
            return {
                typeName: 'JSON',
                inlineComment: `Was: ${field.type.name} (PostgreSQL composite type)`,
            };
        }
    }

    // Look up mapping
    const mapping = getTypeMapping(originalType, 'mysql');
    const effectiveMapping = mapping || getFallbackTypeMapping('mysql');

    let typeName = effectiveMapping.targetType;

    // Handle size/precision
    if (field.characterMaximumLength) {
        if (
            typeName === 'VARCHAR' ||
            typeName === 'CHAR' ||
            typeName === 'VARBINARY'
        ) {
            typeName = `${typeName}(${field.characterMaximumLength})`;
        }
    } else if (effectiveMapping.defaultLength) {
        if (typeName === 'VARCHAR' || typeName === 'CHAR') {
            typeName = `${typeName}(${effectiveMapping.defaultLength})`;
        }
    }

    if (field.precision !== undefined && field.scale !== undefined) {
        if (typeName === 'DECIMAL' || typeName === 'NUMERIC') {
            typeName = `${typeName}(${field.precision}, ${field.scale})`;
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

    // Set inline comment if conversion note exists
    if (effectiveMapping.includeInlineComment) {
        inlineComment = `Was: ${field.type.name}`;
    }

    return { typeName, inlineComment };
}

/**
 * Check if a field should have AUTO_INCREMENT
 */
function isAutoIncrement(field: DBField): boolean {
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
    // Find matching enum type
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
 * Main export function: PostgreSQL diagram to MySQL DDL
 */
export function exportPostgreSQLToMySQL({
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
        DatabaseType.MYSQL
    );

    // Build output
    let sqlScript = formatWarningsHeader(
        unsupportedFeatures,
        'PostgreSQL',
        'MySQL'
    );

    if (!onlyRelationships) {
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
                const primaryKeyFields = table.fields.filter(
                    (f) => f.primaryKey
                );

                return `${
                    table.comments ? formatTableComment(table.comments) : ''
                }\nCREATE TABLE IF NOT EXISTS ${tableName} (\n${table.fields
                    .map((field: DBField) => {
                        const fieldName = `\`${field.name}\``;

                        // Map type to MySQL
                        const { typeName, inlineComment } =
                            mapPostgresTypeToMySQL(field, customTypes);

                        // Check for enum type and get values
                        const enumComment = getEnumValuesComment(
                            field.type.name,
                            customTypes
                        );

                        // Combine inline comments
                        const fullInlineComment = enumComment || inlineComment;

                        const notNull = field.nullable ? '' : ' NOT NULL';

                        // Handle auto_increment
                        const autoIncrement = isAutoIncrement(field)
                            ? ' AUTO_INCREMENT'
                            : '';

                        // Only add UNIQUE constraint if the field is not part of the primary key
                        const unique =
                            !field.primaryKey && field.unique ? ' UNIQUE' : '';

                        // Handle default value
                        const convertedDefault =
                            convertPostgresDefaultToMySQL(field);
                        const defaultValue =
                            convertedDefault && !autoIncrement
                                ? ` DEFAULT ${convertedDefault}`
                                : '';

                        // MySQL supports inline column comments
                        const comment = field.comments
                            ? ` COMMENT '${escapeSQLComment(field.comments)}'`
                            : '';

                        // Build inline SQL comment for conversion notes
                        const sqlInlineComment = fullInlineComment
                            ? ` -- ${fullInlineComment}`
                            : '';

                        return `${exportFieldComment(field.comments ?? '')}    ${fieldName} ${typeName}${notNull}${autoIncrement}${unique}${defaultValue}${comment}${sqlInlineComment}`;
                    })
                    .join(',\n')}${
                    // Add PRIMARY KEY as table constraint
                    primaryKeyFields.length > 0
                        ? `,\n    ${(() => {
                              // Find PK index to get the constraint name
                              const pkIndex = table.indexes.find(
                                  (idx) => idx.isPrimaryKey
                              );
                              return pkIndex?.name
                                  ? `CONSTRAINT \`${pkIndex.name}\` `
                                  : '';
                          })()}PRIMARY KEY (${primaryKeyFields
                              .map((f) => `\`${f.name}\``)
                              .join(', ')})`
                        : ''
                }${
                    // Add CHECK constraints (filter out empty expressions)
                    (() => {
                        const validChecks = (
                            table.checkConstraints ?? []
                        ).filter((c) => c.expression && c.expression.trim());
                        return validChecks.length > 0
                            ? validChecks
                                  .map(
                                      (constraint) =>
                                          `,\n    CHECK (${constraint.expression})`
                                  )
                                  .join('')
                            : '';
                    })()
                }\n)${
                    // MySQL supports table comments
                    table.comments
                        ? ` COMMENT='${escapeSQLComment(table.comments)}'`
                        : ''
                };${
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

                                // Get index type conversion info
                                const indexType = (
                                    index.type || 'btree'
                                ).toLowerCase();
                                const indexTypeMapping =
                                    postgresqlIndexTypeToMySQL[indexType];
                                const indexInlineComment =
                                    getIndexInlineComment(index, 'mysql');

                                // Create index name
                                const fieldNamesForIndex = indexFields
                                    .map((field) => field?.name || '')
                                    .join('_');
                                const uniqueIndicator = index.unique
                                    ? '_unique'
                                    : '';
                                const indexName = `\`idx_${table.name}_${fieldNamesForIndex}${uniqueIndicator}\``;

                                // Get the properly quoted field names
                                const indexFieldNames = indexFields
                                    .map((field) =>
                                        field ? `\`${field.name}\`` : ''
                                    )
                                    .filter(Boolean);

                                // Check for text/blob fields that need prefix length
                                const indexFieldsWithPrefix =
                                    indexFieldNames.map((name) => {
                                        const field = indexFields.find(
                                            (f) => `\`${f?.name}\`` === name
                                        );
                                        if (!field) return name;

                                        const typeName =
                                            field.type.name.toLowerCase();
                                        // Check if it maps to TEXT, JSON, or BLOB in MySQL
                                        const mapping = getTypeMapping(
                                            typeName,
                                            'mysql'
                                        );
                                        const targetType = (
                                            mapping?.targetType || ''
                                        ).toUpperCase();
                                        if (
                                            targetType === 'TEXT' ||
                                            targetType === 'LONGTEXT' ||
                                            targetType === 'MEDIUMTEXT' ||
                                            targetType === 'JSON' ||
                                            targetType === 'BLOB' ||
                                            targetType === 'LONGBLOB'
                                        ) {
                                            return `${name}(255)`;
                                        }
                                        return name;
                                    });

                                const indexTypeStr =
                                    indexTypeMapping?.targetType &&
                                    indexTypeMapping.targetType !== 'BTREE'
                                        ? ` USING ${indexTypeMapping.targetType}`
                                        : '';

                                const commentStr = indexInlineComment
                                    ? ` -- ${indexInlineComment}`
                                    : '';

                                return indexFieldNames.length > 0
                                    ? `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName}${indexTypeStr} (${indexFieldsWithPrefix.join(', ')});${commentStr}`
                                    : '';
                            })
                            .filter(Boolean)
                            .sort((a, b) => a.localeCompare(b));

                        return validIndexes.length > 0
                            ? `\n-- Indexes\n${validIndexes.join('\n')}`
                            : '';
                    })()
                }`;
            })
            .filter(Boolean)
            .join('\n');
    }

    // Generate foreign keys
    if (relationships.length > 0) {
        sqlScript += '\n-- Foreign key constraints\n';

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
                    fkTable = targetTable;
                    fkField = targetField;
                    refTable = sourceTable;
                    refField = sourceField;
                } else if (
                    r.sourceCardinality === 'many' &&
                    r.targetCardinality === 'one'
                ) {
                    fkTable = sourceTable;
                    fkField = sourceField;
                    refTable = targetTable;
                    refField = targetField;
                } else if (
                    r.sourceCardinality === 'one' &&
                    r.targetCardinality === 'one'
                ) {
                    fkTable = sourceTable;
                    fkField = sourceField;
                    refTable = targetTable;
                    refField = targetField;
                } else {
                    // Many-to-many relationships need a junction table, skip
                    return '';
                }

                const fkTableName = fkTable.schema
                    ? `\`${fkTable.schema}\`.\`${fkTable.name}\``
                    : `\`${fkTable.name}\``;
                const refTableName = refTable.schema
                    ? `\`${refTable.schema}\`.\`${refTable.name}\``
                    : `\`${refTable.name}\``;

                const constraintName = `\`fk_${fkTable.name}_${fkField.name}\``;

                return `ALTER TABLE ${fkTableName} ADD CONSTRAINT ${constraintName} FOREIGN KEY(\`${fkField.name}\`) REFERENCES ${refTableName}(\`${refField.name}\`);`;
            })
            .filter(Boolean);

        sqlScript += foreignKeys.join('\n');
    }

    return sqlScript;
}
