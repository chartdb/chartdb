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
} from './postgresql-common';
import {
    parserOpts,
    extractColumnName,
    getTypeArgs,
} from './postgresql-common';

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

// Process PostgreSQL pg_dump foreign key constraints
function processForeignKeyConstraint(
    statement: string,
    tableMap: Record<string, string>,
    relationships: SQLForeignKey[]
): void {
    // Only process statements that look like foreign key constraints
    if (
        !statement.includes('ADD CONSTRAINT') ||
        !statement.includes('FOREIGN KEY') ||
        !statement.includes('REFERENCES')
    ) {
        return;
    }

    try {
        // Extract source table info - find between ALTER TABLE and ADD CONSTRAINT
        // This regex handles:
        // - ALTER TABLE ONLY schema.table
        // - ALTER TABLE ONLY "schema"."table"
        // - ALTER TABLE schema.table
        // - ALTER TABLE "schema"."table"
        const tableRegex =
            /ALTER TABLE(?:\s+ONLY)?\s+(?:"?([^"\s.]+)"?\.)?(?:"?([^"\s.(]+)"?)/i;
        const tableMatch = statement.match(tableRegex);

        if (!tableMatch) {
            return;
        }

        // Extract source schema and table name
        const sourceSchema = tableMatch[1] || '';
        const sourceTable = tableMatch[2];

        // Find constraint name
        const constraintRegex = /ADD CONSTRAINT\s+"?([^"\s]+)"?\s+FOREIGN KEY/i;
        const constraintMatch = statement.match(constraintRegex);
        const constraintName = constraintMatch ? constraintMatch[1] : '';

        // Extract source columns - handles either quoted or unquoted column names
        // This regex captures columns in format: FOREIGN KEY (col1, col2, ...)
        const sourceColRegex = /FOREIGN KEY\s+\(\s*([^)]+)\)/i;
        const sourceColMatch = statement.match(sourceColRegex);

        if (!sourceColMatch) {
            return;
        }

        // Parse the captured group to extract all columns
        const sourceColumnsPart = sourceColMatch[1];
        const sourceColumns = sourceColumnsPart.split(',').map((col) =>
            col
                .trim()
                .replace(/^"(.*)"$/, '$1')
                .replace(/^\s*"?([^"\s]+)"?\s*$/, '$1')
        );

        // Extract target table and columns
        // This regex handles: REFERENCES schema.table (col1, col2, ...)
        const targetRegex =
            /REFERENCES\s+(?:"?([^"\s.]+)"?\.)?(?:"?([^"\s.(]+)"?)\s*\(\s*([^)]+)\)/i;
        const targetMatch = statement.match(targetRegex);

        if (!targetMatch) {
            return;
        }

        // Extract target schema, table and columns
        const targetSchema = targetMatch[1] || '';
        const targetTable = targetMatch[2];

        // Parse the captured group to extract all target columns
        const targetColumnsPart = targetMatch[3];
        const targetColumns = targetColumnsPart.split(',').map((col) =>
            col
                .trim()
                .replace(/^"(.*)"$/, '$1')
                .replace(/^\s*"?([^"\s]+)"?\s*$/, '$1')
        );

        // Extract ON DELETE and ON UPDATE actions
        const deleteActionRegex = /ON DELETE\s+([A-Z\s]+?)(?:\s+ON|;|\s*$)/i;
        const deleteActionMatch = statement.match(deleteActionRegex);
        const deleteAction = deleteActionMatch
            ? deleteActionMatch[1].trim()
            : undefined;

        const updateActionRegex = /ON UPDATE\s+([A-Z\s]+?)(?:\s+ON|;|\s*$)/i;
        const updateActionMatch = statement.match(updateActionRegex);
        const updateAction = updateActionMatch
            ? updateActionMatch[1].trim()
            : undefined;

        // Look up table IDs
        const sourceTableKey = `${sourceSchema ? sourceSchema + '.' : ''}${sourceTable}`;
        let sourceTableId = tableMap[sourceTableKey];

        const targetTableKey = `${targetSchema ? targetSchema + '.' : ''}${targetTable}`;
        let targetTableId = tableMap[targetTableKey];

        if (!sourceTableId || !targetTableId) {
            // Try without schema if not found
            if (!sourceTableId && sourceSchema) {
                sourceTableId = tableMap[sourceTable];
            }
            if (!targetTableId && targetSchema) {
                targetTableId = tableMap[targetTable];
            }

            // If still not found, try with 'public' schema
            if (!sourceTableId && !sourceSchema) {
                sourceTableId = tableMap[`public.${sourceTable}`];
            }
            if (!targetTableId && !targetSchema) {
                targetTableId = tableMap[`public.${targetTable}`];
            }

            // If we still can't find them, log and return
            if (!sourceTableId || !targetTableId) {
                if (!sourceTableId) {
                    console.warn(
                        `No table ID found for source table: ${sourceTable} (tried: ${sourceTableKey}, ${sourceTable}, public.${sourceTable})`
                    );
                }
                if (!targetTableId) {
                    console.warn(
                        `No table ID found for target table: ${targetTable} (tried: ${targetTableKey}, ${targetTable}, public.${targetTable})`
                    );
                }
                return;
            }
        }

        // Create relationships for each column pair
        for (
            let i = 0;
            i < Math.min(sourceColumns.length, targetColumns.length);
            i++
        ) {
            const relationship: SQLForeignKey = {
                name:
                    constraintName || `${sourceTable}_${sourceColumns[i]}_fkey`,
                sourceTable,
                sourceSchema,
                sourceColumn: sourceColumns[i],
                targetTable,
                targetSchema,
                targetColumn: targetColumns[i],
                sourceTableId,
                targetTableId,
                updateAction,
                deleteAction,
            };

            relationships.push(relationship);
        }
    } catch (error) {
        console.error('Error processing foreign key constraint:', error);
    }
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

