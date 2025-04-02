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
} from './mysql-common';

export function fromMySQL(sqlContent: string): SQLParserResult {
    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {}; // Maps table name to its ID

    try {
        // Parse the SQL DDL statements
        const ast = parser.astify(sqlContent, parserOpts);

        if (!Array.isArray(ast)) {
            throw new Error('Failed to parse SQL DDL - AST is not an array');
        }

        // Process each CREATE TABLE statement
        ast.forEach((stmt: SQLAstNode) => {
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
                } else if (typeof createTableStmt.table === 'string') {
                    // Handle string table names (MySQL often has this format)
                    tableName = createTableStmt.table;
                }

                // Remove backticks from table name if present
                tableName = tableName.replace(/`/g, '');

                if (!tableName) {
                    return;
                }

                // Generate a unique ID for the table
                const tableId = generateId();
                tableMap[tableName] = tableId;

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
                                let columnName = extractColumnName(
                                    columnDef.column
                                );

                                // Remove backticks if present
                                columnName = columnName.replace(/`/g, '');

                                const dataType =
                                    columnDef.definition?.dataType || '';

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
                                                let pkColumnName =
                                                    extractColumnName(colDef);

                                                // Remove backticks if present
                                                pkColumnName =
                                                    pkColumnName.replace(
                                                        /`/g,
                                                        ''
                                                    );

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
                                            const cleanColName =
                                                typeof colName === 'string'
                                                    ? colName.replace(/`/g, '')
                                                    : colName;

                                            // Find and mark the column as primary key
                                            const column = columns.find(
                                                (col) =>
                                                    col.name === cleanColName
                                            );
                                            if (column) {
                                                column.primaryKey = true;
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
                                                const targetTableId =
                                                    tableMap[targetTable];

                                                if (!targetTableId) {
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

                tables.push(table);
            } else if (stmt.type === 'create' && stmt.keyword === 'index') {
                // Handle CREATE INDEX statements

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
                                        return colName;
                                    }
                                )
                                .filter((col: string) => col !== '');
                        }

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

                    // Find this table in our collection
                    const table = tables.find((t) => t.name === tableName);

                    if (!table) {
                        return;
                    }

                    // Process each expression in the ALTER TABLE
                    alterTableStmt.expr.forEach((expr: AlterTableExprItem) => {
                        // Check multiple variations of constraint format
                        if (
                            expr.action === 'add' &&
                            expr.constraint_type === 'foreign key'
                        ) {
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
                                    const sourceTableId = tableMap[tableName];
                                    const targetTableId = tableMap[targetTable];

                                    if (!sourceTableId) {
                                        continue;
                                    }

                                    if (!targetTableId) {
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

                                    relationships.push(fk);
                                }
                            }
                        } else if (
                            expr.action === 'add' &&
                            expr.create_definitions
                        ) {
                            // Alternative syntax for constraints in ALTER TABLE

                            const createDefs = expr.create_definitions;

                            if (
                                createDefs.constraint_type === 'FOREIGN KEY' ||
                                createDefs.constraint_type === 'foreign key'
                            ) {
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

        return { tables, relationships: validRelationships };
    } catch (error: unknown) {
        throw new Error(`Error parsing MySQL SQL: ${(error as Error).message}`);
    }
}
