import type { Diagram } from '@/lib/domain/diagram';
import { generateDiagramId, generateId } from '@/lib/utils';
import type { DBTable } from '@/lib/domain/db-table';
import type { Cardinality, DBRelationship } from '@/lib/domain/db-relationship';
import type { DBField } from '@/lib/domain/db-field';
import type { DBIndex } from '@/lib/domain/db-index';
import {
    getPreferredSynonym,
    type DataType,
} from '@/lib/data/data-types/data-types';
import { genericDataTypes } from '@/lib/data/data-types/generic-data-types';
import { defaultTableColor } from '@/lib/colors';
import { DatabaseType } from '@/lib/domain/database-type';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import { DBCustomTypeKind } from '@/lib/domain/db-custom-type';
import { supportsCustomTypes } from '@/lib/domain/database-capabilities';

// Common interfaces for SQL entities
export interface SQLColumn {
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
    unique: boolean;
    typeArgs?:
        | {
              length?: number;
              precision?: number;
              scale?: number;
          }
        | number[]
        | string;
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
    sourceCardinality?: Cardinality;
    targetCardinality?: Cardinality;
}

export interface SQLParserResult {
    tables: SQLTable[];
    relationships: SQLForeignKey[];
    types?: SQLCustomType[];
    enums?: SQLEnumType[];
    warnings?: string[];
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
    name: string | { name: Array<{ value: string }> };
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

export interface SQLDefaultNode extends SQLASTNode {
    type: 'default';
    value: SQLASTNode;
}

export interface SQLCastNode extends SQLASTNode {
    type: 'cast';
    expr: SQLASTNode;
    target: Array<{ dataType: string }>;
}

export interface SQLBooleanNode extends SQLASTNode {
    type: 'bool';
    value: boolean;
}

export interface SQLNullNode extends SQLASTNode {
    type: 'null';
}

export interface SQLNumberNode extends SQLASTNode {
    type: 'number';
    value: number;
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

    // Handle default value wrapper
    if (ast.type === 'default' && 'value' in ast) {
        const defaultNode = ast as SQLDefaultNode;
        return buildSQLFromAST(defaultNode.value, dbType);
    }

    // Handle PostgreSQL cast expressions (e.g., 'value'::type)
    if (ast.type === 'cast' && 'expr' in ast && 'target' in ast) {
        const castNode = ast as SQLCastNode;
        const expr = buildSQLFromAST(castNode.expr, dbType);
        if (castNode.target.length > 0 && castNode.target[0].dataType) {
            return `${expr}::${castNode.target[0].dataType.toLowerCase()}`;
        }
        return expr;
    }

    if (ast.type === 'binary_expr') {
        const expr = ast as SQLBinaryExpr;
        const leftSQL = buildSQLFromAST(expr.left, dbType);
        const rightSQL = buildSQLFromAST(expr.right, dbType);
        return `${leftSQL} ${expr.operator} ${rightSQL}`;
    }