// Process PostgreSQL pg_dump primary key constraints
function processPrimaryKeyConstraint(
    statement: string,
    tableMap: Record<string, string>,
    tables: SQLTable[]
): void {
    // Only process statements that look like primary key constraints
    if (
        !statement.includes('ADD CONSTRAINT') ||
        !statement.includes('PRIMARY KEY')
    ) {
        return;
    }

    try {
        // Extract source table info - similar pattern as FK extraction
        const tableRegex =
            /ALTER TABLE(?:\s+ONLY)?\s+(?:"?([^"\s.]+)"?\.)?(?:"?([^"\s.(]+)"?)/i;
        const tableMatch = statement.match(tableRegex);

        if (!tableMatch) {
            return;
        }

        // Extract source schema and table name
        const sourceSchema = tableMatch[1] || '';
        const sourceTable = tableMatch[2];

        // Extract primary key columns
        const pkColRegex = /PRIMARY KEY\s+\(\s*([^)]+)\)/i;
        const pkColMatch = statement.match(pkColRegex);

        if (!pkColMatch) {
            return;
        }

        // Parse the captured group to extract all columns
        const pkColumnsPart = pkColMatch[1];
        const pkColumns = pkColumnsPart.split(',').map((col) =>
            col
                .trim()
                .replace(/^"(.*)"$/, '$1')
                .replace(/^\s*"?([^"\s]+)"?\s*$/, '$1')
        );

        // Find the table in our collection
        const tableKey = `${sourceSchema ? sourceSchema + '.' : ''}${sourceTable}`;
        const tableId = tableMap[tableKey];

        if (!tableId) {
            return;
        }

        // Find the table in our tables array
        const table = tables.find((t) => t.id === tableId);
        if (!table) {
            return;
        }

        // Mark columns as primary key
        pkColumns.forEach((colName) => {
            const column = table.columns.find((c) => c.name === colName);
            if (column) {
                column.primaryKey = true;
            }
        });

        // Add a primary key index if it doesn't exist
        if (pkColumns.length > 0) {
            const existingPkIndex = table.indexes.find(
                (idx) =>
                    idx.unique &&
                    idx.columns.length === pkColumns.length &&
                    idx.columns.every((col, i) => col === pkColumns[i])
            );

            if (!existingPkIndex) {
                const pkIndexName =
                    statement.match(
                        /ADD CONSTRAINT\s+"?([^"\s]+)"?\s+PRIMARY KEY/i
                    )?.[1] || `pk_${sourceTable}`;

                table.indexes.push({
                    name: pkIndexName,
                    columns: pkColumns,
                    unique: true,
                });
            }
        }
    } catch (error) {
        console.error('Error processing primary key constraint:', error);
    }
}

