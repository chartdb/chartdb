import type { Diagram } from '@/lib/domain/diagram';
import { generateDiagramId, generateId } from '@/lib/utils';
import type { DBTable } from '@/lib/domain/db-table';
import type { Cardinality, DBRelationship } from '@/lib/domain/db-relationship';
import type { DBField } from '@/lib/domain/db-field';
import type { DataType } from '@/lib/data/data-types/data-types';
import { genericDataTypes } from '@/lib/data/data-types/generic-data-types';
import { randomColor } from '@/lib/colors';
import { DatabaseType } from '@/lib/domain/database-type';

// Common interfaces for SQL entities
export interface SQLColumn {
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
    unique: boolean;
    typeArgs?: {
        length?: number;
        precision?: number;
        scale?: number;
    };
    comment?: string;
    default?: string;
    increment?: boolean;
}

export interface SQLTable {
    id: string;
    name: string;
    schema?: string;
    columns: SQLColumn[];
    indexes: SQLIndex[];
    comment?: string;
    order: number;
}

export interface SQLIndex {
    name: string;
    columns: string[];
    unique: boolean;
}

export interface SQLForeignKey {
    name: string;
    sourceTable: string;
    sourceSchema?: string;
    sourceColumn: string;
    targetTable: string;
    targetSchema?: string;
    targetColumn: string;
    sourceTableId: string;
    targetTableId: string;
    updateAction?: string;
    deleteAction?: string;
}

export interface SQLParserResult {
    tables: SQLTable[];
    relationships: SQLForeignKey[];
    types?: SQLCustomType[];
    enums?: SQLEnumType[];
}

// Define more specific types for SQL AST nodes
export interface SQLASTNode {
    type: string;
    [key: string]: unknown;
}

export interface SQLBinaryExpr extends SQLASTNode {
    type: 'binary_expr';
    left: SQLASTNode;
    right: SQLASTNode;
    operator: string;
}

export interface SQLFunctionNode extends SQLASTNode {
    type: 'function';
    name: string;
    args?: {
        value: SQLASTArg[];
    };
}

export interface SQLColumnRef extends SQLASTNode {
    type: 'column_ref';
    column: string;
    table?: string;
}

export interface SQLExprList extends SQLASTNode {
    type: 'expr_list';
    value: Array<{ value: string | number }>;
}

export interface SQLStringLiteral extends SQLASTNode {
    type: 'single_quote_string' | 'double_quote_string';
    value: string;
}

export type SQLASTArg =
    | SQLColumnRef
    | SQLStringLiteral
    | { type: string; value: string | number };

export interface SQLCustomType {
    name: string;
    [key: string]: unknown;
}

export interface SQLEnumType {
    name: string;
    values: string[];
    [key: string]: unknown;
}

// Helper functions for SQL dialect handling
export function quoteIdentifier(str: string, dbType: DatabaseType): string {
    switch (dbType) {
        case DatabaseType.MYSQL:
        case DatabaseType.MARIADB:
            return `\`${str}\``;
        case DatabaseType.POSTGRESQL:
        case DatabaseType.SQLITE:
            return `"${str}"`;
        case DatabaseType.SQL_SERVER:
            return `[${str}]`;
        default:
            return str;
    }
}

export function buildSQLFromAST(
    ast: SQLASTNode | null | undefined,
    dbType: DatabaseType = DatabaseType.GENERIC
): string {
    if (!ast) return '';

    if (ast.type === 'binary_expr') {
        const expr = ast as SQLBinaryExpr;
        const leftSQL = buildSQLFromAST(expr.left, dbType);
        const rightSQL = buildSQLFromAST(expr.right, dbType);
        return `${leftSQL} ${expr.operator} ${rightSQL}`;
    }

    if (ast.type === 'function') {
        const func = ast as SQLFunctionNode;
        let expr = func.name;
        if (func.args) {
            expr +=
                '(' +
                func.args.value
                    .map((v: SQLASTArg) => {
                        if (v.type === 'column_ref')
                            return quoteIdentifier(
                                (v as SQLColumnRef).column,
                                dbType
                            );
                        if (
                            v.type === 'single_quote_string' ||
                            v.type === 'double_quote_string'
                        )
                            return "'" + (v as SQLStringLiteral).value + "'";
                        return v.value;
                    })
                    .join(', ') +
                ')';
        }
        return expr;
    } else if (ast.type === 'column_ref') {
        return quoteIdentifier((ast as SQLColumnRef).column, dbType);
    } else if (ast.type === 'expr_list') {
        return (ast as SQLExprList).value.map((v) => v.value).join(' AND ');
    } else {
        const valueNode = ast as { type: string; value: string | number };
        return typeof valueNode.value === 'string'
            ? "'" + valueNode.value + "'"
            : String(valueNode.value);
    }
}