    if (ast.type === 'function') {
        const func = ast as SQLFunctionNode;
        let funcName = '';

        // Handle nested function name structure
        if (typeof func.name === 'object' && func.name && 'name' in func.name) {
            const nameObj = func.name as { name: Array<{ value: string }> };
            if (nameObj.name.length > 0) {
                funcName = nameObj.name[0].value || '';
            }
        } else if (typeof func.name === 'string') {
            funcName = func.name;
        }

        if (!funcName) return '';

        // Normalize PostgreSQL function names to uppercase for consistency
        if (dbType === DatabaseType.POSTGRESQL) {
            const pgFunctions = [
                'now',
                'current_timestamp',
                'current_date',
                'current_time',
                'gen_random_uuid',
                'random',
                'nextval',
                'currval',
            ];
            if (pgFunctions.includes(funcName.toLowerCase())) {
                funcName = funcName.toUpperCase();
            }
        }

        // Some PostgreSQL functions don't have parentheses (like CURRENT_TIMESTAMP)
        if (funcName === 'CURRENT_TIMESTAMP' && !func.args) {
            return funcName;
        }

        // Handle SQL Server function defaults that were preprocessed as strings
        // The preprocessor converts NEWID() to 'newid', GETDATE() to 'getdate', etc.
        if (dbType === DatabaseType.SQL_SERVER) {
            const sqlServerFunctions: Record<string, string> = {
                newid: 'NEWID()',
                newsequentialid: 'NEWSEQUENTIALID()',
                getdate: 'GETDATE()',
                sysdatetime: 'SYSDATETIME()',
            };

            const lowerFuncName = funcName.toLowerCase();
            if (sqlServerFunctions[lowerFuncName]) {
                return sqlServerFunctions[lowerFuncName];
            }
        }

        let expr = funcName;
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
        } else {
            expr += '()';
        }
        return expr;
    } else if (ast.type === 'column_ref') {
        return quoteIdentifier((ast as SQLColumnRef).column, dbType);
    } else if (ast.type === 'expr_list') {
        return (ast as SQLExprList).value.map((v) => v.value).join(' AND ');
    } else if (ast.type === 'single_quote_string') {
        // String literal with single quotes
        const strNode = ast as SQLStringLiteral;
        return `'${strNode.value}'`;
    } else if (ast.type === 'double_quote_string') {
        // String literal with double quotes
        const strNode = ast as SQLStringLiteral;
        return `"${strNode.value}"`;
    } else if (ast.type === 'bool') {
        // Boolean value
        const boolNode = ast as SQLBooleanNode;
        return boolNode.value ? 'TRUE' : 'FALSE';
    } else if (ast.type === 'null') {
        return 'NULL';
    } else if (ast.type === 'number') {
        const numNode = ast as SQLNumberNode;
        return String(numNode.value);
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
            sourceCardinality: 'one',
            targetCardinality: 'one',
        };
    } else if (isSourceUnique) {
        return {
            sourceCardinality: 'one',
            targetCardinality: 'many',
        };
    } else if (isTargetUnique) {
        return {
            sourceCardinality: 'many',
            targetCardinality: 'one',
        };
    } else {
        return {
            sourceCardinality: 'many',
            targetCardinality: 'many',
        };
    }
}

// Map SQL data type to generic data type in our system
export function mapSQLTypeToGenericType(
    sqlType: string,
    databaseType?: DatabaseType
): DataType {
    if (!sqlType) {
        return genericDataTypes.find((t) => t.id === 'text')!;
    }

    // Normalize the SQL type to lowercase for consistency
    const normalizedSqlType = sqlType.toLowerCase();

    // Add special case handling for SQLite INTEGER type
    if (
        databaseType === DatabaseType.SQLITE &&
        (normalizedSqlType === 'integer' || normalizedSqlType === 'int')
    ) {
        return genericDataTypes.find((t) => t.id === 'integer')!;
    }

    // Get dialect-specific type mappings
    const dialectAffinity =
        (databaseType && typeAffinity[databaseType]) ||
        typeAffinity[DatabaseType.GENERIC];

    // Handle specific database dialect mappings
    if (databaseType) {
        // Try to find a mapping for the normalized type
        const typeMapping = dialectAffinity[normalizedSqlType];
        if (typeMapping) {
            const foundType = genericDataTypes.find(
                (t) => t.id === typeMapping
            );
            if (foundType) return foundType;
        }
    }

    // Try direct mapping by normalizing the input type
    const normalizedType = normalizedSqlType.replace(/\(.*\)/, '');
    const matchedType = genericDataTypes.find((t) => t.id === normalizedType);
    if (matchedType) return matchedType;

    // Generic type mappings as a fallback
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
        real: 'real',
        blob: 'blob',
    };

    const mappedType = typeMap[normalizedType];
    if (mappedType) {
        const foundType = genericDataTypes.find((t) => t.id === mappedType);
        if (foundType) return foundType;
    }

    // Default to text as last resort
    return genericDataTypes.find((t) => t.id === 'text')!;
}