// Process PostgreSQL pg_dump unique constraints
function processUniqueConstraint(
    statement: string,
    tableMap: Record<string, string>,
    tables: SQLTable[]
): void {
    // Only process statements that look like unique constraints
    if (
        !statement.includes('ADD CONSTRAINT') ||
        !statement.includes('UNIQUE')
    ) {
        return;
    }

    try {
        // Extract source table info - similar pattern as other constraints
        const tableRegex =
            /ALTER TABLE(?:\s+ONLY)?\s+(?:"?([^"\s.]+)"?\.)?(?:"?([^"\s.(]+)"?)/i;
        const tableMatch = statement.match(tableRegex);

        if (!tableMatch) {
            return;
        }

        // Extract source schema and table name
        const sourceSchema = tableMatch[1] || '';
        const sourceTable = tableMatch[2];

        // Extract constraint name
        const constraintNameRegex = /ADD CONSTRAINT\s+"?([^"\s]+)"?\s+UNIQUE/i;
        const constraintNameMatch = statement.match(constraintNameRegex);
        const constraintName = constraintNameMatch
            ? constraintNameMatch[1]
            : `unique_${sourceTable}`;

        // Extract unique columns
        const uniqueColRegex = /UNIQUE\s+\(\s*([^)]+)\)/i;
        const uniqueColMatch = statement.match(uniqueColRegex);

        if (!uniqueColMatch) {
            return;
        }

        // Parse the captured group to extract all columns
        const uniqueColumnsPart = uniqueColMatch[1];
        const uniqueColumns = uniqueColumnsPart.split(',').map((col) =>
            col
                .trim()
                .replace(/^"(.*)"$/, '$1')
                .replace(/^\s*"?([^"\s]+)"?\s*$/, '$1')
        );

        // Find the table in our collection
        const tableKey = `${sourceSchema ? sourceSchema + '.' : ''}${sourceTable}`;
        const tableId = tableMap[tableKey];

        if (!tableId) {
            return;
        }

        // Find the table in our tables array
        const table = tables.find((t) => t.id === tableId);
        if (!table) {
            return;
        }

        // Mark columns as unique if it's a single column constraint
        if (uniqueColumns.length === 1) {
            const column = table.columns.find(
                (c) => c.name === uniqueColumns[0]
            );
            if (column) {
                column.unique = true;
            }
        }

        // Add a unique index if it doesn't exist
        if (uniqueColumns.length > 0) {
            const existingUniqueIndex = table.indexes.find(
                (idx) =>
                    idx.unique &&
                    idx.columns.length === uniqueColumns.length &&
                    idx.columns.every((col, i) => col === uniqueColumns[i])
            );

            if (!existingUniqueIndex) {
                table.indexes.push({
                    name: constraintName,
                    columns: uniqueColumns,
                    unique: true,
                });
            }
        }
    } catch (error) {
        console.error('Error processing unique constraint:', error);
    }
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