// Helper to determine cardinality of relationships
export function determineCardinality(
    isSourceUnique: boolean,
    isTargetUnique: boolean
): { sourceCardinality: Cardinality; targetCardinality: Cardinality } {
    if (isSourceUnique && isTargetUnique) {
        return {
            sourceCardinality: 'one' as Cardinality,
            targetCardinality: 'one' as Cardinality,
        };
    } else if (isSourceUnique) {
        return {
            sourceCardinality: 'one' as Cardinality,
            targetCardinality: 'many' as Cardinality,
        };
    } else if (isTargetUnique) {
        return {
            sourceCardinality: 'many' as Cardinality,
            targetCardinality: 'one' as Cardinality,
        };
    } else {
        return {
            sourceCardinality: 'many' as Cardinality,
            targetCardinality: 'many' as Cardinality,
        };
    }
}

// Map SQL data type to generic data type in our system
export function mapSQLTypeToGenericType(sqlType: string): DataType {
    const normalizedType = sqlType.toLowerCase().replace(/\(.*\)/, '');
    const matchedType = genericDataTypes.find((t) => t.id === normalizedType);
    if (matchedType) return matchedType;

    const typeMap: Record<string, string> = {
        int: 'integer',
        integer: 'integer',
        smallint: 'smallint',
        bigint: 'bigint',
        decimal: 'decimal',
        numeric: 'numeric',
        float: 'float',
        double: 'double',
        varchar: 'varchar',
        'character varying': 'varchar',
        char: 'char',
        character: 'char',
        text: 'text',
        boolean: 'boolean',
        bool: 'boolean',
        timestamp: 'timestamp',
        datetime: 'timestamp',
        date: 'date',
        time: 'time',
        json: 'json',
        jsonb: 'json',
    };

    const mappedType = typeMap[normalizedType];
    if (mappedType) {
        const foundType = genericDataTypes.find((t) => t.id === mappedType);
        if (foundType) return foundType;
    }

    return genericDataTypes.find((t) => t.id === 'varchar')!;
}

// Type affinity definitions for different database dialects
export const typeAffinity: Record<string, Record<string, string>> = {
    [DatabaseType.POSTGRESQL]: {
        INT: 'INTEGER',
        INTEGER: 'INTEGER',
        MEDIUMINT: 'INTEGER',
        BIT: 'BOOLEAN',
    },
    [DatabaseType.MYSQL]: {
        INT: 'INTEGER',
        INTEGER: 'INTEGER',
        BOOL: 'BOOLEAN',
        BOOLEAN: 'TINYINT',
    },
    [DatabaseType.MARIADB]: {
        INT: 'INTEGER',
        INTEGER: 'INTEGER',
        BOOL: 'BOOLEAN',
        BOOLEAN: 'TINYINT',
    },
    [DatabaseType.SQL_SERVER]: {
        INT: 'INTEGER',
        INTEGER: 'INT',
        BOOL: 'BIT',
        BOOLEAN: 'BIT',
    },
    [DatabaseType.SQLITE]: {
        INT: 'INTEGER',
        BOOL: 'INTEGER',
        BOOLEAN: 'INTEGER',
    },
    [DatabaseType.GENERIC]: {
        INTEGER: 'integer',
        INT: 'integer',
        MEDIUMINT: 'integer',
        BIT: 'boolean',
        VARCHAR: 'varchar',
        'CHARACTER VARYING': 'varchar',
        CHAR: 'char',
        CHARACTER: 'char',
        TEXT: 'text',
        BOOLEAN: 'boolean',
        BOOL: 'boolean',
        TIMESTAMP: 'timestamp',
        DATETIME: 'timestamp',
        DATE: 'date',
        TIME: 'time',
        JSON: 'json',
        JSONB: 'json',
        DECIMAL: 'decimal',
        NUMERIC: 'numeric',
        FLOAT: 'float',
        DOUBLE: 'double',
        BIGINT: 'bigint',
        SMALLINT: 'smallint',
    },
};

// For safe type conversions
export function getTypeAffinity(
    databaseType: DatabaseType,
    sqlType: string
): string {
    if (!sqlType) return 'varchar';

    const normalizedType = sqlType.toUpperCase();
    const dialectAffinity =
        typeAffinity[databaseType] || typeAffinity[DatabaseType.GENERIC];
    return dialectAffinity[normalizedType] || sqlType.toLowerCase();
}

