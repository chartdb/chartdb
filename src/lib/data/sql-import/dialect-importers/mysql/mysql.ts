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
    ColumnDefinition,
    ConstraintDefinition,
    CreateTableStatement,
    TableReference,
} from './mysql-common';
import { parserOpts, extractColumnName, getTypeArgs } from './mysql-common';

// Interface for pending foreign keys that need to be processed later
interface PendingForeignKey {
    name: string;
    sourceTable: string;
    sourceTableId: string;
    sourceColumns: string[];
    targetTable: string;
    targetColumns: string[];
    updateAction?: string;
    deleteAction?: string;
}

// Helper to extract statements from PostgreSQL dump
function extractStatements(sqlContent: string): string[] {
    const statements: string[] = [];
    let currentStatement = '';
    const lines = sqlContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip comments and empty lines
        if (line.startsWith('--') || line === '') {
            continue;
        }

        // Add line to current statement
        currentStatement += line + ' ';

        // If line ends with semicolon, consider statement complete
        if (line.endsWith(';')) {
            statements.push(currentStatement.trim());
            currentStatement = '';
        }
    }

    // Handle any remaining statement
    if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
    }

    return statements;
}

// Function to extract columns from a CREATE TABLE statement using regex
function extractColumnsFromCreateTable(statement: string): SQLColumn[] {
    const columns: SQLColumn[] = [];

    // Extract everything between the first opening and last closing parenthesis
    const columnMatch = statement.match(/CREATE\s+TABLE.*?\((.*)\)[^)]*;$/s);
    if (!columnMatch || !columnMatch[1]) {
        return columns;
    }

    const columnDefs = columnMatch[1].trim();
    // Split by commas, but not those within parentheses (for nested type definitions)
    const columnLines = columnDefs.split(/,(?![^(]*\))/);

    for (const columnLine of columnLines) {
        const line = columnLine.trim();
        // Skip constraints at the table level
        if (
            line.toUpperCase().startsWith('CONSTRAINT') ||
            line.toUpperCase().startsWith('PRIMARY KEY') ||
            line.toUpperCase().startsWith('FOREIGN KEY') ||
            line.toUpperCase().startsWith('UNIQUE')
        ) {
            continue;
        }

        // Extract column name and definition
        const columnNameMatch = line.match(/^"?([^"\s]+)"?\s+(.+)$/);
        if (columnNameMatch) {
            const columnName = columnNameMatch[1];
            const definition = columnNameMatch[2];

            // Determine if column is nullable
            const nullable = !definition.toUpperCase().includes('NOT NULL');

            // Determine if column is primary key
            const primaryKey = definition.toUpperCase().includes('PRIMARY KEY');

            // Extract data type
            const typeMatch = definition.match(/^([^\s(]+)(?:\(([^)]+)\))?/);
            const dataType = typeMatch ? typeMatch[1] : '';

            columns.push({
                name: columnName,
                type: dataType,
                nullable,
                primaryKey,
                unique: definition.toUpperCase().includes('UNIQUE'),
            });
        }
    }

    return columns;
}

