import type { SQLASTNode } from '../../common';

// Set up the SQL parser with Oracle/PL-SQL dialect
export const parserOpts = {
    database: 'plsql',
};

// Type definitions for Oracle AST
export interface TableReference {
    db?: string;
    schema?: string;
    table: string;
    as?: string;
}

export interface ColumnReference {
    type: 'column_ref';
    table?: string;
    column: string;
}

export interface CreateTableStatement extends SQLASTNode {
    type: 'create';
    keyword: 'table';
    table: TableReference | TableReference[];
    create_definitions: (ColumnDefinition | ConstraintDefinition)[];
    table_options?: Record<string, unknown>[];
    if_not_exists?: boolean;
}

export interface CreateIndexStatement extends SQLASTNode {
    type: 'create';
    keyword: 'index';
    index: string;
    table: TableReference | TableReference[];
    columns: ColumnReference[];
    constraint?: string;
    index_using?: string;
    index_options?: Record<string, unknown>[];
}

export interface AlterTableStatement extends SQLASTNode {
    type: 'alter';
    keyword: 'table';
    table: TableReference | TableReference[];
    expr: AlterTableExprItem[];
}

export interface AlterTableExprItem {
    action: string;
    column?: ColumnReference | string;
    definition?: Record<string, unknown>;
    resource?: string;
    [key: string]: unknown;
}

export interface ColumnDefinition {
    column: ColumnReference | string;
    definition?: {
        dataType: string;
        length?: number | string;
        width?: number | string;
        scale?: number;
        precision?: number;
        parentheses?: boolean;
        suffix?: string[];
        constraint?: string;
        [key: string]: unknown;
    };
    nullable?: { type: string };
    primary_key?: string;
    unique?: string;
    default_val?: unknown;
    auto_increment?: string;
    comment?: string;
    reference?: Record<string, unknown>;
    resource: string;
    [key: string]: unknown;
}

export interface ConstraintDefinition {
    constraint_type: string;
    constraint?: string;
    definition?: Array<unknown> | Record<string, unknown>;
    resource: string;
    reference?: {
        table: TableReference;
        columns: ColumnReference[];
        on_delete?: string;
        on_update?: string;
    };
    [key: string]: unknown;
}

/**
 * Extract column name from a column reference
 */
export function extractColumnName(columnRef: ColumnReference | string): string {
    if (typeof columnRef === 'string') {
        // Remove double quotes if present (Oracle quoted identifiers)
        return columnRef.replace(/^"|"$/g, '');
    }

    if (columnRef.type === 'column_ref') {
        return columnRef.column.replace(/^"|"$/g, '');
    }

    return '';
}

/**
 * Extract type arguments such as length, precision, scale
 */
export function getTypeArgs(
    definition?: ColumnDefinition['definition']
): { length?: number; precision?: number; scale?: number } | undefined {
    if (!definition) return undefined;

    const result: { length?: number; precision?: number; scale?: number } = {};

    // Check if length/width is present
    if (definition.length !== undefined) {
        result.length = Number(definition.length);
    } else if (definition.width !== undefined) {
        result.length = Number(definition.width);
    }

    // Check if precision is present
    if (definition.precision !== undefined) {
        result.precision = Number(definition.precision);
    }

    // Check if scale is present
    if (definition.scale !== undefined) {
        result.scale = Number(definition.scale);
    }

    return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Find a table in the tables array with schema support
 */
export function findTableWithSchemaSupport(
    tables: Array<{ id: string; name: string; schema?: string }>,
    tableName: string,
    schemaName?: string
): { id: string; name: string; schema?: string } | undefined {
    // Normalize names (Oracle is case-insensitive by default, uppercase)
    const normalizedTableName = tableName.toUpperCase();
    const normalizedSchemaName = schemaName?.toUpperCase();

    // If schema is provided, search for exact match
    if (normalizedSchemaName) {
        return tables.find(
            (t) =>
                t.name.toUpperCase() === normalizedTableName &&
                t.schema?.toUpperCase() === normalizedSchemaName
        );
    }

    // No schema provided, first try to find exact match without schema
    const exactMatch = tables.find(
        (t) => t.name.toUpperCase() === normalizedTableName && !t.schema
    );
    if (exactMatch) return exactMatch;

    // Finally, look for any table with matching name regardless of schema
    return tables.find((t) => t.name.toUpperCase() === normalizedTableName);
}

/**
 * Normalize Oracle identifier (remove quotes, handle case)
 */
export function normalizeOracleIdentifier(identifier: string): string {
    if (!identifier) return '';

    // If quoted with double quotes, preserve case and remove quotes
    if (identifier.startsWith('"') && identifier.endsWith('"')) {
        return identifier.slice(1, -1);
    }

    // Unquoted identifiers in Oracle are case-insensitive
    // We preserve the original case for display purposes
    return identifier;
}
