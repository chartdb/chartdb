import type { SQLASTNode } from '../../common';

// Set up the SQL parser with SQLite dialect
export const parserOpts = {
    database: 'sqlite',
};

// Type definitions for SQLite AST nodes
export interface TableReference {
    db?: string;
    schema?: string;
    table: string;
}

export interface ColumnReference {
    expr?: {
        column?: string;
        table?: string;
    };
    column?: string;
    table?: string;
}

export interface ColumnDefinition {
    column: ColumnReference;
    dataType: {
        dataType: string;
        length?: number | number[];
        suffix?: string[];
    };
    primary_key?: boolean;
    autoIncrement?: boolean;
    notNull?: boolean;
    unique?: boolean;
    default_val?: {
        value: string | number;
        type: string;
    };
    reference?: {
        table: TableReference;
        columns: ColumnReference[];
    };
}

export interface ConstraintDefinition {
    constraint_type: string;
    columns?: ColumnReference[];
    definition?: {
        columns?: ColumnReference[];
        table?: TableReference;
        reference_columns?: ColumnReference[];
        reference?: {
            table: TableReference;
            columns: ColumnReference[];
        };
    };
    reference?: {
        table: TableReference;
        columns: ColumnReference[];
    };
    constraint_name?: string;
}

export interface CreateTableStatement extends SQLASTNode {
    type: 'create';
    keyword: 'table';
    temporary?: boolean;
    table: TableReference | TableReference[];
    create_definitions?: (ColumnDefinition | ConstraintDefinition)[];
    as?: unknown;
    if_not_exists?: boolean;
}

export interface CreateIndexStatement extends SQLASTNode {
    type: 'create';
    keyword: 'index';
    index: {
        name: string;
        type?: string;
    };
    table: TableReference | TableReference[];
    columns?: ColumnReference[];
    index_type?: string;
    unique?: boolean;
    concurrently?: boolean;
    if_not_exists?: boolean;
}

export interface AlterTableExprItem {
    action: string;
    name?: ColumnReference;
    dataType?: {
        dataType: string;
        length?: number | number[];
    };
    expr?: {
        constraint_type?: string;
        columns?: ColumnReference[];
        reference?: {
            table: TableReference;
            columns: ColumnReference[];
        };
    };
}

export interface AlterTableStatement extends SQLASTNode {
    type: 'alter';
    table: TableReference;
    expr?: AlterTableExprItem[];
}

/**
 * Helper function to extract column name from column reference
 */
export function extractColumnName(column: ColumnReference): string {
    if (typeof column === 'string') {
        return column;
    }

    if (column.column) {
        return column.column;
    }

    if (column.expr && column.expr.column) {
        return column.expr.column;
    }

    return '';
}

/**
 * Helper function to extract type arguments (e.g., size, precision, scale)
 */
export function getTypeArgs(dataType?: {
    dataType: string;
    length?: number | number[];
}): {
    size: number;
    precision?: number | undefined;
    scale?: number | undefined;
} {
    const result = {
        size: 0,
        precision: undefined as number | undefined,
        scale: undefined as number | undefined,
    };

    if (!dataType || !dataType.length) {
        return result;
    }

    if (typeof dataType.length === 'number') {
        result.size = dataType.length;
    } else if (Array.isArray(dataType.length)) {
        if (dataType.length.length >= 1) {
            result.size = dataType.length[0] as number;
        }
        if (dataType.length.length >= 2) {
            result.precision = dataType.length[0] as number;
            result.scale = dataType.length[1] as number;
        }
    }

    return result;
}

/**
 * Find a table in the collection that matches the table name and schema name
 */
export function findTableWithSchemaSupport(
    tables: { id: string; name: string; schema?: string }[],
    tableName: string,
    schemaName?: string
): { id: string; name: string; schema?: string } | undefined {
    return tables.find(
        (t) =>
            t.name === tableName &&
            (!schemaName || t.schema === schemaName || !t.schema)
    );
}

/**
 * Get a table ID with schema support
 */
export function getTableIdWithSchemaSupport(
    tableName: string,
    schemaName?: string
): string {
    return schemaName ? `${schemaName}.${tableName}` : tableName;
}

/**
 * Validates a foreign key relationship to ensure it refers to valid tables and columns
 */
export function isValidForeignKeyRelationship(
    relationship: {
        sourceTable: string;
        sourceColumn: string;
        targetTable: string;
        targetColumn: string;
    },
    tables: { id: string; name: string; schema?: string }[]
): boolean {
    // Check for empty values
    if (
        !relationship.sourceTable ||
        !relationship.sourceColumn ||
        !relationship.targetTable ||
        !relationship.targetColumn
    ) {
        return false;
    }

    // Check for SQL keywords that might have been mistakenly captured
    const invalidKeywords = [
        'CREATE',
        'TABLE',
        'FOREIGN',
        'KEY',
        'REFERENCES',
        'PRIMARY',
    ];
    if (
        invalidKeywords.includes(relationship.sourceColumn.toUpperCase()) ||
        invalidKeywords.includes(relationship.targetColumn.toUpperCase())
    ) {
        return false;
    }

    // Source table must exist in our schema
    const sourceTableExists = tables.some(
        (t) => t.name === relationship.sourceTable
    );
    if (!sourceTableExists) {
        return false;
    }

    return true;
}