// Process PostgreSQL pg_dump CREATE INDEX statements
function processCreateIndexStatement(
    statement: string,
    tableMap: Record<string, string>,
    tables: SQLTable[]
): void {
    if (
        !statement.startsWith('CREATE INDEX') &&
        !statement.startsWith('CREATE UNIQUE INDEX')
    ) {
        return;
    }

    try {
        // Determine if the index is unique
        const isUnique = statement.startsWith('CREATE UNIQUE INDEX');

        // Extract index name
        const indexNameRegex = /CREATE (?:UNIQUE )?INDEX\s+"?([^"\s]+)"?/i;
        const indexNameMatch = statement.match(indexNameRegex);
        const indexName = indexNameMatch ? indexNameMatch[1] : '';

        if (!indexName) {
            return;
        }

        // Extract table name and schema
        const tableRegex = /ON\s+(?:"?([^"\s.]+)"?\.)?(?:"?([^"\s.(]+)"?)/i;
        const tableMatch = statement.match(tableRegex);

        if (!tableMatch) {
            return;
        }

        const tableSchema = tableMatch[1] || '';
        const tableName = tableMatch[2];

        // Extract index columns
        const columnsRegex = /\(\s*([^)]+)\)/i;
        const columnsMatch = statement.match(columnsRegex);

        if (!columnsMatch) {
            return;
        }

        // Parse columns (handle function-based indexes, etc.)
        const columnsStr = columnsMatch[1];
        // This is a simplified approach - advanced indexes may need more complex parsing
        const indexColumns = columnsStr.split(',').map((col) => {
            // Extract basic column name, handling possible expressions
            const colName = col
                .trim()
                .replace(/^"(.*)"$/, '$1')
                .replace(/^\s*"?([^"\s(]+)"?\s*.*$/, '$1'); // Get just the column name part
            return colName;
        });

        if (indexColumns.length === 0) {
            return;
        }

        // Find the table
        const tableKey = `${tableSchema ? tableSchema + '.' : ''}${tableName}`;
        const tableId = tableMap[tableKey];

        if (!tableId) {
            return;
        }

        const table = tables.find((t) => t.id === tableId);
        if (!table) {
            return;
        }

        // Check if a similar index already exists (to avoid duplicates)
        const existingIndex = table.indexes.find(
            (idx) =>
                idx.name === indexName ||
                (idx.columns.length === indexColumns.length &&
                    idx.columns.every((col, i) => col === indexColumns[i]))
        );

        if (!existingIndex) {
            table.indexes.push({
                name: indexName,
                columns: indexColumns,
                unique: isUnique,
            });
        }
    } catch (error) {
        console.error('Error processing CREATE INDEX statement:', error);
    }
}

/**
 * Detects if a CREATE TABLE statement contains inline REFERENCES (PostgreSQL-style)
 * which is not supported in MySQL
 */
function detectInlineReferences(sqlContent: string): {
    found: boolean;
    line: number;
} {
    const lines = sqlContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Match column definitions with inline REFERENCES
        if (/\w+\s+\w+\s+(?:PRIMARY\s+KEY\s+)?REFERENCES\s+/i.test(line)) {
            return { found: true, line: i + 1 };
        }
    }
    return { found: false, line: 0 };
}