// PostgreSQL dump-specific parsing logic - optimized for pg_dump output format
export async function fromPostgresDump(
    sqlContent: string
): Promise<SQLParserResult> {
    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {}; // Maps table name to its ID

    // Extract statements for different types to process in the correct order
    const alterTableStatements: string[] = [];
    const createTableStatements: string[] = [];
    const createIndexStatements: string[] = [];

    // Split SQL dump into statements
    const statements = extractStatements(sqlContent);

    for (const statement of statements) {
        if (statement.trim().startsWith('CREATE TABLE')) {
            createTableStatements.push(statement);
        } else if (statement.trim().startsWith('CREATE INDEX')) {
            createIndexStatements.push(statement);
        } else if (statement.trim().startsWith('ALTER TABLE')) {
            alterTableStatements.push(statement);
        }
    }

    try {
        // Phase 1: Process CREATE TABLE statements individually
        for (const statement of createTableStatements) {
            try {
                const { Parser } = await import('node-sql-parser');
                const parser = new Parser();
                // Parse just this statement with the SQL parser
                const ast = parser.astify(statement, parserOpts);
                if (Array.isArray(ast) && ast.length > 0) {
                    const createTableStmt = ast[0] as CreateTableStatement;

                    // Extract table name and schema
                    let tableName = '';
                    let schemaName = '';

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
                            schemaName = tableObj.schema || '';
                        } else {
                            // Direct object reference
                            const tableObj =
                                createTableStmt.table as TableReference;
                            tableName = tableObj.table || '';
                            schemaName = tableObj.schema || '';
                        }
                    }

                    if (!tableName) {
                        // Try to extract table name using regex for cases where the parser might fail
                        const tableNameMatch = statement.match(
                            /CREATE\s+TABLE\s+(?:ONLY\s+)?(?:(?:"?([^"\s.]+)"?\.)?"?([^"\s.(]+)"?)/i
                        );
                        if (tableNameMatch) {
                            schemaName = tableNameMatch[1] || '';
                            tableName = tableNameMatch[2];
                        } else {
                            continue;
                        }
                    }

                    // If schema is not in the AST, try to extract it from the SQL
                    if (!schemaName) {
                        // Look for schema in CREATE TABLE statement: CREATE TABLE schema.table (
                        const schemaMatch = statement.match(
                            /CREATE\s+TABLE\s+(?:ONLY\s+)?(?:"?([^"\s.]+)"?\.)/i
                        );
                        if (schemaMatch && schemaMatch[1]) {
                            schemaName = schemaMatch[1];
                        }
                    }

                    // Generate a unique ID for the table
                    const tableId = generateId();
                    const tableKey = `${schemaName ? schemaName + '.' : ''}${tableName}`;
                    tableMap[tableKey] = tableId;

                    // Process table columns
                    let columns: SQLColumn[] = [];
                    const indexes: SQLIndex[] = [];

                    // Try to extract columns from AST first
                    let columnsFromAst = false;
                    if (
                        createTableStmt.create_definitions &&
                        Array.isArray(createTableStmt.create_definitions)
                    ) {
                        createTableStmt.create_definitions.forEach(
                            (def: ColumnDefinition | ConstraintDefinition) => {
                                if (def.resource === 'column') {
                                    const columnDef = def as ColumnDefinition;
                                    const columnName = extractColumnName(
                                        columnDef.column
                                    );
                                    const dataType =
                                        columnDef.definition?.dataType || '';

                                    if (columnName) {
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
                                            unique:
                                                columnDef.unique === 'unique',
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
                                        columnsFromAst = true;
                                    }
                                }
                            }
                        );
                    }

                    // If we couldn't extract columns from AST, try regex approach
                    if (!columnsFromAst || columns.length === 0) {
                        columns = extractColumnsFromCreateTable(statement);
                    }

                    // Create and add the table object
                    const table: SQLTable = {
                        id: tableId,
                        name: tableName,
                        schema: schemaName,
                        columns,
                        indexes,
                        order: tables.length,
                    };

                    // Set comment if available
                    if (
                        'comment' in createTableStmt &&
                        typeof createTableStmt.comment === 'string'
                    ) {
                        table.comment = createTableStmt.comment;
                    }

                    tables.push(table);
                }
            } catch (error) {
                console.error('Error parsing CREATE TABLE statement:', error);

                // Fallback: extract table and columns using regex
                try {
                    const tableNameMatch = statement.match(
                        /CREATE\s+TABLE\s+(?:ONLY\s+)?(?:(?:"?([^"\s.]+)"?\.)?"?([^"\s.(]+)"?)/i
                    );
                    if (tableNameMatch) {
                        const schemaName = tableNameMatch[1] || '';
                        const tableName = tableNameMatch[2];

                        // Generate a unique ID for the table
                        const tableId = generateId();
                        const tableKey = `${schemaName ? schemaName + '.' : ''}${tableName}`;
                        tableMap[tableKey] = tableId;

                        // Extract columns using regex
                        const columns =
                            extractColumnsFromCreateTable(statement);

                        // Create and add the table object
                        const table: SQLTable = {
                            id: tableId,
                            name: tableName,
                            schema: schemaName,
                            columns,
                            indexes: [],
                            order: tables.length,
                        };

                        tables.push(table);
                    }
                } catch (fallbackError) {
                    console.error(
                        'Fallback extraction also failed:',
                        fallbackError
                    );
                }
            }
        }

        // Phase 2: Process CREATE INDEX statements
        for (const statement of createIndexStatements) {
            processCreateIndexStatement(statement, tableMap, tables);
        }

        // Phase 3: First process PRIMARY KEY constraints
        for (const statement of alterTableStatements) {
            if (statement.includes('PRIMARY KEY')) {
                processPrimaryKeyConstraint(statement, tableMap, tables);
            }
        }

        // Phase 3.5: Then process UNIQUE constraints
        for (const statement of alterTableStatements) {
            if (
                statement.includes('UNIQUE') &&
                !statement.includes('PRIMARY KEY')
            ) {
                processUniqueConstraint(statement, tableMap, tables);
            }
        }

        // Phase 4: Then process FOREIGN KEY constraints
        for (const statement of alterTableStatements) {
            if (statement.includes('FOREIGN KEY')) {
                processForeignKeyConstraint(statement, tableMap, relationships);
            }
        }

        // Filter out relationships with missing IDs
        const validRelationships = relationships.filter(
            (rel) => rel.sourceTableId && rel.targetTableId
        );

        return { tables, relationships: validRelationships };
    } catch (error: unknown) {
        console.error('Error in PostgreSQL dump parser:', error);
        throw new Error(
            `Error parsing PostgreSQL dump: ${(error as Error).message}`
        );
    }
}