// Type affinity definitions for different database dialects
export const typeAffinity: Record<string, Record<string, string>> = {
    [DatabaseType.POSTGRESQL]: {
        // PostgreSQL data types (all lowercase for consistency)
        int: 'integer',
        integer: 'integer',
        int4: 'integer',
        smallint: 'smallint',
        int2: 'smallint',
        bigint: 'bigint',
        int8: 'bigint',
        decimal: 'decimal',
        numeric: 'numeric',
        real: 'real',
        'double precision': 'double',
        float: 'float',
        float4: 'float',
        float8: 'double',
        boolean: 'boolean',
        bool: 'boolean',
        varchar: 'varchar',
        'character varying': 'varchar',
        char: 'char',
        character: 'char',
        text: 'text',
        date: 'date',
        timestamp: 'timestamp',
        time: 'time',
        json: 'json',
        jsonb: 'jsonb',
    },
    [DatabaseType.MYSQL]: {
        // MySQL data types (all lowercase for consistency)
        int: 'integer',
        integer: 'integer',
        smallint: 'smallint',
        tinyint: 'tinyint',
        bigint: 'bigint',
        decimal: 'decimal',
        numeric: 'numeric',
        float: 'float',
        double: 'double',
        boolean: 'tinyint',
        bool: 'tinyint',
        varchar: 'varchar',
        char: 'char',
        text: 'text',
        date: 'date',
        datetime: 'datetime',
        timestamp: 'timestamp',
        time: 'time',
        json: 'json',
    },
    [DatabaseType.MARIADB]: {
        // MariaDB data types (all lowercase for consistency)
        int: 'integer',
        integer: 'integer',
        smallint: 'smallint',
        tinyint: 'tinyint',
        bigint: 'bigint',
        decimal: 'decimal',
        numeric: 'numeric',
        float: 'float',
        double: 'double',
        boolean: 'tinyint',
        bool: 'tinyint',
        varchar: 'varchar',
        char: 'char',
        text: 'text',
        date: 'date',
        datetime: 'datetime',
        timestamp: 'timestamp',
        time: 'time',
        json: 'json',
    },
    [DatabaseType.SQL_SERVER]: {
        // SQL Server data types (all lowercase for consistency)
        int: 'integer',
        integer: 'integer',
        smallint: 'smallint',
        bigint: 'bigint',
        decimal: 'decimal',
        numeric: 'numeric',
        float: 'float',
        real: 'real',
        bit: 'bit',
        boolean: 'bit',
        bool: 'bit',
        varchar: 'varchar',
        nvarchar: 'nvarchar',
        char: 'char',
        nchar: 'nchar',
        text: 'text',
        ntext: 'ntext',
        date: 'date',
        datetime: 'datetime',
        datetime2: 'datetime2',
        time: 'time',
        uniqueidentifier: 'uniqueidentifier',
    },
    [DatabaseType.SQLITE]: {
        // SQLite storage classes (all lowercase for consistency)
        integer: 'integer',
        int: 'integer',
        bigint: 'bigint',
        smallint: 'smallint',
        tinyint: 'tinyint',
        real: 'real',
        float: 'real',
        double: 'real',
        numeric: 'real',
        decimal: 'real',
        text: 'text',
        varchar: 'text',
        char: 'text',
        blob: 'blob',
        binary: 'blob',
        varbinary: 'blob',
        timestamp: 'timestamp',
        datetime: 'timestamp',
        date: 'date',
        boolean: 'integer',
        bool: 'integer',
        time: 'text',
        json: 'text',
    },
    [DatabaseType.ORACLE]: {
        // Oracle data types (all lowercase for consistency)
        // Character types
        varchar2: 'varchar',
        nvarchar2: 'varchar',
        char: 'char',
        nchar: 'char',
        clob: 'text',
        nclob: 'text',
        long: 'text',
        // Numeric types
        number: 'numeric',
        integer: 'integer',
        int: 'integer',
        smallint: 'smallint',
        float: 'float',
        real: 'real',
        binary_float: 'float',
        binary_double: 'double',
        // Date/Time types
        date: 'date',
        timestamp: 'timestamp',
        'timestamp with time zone': 'timestamp',
        'timestamp with local time zone': 'timestamp',
        interval: 'interval',
        // Binary types
        blob: 'blob',
        raw: 'blob',
        'long raw': 'blob',
        bfile: 'blob',
        // Other types
        rowid: 'varchar',
        urowid: 'varchar',
        xmltype: 'text',
        json: 'json',
        boolean: 'boolean',
    },
    [DatabaseType.GENERIC]: {
        // Generic fallback types (all lowercase for consistency)
        integer: 'integer',
        int: 'integer',
        smallint: 'smallint',
        bigint: 'bigint',
        decimal: 'decimal',
        numeric: 'numeric',
        float: 'float',
        double: 'double',
        real: 'real',
        boolean: 'boolean',
        bool: 'boolean',
        varchar: 'varchar',
        'character varying': 'varchar',
        char: 'char',
        character: 'char',
        text: 'text',
        date: 'date',
        timestamp: 'timestamp',
        datetime: 'timestamp',
        time: 'time',
        json: 'json',
        jsonb: 'json',
        blob: 'blob',
    },
};

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
            // Use special case handling for specific database types to ensure correct mapping
            let mappedType: DataType;

            // SQLite-specific handling for numeric types
            if (sourceDatabaseType === DatabaseType.SQLITE) {
                const normalizedType = column.type.toLowerCase();

                if (normalizedType === 'integer' || normalizedType === 'int') {
                    // Ensure integer types are preserved
                    mappedType = { id: 'integer', name: 'integer' };
                } else if (
                    normalizedType === 'real' ||
                    normalizedType === 'float' ||
                    normalizedType === 'double' ||
                    normalizedType === 'numeric' ||
                    normalizedType === 'decimal'
                ) {
                    // Ensure real types are preserved
                    mappedType = { id: 'real', name: 'real' };
                } else if (normalizedType === 'blob') {
                    // Ensure blob types are preserved
                    mappedType = { id: 'blob', name: 'blob' };
                } else {
                    // Use the standard mapping for other types
                    mappedType = mapSQLTypeToGenericType(
                        column.type,
                        sourceDatabaseType
                    );
                }
            }
            // Handle MySQL/MariaDB integer types specifically
            else if (
                sourceDatabaseType === DatabaseType.MYSQL ||
                sourceDatabaseType === DatabaseType.MARIADB
            ) {
                const normalizedType = column.type
                    .toLowerCase()
                    .replace(/\(\d+\)/, '')
                    .trim();

                // Handle various integer types
                if (normalizedType === 'tinyint') {
                    mappedType = { id: 'tinyint', name: 'tinyint' };
                } else if (
                    normalizedType === 'int' ||
                    normalizedType === 'integer'
                ) {
                    mappedType = { id: 'int', name: 'int' };
                } else if (normalizedType === 'smallint') {
                    mappedType = { id: 'smallint', name: 'smallint' };
                } else if (normalizedType === 'mediumint') {
                    mappedType = { id: 'mediumint', name: 'mediumint' };
                } else if (normalizedType === 'bigint') {
                    mappedType = { id: 'bigint', name: 'bigint' };
                } else {
                    // Use the standard mapping for other types
                    mappedType = mapSQLTypeToGenericType(
                        column.type,
                        sourceDatabaseType
                    );
                }
            }
            // Handle PostgreSQL integer type specifically
            else if (
                sourceDatabaseType === DatabaseType.POSTGRESQL &&
                (column.type.toLowerCase() === 'integer' ||
                    column.type.toLowerCase() === 'int' ||
                    column.type.toLowerCase() === 'int4')
            ) {
                // Ensure integer types are preserved
                mappedType = { id: 'integer', name: 'integer' };
            } else if (
                supportsCustomTypes(sourceDatabaseType) &&
                parserResult.enums &&
                parserResult.enums.some(
                    (e) => e.name.toLowerCase() === column.type.toLowerCase()
                )
            ) {
                // If the column type matches a custom enum type, preserve it
                mappedType = {
                    id: column.type.toLowerCase(),
                    name: column.type,
                };
            }
            // Handle SQL Server types specifically
            else if (
                sourceDatabaseType === DatabaseType.SQL_SERVER &&
                targetDatabaseType === DatabaseType.SQL_SERVER
            ) {
                const normalizedType = column.type.toLowerCase();

                // Preserve SQL Server specific types when target is also SQL Server
                if (
                    normalizedType === 'nvarchar' ||
                    normalizedType === 'nchar' ||
                    normalizedType === 'ntext' ||
                    normalizedType === 'uniqueidentifier' ||
                    normalizedType === 'datetime2' ||
                    normalizedType === 'datetimeoffset' ||
                    normalizedType === 'money' ||
                    normalizedType === 'smallmoney' ||
                    normalizedType === 'bit' ||
                    normalizedType === 'xml' ||
                    normalizedType === 'hierarchyid' ||
                    normalizedType === 'geography' ||
                    normalizedType === 'geometry'
                ) {
                    mappedType = { id: normalizedType, name: normalizedType };
                } else {
                    // Use the standard mapping for other types
                    mappedType = mapSQLTypeToGenericType(
                        column.type,
                        sourceDatabaseType
                    );
                }
            } else {
                // Use the standard mapping for other types
                mappedType = mapSQLTypeToGenericType(
                    column.type,
                    sourceDatabaseType
                );
            }

            // Check if there's a preferred synonym for this type
            const preferredType = getPreferredSynonym(
                mappedType.name,
                targetDatabaseType
            );

            // Use the preferred synonym if it exists, otherwise use the mapped type
            const finalType = preferredType
                ? { id: preferredType.id, name: preferredType.name }
                : mappedType;

            const field: DBField = {
                id: generateId(),
                name: column.name,
                type: finalType,
                nullable: column.nullable,
                primaryKey: column.primaryKey,
                unique: column.unique,
                default: column.default || '',
                createdAt: Date.now(),
                increment: column.increment,
            };

            // Add type arguments if present
            if (column.typeArgs) {
                // Handle string typeArgs (e.g., 'max' for varchar(max))
                if (typeof column.typeArgs === 'string') {
                    if (
                        (field.type.id === 'varchar' ||
                            field.type.id === 'nvarchar') &&
                        column.typeArgs === 'max'
                    ) {
                        field.characterMaximumLength = 'max';
                    }
                }
                // Handle array typeArgs (SQL Server format)
                else if (
                    Array.isArray(column.typeArgs) &&
                    column.typeArgs.length > 0
                ) {
                    if (
                        field.type.id === 'varchar' ||
                        field.type.id === 'nvarchar' ||
                        field.type.id === 'char' ||
                        field.type.id === 'nchar'
                    ) {
                        field.characterMaximumLength =
                            column.typeArgs[0].toString();
                    } else if (
                        (field.type.id === 'numeric' ||
                            field.type.id === 'decimal') &&
                        column.typeArgs.length >= 2
                    ) {
                        field.precision = column.typeArgs[0];
                        field.scale = column.typeArgs[1];
                    }
                }
                // Handle object typeArgs (standard format)
                else if (
                    typeof column.typeArgs === 'object' &&
                    !Array.isArray(column.typeArgs)
                ) {
                    const typeArgsObj = column.typeArgs as {
                        length?: number;
                        precision?: number;
                        scale?: number;
                    };

                    // Transfer length for varchar/char types
                    if (
                        typeArgsObj.length !== undefined &&
                        (field.type.id === 'varchar' ||
                            field.type.id === 'char')
                    ) {
                        field.characterMaximumLength =
                            typeArgsObj.length.toString();
                    }

                    // Transfer precision/scale for numeric types
                    if (
                        typeArgsObj.precision !== undefined &&
                        (field.type.id === 'numeric' ||
                            field.type.id === 'decimal')
                    ) {
                        field.precision = typeArgsObj.precision;
                        field.scale = typeArgsObj.scale;
                    }
                }
            }

            return field;
        });

        // Create indexes
        const indexes = table.indexes
            .map((sqlIndex) => {
                const fieldIds = sqlIndex.columns
                    .map((columnName) => {
                        const field = fields.find((f) => f.name === columnName);
                        if (!field) {
                            console.warn(
                                `Index ${sqlIndex.name} references non-existent column: ${columnName} in table ${table.name}. Skipping this column.`
                            );
                            return null;
                        }
                        return field.id;
                    })
                    .filter((id): id is string => id !== null);

                // Only create index if at least one column was found
                if (fieldIds.length === 0) {
                    console.warn(
                        `Index ${sqlIndex.name} has no valid columns. Skipping index.`
                    );
                    return null;
                }

                return {
                    id: generateId(),
                    name: sqlIndex.name,
                    fieldIds,
                    unique: sqlIndex.unique,
                    createdAt: Date.now(),
                };
            })
            .filter((idx): idx is DBIndex => idx !== null);

        return {
            id: newId,
            name: table.name,
            schema: table.schema || '',
            order: index,
            fields,
            indexes,
            x: col * tableSpacing,
            y: row * tableSpacing,
            color: defaultTableColor,
            isView: false,
            createdAt: Date.now(),
        } satisfies DBTable;
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
            (f) => f.name.toLowerCase() === rel.sourceColumn.toLowerCase()
        );
        const targetField = targetTable.fields.find(
            (f) => f.name.toLowerCase() === rel.targetColumn.toLowerCase()
        );

        if (!sourceField || !targetField) {
            return;
        }

        // Use the cardinality from the SQL parser if available, otherwise determine it
        // Note: In SQLForeignKey, source = table with FK, target = referenced table
        // In DBRelationship, we want source = referenced table (PK), target = FK table
        // So we swap them here
        const sourceCardinality =
            rel.targetCardinality ||
            (targetField.unique || targetField.primaryKey ? 'one' : 'many');
        const targetCardinality =
            rel.sourceCardinality ||
            (sourceField.unique || sourceField.primaryKey ? 'one' : 'many');

        relationships.push({
            id: generateId(),
            name: rel.name,
            sourceSchema: targetTable.schema,
            targetSchema: sourceTable.schema,
            sourceTableId: targetTableId,
            targetTableId: sourceTableId,
            sourceFieldId: targetField.id,
            targetFieldId: sourceField.id,
            sourceCardinality,
            targetCardinality,
            createdAt: Date.now(),
        });
    });

    // Convert SQL enum types to ChartDB custom types
    const customTypes: DBCustomType[] = [];

    if (parserResult.enums) {
        parserResult.enums.forEach((enumType, index) => {
            customTypes.push({
                id: generateId(),
                name: enumType.name,
                schema: 'public', // Default to public schema for now
                kind: DBCustomTypeKind.enum,
                values: enumType.values,
                order: index,
            });
        });
    }

    const diagram = {
        id: generateDiagramId(),
        name: `SQL Import (${sourceDatabaseType})`,
        databaseType: targetDatabaseType,
        tables,
        relationships,
        customTypes: customTypes.length > 0 ? customTypes : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    return diagram;
}
