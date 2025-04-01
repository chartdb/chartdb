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
} from './mysql-common';
import {
    parser,
    parserOpts,
    extractColumnName,
    getTypeArgs,
    findTableWithSchemaSupport,
    getTableIdWithSchemaSupport,
} from './mysql-common';

// PostgreSQL-specific parsing logic
export function fromPostgres(sqlContent: string): SQLParserResult {
    console.log('PostgreSQL parser starting');
    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {}; // Maps table name to its ID

    try {
        // Parse the SQL DDL statements
        console.log('Parsing SQL DDL with PostgreSQL parser');
        const ast = parser.astify(sqlContent, parserOpts);

        if (!Array.isArray(ast)) {
            throw new Error('Failed to parse SQL DDL - AST is not an array');
        }

        console.log(`Parsed ${ast.length} SQL statements`, ast);

        // Debug the full AST structure
        console.log('AST structure:', JSON.stringify(ast, null, 2));

        // Process each CREATE TABLE statement
        ast.forEach((stmt: SQLAstNode, idx: number) => {
            console.log(`Processing statement ${idx + 1}:`, {
                type: stmt.type,
                keyword: stmt.keyword,
            });

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
                    console.log(
                        `Found CREATE TABLE for: ${schemaName ? schemaName + '.' : ''}${tableName}`
                    );

                    // If schema is found, log it clearly for debugging
                    if (schemaName) {
                        console.log(
                            `Found schema: ${schemaName} for table: ${tableName}`
                        );
                    }
                }

                if (!tableName) {
                    console.log('Skipping table with empty name');
                    return;
                }

                // Check if tableName contains a schema prefix (schema.table)
                if (!schemaName && tableName.includes('.')) {
                    const parts = tableName.split('.');
                    schemaName = parts[0].replace(/"/g, '');
                    tableName = parts[1].replace(/"/g, '');
                    console.log(
                        `Extracted schema from table name: schema=${schemaName}, table=${tableName}`
                    );
                }

                // If still no schema, ensure default schema is set to public
                if (!schemaName) {
                    schemaName = 'public';
                    console.log(
                        `Using default schema: ${schemaName} for table: ${tableName}`
                    );
                }

                // Generate a unique ID for the table
                const tableId = generateId();
                const tableKey = `${schemaName ? schemaName + '.' : ''}${tableName}`;
                tableMap[tableKey] = tableId;
                console.log(
                    `Added table to tableMap with key: "${tableKey}", id: ${tableId}`
                );

                // Process table columns
                const columns: SQLColumn[] = [];
                const indexes: SQLIndex[] = [];

                // Debugged from actual parse output - handle different structure formats
                if (
                    createTableStmt.create_definitions &&
                    Array.isArray(createTableStmt.create_definitions)
                ) {
                    console.log(
                        `Table ${tableName} has ${createTableStmt.create_definitions.length} column/constraint definitions`
                    );

                    createTableStmt.create_definitions.forEach(
                        (
                            def: ColumnDefinition | ConstraintDefinition,
                            colIdx: number
                        ) => {
                            console.log(
                                `Processing definition ${colIdx + 1}:`,
                                def
                            );

                            // Process column definition
                            if (def.resource === 'column') {
                                const columnDef = def as ColumnDefinition;
                                const columnName = extractColumnName(
                                    columnDef.column
                                );
                                const dataType =
                                    columnDef.definition?.dataType || '';

                                console.log(`Found column definition:`, {
                                    column: columnName,
                                    dataType: dataType,
                                });

                                // Handle the column definition and add to columns array
                                if (columnName) {
                                    // Check if the column has a PRIMARY KEY constraint inline
                                    const isPrimaryKey =
                                        columnDef.primary_key ===
                                            'primary key' ||
                                        // Check inline constraint property on the definition
                                        columnDef.definition?.constraint ===
                                            'primary key';

                                    // MySQL specific: Check for AUTO_INCREMENT using the dedicated property
                                    const isIncrement =
                                        columnDef.auto_increment ===
                                        'auto_increment';

                                    columns.push({
                                        name: columnName,
                                        type: dataType,
                                        nullable:
                                            columnDef.nullable?.type !==
                                            'not null',
                                        primaryKey: isPrimaryKey,
                                        unique:
                                            columnDef.unique === 'unique' ||
                                            // Check inline constraint property for unique
                                            columnDef.definition?.constraint ===
                                                'unique',
                                        typeArgs: getTypeArgs(
                                            columnDef.definition
                                        ),
                                        default: columnDef.default_val
                                            ? buildSQLFromAST(
                                                  columnDef.default_val
                                              )
                                            : undefined,
                                        increment: isIncrement,
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
                                    console.log(
                                        `Found PRIMARY KEY constraint with structure:`,
                                        constraintDef
                                    );

                                    // Check if definition is an array (standalone PRIMARY KEY constraint)
                                    if (
                                        Array.isArray(constraintDef.definition)
                                    ) {
                                        console.log(
                                            `Processing PK with definition as array`
                                        );

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
                                                console.log(
                                                    `Primary key column: ${pkColumnName}`
                                                );

                                                // Find and mark the column as primary key
                                                const column = columns.find(
                                                    (col) =>
                                                        col.name ===
                                                        pkColumnName
                                                );
                                                if (column) {
                                                    column.primaryKey = true;
                                                    console.log(
                                                        `Marked column ${pkColumnName} as primary key`
                                                    );
                                                } else {
                                                    console.log(
                                                        `Warning: Primary key column ${pkColumnName} not found in columns array`
                                                    );
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
                                            console.log(
                                                `Added primary key index for columns: ${pkColumnNames.join(', ')}`
                                            );
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
                                        console.log(
                                            `Processing PK with columns in definition.columns`
                                        );

                                        // Handle different format where columns are in def.definition.columns
                                        const colDefs =
                                            constraintDef.definition.columns ||
                                            [];
                                        for (const colName of colDefs) {
                                            console.log(
                                                `Primary key column: ${colName}`
                                            );

                                            // Find and mark the column as primary key
                                            const column = columns.find(
                                                (col) => col.name === colName
                                            );
                                            if (column) {
                                                column.primaryKey = true;
                                                console.log(
                                                    `Marked column ${colName} as primary key`
                                                );
                                            } else {
                                                console.log(
                                                    `Warning: Primary key column ${colName} not found in columns array`
                                                );
                                            }
                                        }

                                        // Add a primary key index
                                        if (colDefs.length > 0) {
                                            indexes.push({
                                                name: `pk_${tableName}`,
                                                columns: colDefs,
                                                unique: true,
                                            });
                                            console.log(
                                                `Added primary key index for columns: ${colDefs.join(', ')}`
                                            );
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
                                    console.log(
                                        'Found foreign key at top level:',
                                        JSON.stringify(constraintDef, null, 2)
                                    );

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
                                                    console.log(
                                                        'Top level source column:',
                                                        colName
                                                    );
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
                                                    console.log(
                                                        'Top level source column from columns:',
                                                        colName
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
                                                    console.log(
                                                        `Extracted schema from FK target table: schema=${targetSchema}, table=${targetTable}`
                                                    );
                                                }
                                            }
                                        }

                                        // If no target schema was found, use default public schema
                                        if (!targetSchema) {
                                            targetSchema = 'public';
                                            console.log(
                                                `Using default schema: ${targetSchema} for FK target table: ${targetTable}`
                                            );
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
                                                        console.log(
                                                            'Top level target column:',
                                                            colName
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
                                                        console.log(
                                                            'Top level target column from definition:',
                                                            colName
                                                        );
                                                        return colName;
                                                    }
                                                );
                                        }

                                        console.log('Top level FK details:', {
                                            sourceColumns,
                                            targetTable,
                                            targetColumns,
                                        });

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
                                                    console.warn(
                                                        `Target table ${targetTable} not found for FK in top level CREATE TABLE with schema ${targetSchema}`
                                                    );
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

                                                console.log(
                                                    'Adding relationship from top level:',
                                                    fk
                                                );
                                                relationships.push(fk);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    );
                } else {
                    console.log(`Table ${tableName} has no columns defined`);
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

                console.log(`Adding table to results:`, {
                    name: table.name,
                    columns: table.columns.length,
                    indexes: table.indexes.length,
                });
                tables.push(table);
            } else if (stmt.type === 'create' && stmt.keyword === 'index') {
                // Handle CREATE INDEX statements
                console.log(
                    'Processing CREATE INDEX statement:',
                    JSON.stringify(stmt, null, 2)
                );

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
                        console.log(
                            `Extracted schema from index table name: schema=${schemaName}, table=${tableName}`
                        );
                    }

                    // If still no schema, use public
                    if (!schemaName) {
                        schemaName = 'public';
                        console.log(
                            `Using default schema: ${schemaName} for indexed table: ${tableName}`
                        );
                    }

                    console.log(
                        `Processing CREATE INDEX for table: ${schemaName ? schemaName + '.' : ''}${tableName}`
                    );

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
                                        console.log(
                                            'Extracted index column:',
                                            colName
                                        );
                                        return colName;
                                    }
                                )
                                .filter((col: string) => col !== '');
                        }

                        console.log(
                            `Found ${columns.length} columns for index:`,
                            columns
                        );

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

                            console.log(
                                `Added index ${indexName} to table ${tableName}`
                            );
                        } else {
                            console.log(
                                'Could not extract column names for index'
                            );
                        }
                    } else {
                        console.log(
                            `Table ${tableName} not found for CREATE INDEX statement`
                        );
                    }
                }
            } else if (stmt.type === 'alter' && stmt.keyword === 'table') {
                // Process ALTER TABLE statements for foreign keys
                console.log(
                    'Processing ALTER TABLE statement:',
                    JSON.stringify(stmt, null, 2)
                );

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
                        console.log(
                            `Extracted schema from ALTER TABLE name: schema=${schemaName}, table=${tableName}`
                        );
                    }

                    // If still no schema, use default
                    if (!schemaName) {
                        schemaName = 'public';
                        console.log(
                            `Using default schema: ${schemaName} for ALTER TABLE: ${tableName}`
                        );
                    }

                    console.log(
                        `Processing ALTER TABLE for: ${schemaName ? schemaName + '.' : ''}${tableName}`
                    );

                    // Find this table in our collection using the helper function
                    const table = findTableWithSchemaSupport(
                        tables,
                        tableName,
                        schemaName
                    );

                    if (!table) {
                        console.log(
                            `Table ${schemaName ? schemaName + '.' : ''}${tableName} not found for ALTER TABLE statement`
                        );
                        return;
                    }

                    // Process each expression in the ALTER TABLE
                    alterTableStmt.expr.forEach((expr: AlterTableExprItem) => {
                        console.log(
                            'ALTER TABLE expression:',
                            JSON.stringify(expr, null, 2)
                        );
                        console.log(
                            'ALTER TABLE expression action:',
                            expr.action,
                            'constraint_type:',
                            expr.constraint?.constraint_type,
                            'resource:',
                            expr.resource,
                            'expression type:',
                            expr.type
                        );

                        // Check multiple variations of constraint format
                        if (expr.action === 'add' && expr.create_definitions) {
                            console.log('ALTER TABLE add action found');
                            console.log(
                                'expr.create_definitions:',
                                JSON.stringify(expr.create_definitions, null, 2)
                            );

                            // Check for foreign key constraint
                            if (
                                expr.create_definitions.constraint_type ===
                                    'FOREIGN KEY' ||
                                expr.create_definitions.constraint_type ===
                                    'foreign key'
                            ) {
                                console.log(
                                    'Found FOREIGN KEY constraint in ALTER TABLE'
                                );

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
                                            console.log(
                                                'ALTER TABLE FK source column:',
                                                colName
                                            );
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
                                            console.log(
                                                `Extracted schema from FK target table: schema=${targetSchema}, table=${targetTable}`
                                            );
                                        }
                                    }
                                }

                                // If no target schema was found, use default schema
                                if (!targetSchema) {
                                    targetSchema = 'public';
                                    console.log(
                                        `Using default schema: ${targetSchema} for FK target table in ALTER TABLE: ${targetTable}`
                                    );
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
                                            console.log(
                                                'ALTER TABLE FK target column:',
                                                colName
                                            );
                                            return colName;
                                        }
                                    );
                                }

                                console.log('ALTER TABLE FK details:', {
                                    sourceTable: tableName,
                                    sourceColumns,
                                    targetTable,
                                    targetColumns,
                                });

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
                                            console.warn(
                                                `Source table ${tableName} not found for FK in ALTER TABLE`
                                            );
                                            continue;
                                        }

                                        if (!targetTableId) {
                                            console.warn(
                                                `Target table ${targetTable} not found for FK in ALTER TABLE with schema ${targetSchema}`
                                            );
                                            continue;
                                        }

                                        // Access FK actions directly from the reference object
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

                                        console.log(
                                            'Adding relationship from ALTER TABLE:',
                                            fk
                                        );
                                        relationships.push(fk);
                                    }
                                }
                            } else if (
                                'resource' in expr.create_definitions &&
                                expr.create_definitions.resource ===
                                    'constraint'
                            ) {
                                // For backward compatibility, keep the existing check
                                console.log(
                                    'Found constraint in expr.resource:',
                                    expr.create_definitions.constraint_type
                                );
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

                if (!rel.sourceTableId) {
                    console.warn(
                        `Source table ${rel.sourceTable} not found for relationship with schema ${rel.sourceSchema}`
                    );
                }
            }

            // Check/fix targetTableId if not already set
            if (!rel.targetTableId) {
                rel.targetTableId =
                    getTableIdWithSchemaSupport(
                        tableMap,
                        rel.targetTable,
                        rel.targetSchema
                    ) || '';

                if (!rel.targetTableId) {
                    console.warn(
                        `Target table ${rel.targetTable} not found for relationship with schema ${rel.targetSchema}`
                    );
                }
            }
        });

        // Filter out relationships with missing source table IDs or target table IDs
        const validRelationships = relationships.filter(
            (rel) => rel.sourceTableId && rel.targetTableId
        );

        // Log any invalid relationships that were filtered out
        if (validRelationships.length !== relationships.length) {
            console.warn(
                `Filtered out ${relationships.length - validRelationships.length} invalid relationships`
            );
        }

        // At the end before returning
        console.log(
            `PostgreSQL parser finished with ${tables.length} tables and ${validRelationships.length} relationships`
        );

        // Debug log to show schema information for all tables
        console.log('Tables with schema information:');
        tables.forEach((table) => {
            console.log(
                `Table: ${table.name}, Schema: ${table.schema || 'none'}, ID: ${table.id}`
            );
        });

        // Debug log to show schema information for all relationships
        console.log('Relationships with schema information:');
        validRelationships.forEach((rel) => {
            console.log(
                `Relationship: ${rel.name}, Source: ${rel.sourceSchema || 'none'}.${rel.sourceTable}, Target: ${rel.targetSchema || 'none'}.${rel.targetTable}`
            );
        });

        return { tables, relationships: validRelationships };
    } catch (error: unknown) {
        console.error('Error in PostgreSQL parser:', error);
        throw new Error(
            `Error parsing PostgreSQL SQL: ${(error as Error).message}`
        );
    }
}

