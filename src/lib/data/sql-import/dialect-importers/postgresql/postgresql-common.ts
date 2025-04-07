export const parserOpts = { database: 'postgresql' };

// Define interfaces for AST nodes - Fixed no-explicit-any issues
export interface SQLAstNode {
    type: string;
    keyword?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // Need to keep any here for compatibility with Parser's AST
}

// Define a minimal interface for table objects used in helper functions
export interface TableLike {
    id: string;
    name: string;
    schema?: string;
    columns: unknown[];
    indexes: unknown[];
}

export interface TableReference {
    table?: string;
    schema?: string;
    db?: string; // Support for PostgreSQL AST compatibility
}

export interface ColumnReference {
    column?:
        | string
        | { value?: string; expr?: { value?: string; type?: string } };
    expr?: { value?: string; type?: string };
    value?: string;
    type?: string;
}

export interface ColumnDefinition {
    resource: string;
    column: string | ColumnReference;
    definition?: {
        dataType?: string;
        constraint?: string;
        length?: number;
        precision?: number;
        scale?: number;
    };
    primary_key?: string;
    nullable?: { type?: string };
    unique?: string;
    default_val?: SQLAstNode;
    auto_increment?: string;
}

export interface ConstraintDefinition {
    resource: string;
    constraint_type: string;
    constraint_name?: string;
    definition?: Array<ColumnReference> | { columns?: string[] };
    columns?: string[];
    reference_definition?: ReferenceDefinition;
    reference?: ReferenceDefinition;
}

export interface ReferenceDefinition {
    table?: string | TableReference | TableReference[];
    columns?: Array<ColumnReference | string> | string[];
    definition?: Array<ColumnReference>;
    on_update?: string;
    on_delete?: string;
}

export interface CreateTableStatement extends SQLAstNode {
    table: TableReference | TableReference[];
    create_definitions?: Array<ColumnDefinition | ConstraintDefinition>;
    comment?: string;
}

export interface CreateIndexStatement extends SQLAstNode {
    table: TableReference | TableReference[] | string;
    index?: string;
    index_name?: string;
    index_type?: string;
    unique?: boolean;
    columns?: Array<ColumnReference>;
    index_columns?: Array<{ column?: ColumnReference } | ColumnReference>;
}

export interface AlterTableConstraintDefinition extends ConstraintDefinition {
    constraint?: string;
}

export interface AlterTableExprItem {
    action: string;
    resource?: string;
    type?: string;
    constraint?: { constraint_type?: string };
    create_definitions?:
        | AlterTableConstraintDefinition
        | {
              constraint_type?: string;
              definition?: Array<ColumnReference>;
              constraint?: string;
              reference_definition?: ReferenceDefinition;
              resource?: string;
          };
}

export interface AlterTableStatement extends SQLAstNode {
    table: TableReference[] | TableReference | string;
    expr: AlterTableExprItem[];
}

// Define type for column type arguments
export interface TypeArgs {
    length?: number;
    precision?: number;
    scale?: number;
}

// Helper to extract column name from different AST formats
export function extractColumnName(
    columnObj: string | ColumnReference | undefined
): string {
    if (!columnObj) return '';

    // Handle different formats based on actual AST structure
    if (typeof columnObj === 'string') return columnObj;

    if (typeof columnObj === 'object') {
        // Direct column property
        if (columnObj.column) {
            if (typeof columnObj.column === 'string') return columnObj.column;
            if (typeof columnObj.column === 'object') {
                // Handle nested value property
                if (columnObj.column.value) return columnObj.column.value;
                // Handle expression property with value
                if (columnObj.column.expr?.value)
                    return columnObj.column.expr.value;
                // Handle double_quote_string type which is common in PostgreSQL
                if (columnObj.column.expr?.type === 'double_quote_string')
                    return columnObj.column.expr.value || '';
                // Direct access to expr
                if (columnObj.column.expr?.type === 'default')
                    return columnObj.column.expr.value || '';
            }
        }

        // Direct expr property
        if (columnObj.expr) {
            if (columnObj.expr.type === 'default')
                return columnObj.expr.value || '';
            if (columnObj.expr.type === 'double_quote_string')
                return columnObj.expr.value || '';
            if (columnObj.expr.value) return columnObj.expr.value;
        }

        // Direct value property
        if (columnObj.value) return columnObj.value;
    }

    return '';
}

// Helper function to extract type arguments from column definition
export function getTypeArgs(
    definition: ColumnDefinition['definition'] | undefined
): TypeArgs {
    const typeArgs: TypeArgs = {};

    if (!definition) return typeArgs;

    if (definition.length !== undefined) {
        typeArgs.length = definition.length;
    }

    if (definition.scale !== undefined && definition.precision !== undefined) {
        typeArgs.precision = definition.precision;
        typeArgs.scale = definition.scale;
    }

    return typeArgs;
}

// Helper function to find a table with consistent schema handling
export function findTableWithSchemaSupport(
    tables: TableLike[],
    tableName: string,
    schemaName?: string
): TableLike | undefined {
    // Default to public schema if none provided
    const effectiveSchema = schemaName || 'public';

    // First try with exact schema match
    let table = tables.find(
        (t) => t.name === tableName && t.schema === effectiveSchema
    );

    // If not found with schema, try with the legacy schema match
    if (!table && schemaName) {
        table = tables.find(
            (t) => t.name === tableName && t.schema === schemaName
        );
    }

    // If still not found with schema, try any match on the table name
    if (!table) {
        table = tables.find((t) => t.name === tableName);
        if (table) {
            console.log(
                `Found table ${tableName} without schema match, source schema: ${effectiveSchema}, table schema: ${table.schema}`
            );
        }
    }

    return table;
}

// Helper function to find table ID with schema support
export function getTableIdWithSchemaSupport(
    tableMap: Record<string, string>,
    tableName: string,
    schemaName?: string
): string | undefined {
    // Default to public schema if none provided
    const effectiveSchema = schemaName || 'public';

    // First try with schema
    const tableKey = `${effectiveSchema}.${tableName}`;
    let tableId = tableMap[tableKey];

    // If not found with the effective schema, try with the original schema if different
    if (!tableId && schemaName && schemaName !== effectiveSchema) {
        const originalSchemaKey = `${schemaName}.${tableName}`;
        tableId = tableMap[originalSchemaKey];
    }

    // If still not found with schema, try without schema
    if (!tableId) {
        tableId = tableMap[tableName];
        if (tableId) {
            console.log(
                `Found table ID for ${tableName} without schema match, source schema: ${effectiveSchema}`
            );
        } else {
            console.warn(
                `No table ID found for ${tableName} with schema ${effectiveSchema}`
            );
        }
    }

    return tableId;
}