// Convert SQLParserResult to ChartDB Diagram structure
export function convertToChartDBDiagram(
    parserResult: SQLParserResult,
    sourceDatabaseType: DatabaseType,
    targetDatabaseType: DatabaseType
): Diagram {
    // Create a mapping of old table IDs to new ones
    const tableIdMapping = new Map<string, string>();

    // Convert SQL tables to ChartDB tables
    const tables: DBTable[] = parserResult.tables.map((table, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const tableSpacing = 300;
        const newId = generateId();
        tableIdMapping.set(table.id, newId);

        // Create fields from columns
        const fields: DBField[] = table.columns.map((column) => {
            const field: DBField = {
                id: generateId(),
                name: column.name,
                type: mapSQLTypeToGenericType(column.type),
                nullable: column.nullable,
                primaryKey: column.primaryKey,
                unique: column.unique,
                default: column.default || '',
                createdAt: Date.now(),
            };

            // Add type arguments if present
            if (column.typeArgs) {
                // Transfer length for varchar/char types
                if (
                    column.typeArgs.length !== undefined &&
                    (field.type.id === 'varchar' || field.type.id === 'char')
                ) {
                    field.characterMaximumLength =
                        column.typeArgs.length.toString();
                }

                // Transfer precision/scale for numeric types
                if (
                    column.typeArgs.precision !== undefined &&
                    (field.type.id === 'numeric' || field.type.id === 'decimal')
                ) {
                    field.precision = column.typeArgs.precision;
                    field.scale = column.typeArgs.scale;
                }
            }

            return field;
        });

        // Create indexes
        const indexes = table.indexes.map((sqlIndex) => {
            const fieldIds = sqlIndex.columns.map((columnName) => {
                const field = fields.find((f) => f.name === columnName);
                if (!field) {
                    throw new Error(
                        `Index references non-existent column: ${columnName}`
                    );
                }
                return field.id;
            });

            return {
                id: generateId(),
                name: sqlIndex.name,
                fieldIds,
                unique: sqlIndex.unique,
                createdAt: Date.now(),
            };
        });

        return {
            id: newId,
            name: table.name,
            schema: table.schema || '',
            order: index,
            fields,
            indexes,
            x: col * tableSpacing,
            y: row * tableSpacing,
            color: randomColor(),
            isView: false,
            createdAt: Date.now(),
        };
    });

    // Process relationships
    const relationships: DBRelationship[] = [];

    parserResult.relationships.forEach((rel) => {
        // First try to find the table with exact schema match
        let sourceTable = tables.find(
            (t) => t.name === rel.sourceTable && rel.sourceSchema === t.schema
        );

        // If not found, try without schema requirements
        if (!sourceTable) {
            sourceTable = tables.find((t) => t.name === rel.sourceTable);
        }

        // Similar approach for target table
        let targetTable = tables.find(
            (t) => t.name === rel.targetTable && rel.targetSchema === t.schema
        );

        // If not found, try without schema requirements
        if (!targetTable) {
            targetTable = tables.find((t) => t.name === rel.targetTable);
        }

        if (!sourceTable || !targetTable) {
            console.warn('Relationship refers to non-existent table:', {
                sourceTable: rel.sourceTable,
                sourceSchema: rel.sourceSchema,
                targetTable: rel.targetTable,
                targetSchema: rel.targetSchema,
                availableTables: tables.map(
                    (t) => `${t.schema || ''}.${t.name}`
                ),
            });
            return;
        }

        const sourceTableId = tableIdMapping.get(rel.sourceTableId);
        const targetTableId = tableIdMapping.get(rel.targetTableId);

        if (!sourceTableId || !targetTableId) {
            console.warn('Could not find mapped table IDs for relationship');
            return;
        }

        const sourceField = sourceTable.fields.find(
            (f) => f.name === rel.sourceColumn
        );
        const targetField = targetTable.fields.find(
            (f) => f.name === rel.targetColumn
        );

        if (!sourceField || !targetField) {
            console.warn('Relationship refers to non-existent field:', {
                sourceTable: rel.sourceTable,
                sourceField: rel.sourceColumn,
                targetTable: rel.targetTable,
                targetField: rel.targetColumn,
            });
            return;
        }

        const { sourceCardinality, targetCardinality } = determineCardinality(
            sourceField.unique || sourceField.primaryKey,
            targetField.unique || targetField.primaryKey
        );

        relationships.push({
            id: generateId(),
            name: rel.name,
            sourceSchema: sourceTable.schema,
            targetSchema: targetTable.schema,
            sourceTableId: sourceTableId,
            targetTableId: targetTableId,
            sourceFieldId: sourceField.id,
            targetFieldId: targetField.id,
            sourceCardinality,
            targetCardinality,
            createdAt: Date.now(),
        });
    });

    const diagram = {
        id: generateDiagramId(),
        name: `SQL Import (${sourceDatabaseType})`,
        databaseType: targetDatabaseType,
        tables,
        relationships,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    return diagram;
}