export function fromMySQL(sqlContent: string): SQLParserResult {
    console.log('MySQL parser starting');
    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {}; // Maps table name to its ID

    try {
        // Parse the SQL DDL statements
        console.log('Parsing SQL DDL with MySQL parser');
        const ast = parser.astify(sqlContent, parserOpts);

        if (!Array.isArray(ast)) {
            throw new Error('Failed to parse SQL DDL - AST is not an array');
        }

        console.log(`Parsed ${ast.length} SQL statements`);

        // Process each CREATE TABLE statement
        ast.forEach((stmt: SQLAstNode, idx: number) => {
            console.log(`Processing statement ${idx + 1}:`, {
                type: stmt.type,
                keyword: stmt.keyword,
            });

            if (stmt.type === 'create' && stmt.keyword === 'table') {
                // Extract table name
                let tableName = '';

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
                    } else {
                        // Direct object reference
                        const tableObj =
                            createTableStmt.table as TableReference;
                        tableName = tableObj.table || '';
                    }
                    console.log(`Found CREATE TABLE for: ${tableName}`);
                } else if (typeof createTableStmt.table === 'string') {
                    // Handle string table names (MySQL often has this format)
                    tableName = createTableStmt.table;
                    console.log(`Found CREATE TABLE for: ${tableName}`);
                }

                // Remove backticks from table name if present
                tableName = tableName.replace(/`/g, '');

                if (!tableName) {
                    console.log('Skipping table with empty name');
                    return;
                }

                // Generate a unique ID for the table
                const tableId = generateId();
                tableMap[tableName] = tableId;
                console.log(
                    `Added table to tableMap with key: "${tableName}", id: ${tableId}`
                );

                // Process table columns
                const columns: SQLColumn[] = [];
                const indexes: SQLIndex[] = [];

                // Debugged from actual parse output - handle different structure formats
                if (
                    createTableStmt.create_definitions &&
                    Array.isArray(createTableStmt.create_definitions)
                ) {
                    console.log(
                        `Table ${tableName} has ${createTableStmt.create_definitions.length} column/constraint definitions`
                    );

                    createTableStmt.create_definitions.forEach(
                        (
                            def: ColumnDefinition | ConstraintDefinition,
                            colIdx: number
                        ) => {
                            console.log(
                                `Processing definition ${colIdx + 1}:`,
                                def
                            );

                            // Process column definition
                            if (def.resource === 'column') {
                                const columnDef = def as ColumnDefinition;
                                let columnName = extractColumnName(
                                    columnDef.column
                                );

                                // Remove backticks if present
                                columnName = columnName.replace(/`/g, '');

                                const dataType =
                                    columnDef.definition?.dataType || '';

                                console.log(`Found column definition:`, {
                                    column: columnName,
                                    dataType: dataType,
                                });

                                // Handle the column definition and add to columns array
                                if (columnName) {
                                    // Check if the column has a PRIMARY KEY constraint inline
                                    const isPrimaryKey =
                                        columnDef.primary_key ===
                                            'primary key' ||
                                        // Check inline constraint property on the definition
                                        columnDef.definition?.constraint ===
                                            'primary key';

                                    // MySQL specific: Check for AUTO_INCREMENT using the dedicated property
                                    const isIncrement =
                                        columnDef.auto_increment ===
                                        'auto_increment';

                                    columns.push({
                                        name: columnName,
                                        type: dataType,
                                        nullable:
                                            columnDef.nullable?.type !==
                                            'not null',
                                        primaryKey: isPrimaryKey,
                                        unique:
                                            columnDef.unique === 'unique' ||
                                            // Check inline constraint property for unique
                                            columnDef.definition?.constraint ===
                                                'unique',
                                        typeArgs: getTypeArgs(
                                            columnDef.definition
                                        ),
                                        default: columnDef.default_val
                                            ? buildSQLFromAST(
                                                  columnDef.default_val
                                              )
                                            : undefined,
                                        increment: isIncrement,
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
                                    console.log(
                                        `Found PRIMARY KEY constraint with structure:`,
                                        constraintDef
                                    );

                                    // Check if definition is an array (standalone PRIMARY KEY constraint)
                                    if (
                                        Array.isArray(constraintDef.definition)
                                    ) {
                                        console.log(
                                            `Processing PK with definition as array`
                                        );

                                        // Extract column names from the constraint definition
                                        for (const colDef of constraintDef.definition) {
                                            if (
                                                typeof colDef === 'object' &&
                                                'type' in colDef &&
                                                colDef.type === 'column_ref' &&
                                                'column' in colDef &&
                                                colDef.column
                                            ) {
                                                let pkColumnName =
                                                    extractColumnName(colDef);

                                                // Remove backticks if present
                                                pkColumnName =
                                                    pkColumnName.replace(
                                                        /`/g,
                                                        ''
                                                    );

                                                console.log(
                                                    `Primary key column: ${pkColumnName}`
                                                );

                                                // Find and mark the column as primary key
                                                const column = columns.find(
                                                    (col) =>
                                                        col.name ===
                                                        pkColumnName
                                                );
                                                if (column) {
                                                    column.primaryKey = true;
                                                    console.log(
                                                        `Marked column ${pkColumnName} as primary key`
                                                    );
                                                } else {
                                                    console.log(
                                                        `Warning: Primary key column ${pkColumnName} not found in columns array`
                                                    );
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
                                                    (
                                                        colDef: ColumnReference
                                                    ) => {
                                                        const colName =
                                                            extractColumnName(
                                                                colDef
                                                            );
                                                        return colName.replace(
                                                            /`/g,
                                                            ''
                                                        );
                                                    }
                                                );

                                        if (pkColumnNames.length > 0) {
                                            indexes.push({
                                                name: `pk_${tableName}`,
                                                columns: pkColumnNames,
                                                unique: true,
                                            });
                                            console.log(
                                                `Added primary key index for columns: ${pkColumnNames.join(', ')}`
                                            );
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
                                        console.log(
                                            `Processing PK with columns in definition.columns`
                                        );

                                        // Handle different format where columns are in def.definition.columns
                                        const colDefs =
                                            constraintDef.definition.columns ||
                                            [];
                                        for (const colName of colDefs) {
                                            const cleanColName =
                                                typeof colName === 'string'
                                                    ? colName.replace(/`/g, '')
                                                    : colName;

                                            console.log(
                                                `Primary key column: ${cleanColName}`
                                            );

                                            // Find and mark the column as primary key
                                            const column = columns.find(
                                                (col) =>
                                                    col.name === cleanColName
                                            );
                                            if (column) {
                                                column.primaryKey = true;
                                                console.log(
                                                    `Marked column ${cleanColName} as primary key`
                                                );
                                            } else {
                                                console.log(
                                                    `Warning: Primary key column ${cleanColName} not found in columns array`
                                                );
                                            }
                                        }

                                        // Add a primary key index
                                        if (colDefs.length > 0) {
                                            const cleanColDefs = colDefs.map(
                                                (col) =>
                                                    typeof col === 'string'
                                                        ? col.replace(/`/g, '')
                                                        : col
                                            );

                                            indexes.push({
                                                name: `pk_${tableName}`,
                                                columns: cleanColDefs,
                                                unique: true,
                                            });
                                            console.log(
                                                `Added primary key index for columns: ${cleanColDefs.join(', ')}`
                                            );
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
                                                    ? uniqueCol.replace(
                                                          /`/g,
                                                          ''
                                                      )
                                                    : extractColumnName(
                                                          uniqueCol
                                                      ).replace(/`/g, '');
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
                                        const cleanColumnNames = columnDefs.map(
                                            (col: string | ColumnReference) =>
                                                typeof col === 'string'
                                                    ? col.replace(/`/g, '')
                                                    : extractColumnName(
                                                          col as ColumnReference
                                                      ).replace(/`/g, '')
                                        );

                                        indexes.push({
                                            name: constraintDef.constraint_name
                                                ? constraintDef.constraint_name.replace(
                                                      /`/g,
                                                      ''
                                                  )
                                                : `${tableName}_${cleanColumnNames[0]}_key`,
                                            columns: cleanColumnNames,
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
                                    console.log(
                                        'Found foreign key at top level:',
                                        JSON.stringify(constraintDef, null, 2)
                                    );

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
                                                        extractColumnName(
                                                            col
                                                        ).replace(/`/g, '');
                                                    console.log(
                                                        'Top level source column:',
                                                        colName
                                                    );
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
                                                            ? col.replace(
                                                                  /`/g,
                                                                  ''
                                                              )
                                                            : extractColumnName(
                                                                  col
                                                              ).replace(
                                                                  /`/g,
                                                                  ''
                                                              );
                                                    console.log(
                                                        'Top level source column from columns:',
                                                        colName
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
                                                } else {
                                                    const tableRef =
                                                        reference.table as TableReference;
                                                    targetTable =
                                                        tableRef.table || '';
                                                }
                                            } else {
                                                targetTable =
                                                    reference.table as string;
                                            }

                                            // Remove backticks from target table
                                            targetTable = targetTable.replace(
                                                /`/g,
                                                ''
                                            );
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
                                                                ? col.replace(
                                                                      /`/g,
                                                                      ''
                                                                  )
                                                                : extractColumnName(
                                                                      col
                                                                  ).replace(
                                                                      /`/g,
                                                                      ''
                                                                  );
                                                        console.log(
                                                            'Top level target column:',
                                                            colName
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
                                                            ).replace(/`/g, '');
                                                        console.log(
                                                            'Top level target column from definition:',
                                                            colName
                                                        );
                                                        return colName;
                                                    }
                                                );
                                        }

                                        console.log('Top level FK details:', {
                                            sourceColumns,
                                            targetTable,
                                            targetColumns,
                                        });

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
                                                const targetTableId =
                                                    tableMap[targetTable];

                                                if (!targetTableId) {
                                                    console.warn(
                                                        `Target table ${targetTable} not found for FK in top level CREATE TABLE`
                                                    );
                                                    continue; // Skip this relationship if target table not found
                                                }

                                                const fk: SQLForeignKey = {
                                                    name: constraintDef.constraint_name
                                                        ? constraintDef.constraint_name.replace(
                                                              /`/g,
                                                              ''
                                                          )
                                                        : `${tableName}_${sourceColumns[i]}_fkey`,
                                                    sourceTable: tableName,
                                                    sourceColumn:
                                                        sourceColumns[i],
                                                    targetTable,
                                                    targetColumn:
                                                        targetColumns[i],
                                                    sourceTableId: tableId,
                                                    targetTableId,
                                                    updateAction:
                                                        reference.on_update,
                                                    deleteAction:
                                                        reference.on_delete,
                                                };

                                                console.log(
                                                    'Adding relationship from top level:',
                                                    fk
                                                );
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

                console.log(`Adding table to results:`, {
                    name: table.name,
                    columns: table.columns.length,
                    indexes: table.indexes.length,
                });
                tables.push(table);
            } else if (stmt.type === 'create' && stmt.keyword === 'index') {
                // Handle CREATE INDEX statements
                console.log('Processing CREATE INDEX statement');

                const createIndexStmt = stmt as CreateIndexStatement;
                if (createIndexStmt.table) {
                    // Extract table name
                    let tableName = '';

                    if (typeof createIndexStmt.table === 'string') {
                        tableName = createIndexStmt.table.replace(/`/g, '');
                    } else if (Array.isArray(createIndexStmt.table)) {
                        if (createIndexStmt.table.length > 0) {
                            tableName =
                                createIndexStmt.table[0].table?.replace(
                                    /`/g,
                                    ''
                                ) || '';
                        }
                    } else {
                        // Direct object reference
                        tableName =
                            createIndexStmt.table.table?.replace(/`/g, '') ||
                            '';
                    }

                    console.log(
                        `Processing CREATE INDEX for table: ${tableName}`
                    );

                    // Find the table in our collection
                    const table = tables.find((t) => t.name === tableName);

                    if (table) {
                        // Extract column names from index columns
                        let columns: string[] = [];

                        // Check different possible structures for index columns
                        if (
                            createIndexStmt.columns &&
                            Array.isArray(createIndexStmt.columns)
                        ) {
                            // Some parsers use 'columns'
                            columns = createIndexStmt.columns
                                .map((col: ColumnReference) =>
                                    extractColumnName(col).replace(/`/g, '')
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
                                        ).replace(/`/g, '');
                                        console.log(
                                            'Extracted index column:',
                                            colName
                                        );
                                        return colName;
                                    }
                                )
                                .filter((col: string) => col !== '');
                        }

                        console.log(
                            `Found ${columns.length} columns for index:`,
                            columns
                        );

                        if (columns.length > 0) {
                            const indexName = (
                                createIndexStmt.index ||
                                createIndexStmt.index_name ||
                                `idx_${tableName}_${columns.join('_')}`
                            ).replace(/`/g, '');

                            table.indexes.push({
                                name: indexName,
                                columns,
                                unique:
                                    createIndexStmt.index_type === 'unique' ||
                                    createIndexStmt.unique === true,
                            });

                            console.log(
                                `Added index ${indexName} to table ${tableName}`
                            );
                        } else {
                            console.log(
                                'Could not extract column names for index'
                            );
                        }
                    } else {
                        console.log(
                            `Table ${tableName} not found for CREATE INDEX statement`
                        );
                    }
                }
            } else if (stmt.type === 'alter' && stmt.keyword === 'table') {
                // Process ALTER TABLE statements for foreign keys
                console.log('Processing ALTER TABLE statement');

                const alterTableStmt = stmt as AlterTableStatement;
                if (
                    alterTableStmt.table &&
                    alterTableStmt.expr &&
                    alterTableStmt.expr.length > 0
                ) {
                    // Fix the table name extraction - table is an array in ALTER TABLE statements
                    let tableName = '';

                    if (
                        Array.isArray(alterTableStmt.table) &&
                        alterTableStmt.table.length > 0
                    ) {
                        const tableObj = alterTableStmt.table[0];
                        tableName = tableObj.table || '';
                    } else if (typeof alterTableStmt.table === 'object') {
                        const tableRef = alterTableStmt.table as TableReference;
                        tableName = tableRef.table || '';
                    } else {
                        tableName = alterTableStmt.table;
                    }

                    // Remove backticks from table name
                    tableName = tableName.replace(/`/g, '');

                    console.log(`Processing ALTER TABLE for: ${tableName}`);

                    // Find this table in our collection
                    const table = tables.find((t) => t.name === tableName);

                    if (!table) {
                        console.log(
                            `Table ${tableName} not found for ALTER TABLE statement`
                        );
                        return;
                    }

                    // Process each expression in the ALTER TABLE
                    alterTableStmt.expr.forEach((expr: AlterTableExprItem) => {
                        console.log(
                            'ALTER TABLE expression action:',
                            expr.action
                        );

                        // Check multiple variations of constraint format
                        if (
                            expr.action === 'add' &&
                            expr.constraint_type === 'foreign key'
                        ) {
                            console.log(
                                'ALTER TABLE add FOREIGN KEY action found'
                            );

                            // Extract source columns
                            let sourceColumns: string[] = [];
                            if (
                                expr.definition &&
                                Array.isArray(expr.definition)
                            ) {
                                sourceColumns = expr.definition.map(
                                    (col: ColumnReference) => {
                                        const colName = extractColumnName(
                                            col
                                        ).replace(/`/g, '');
                                        console.log(
                                            'ALTER TABLE FK source column:',
                                            colName
                                        );
                                        return colName;
                                    }
                                );
                            } else if (
                                expr.columns &&
                                Array.isArray(expr.columns)
                            ) {
                                sourceColumns = expr.columns.map(
                                    (col: string | ColumnReference) => {
                                        const colName =
                                            typeof col === 'string'
                                                ? col.replace(/`/g, '')
                                                : extractColumnName(
                                                      col
                                                  ).replace(/`/g, '');
                                        console.log(
                                            'ALTER TABLE FK source column from columns:',
                                            colName
                                        );
                                        return colName;
                                    }
                                );
                            }

                            // Extract target table and columns
                            const reference =
                                expr.reference || expr.reference_definition;

                            // Declare target variables
                            let targetTable = '';
                            let targetColumns: string[] = [];

                            if (reference && reference.table) {
                                if (typeof reference.table === 'object') {
                                    if (
                                        Array.isArray(reference.table) &&
                                        reference.table.length > 0
                                    ) {
                                        targetTable =
                                            reference.table[0].table || '';
                                    } else {
                                        const tableRef =
                                            reference.table as TableReference;
                                        targetTable = tableRef.table || '';
                                    }
                                } else {
                                    targetTable = reference.table as string;
                                }

                                // Remove backticks from target table name
                                targetTable = targetTable.replace(/`/g, '');
                            }

                            // Extract target columns
                            if (
                                reference &&
                                reference.definition &&
                                Array.isArray(reference.definition)
                            ) {
                                targetColumns = reference.definition.map(
                                    (col: ColumnReference) => {
                                        const colName = extractColumnName(
                                            col
                                        ).replace(/`/g, '');
                                        console.log(
                                            'ALTER TABLE FK target column:',
                                            colName
                                        );
                                        return colName;
                                    }
                                );
                            } else if (
                                reference &&
                                reference.columns &&
                                Array.isArray(reference.columns)
                            ) {
                                targetColumns = reference.columns.map(
                                    (col: string | ColumnReference) => {
                                        const colName =
                                            typeof col === 'string'
                                                ? col.replace(/`/g, '')
                                                : extractColumnName(
                                                      col
                                                  ).replace(/`/g, '');
                                        console.log(
                                            'ALTER TABLE FK target column from columns:',
                                            colName
                                        );
                                        return colName;
                                    }
                                );
                            }

                            console.log('ALTER TABLE FK details:', {
                                sourceTable: tableName,
                                sourceColumns,
                                targetTable,
                                targetColumns,
                            });

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
                                    const sourceTableId = tableMap[tableName];
                                    const targetTableId = tableMap[targetTable];

                                    if (!sourceTableId) {
                                        console.warn(
                                            `Source table ${tableName} not found for FK in ALTER TABLE`
                                        );
                                        continue;
                                    }

                                    if (!targetTableId) {
                                        console.warn(
                                            `Target table ${targetTable} not found for FK in ALTER TABLE`
                                        );
                                        continue;
                                    }

                                    // Access FK actions directly from the reference object
                                    const updateAction = reference?.on_update;
                                    const deleteAction = reference?.on_delete;

                                    const fk: SQLForeignKey = {
                                        name: expr.constraint_name
                                            ? expr.constraint_name.replace(
                                                  /`/g,
                                                  ''
                                              )
                                            : `${tableName}_${sourceColumns[i]}_fkey`,
                                        sourceTable: tableName,
                                        sourceColumn: sourceColumns[i],
                                        targetTable,
                                        targetColumn: targetColumns[i],
                                        sourceTableId,
                                        targetTableId,
                                        updateAction,
                                        deleteAction,
                                    };

                                    console.log(
                                        'Adding relationship from ALTER TABLE:',
                                        fk
                                    );
                                    relationships.push(fk);
                                }
                            }
                        } else if (
                            expr.action === 'add' &&
                            expr.create_definitions
                        ) {
                            // Alternative syntax for constraints in ALTER TABLE
                            console.log(
                                'ALTER TABLE add action with create_definitions found'
                            );

                            const createDefs = expr.create_definitions;

                            if (
                                createDefs.constraint_type === 'FOREIGN KEY' ||
                                createDefs.constraint_type === 'foreign key'
                            ) {
                                console.log(
                                    'Found FOREIGN KEY constraint in ALTER TABLE create_definitions'
                                );

                                // Extract source columns
                                let sourceColumns: string[] = [];
                                if (
                                    createDefs.definition &&
                                    Array.isArray(createDefs.definition)
                                ) {
                                    sourceColumns = createDefs.definition.map(
                                        (col: ColumnReference) => {
                                            const colName = extractColumnName(
                                                col
                                            ).replace(/`/g, '');
                                            console.log(
                                                'ALTER TABLE FK source column:',
                                                colName
                                            );
                                            return colName;
                                        }
                                    );
                                } else if (
                                    createDefs.columns &&
                                    Array.isArray(createDefs.columns)
                                ) {
                                    sourceColumns = createDefs.columns.map(
                                        (col: string | ColumnReference) => {
                                            const colName =
                                                typeof col === 'string'
                                                    ? col.replace(/`/g, '')
                                                    : extractColumnName(
                                                          col
                                                      ).replace(/`/g, '');
                                            console.log(
                                                'ALTER TABLE FK source column from columns:',
                                                colName
                                            );
                                            return colName;
                                        }
                                    );
                                }

                                // Extract target table and columns
                                const reference =
                                    createDefs.reference_definition;

                                let targetTable = '';
                                let targetColumns: string[] = [];

                                if (reference && reference.table) {
                                    if (typeof reference.table === 'object') {
                                        if (
                                            Array.isArray(reference.table) &&
                                            reference.table.length > 0
                                        ) {
                                            targetTable =
                                                reference.table[0].table || '';
                                        } else {
                                            const tableRef =
                                                reference.table as TableReference;
                                            targetTable = tableRef.table || '';
                                        }
                                    } else {
                                        targetTable = reference.table as string;
                                    }

                                    // Remove backticks from target table name
                                    targetTable = targetTable.replace(/`/g, '');
                                }

                                // Extract target columns
                                if (
                                    reference &&
                                    reference.definition &&
                                    Array.isArray(reference.definition)
                                ) {
                                    targetColumns = reference.definition.map(
                                        (col: ColumnReference) => {
                                            const colName = extractColumnName(
                                                col
                                            ).replace(/`/g, '');
                                            console.log(
                                                'ALTER TABLE FK target column:',
                                                colName
                                            );
                                            return colName;
                                        }
                                    );
                                } else if (
                                    reference &&
                                    reference.columns &&
                                    Array.isArray(reference.columns)
                                ) {
                                    targetColumns = reference.columns.map(
                                        (col: string | ColumnReference) => {
                                            const colName =
                                                typeof col === 'string'
                                                    ? col.replace(/`/g, '')
                                                    : extractColumnName(
                                                          col
                                                      ).replace(/`/g, '');
                                            console.log(
                                                'ALTER TABLE FK target column from columns:',
                                                colName
                                            );
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
                                        const sourceTableId =
                                            tableMap[tableName];
                                        const targetTableId =
                                            tableMap[targetTable];

                                        if (!sourceTableId || !targetTableId) {
                                            console.warn(
                                                `Source table ${tableName} or target table ${targetTable} not found for FK in ALTER TABLE`
                                            );
                                            continue;
                                        }

                                        const fk: SQLForeignKey = {
                                            name: createDefs.constraint_name
                                                ? createDefs.constraint_name.replace(
                                                      /`/g,
                                                      ''
                                                  )
                                                : `${tableName}_${sourceColumns[i]}_fkey`,
                                            sourceTable: tableName,
                                            sourceColumn: sourceColumns[i],
                                            targetTable,
                                            targetColumn: targetColumns[i],
                                            sourceTableId,
                                            targetTableId,
                                            updateAction: reference?.on_update,
                                            deleteAction: reference?.on_delete,
                                        };

                                        console.log(
                                            'Adding relationship from ALTER TABLE create_definitions:',
                                            fk
                                        );
                                        relationships.push(fk);
                                    }
                                }
                            }
                        }
                    });
                }
            }
        });

        // Filter out relationships with missing source table IDs or target table IDs
        const validRelationships = relationships.filter(
            (rel) => rel.sourceTableId && rel.targetTableId
        );

        // Log any invalid relationships that were filtered out
        if (validRelationships.length !== relationships.length) {
            console.warn(
                `Filtered out ${relationships.length - validRelationships.length} invalid relationships`
            );
        }

        console.log(
            `MySQL parser finished with ${tables.length} tables and ${validRelationships.length} relationships`
        );

        return { tables, relationships: validRelationships };
    } catch (error: unknown) {
        console.error('Error in MySQL parser:', error);
        throw new Error(`Error parsing MySQL SQL: ${(error as Error).message}`);
    }
}
