/**
 * Detects PostgreSQL features that cannot be fully converted to target dialects.
 * Used to generate warning comments in cross-dialect exports.
 */

import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import type { DBIndex } from '@/lib/domain/db-index';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import { DatabaseType } from '@/lib/domain/database-type';
import {
    getTypeMapping,
    postgresqlIndexTypeToMySQL,
    postgresqlIndexTypeToSQLServer,
} from './type-mappings';

export type UnsupportedFeatureType =
    | 'type'
    | 'index'
    | 'constraint'
    | 'default'
    | 'custom_type'
    | 'array'
    | 'schema';

export interface UnsupportedFeature {
    type: UnsupportedFeatureType;
    tableName?: string;
    objectName: string;
    feature: string;
    recommendation: string;
}

/**
 * Detect all unsupported PostgreSQL features when converting to a target dialect
 */
export function detectUnsupportedFeatures(
    diagram: Diagram,
    targetDialect: DatabaseType
): UnsupportedFeature[] {
    const features: UnsupportedFeature[] = [];
    const dialectKey =
        targetDialect === DatabaseType.SQL_SERVER ? 'sqlserver' : 'mysql';

    // Check custom types (ENUMs and composites)
    if (diagram.customTypes && diagram.customTypes.length > 0) {
        features.push(
            ...detectCustomTypeIssues(diagram.customTypes, dialectKey)
        );
    }

    // Check each table
    if (diagram.tables) {
        for (const table of diagram.tables) {
            if (table.isView) continue;

            // Check fields
            features.push(...detectFieldIssues(table, dialectKey));

            // Check indexes
            features.push(...detectIndexIssues(table, dialectKey));
        }
    }

    return features;
}

/**
 * Detect issues with custom types (ENUMs, composites)
 */
function detectCustomTypeIssues(
    customTypes: DBCustomType[],
    dialectKey: 'mysql' | 'sqlserver'
): UnsupportedFeature[] {
    const features: UnsupportedFeature[] = [];

    for (const customType of customTypes) {
        const typeName = customType.schema
            ? `${customType.schema}.${customType.name}`
            : customType.name;

        if (customType.kind === 'enum') {
            const values = customType.values?.join("', '") || '';
            features.push({
                type: 'custom_type',
                objectName: typeName,
                feature: `ENUM type with values: '${values}'`,
                recommendation:
                    dialectKey === 'mysql'
                        ? `Converted to VARCHAR(255). Consider using MySQL ENUM or CHECK constraint.`
                        : `Converted to NVARCHAR(255). Consider using CHECK constraint.`,
            });
        } else if (customType.kind === 'composite') {
            const fields =
                customType.fields?.map((f) => `${f.field}: ${f.type}`) || [];
            features.push({
                type: 'custom_type',
                objectName: typeName,
                feature: `Composite type with fields: ${fields.join(', ')}`,
                recommendation:
                    dialectKey === 'mysql'
                        ? `Converted to JSON. Consider restructuring as separate columns or JSON.`
                        : `Converted to NVARCHAR(MAX) as JSON. Consider restructuring as separate columns.`,
            });
        }
    }

    return features;
}

/**
 * Detect issues with field types and defaults
 */
function detectFieldIssues(
    table: DBTable,
    dialectKey: 'mysql' | 'sqlserver'
): UnsupportedFeature[] {
    const features: UnsupportedFeature[] = [];
    const tableName = table.schema
        ? `${table.schema}.${table.name}`
        : table.name;

    for (const field of table.fields) {
        const typeName = field.type.name.toLowerCase();

        // Check for array types
        if (field.isArray || typeName.endsWith('[]')) {
            features.push({
                type: 'array',
                tableName,
                objectName: field.name,
                feature: `Array type: ${typeName}`,
                recommendation:
                    dialectKey === 'mysql'
                        ? `Converted to JSON. Use JSON_ARRAY() for inserts.`
                        : `Converted to NVARCHAR(MAX) as JSON array.`,
            });
        }

        // Check type mapping for conversion notes
        const mapping = getTypeMapping(typeName, dialectKey);
        if (mapping?.conversionNote) {
            features.push({
                type: 'type',
                tableName,
                objectName: field.name,
                feature: `Type: ${typeName}`,
                recommendation: mapping.conversionNote,
            });
        }

        // Check for PostgreSQL-specific defaults
        if (field.default) {
            const defaultLower = field.default.toLowerCase();

            // Sequences
            if (defaultLower.includes('nextval')) {
                const match = field.default.match(/nextval\('([^']+)'/);
                const seqName = match ? match[1] : 'unknown';
                features.push({
                    type: 'default',
                    tableName,
                    objectName: field.name,
                    feature: `Sequence: ${seqName}`,
                    recommendation:
                        dialectKey === 'mysql'
                            ? `Converted to AUTO_INCREMENT.`
                            : `Converted to IDENTITY(1,1).`,
                });
            }

            // PostgreSQL-specific functions
            if (
                defaultLower.includes('gen_random_uuid') ||
                defaultLower.includes('uuid_generate')
            ) {
                features.push({
                    type: 'default',
                    tableName,
                    objectName: field.name,
                    feature: `UUID generation function`,
                    recommendation:
                        dialectKey === 'mysql'
                            ? `Use UUID() function in MySQL.`
                            : `Use NEWID() function in SQL Server.`,
                });
            }

            // Array constructors
            if (
                defaultLower.includes('array[') ||
                defaultLower.includes("'{}")
            ) {
                features.push({
                    type: 'default',
                    tableName,
                    objectName: field.name,
                    feature: `Array default value`,
                    recommendation:
                        dialectKey === 'mysql'
                            ? `Converted to JSON array literal.`
                            : `Converted to JSON array string.`,
                });
            }
        }
    }

    return features;
}

