import { generateId } from '@/lib/utils';
import type {
    SQLParserResult,
    SQLTable,
    SQLColumn,
    SQLIndex,
    SQLForeignKey,
} from '../../common';
import { buildSQLFromAST } from '../../common';
import type {
    SQLAstNode,
    TableReference,
    ColumnReference,
    ColumnDefinition,
    ConstraintDefinition,
    CreateTableStatement,
    CreateIndexStatement,
    AlterTableExprItem,
    AlterTableStatement,
} from './postgresql-common';
import {
    parserOpts,
    extractColumnName,
    getTypeArgs,
    findTableWithSchemaSupport,
    getTableIdWithSchemaSupport,
} from './postgresql-common';

// PostgreSQL-specific parsing logic
export async function fromPostgres(
    sqlContent: string
): Promise<SQLParserResult> {
    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {}; // Maps table name to its ID

    try {
        const { Parser } = await import('node-sql-parser');
        const parser = new Parser();
        // Parse the SQL DDL statements
        const ast = parser.astify(sqlContent, parserOpts);

        if (!Array.isArray(ast)) {
            throw new Error('Failed to parse SQL DDL - AST is not an array');
        }

        // Process each CREATE TABLE statement
        ast.forEach((stmt: SQLAstNode) => {
            if (stmt.type === 'create' && stmt.keyword === 'table') {
                // Extract table name and schema
                let tableName = '';
                let schemaName = '';

                const createTableStmt = stmt as CreateTableStatement;

                if (
                    createTableStmt.table &&
                    typeof createTableStmt.table === 'object'
                ) {
                    // Handle array of tables if needed
                    if (
                        Array.isArray(createTableStmt.table) &&
                        createTableStmt.table.length > 0
                    ) {
                        const tableObj = createTableStmt.table[0];
                        tableName = tableObj.table || '';
                        // Check for schema in both 'schema' and 'db' fields
                        schemaName = tableObj.schema || tableObj.db || '';
                    } else {
                        // Direct object reference
                        const tableObj =
                            createTableStmt.table as TableReference;
                        tableName = tableObj.table || '';
                        // Check for schema in both 'schema' and 'db' fields
                        schemaName = tableObj.schema || tableObj.db || '';
                    }
                }

                if (!tableName) {
                    return;
                }

                // Check if tableName contains a schema prefix (schema.table)
                if (!schemaName && tableName.includes('.')) {
                    const parts = tableName.split('.');
                    schemaName = parts[0].replace(/"/g, '');
                    tableName = parts[1].replace(/"/g, '');
                }

                // If still no schema, ensure default schema is set to public
                if (!schemaName) {
                    schemaName = 'public';
                }

                // Generate a unique ID for the table
                const tableId = generateId();
                const tableKey = `${schemaName ? schemaName + '.' : ''}${tableName}`;
                tableMap[tableKey] = tableId;

                // Process table columns
                const columns: SQLColumn[] = [];
                const indexes: SQLIndex[] = [];

                // Debugged from actual parse output - handle different structure formats
                if (
                    createTableStmt.create_definitions &&
                    Array.isArray(createTableStmt.create_definitions)
                ) {
                    createTableStmt.create_definitions.forEach(
                        (def: ColumnDefinition | ConstraintDefinition) => {
                            // Process column definition
                            if (def.resource === 'column') {
                                const columnDef = def as ColumnDefinition;
                                const columnName = extractColumnName(
                                    columnDef.column
                                );
                                const dataType =
                                    columnDef.definition?.dataType || '';

                                // Handle the column definition and add to columns array
                                if (columnName) {
                                    // Check if the column has a PRIMARY KEY constraint inline
                                    const isPrimaryKey =
                                        columnDef.primary_key ===
                                            'primary key' ||
                                        columnDef.definition?.constraint ===
                                            'primary key';

                                    columns.push({
                                        name: columnName,
                                        type: dataType,
                                        nullable:
                                            columnDef.nullable?.type !==
                                            'not null',
                                        primaryKey: isPrimaryKey,
                                        unique: columnDef.unique === 'unique',
                                        typeArgs: getTypeArgs(
                                            columnDef.definition
                                        ),
                                        default: columnDef.default_val
                                            ? buildSQLFromAST(
                                                  columnDef.default_val
                                              )
                                            : undefined,
                                        increment:
                                            columnDef.auto_increment ===
                                            'auto_increment',
                                    });
                                }
                            } else if (def.resource === 'constraint') {
                                // Handle constraint definitions
                                const constraintDef =
                                    def as ConstraintDefinition;
                                if (
                                    constraintDef.constraint_type ===
                                    'primary key'
                                ) {
                                    // Check if definition is an array (standalone PRIMARY KEY constraint)
                                    if (
                                        Array.isArray(constraintDef.definition)
                                    ) {
                                        // Extract column names from the constraint definition
                                        for (const colDef of constraintDef.definition) {
                                            if (
                                                typeof colDef === 'object' &&
                                                'type' in colDef &&
                                                colDef.type === 'column_ref' &&
                                                'column' in colDef &&
                                                colDef.column
                                            ) {
                                                const pkColumnName =
                                                    extractColumnName(colDef);

                                                // Find and mark the column as primary key
                                                const column = columns.find(
                                                    (col) =>
                                                        col.name ===
                                                        pkColumnName
                                                );
                                                if (column) {
                                                    column.primaryKey = true;
                                                }
                                            }
                                        }

                                        // Add a primary key index
                                        const pkColumnNames =
                                            constraintDef.definition
                                                .filter(
                                                    (colDef: ColumnReference) =>
                                                        typeof colDef ===
                                                            'object' &&
                                                        'type' in colDef &&
                                                        colDef.type ===
                                                            'column_ref' &&
                                                        'column' in colDef &&
                                                        colDef.column
                                                )
                                                .map(
                                                    (colDef: ColumnReference) =>
                                                        extractColumnName(
                                                            colDef
                                                        )
                                                );

                                        if (pkColumnNames.length > 0) {
                                            indexes.push({
                                                name: `pk_${tableName}`,
                                                columns: pkColumnNames,
                                                unique: true,
                                            });
                                        }
                                    } else if (
                                        constraintDef.definition &&
                                        typeof constraintDef.definition ===
                                            'object' &&
                                        !Array.isArray(
                                            constraintDef.definition
                                        ) &&
                                        'columns' in constraintDef.definition
                                    ) {
                                        // Handle different format where columns are in def.definition.columns
                                        const colDefs =
                                            constraintDef.definition.columns ||
                                            [];
                                        for (const colName of colDefs) {
                                            // Find and mark the column as primary key
                                            const column = columns.find(
                                                (col) => col.name === colName
                                            );
                                            if (column) {
                                                column.primaryKey = true;
                                            }
                                        }

                                        // Add a primary key index
                                        if (colDefs.length > 0) {
                                            indexes.push({
                                                name: `pk_${tableName}`,
                                                columns: colDefs,
                                                unique: true,
                                            });
                                        }
                                    }
                                } else if (
                                    constraintDef.constraint_type ===
                                        'unique' &&
                                    constraintDef.definition &&
                                    typeof constraintDef.definition ===
                                        'object' &&
                                    !Array.isArray(constraintDef.definition) &&
                                    'columns' in constraintDef.definition
                                ) {
                                    // Handle unique constraint
                                    const columnDefs =
                                        constraintDef.definition.columns || [];
                                    columnDefs.forEach(
                                        (
                                            uniqueCol: string | ColumnReference
                                        ) => {
                                            const colName =
                                                typeof uniqueCol === 'string'
                                                    ? uniqueCol
                                                    : extractColumnName(
                                                          uniqueCol
                                                      );
                                            const col = columns.find(
                                                (c) => c.name === colName
                                            );
                                            if (col) {
                                                col.unique = true;
                                            }
                                        }
                                    );

                                    // Add as a unique index
                                    if (columnDefs.length > 0) {
                                        indexes.push({
                                            name:
                                                constraintDef.constraint_name ||
                                                `${tableName}_${
                                                    typeof columnDefs[0] ===
                                                    'string'
                                                        ? columnDefs[0]
                                                        : extractColumnName(
                                                              columnDefs[0] as ColumnReference
                                                          )
                                                }_key`,
                                            columns: columnDefs.map(
                                                (
                                                    col:
                                                        | string
                                                        | ColumnReference
                                                ) =>
                                                    typeof col === 'string'
                                                        ? col
                                                        : extractColumnName(col)
                                            ),
                                            unique: true,
                                        });
                                    }
                                } else if (
                                    constraintDef.constraint_type ===
                                        'foreign key' ||
                                    constraintDef.constraint_type ===
                                        'FOREIGN KEY'
                                ) {
                                    // Handle foreign key directly at this level

                                    // Extra code for this specific format
                                    let sourceColumns: string[] = [];
                                    if (
                                        constraintDef.definition &&
                                        Array.isArray(constraintDef.definition)
                                    ) {
                                        sourceColumns =
                                            constraintDef.definition.map(
                                                (col: ColumnReference) => {
                                                    const colName =
                                                        extractColumnName(col);
                                                    return colName;
                                                }
                                            );
                                    } else if (
                                        constraintDef.columns &&
                                        Array.isArray(constraintDef.columns)
                                    ) {
                                        sourceColumns =
                                            constraintDef.columns.map(
                                                (
                                                    col:
                                                        | string
                                                        | ColumnReference
                                                ) => {
                                                    const colName =
                                                        typeof col === 'string'
                                                            ? col
                                                            : extractColumnName(
                                                                  col
                                                              );
                                                    return colName;
                                                }
                                            );
                                    }

                                    const reference =
                                        constraintDef.reference_definition ||
                                        constraintDef.reference;
                                    if (reference && sourceColumns.length > 0) {
                                        // Process similar to the constraint resource case
                                        let targetTable = '';
                                        let targetSchema = '';

                                        if (reference.table) {
                                            if (
                                                typeof reference.table ===
                                                'object'
                                            ) {
                                                if (
                                                    Array.isArray(
                                                        reference.table
                                                    ) &&
                                                    reference.table.length > 0
                                                ) {
                                                    targetTable =
                                                        reference.table[0]
                                                            .table || '';
                                                    targetSchema =
                                                        reference.table[0]
                                                            .schema ||
                                                        reference.table[0].db ||
                                                        '';
                                                } else {
                                                    const tableRef =
                                                        reference.table as TableReference;
                                                    targetTable =
                                                        tableRef.table || '';
                                                    targetSchema =
                                                        tableRef.schema ||
                                                        tableRef.db ||
                                                        '';
                                                }
                                            } else {
                                                targetTable =
                                                    reference.table as string;

                                                // Check if targetTable contains a schema prefix (schema.table)
                                                if (targetTable.includes('.')) {
                                                    const parts =
                                                        targetTable.split('.');
                                                    targetSchema =
                                                        parts[0].replace(
                                                            /"/g,
                                                            ''
                                                        );
                                                    targetTable =
                                                        parts[1].replace(
                                                            /"/g,
                                                            ''
                                                        );
                                                }
                                            }
                                        }

                                        // If no target schema was found, use default public schema
                                        if (!targetSchema) {
                                            targetSchema = 'public';
                                        }

                                        let targetColumns: string[] = [];
                                        if (
                                            reference.columns &&
                                            Array.isArray(reference.columns)
                                        ) {
                                            targetColumns =
                                                reference.columns.map(
                                                    (
                                                        col:
                                                            | string
                                                            | ColumnReference
                                                    ) => {
                                                        const colName =
                                                            typeof col ===
                                                            'string'
                                                                ? col
                                                                : extractColumnName(
                                                                      col
                                                                  );
                                                        return colName;
                                                    }
                                                );
                                        } else if (
                                            reference.definition &&
                                            Array.isArray(reference.definition)
                                        ) {
                                            targetColumns =
                                                reference.definition.map(
                                                    (col: ColumnReference) => {
                                                        const colName =
                                                            extractColumnName(
                                                                col
                                                            );
                                                        return colName;
                                                    }
                                                );
                                        }

                                        // Create relationships
                                        if (
                                            targetColumns.length > 0 &&
                                            targetTable
                                        ) {
                                            for (
                                                let i = 0;
                                                i <
                                                Math.min(
                                                    sourceColumns.length,
                                                    targetColumns.length
                                                );
                                                i++
                                            ) {
                                                // Look up target table ID using the helper function
                                                const targetTableId =
                                                    getTableIdWithSchemaSupport(
                                                        tableMap,
                                                        targetTable,
                                                        targetSchema
                                                    );

                                                if (!targetTableId) {
                                                    continue; // Skip this relationship if target table not found
                                                }

                                                const fk: SQLForeignKey = {
                                                    name:
                                                        constraintDef.constraint_name ||
                                                        `${tableName}_${sourceColumns[i]}_fkey`,
                                                    sourceTable: tableName,
                                                    sourceSchema: schemaName,
                                                    sourceColumn:
                                                        sourceColumns[i],
                                                    targetTable,
                                                    targetSchema,
                                                    targetColumn:
                                                        targetColumns[i],
                                                    sourceTableId: tableId,
                                                    targetTableId,
                                                    updateAction:
                                                        reference.on_update,
                                                    deleteAction:
                                                        reference.on_delete,
                                                };

                                                relationships.push(fk);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    );
                }

                // Create the table object
                const table: SQLTable = {
                    id: tableId,
                    name: tableName,
                    schema: schemaName,
                    columns,
                    indexes,
                    order: tables.length,
                };

                // Set comment if available (if exists in the parser's output)
                if (
                    'comment' in createTableStmt &&
                    typeof createTableStmt.comment === 'string'
                ) {
                    table.comment = createTableStmt.comment;
                }

                tables.push(table);
            } else if (stmt.type === 'create' && stmt.keyword === 'index') {
                // Handle CREATE INDEX statements
                const createIndexStmt = stmt as CreateIndexStatement;
                if (createIndexStmt.table) {
                    // Extract table name and schema
                    let tableName = '';
                    let schemaName = '';

                    if (typeof createIndexStmt.table === 'string') {
                        tableName = createIndexStmt.table;
                    } else if (Array.isArray(createIndexStmt.table)) {
                        if (createIndexStmt.table.length > 0) {
                            tableName = createIndexStmt.table[0].table || '';
                            schemaName = createIndexStmt.table[0].schema || '';
                        }
                    } else {
                        // Direct object reference
                        tableName = createIndexStmt.table.table || '';
                        schemaName = createIndexStmt.table.schema || '';
                    }

                    // Check if tableName contains a schema prefix (schema.table)
                    if (!schemaName && tableName.includes('.')) {
                        const parts = tableName.split('.');
                        schemaName = parts[0].replace(/"/g, '');
                        tableName = parts[1].replace(/"/g, '');
                    }

                    // If still no schema, use public
                    if (!schemaName) {
                        schemaName = 'public';
                    }

                    // Find the table in our collection using the helper function
                    const table = findTableWithSchemaSupport(
                        tables,
                        tableName,
                        schemaName
                    );

                    if (table) {
                        // Extract column names from index columns
                        let columns: string[] = [];

                        // Check different possible structures for index columns
                        if (
                            createIndexStmt.columns &&
                            Array.isArray(createIndexStmt.columns)
                        ) {
                            // Some PostgreSQL parsers use 'columns'
                            columns = createIndexStmt.columns
                                .map((col: ColumnReference) =>
                                    extractColumnName(col)
                                )
                                .filter((col: string) => col !== '');
                        } else if (
                            createIndexStmt.index_columns &&
                            Array.isArray(createIndexStmt.index_columns)
                        ) {
                            // Other parsers use 'index_columns'
                            columns = createIndexStmt.index_columns
                                .map(
                                    (
                                        col:
                                            | { column?: ColumnReference }
                                            | ColumnReference
                                    ) => {
                                        const colRef =
                                            'column' in col ? col.column : col;
                                        const colName = extractColumnName(
                                            colRef || col
                                        );
                                        return colName;
                                    }
                                )
                                .filter((col: string) => col !== '');
                        }

                        if (columns.length > 0) {
                            const indexName =
                                createIndexStmt.index ||
                                createIndexStmt.index_name ||
                                `idx_${tableName}_${columns.join('_')}`;

                            table.indexes.push({
                                name: indexName,
                                columns,
                                unique:
                                    createIndexStmt.index_type === 'unique' ||
                                    createIndexStmt.unique === true,
                            });
                        }
                    }
                }
            } else if (stmt.type === 'alter' && stmt.keyword === 'table') {
                // Process ALTER TABLE statements for foreign keys
                const alterTableStmt = stmt as AlterTableStatement;
                if (
                    alterTableStmt.table &&
                    alterTableStmt.expr &&
                    alterTableStmt.expr.length > 0
                ) {
                    // Fix the table name extraction - table is an array in ALTER TABLE statements
                    let tableName = '';
                    let schemaName = '';

                    if (
                        Array.isArray(alterTableStmt.table) &&
                        alterTableStmt.table.length > 0
                    ) {
                        const tableObj = alterTableStmt.table[0];
                        tableName = tableObj.table || '';
                        // Check for schema in both 'schema' and 'db' fields
                        schemaName = tableObj.schema || tableObj.db || '';
                    } else if (typeof alterTableStmt.table === 'object') {
                        const tableRef = alterTableStmt.table as TableReference;
                        tableName = tableRef.table || '';
                        // Check for schema in both 'schema' and 'db' fields
                        schemaName = tableRef.schema || tableRef.db || '';
                    } else {
                        tableName = alterTableStmt.table;
                    }

                    // Check if tableName contains a schema prefix (schema.table)
                    if (!schemaName && tableName.includes('.')) {
                        const parts = tableName.split('.');
                        schemaName = parts[0].replace(/"/g, '');
                        tableName = parts[1].replace(/"/g, '');
                    }

                    // If still no schema, use default
                    if (!schemaName) {
                        schemaName = 'public';
                    }

                    // Find this table in our collection using the helper function
                    const table = findTableWithSchemaSupport(
                        tables,
                        tableName,
                        schemaName
                    );

                    if (!table) {
                        return;
                    }

                    // Process each expression in the ALTER TABLE
                    alterTableStmt.expr.forEach((expr: AlterTableExprItem) => {
                        // Check multiple variations of constraint format
                        if (expr.action === 'add' && expr.create_definitions) {
                            // Check for foreign key constraint
                            if (
                                expr.create_definitions.constraint_type ===
                                    'FOREIGN KEY' ||
                                expr.create_definitions.constraint_type ===
                                    'foreign key'
                            ) {
                                const createDefs = expr.create_definitions;

                                // Extract source columns
                                let sourceColumns: string[] = [];
                                if (
                                    createDefs.definition &&
                                    Array.isArray(createDefs.definition)
                                ) {
                                    sourceColumns = createDefs.definition.map(
                                        (col: ColumnReference) => {
                                            const colName =
                                                extractColumnName(col);
                                            return colName;
                                        }
                                    );
                                }

                                // Extract target table and schema
                                const reference =
                                    createDefs.reference_definition;

                                // Declare target variables
                                let targetTable = '';
                                let targetSchema = '';
                                let targetColumns: string[] = [];

                                if (reference && reference.table) {
                                    if (typeof reference.table === 'object') {
                                        if (
                                            Array.isArray(reference.table) &&
                                            reference.table.length > 0
                                        ) {
                                            targetTable =
                                                reference.table[0].table || '';
                                            targetSchema =
                                                reference.table[0].schema ||
                                                reference.table[0].db ||
                                                '';
                                        } else {
                                            const tableRef =
                                                reference.table as TableReference;
                                            targetTable = tableRef.table || '';
                                            targetSchema =
                                                tableRef.schema ||
                                                tableRef.db ||
                                                '';
                                        }
                                    } else {
                                        targetTable = reference.table as string;

                                        // Check if targetTable contains a schema prefix (schema.table)
                                        if (targetTable.includes('.')) {
                                            const parts =
                                                targetTable.split('.');
                                            targetSchema = parts[0].replace(
                                                /"/g,
                                                ''
                                            );
                                            targetTable = parts[1].replace(
                                                /"/g,
                                                ''
                                            );
                                        }
                                    }
                                }

                                // If no target schema was found, use default schema
                                if (!targetSchema) {
                                    targetSchema = 'public';
                                }

                                // Extract target columns
                                if (
                                    reference &&
                                    reference.definition &&
                                    Array.isArray(reference.definition)
                                ) {
                                    targetColumns = reference.definition.map(
                                        (col: ColumnReference) => {
                                            const colName =
                                                extractColumnName(col);
                                            return colName;
                                        }
                                    );
                                }

                                // Create relationships
                                if (
                                    sourceColumns.length > 0 &&
                                    targetTable &&
                                    targetColumns.length > 0
                                ) {
                                    for (
                                        let i = 0;
                                        i <
                                        Math.min(
                                            sourceColumns.length,
                                            targetColumns.length
                                        );
                                        i++
                                    ) {
                                        // Look up source and target table IDs
                                        const sourceTableId =
                                            getTableIdWithSchemaSupport(
                                                tableMap,
                                                tableName,
                                                schemaName
                                            );
                                        const targetTableId =
                                            getTableIdWithSchemaSupport(
                                                tableMap,
                                                targetTable,
                                                targetSchema
                                            );

                                        if (!sourceTableId) {
                                            continue;
                                        }

                                        if (!targetTableId) {
                                            continue;
                                        }

                                        // Safe to access properties with null check
                                        const updateAction =
                                            reference?.on_update;
                                        const deleteAction =
                                            reference?.on_delete;

                                        const fk: SQLForeignKey = {
                                            name:
                                                'constraint' in createDefs
                                                    ? createDefs.constraint ||
                                                      `${tableName}_${sourceColumns[i]}_fkey`
                                                    : `${tableName}_${sourceColumns[i]}_fkey`,
                                            sourceTable: tableName,
                                            sourceSchema: schemaName,
                                            sourceColumn: sourceColumns[i],
                                            targetTable,
                                            targetSchema,
                                            targetColumn: targetColumns[i],
                                            sourceTableId,
                                            targetTableId,
                                            updateAction,
                                            deleteAction,
                                        };

                                        relationships.push(fk);
                                    }
                                }
                            } else if (
                                'resource' in expr.create_definitions &&
                                expr.create_definitions.resource ===
                                    'constraint'
                            ) {
                                // For backward compatibility, keep the existing check
                            }
                        }
                    });
                }
            }
        });

        // Update table IDs in relationships and fix missing target table IDs
        relationships.forEach((rel) => {
            // Ensure schemas are set to 'public' if empty
            if (!rel.sourceSchema) rel.sourceSchema = 'public';
            if (!rel.targetSchema) rel.targetSchema = 'public';

            // Only check/fix sourceTableId if not already set
            if (!rel.sourceTableId) {
                rel.sourceTableId =
                    getTableIdWithSchemaSupport(
                        tableMap,
                        rel.sourceTable,
                        rel.sourceSchema
                    ) || '';
            }

            // Check/fix targetTableId if not already set
            if (!rel.targetTableId) {
                rel.targetTableId =
                    getTableIdWithSchemaSupport(
                        tableMap,
                        rel.targetTable,
                        rel.targetSchema
                    ) || '';
            }
        });

        // Filter out relationships with missing source table IDs or target table IDs
        const validRelationships = relationships.filter(
            (rel) => rel.sourceTableId && rel.targetTableId
        );

        return { tables, relationships: validRelationships };
    } catch (error: unknown) {
        throw new Error(
            `Error parsing PostgreSQL SQL: ${(error as Error).message}`
        );
    }
}