export async function fromMySQL(sqlContent: string): Promise<SQLParserResult> {
    // Check for inline REFERENCES before proceeding
    const { found, line } = detectInlineReferences(sqlContent);
    if (found) {
        throw new Error(
            `MySQL does not support inline REFERENCES in column definitions (line ${line}). Please use FOREIGN KEY constraints instead:\n\nCREATE TABLE UserProfile (\n    user_id INT PRIMARY KEY,\n    bio TEXT,\n    avatar_url VARCHAR(255),\n    FOREIGN KEY (user_id) REFERENCES Users(id)\n);`
        );
    }

    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {}; // Maps table name to its ID
    const pendingForeignKeys: PendingForeignKey[] = []; // Store FKs that reference tables not yet created
    const addedRelationships = new Set<string>();

    try {
        // Extract SQL statements from the dump
        const statements = extractStatements(sqlContent);

        // First pass: process CREATE TABLE statements
        for (const statement of statements) {
            const trimmedStmt = statement.trim();
            // Process only CREATE TABLE statements
            if (trimmedStmt.toUpperCase().startsWith('CREATE TABLE')) {
                try {
                    const { Parser } = await import('node-sql-parser');
                    const parser = new Parser();
                    // Parse with SQL parser
                    const ast = parser.astify(trimmedStmt, parserOpts);
                    if (
                        Array.isArray(ast) &&
                        ast.length > 0 &&
                        ast[0].type === 'create' &&
                        ast[0].keyword === 'table'
                    ) {
                        const createTableStmt = ast[0] as CreateTableStatement;

                        // Extract table name
                        let tableName = '';
                        if (typeof createTableStmt.table === 'object') {
                            if (
                                Array.isArray(createTableStmt.table) &&
                                createTableStmt.table.length > 0
                            ) {
                                tableName =
                                    createTableStmt.table[0].table || '';
                            } else {
                                const tableObj =
                                    createTableStmt.table as TableReference;
                                tableName = tableObj.table || '';
                            }
                        } else if (typeof createTableStmt.table === 'string') {
                            tableName = createTableStmt.table;
                        }

                        // Remove backticks from table name
                        tableName = tableName.replace(/`/g, '');

                        if (tableName) {
                            // Generate table ID
                            const tableId = generateId();

                            // Handle database-qualified table names
                            const tableNameParts = tableName.split('.');
                            let database = '';
                            let simpleTableName = tableName;

                            if (tableNameParts.length > 1) {
                                database = tableNameParts[0];
                                simpleTableName = tableNameParts[1];
                                // Store with fully qualified name (for ALTER TABLE references)
                                tableMap[tableName] = tableId;
                                // Also store with just table name (for simpler lookups)
                                tableMap[simpleTableName] = tableId;
                            } else {
                                tableMap[tableName] = tableId;
                            }

                            // Process columns
                            const columns: SQLColumn[] = [];
                            const indexes: SQLIndex[] = [];

                            if (
                                createTableStmt.create_definitions &&
                                Array.isArray(
                                    createTableStmt.create_definitions
                                )
                            ) {
                                createTableStmt.create_definitions.forEach(
                                    (
                                        def:
                                            | ColumnDefinition
                                            | ConstraintDefinition
                                    ) => {
                                        if (def.resource === 'column') {
                                            const columnDef =
                                                def as ColumnDefinition;
                                            let columnName = extractColumnName(
                                                columnDef.column
                                            );

                                            // Remove backticks
                                            columnName = columnName.replace(
                                                /`/g,
                                                ''
                                            );
                                            const dataType =
                                                columnDef.definition
                                                    ?.dataType || '';

                                            // Check column constraints
                                            const isPrimaryKey =
                                                columnDef.primary_key ===
                                                    'primary key' ||
                                                columnDef.definition
                                                    ?.constraint ===
                                                    'primary key';

                                            const isAutoIncrement =
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
                                                    columnDef.unique ===
                                                        'unique' ||
                                                    columnDef.definition
                                                        ?.constraint ===
                                                        'unique',
                                                typeArgs: getTypeArgs(
                                                    columnDef.definition
                                                ),
                                                default: columnDef.default_val
                                                    ? buildSQLFromAST(
                                                          columnDef.default_val
                                                      )
                                                    : undefined,
                                                increment: isAutoIncrement,
                                            });
                                        } else if (
                                            def.resource === 'constraint'
                                        ) {
                                            const constraintDef =
                                                def as ConstraintDefinition;

                                            // Handle PRIMARY KEY constraint
                                            if (
                                                constraintDef.constraint_type ===
                                                'primary key'
                                            ) {
                                                if (
                                                    Array.isArray(
                                                        constraintDef.definition
                                                    )
                                                ) {
                                                    const pkColumns =
                                                        constraintDef.definition
                                                            .filter(
                                                                (colDef) =>
                                                                    typeof colDef ===
                                                                        'object' &&
                                                                    'type' in
                                                                        colDef &&
                                                                    colDef.type ===
                                                                        'column_ref'
                                                            )
                                                            .map((colDef) =>
                                                                extractColumnName(
                                                                    colDef
                                                                ).replace(
                                                                    /`/g,
                                                                    ''
                                                                )
                                                            );

                                                    // Mark columns as PK
                                                    for (const colName of pkColumns) {
                                                        const col =
                                                            columns.find(
                                                                (c) =>
                                                                    c.name ===
                                                                    colName
                                                            );
                                                        if (col) {
                                                            col.primaryKey =
                                                                true;
                                                        }
                                                    }

                                                    // Add PK index
                                                    if (pkColumns.length > 0) {
                                                        indexes.push({
                                                            name: `pk_${tableName}`,
                                                            columns: pkColumns,
                                                            unique: true,
                                                        });
                                                    }
                                                }
                                            }
                                            // Handle UNIQUE constraint
                                            else if (
                                                constraintDef.constraint_type ===
                                                'unique'
                                            ) {
                                                const uniqueColumns =
                                                    Array.isArray(
                                                        constraintDef.definition
                                                    )
                                                        ? constraintDef.definition.map(
                                                              (colDef) =>
                                                                  extractColumnName(
                                                                      colDef
                                                                  ).replace(
                                                                      /`/g,
                                                                      ''
                                                                  )
                                                          )
                                                        : (
                                                              constraintDef
                                                                  .definition
                                                                  ?.columns ||
                                                              []
                                                          ).map((col) =>
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
                                                                    )
                                                          );

                                                if (uniqueColumns.length > 0) {
                                                    indexes.push({
                                                        name: constraintDef.constraint_name
                                                            ? constraintDef.constraint_name.replace(
                                                                  /`/g,
                                                                  ''
                                                              )
                                                            : `${tableName}_${uniqueColumns[0]}_key`,
                                                        columns: uniqueColumns,
                                                        unique: true,
                                                    });
                                                }
                                            }
                                            // Handle FOREIGN KEY constraints
                                            else if (
                                                constraintDef.constraint_type ===
                                                    'foreign key' ||
                                                constraintDef.constraint_type ===
                                                    'FOREIGN KEY'
                                            ) {
                                                // Extract source columns
                                                let sourceColumns: string[] =
                                                    [];
                                                if (
                                                    Array.isArray(
                                                        constraintDef.definition
                                                    )
                                                ) {
                                                    sourceColumns =
                                                        constraintDef.definition.map(
                                                            (col) => {
                                                                const colName =
                                                                    extractColumnName(
                                                                        col
                                                                    ).replace(
                                                                        /`/g,
                                                                        ''
                                                                    );
                                                                return colName;
                                                            }
                                                        );
                                                }

                                                // Process reference info (target table/columns)
                                                const reference =
                                                    constraintDef.reference_definition ||
                                                    constraintDef.reference;

                                                if (
                                                    reference &&
                                                    sourceColumns.length > 0
                                                ) {
                                                    // Extract target table
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
                                                                reference.table
                                                                    .length > 0
                                                            ) {
                                                                targetTable =
                                                                    reference
                                                                        .table[0]
                                                                        .table ||
                                                                    '';
                                                            } else {
                                                                const tableRef =
                                                                    reference.table as TableReference;
                                                                targetTable =
                                                                    tableRef.table ||
                                                                    '';
                                                            }
                                                        } else {
                                                            targetTable =
                                                                reference.table as string;
                                                        }

                                                        // Remove backticks
                                                        targetTable =
                                                            targetTable.replace(
                                                                /`/g,
                                                                ''
                                                            );
                                                    }

                                                    // Extract target columns
                                                    let targetColumns: string[] =
                                                        [];
                                                    if (
                                                        reference.columns &&
                                                        Array.isArray(
                                                            reference.columns
                                                        )
                                                    ) {
                                                        targetColumns =
                                                            reference.columns.map(
                                                                (col) => {
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
                                                        Array.isArray(
                                                            reference.definition
                                                        )
                                                    ) {
                                                        targetColumns =
                                                            reference.definition.map(
                                                                (col) => {
                                                                    const colName =
                                                                        extractColumnName(
                                                                            col
                                                                        ).replace(
                                                                            /`/g,
                                                                            ''
                                                                        );
                                                                    return colName;
                                                                }
                                                            );
                                                    }

                                                    // Add relationships for matching columns
                                                    if (
                                                        targetTable &&
                                                        targetColumns.length > 0
                                                    ) {
                                                        const targetTableId =
                                                            tableMap[
                                                                targetTable
                                                            ];

                                                        if (!targetTableId) {
                                                            // Store for later processing (after all tables are created)
                                                            const pendingFk: PendingForeignKey =
                                                                {
                                                                    name: constraintDef.constraint_name
                                                                        ? constraintDef.constraint_name.replace(
                                                                              /`/g,
                                                                              ''
                                                                          )
                                                                        : `${tableName}_${sourceColumns[0]}_fkey`,
                                                                    sourceTable:
                                                                        tableName,
                                                                    sourceTableId:
                                                                        tableId,
                                                                    sourceColumns,
                                                                    targetTable,
                                                                    targetColumns,
                                                                    updateAction:
                                                                        reference.on_update,
                                                                    deleteAction:
                                                                        reference.on_delete,
                                                                };
                                                            pendingForeignKeys.push(
                                                                pendingFk
                                                            );
                                                        } else {
                                                            // Create foreign key relationships
                                                            for (
                                                                let i = 0;
                                                                i <
                                                                Math.min(
                                                                    sourceColumns.length,
                                                                    targetColumns.length
                                                                );
                                                                i++
                                                            ) {
                                                                const fk: SQLForeignKey =
                                                                    {
                                                                        name: constraintDef.constraint_name
                                                                            ? constraintDef.constraint_name.replace(
                                                                                  /`/g,
                                                                                  ''
                                                                              )
                                                                            : `${tableName}_${sourceColumns[i]}_fkey`,
                                                                        sourceTable:
                                                                            tableName,
                                                                        sourceColumn:
                                                                            sourceColumns[
                                                                                i
                                                                            ],
                                                                        targetTable,
                                                                        targetColumn:
                                                                            targetColumns[
                                                                                i
                                                                            ],
                                                                        sourceTableId:
                                                                            tableId,
                                                                        targetTableId,
                                                                        updateAction:
                                                                            reference.on_update,
                                                                        deleteAction:
                                                                            reference.on_delete,
                                                                    };

                                                                relationships.push(
                                                                    fk
                                                                );
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                );
                            } else {
                                // If parser fails, try regex-based extraction as fallback
                                const extractedColumns =
                                    extractColumnsFromCreateTable(trimmedStmt);
                                if (extractedColumns.length > 0) {
                                    columns.push(...extractedColumns);
                                }
                            }

                            // Create and store the table
                            tables.push({
                                id: tableId,
                                name: simpleTableName || tableName,
                                schema: database || undefined,
                                columns,
                                indexes,
                                order: tables.length,
                            });
                        }
                    }
                } catch (parseError) {
                    console.error(
                        'Error parsing CREATE TABLE statement:',
                        parseError
                    );

                    // Error handling without logging
                }
            }
        }

        // Second pass: process CREATE INDEX statements
        for (const statement of statements) {
            const trimmedStmt = statement.trim();
            if (
                trimmedStmt.toUpperCase().startsWith('CREATE INDEX') ||
                trimmedStmt.toUpperCase().startsWith('CREATE UNIQUE INDEX')
            ) {
                processCreateIndexStatement(trimmedStmt, tableMap, tables);
            }
        }

        // Third pass: process ALTER TABLE statements for foreign keys
        for (const statement of statements) {
            const trimmedStmt = statement.trim();
            if (
                trimmedStmt.toUpperCase().startsWith('ALTER TABLE') &&
                trimmedStmt.toUpperCase().includes('FOREIGN KEY')
            ) {
                try {
                    // Extract table name and schema
                    const tableRegex =
                        /ALTER TABLE\s+(?:`?([^`\s.]+)`?\.)?`?([^`\s.(]+)`?\s+/i;
                    const tableMatch = statement.match(tableRegex);

                    if (!tableMatch) continue;

                    const databaseName = tableMatch[1] || '';
                    const sourceTable = tableMatch[2];

                    // Look for source table in tableMap - try with and without database prefix
                    let sourceTableId = tableMap[sourceTable];
                    if (!sourceTableId && databaseName) {
                        sourceTableId =
                            tableMap[`${databaseName}.${sourceTable}`];
                    }
                    if (!sourceTableId) {
                        continue;
                    }

                    // Extract constraint name if it exists
                    let constraintName = '';
                    const constraintMatch = statement.match(
                        /ADD CONSTRAINT\s+`?([^`\s(]+)`?\s+/i
                    );
                    if (constraintMatch) {
                        constraintName = constraintMatch[1].replace(/`/g, '');
                    }

                    // Extract source columns
                    const sourceColMatch = statement.match(
                        /FOREIGN KEY\s*\(([^)]+)\)/i
                    );
                    if (!sourceColMatch) continue;

                    const sourceColumns = sourceColMatch[1]
                        .split(',')
                        .map((col) => col.trim().replace(/`/g, ''));

                    // Extract target table and columns
                    const targetMatch = statement.match(
                        /REFERENCES\s+(?:`?([^`\s.]+)`?\.)?`?([^`\s(]+)`?\s*\(([^)]+)\)/i
                    );
                    if (!targetMatch) continue;

                    const targetDatabase = targetMatch[1] || '';
                    const targetTable = targetMatch[2];
                    const targetColumns = targetMatch[3]
                        .split(',')
                        .map((col) => col.trim().replace(/`/g, ''));

                    // Try to find target table with and without database prefix
                    let targetTableId = tableMap[targetTable];
                    if (!targetTableId && targetDatabase) {
                        targetTableId =
                            tableMap[`${targetDatabase}.${targetTable}`];
                    }

                    if (!targetTableId) {
                        continue;
                    }

                    // Extract ON DELETE and ON UPDATE actions
                    let updateAction: string | undefined;
                    let deleteAction: string | undefined;

                    const onDeleteMatch = statement.match(
                        /ON DELETE\s+([A-Z\s]+?)(?=\s+ON|\s*$)/i
                    );
                    if (onDeleteMatch) {
                        deleteAction = onDeleteMatch[1].trim();
                    }

                    const onUpdateMatch = statement.match(
                        /ON UPDATE\s+([A-Z\s]+?)(?=\s+ON|\s*$)/i
                    );
                    if (onUpdateMatch) {
                        updateAction = onUpdateMatch[1].trim();
                    }

                    // Create the foreign key relationships
                    for (
                        let i = 0;
                        i <
                        Math.min(sourceColumns.length, targetColumns.length);
                        i++
                    ) {
                        const fk: SQLForeignKey = {
                            name:
                                constraintName ||
                                `${sourceTable}_${sourceColumns[i]}_fkey`,
                            sourceTable,
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
                } catch (fkError) {
                    console.error(
                        'Error processing foreign key in ALTER TABLE:',
                        fkError
                    );

                    // Error handling without logging
                }
            }
        }

        // After processing all tables, process pending foreign keys:
        if (pendingForeignKeys.length > 0) {
            for (const pendingFk of pendingForeignKeys) {
                // Try with and without database prefix
                let targetTableId = tableMap[pendingFk.targetTable];

                // Try to extract database if the target table has a database prefix
                const targetTableParts = pendingFk.targetTable.split('.');
                if (!targetTableId && targetTableParts.length > 1) {
                    const tableName = targetTableParts[1];
                    targetTableId = tableMap[tableName];
                }

                if (!targetTableId) {
                    continue;
                }

                // Create foreign key relationships
                for (
                    let i = 0;
                    i <
                    Math.min(
                        pendingFk.sourceColumns.length,
                        pendingFk.targetColumns.length
                    );
                    i++
                ) {
                    const fk: SQLForeignKey = {
                        name:
                            pendingFk.name ||
                            `${pendingFk.sourceTable}_${pendingFk.sourceColumns[i]}_fkey`,
                        sourceTable: pendingFk.sourceTable,
                        sourceColumn: pendingFk.sourceColumns[i],
                        targetTable: pendingFk.targetTable,
                        targetColumn: pendingFk.targetColumns[i],
                        sourceTableId: pendingFk.sourceTableId,
                        targetTableId,
                        updateAction: pendingFk.updateAction,
                        deleteAction: pendingFk.deleteAction,
                    };

                    relationships.push(fk);
                }
            }
        }

        findForeignKeysUsingRegex(
            sqlContent,
            tableMap,
            relationships,
            addedRelationships
        );

        return { tables, relationships };
    } catch (error) {
        console.error('Error in MySQL dump parser:', error);

        throw new Error(
            `Error parsing MySQL dump: ${(error as Error).message}`
        );
    }
}