/**
 * Detect issues with index types
 */
function detectIndexIssues(
    table: DBTable,
    dialectKey: 'mysql' | 'sqlserver'
): UnsupportedFeature[] {
    const features: UnsupportedFeature[] = [];
    const tableName = table.schema
        ? `${table.schema}.${table.name}`
        : table.name;

    const indexTypeMap =
        dialectKey === 'mysql'
            ? postgresqlIndexTypeToMySQL
            : postgresqlIndexTypeToSQLServer;

    for (const index of table.indexes) {
        if (index.isPrimaryKey) continue;

        const indexType = (index.type || 'btree').toLowerCase();
        const mapping = indexTypeMap[indexType];

        if (mapping?.note) {
            features.push({
                type: 'index',
                tableName,
                objectName: index.name,
                feature: `${indexType.toUpperCase()} index`,
                recommendation: mapping.note,
            });
        }
    }

    return features;
}

/**
 * Format unsupported features as a warning comment block for SQL output
 */
export function formatWarningsHeader(
    features: UnsupportedFeature[],
    sourceDialect: string,
    targetDialect: string
): string {
    if (features.length === 0) {
        return `-- ${sourceDialect} to ${targetDialect} conversion\n-- Generated by ChartDB\n`;
    }

    let header = `-- ${sourceDialect} to ${targetDialect} conversion\n`;
    header += `-- Generated by ChartDB\n`;
    header += `--\n`;
    header += `-- CONVERSION NOTES (${features.length} items):\n`;

    // Group by type
    const grouped = groupFeaturesByType(features);

    for (const [type, items] of Object.entries(grouped)) {
        header += `--\n`;
        header += `-- ${formatTypeLabel(type as UnsupportedFeatureType)}:\n`;
        for (const item of items) {
            const location = item.tableName
                ? `${item.tableName}.${item.objectName}`
                : item.objectName;
            header += `--   - ${location}: ${item.feature}\n`;
        }
    }

    header += `--\n\n`;
    return header;
}

/**
 * Group features by their type for organized output
 */
function groupFeaturesByType(
    features: UnsupportedFeature[]
): Record<string, UnsupportedFeature[]> {
    const grouped: Record<string, UnsupportedFeature[]> = {};

    for (const feature of features) {
        if (!grouped[feature.type]) {
            grouped[feature.type] = [];
        }
        grouped[feature.type].push(feature);
    }

    return grouped;
}

/**
 * Format type label for display
 */
function formatTypeLabel(type: UnsupportedFeatureType): string {
    switch (type) {
        case 'custom_type':
            return 'Custom Types (ENUM/Composite)';
        case 'array':
            return 'Array Fields';
        case 'type':
            return 'Type Conversions';
        case 'index':
            return 'Index Type Changes';
        case 'default':
            return 'Default Value Conversions';
        case 'constraint':
            return 'Constraint Changes';
        case 'schema':
            return 'Schema Changes';
        default:
            return type;
    }
}

/**
 * Get inline comment for a specific field conversion
 */
export function getFieldInlineComment(
    field: DBField,
    dialectKey: 'mysql' | 'sqlserver'
): string | null {
    const typeName = field.type.name.toLowerCase();

    // Array types
    if (field.isArray || typeName.endsWith('[]')) {
        return `Was: ${field.type.name} (PostgreSQL array)`;
    }

    // Check type mapping
    const mapping = getTypeMapping(typeName, dialectKey);
    if (mapping?.includeInlineComment && mapping.conversionNote) {
        return `Was: ${field.type.name}`;
    }

    return null;
}

/**
 * Get inline comment for an index conversion
 */
export function getIndexInlineComment(
    index: DBIndex,
    dialectKey: 'mysql' | 'sqlserver'
): string | null {
    const indexType = (index.type || 'btree').toLowerCase();
    const indexTypeMap =
        dialectKey === 'mysql'
            ? postgresqlIndexTypeToMySQL
            : postgresqlIndexTypeToSQLServer;
    const mapping = indexTypeMap[indexType];

    if (mapping?.note) {
        return mapping.note;
    }

    return null;
}