export function isMySQLFormat(sqlContent: string): boolean {
    // Common patterns in MySQL dumps
    const mysqlDumpPatterns = [
        /START TRANSACTION/i,
        /CREATE TABLE.*IF NOT EXISTS/i,
        /ENGINE\s*=\s*(?:InnoDB|MyISAM|MEMORY|ARCHIVE)/i,
        /DEFAULT CHARSET\s*=\s*(?:utf8|latin1)/i,
        /COLLATE\s*=\s*(?:utf8_general_ci|latin1_swedish_ci)/i,
        /AUTO_INCREMENT\s*=\s*\d+/i,
        /ALTER TABLE.*ADD CONSTRAINT.*FOREIGN KEY/i,
        /-- (MySQL|MariaDB) dump/i,
    ];

    // Look for backticks around identifiers (common in MySQL)
    const hasBackticks = /`[^`]+`/.test(sqlContent);

    // Check for MySQL specific comments
    const hasMysqlComments =
        /-- MySQL dump|-- Host:|-- Server version:|-- Dump completed on/.test(
            sqlContent
        );

    // If there are MySQL specific comments, it's likely a MySQL dump
    if (hasMysqlComments) {
        return true;
    }

    // Count how many MySQL patterns are found
    let patternCount = 0;
    for (const pattern of mysqlDumpPatterns) {
        if (pattern.test(sqlContent)) {
            patternCount++;
        }
    }

    // If the SQL has backticks and at least a few MySQL patterns, it's likely MySQL
    const isLikelyMysql = hasBackticks && patternCount >= 2;

    return isLikelyMysql;
}

function findForeignKeysUsingRegex(
    sqlContent: string,
    tableMap: Record<string, string>,
    relationships: SQLForeignKey[],
    addedRelationships: Set<string>
): void {
    // Normalize SQL content: replace multiple whitespaces and newlines with single space
    const normalizedSQL = sqlContent
        .replace(/\s+/g, ' ')
        // Replace common bracket/brace formatting issues
        .replace(/\[\s*(\d+)\s*\]/g, '[$1]')
        .replace(/\{\s*(\d+)\s*\}/g, '{$1}')
        // Normalize commas and parentheses to help regex matching
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s*\(\s*/g, ' (')
        .replace(/\s*\)\s*/g, ') ')
        // Ensure spaces around keywords
        .replace(/\bREFERENCES\b/g, ' REFERENCES ')
        .replace(/\bINT\b/g, ' INT ')
        .replace(/\bPRIMARY\s+KEY\b/g, ' PRIMARY KEY ')
        .replace(/\bUNIQUE\b/g, ' UNIQUE ')
        .replace(/\bFOREIGN\s+KEY\b/g, ' FOREIGN KEY ')
        .replace(/\bENGINE\s*=\s*InnoDB\b/gi, ' ENGINE=InnoDB ');

    // First extract all table names to ensure they're in the tableMap
    const tableNamePattern =
        /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:`?([^`\s.]+)`?\.)?(?:`([^`]+)`|([A-Za-z0-9_]+))/gi;
    let match;

    tableNamePattern.lastIndex = 0;
    while ((match = tableNamePattern.exec(normalizedSQL)) !== null) {
        const schemaName = match[1] || 'public';
        const tableName = match[2] || match[3]; // match[2] for backtick quoted, match[3] for unquoted

        // Skip invalid table names
        if (!tableName || tableName.toUpperCase() === 'CREATE') continue;

        // Ensure the table is in our tableMap
        const tableKey = `${schemaName}.${tableName}`;
        if (!tableMap[tableKey]) {
            const tableId = generateId();
            tableMap[tableKey] = tableId;
        }
    }

    // Now process each CREATE TABLE statement separately to find REFERENCES
    const createTableStatements = normalizedSQL.split(';');
    for (const stmt of createTableStatements) {
        if (!stmt.trim().toUpperCase().startsWith('CREATE TABLE')) continue;

        // Extract the table name from the CREATE TABLE statement
        const tableMatch = stmt.match(
            /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:`?([^`\s.]+)`?\.)?(?:`([^`]+)`|([A-Za-z0-9_]+))/i
        );
        if (!tableMatch) continue;

        const sourceSchema = tableMatch[1] || 'public';
        const sourceTable = tableMatch[2] || tableMatch[3];
        if (!sourceTable) continue;

        // Check if this table has a composite primary key that includes the foreign key columns
        const pkMatch = stmt.match(/PRIMARY\s+KEY\s*\(\s*([^)]+)\)/i);
        const pkColumns = pkMatch
            ? pkMatch[1]
                  .split(',')
                  .map((col) => col.trim().replace(/[`'"]/g, ''))
            : [];

        // Find single-column PRIMARY KEY declarations
        const singlePkPattern =
            /`?(\w+)`?\s+(?:INT|INTEGER|BIGINT|SMALLINT)(?:\([^)]*\))?\s+PRIMARY\s+KEY\b/gi;
        let pkMatch2;
        while ((pkMatch2 = singlePkPattern.exec(stmt)) !== null) {
            const pkCol = pkMatch2[1];
            if (!pkColumns.includes(pkCol)) {
                pkColumns.push(pkCol);
            }
        }

        // Find FOREIGN KEY constraints
        const fkPattern =
            /FOREIGN\s+KEY\s*\(\s*`?(\w+)`?\s*\)\s*REFERENCES\s+(?:`?([^`\s.]+)`?|(\w+))\s*\(\s*`?(\w+)`?\s*\)/gi;
        let fkMatch;
        while ((fkMatch = fkPattern.exec(stmt)) !== null) {
            const sourceColumn = fkMatch[1];
            const targetTable = fkMatch[2] || fkMatch[3]; // fkMatch[2] for backtick quoted, fkMatch[3] for unquoted
            const targetColumn = fkMatch[4];

            // Skip if any part is invalid
            if (!sourceColumn || !targetTable || !targetColumn) {
                continue;
            }

            // Create a unique key to track this relationship
            const relationshipKey = `${sourceTable}.${sourceColumn}-${targetTable}.${targetColumn}`;

            // Skip if we've already added this relationship
            if (addedRelationships.has(relationshipKey)) {
                continue;
            }

            // Get table IDs
            const sourceTableKey = `${sourceSchema}.${sourceTable}`;
            const targetTableKey = `${sourceSchema}.${targetTable}`;

            const sourceTableId = tableMap[sourceTableKey];
            const targetTableId = tableMap[targetTableKey];

            // Skip if either table ID is missing
            if (!sourceTableId || !targetTableId) {
                continue;
            }

            // Check if this is a one-to-one relationship
            const isUnique =
                stmt.toLowerCase().includes(`unique (${sourceColumn})`) ||
                stmt.toLowerCase().includes(`unique(\`${sourceColumn}\`)`) ||
                stmt.toLowerCase().includes(`unique key (${sourceColumn})`) ||
                stmt
                    .toLowerCase()
                    .includes(`unique key(\`${sourceColumn}\`)`) ||
                (pkColumns.length === 1 && pkColumns[0] === sourceColumn);

            // For one-to-one relationships, both sides are 'one'
            const sourceCardinality = isUnique ? 'one' : 'many';
            const targetCardinality = 'one'; // Referenced PK is always one

            // Add the relationship
            relationships.push({
                name: `FK_${sourceTable}_${sourceColumn}_${targetTable}`,
                sourceTable,
                sourceSchema,
                sourceColumn,
                targetTable,
                targetSchema: sourceSchema,
                targetColumn,
                sourceTableId,
                targetTableId,
                sourceCardinality,
                targetCardinality,
            });

            addedRelationships.add(relationshipKey);
        }
    }
}
