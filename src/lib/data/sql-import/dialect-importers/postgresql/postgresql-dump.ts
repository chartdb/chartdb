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
    parser,
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
    console.log('Processing FK constraint in statement:', statement);

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
            console.log('Unable to extract source table from statement');
            return;
        }

        // Extract source schema and table name
        const sourceSchema = tableMatch[1] || '';
        const sourceTable = tableMatch[2];

        console.log(
            `Extracted source table: ${sourceSchema ? sourceSchema + '.' : ''}${sourceTable}`
        );

        // Find constraint name
        const constraintRegex = /ADD CONSTRAINT\s+"?([^"\s]+)"?\s+FOREIGN KEY/i;
        const constraintMatch = statement.match(constraintRegex);
        const constraintName = constraintMatch ? constraintMatch[1] : '';

        // Extract source columns - handles either quoted or unquoted column names
        // This regex captures columns in format: FOREIGN KEY (col1, col2, ...)
        const sourceColRegex = /FOREIGN KEY\s+\(\s*([^)]+)\)/i;
        const sourceColMatch = statement.match(sourceColRegex);

        if (!sourceColMatch) {
            console.log('Unable to extract source columns from statement');
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
            console.log('Unable to extract target info from statement');
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

        console.log('Extracted FK details:', {
            sourceSchema,
            sourceTable,
            sourceColumns,
            targetSchema,
            targetTable,
            targetColumns,
            constraintName,
            deleteAction,
            updateAction,
        });

        // Look up table IDs
        const sourceTableKey = `${sourceSchema ? sourceSchema + '.' : ''}${sourceTable}`;
        const sourceTableId = tableMap[sourceTableKey];

        const targetTableKey = `${targetSchema ? targetSchema + '.' : ''}${targetTable}`;
        const targetTableId = tableMap[targetTableKey];

        if (!sourceTableId) {
            console.warn(
                `Source table ${sourceTableKey} not found in tableMap. Available tables: ${Object.keys(tableMap).join(', ')}`
            );
            return;
        }

        if (!targetTableId) {
            console.warn(
                `Target table ${targetTableKey} not found in tableMap. Available tables: ${Object.keys(tableMap).join(', ')}`
            );
            return;
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

            console.log(
                'Adding relationship from FK constraint:',
                relationship
            );
            relationships.push(relationship);
        }
    } catch (error) {
        console.error('Error processing foreign key constraint:', error);
        console.log('Problematic statement:', statement);
    }
}

// Function to extract columns from a CREATE TABLE statement using regex
function extractColumnsFromCreateTable(statement: string): SQLColumn[] {
    console.log(
        'Extracting columns via regex from:',
        statement.substring(0, 100) + '...'
    );
    const columns: SQLColumn[] = [];

    // Extract everything between the first opening and last closing parenthesis
    const columnMatch = statement.match(/CREATE\s+TABLE.*?\((.*)\)[^)]*;$/s);
    if (!columnMatch || !columnMatch[1]) {
        console.log('Failed to extract column definitions');
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

    console.log(`Extracted ${columns.length} columns via regex`);
    return columns;
}

// Process PostgreSQL pg_dump primary key constraints
function processPrimaryKeyConstraint(
    statement: string,
    tableMap: Record<string, string>,
    tables: SQLTable[]
): void {
    console.log('Processing PK constraint in statement:', statement);

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
            console.log('Unable to extract source table from statement');
            return;
        }

        // Extract source schema and table name
        const sourceSchema = tableMatch[1] || '';
        const sourceTable = tableMatch[2];

        console.log(
            `Extracted PK table: ${sourceSchema ? sourceSchema + '.' : ''}${sourceTable}`
        );

        // Extract primary key columns
        const pkColRegex = /PRIMARY KEY\s+\(\s*([^)]+)\)/i;
        const pkColMatch = statement.match(pkColRegex);

        if (!pkColMatch) {
            console.log('Unable to extract PK columns from statement');
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

        console.log('Extracted PK columns:', pkColumns);

        // Find the table in our collection
        const tableKey = `${sourceSchema ? sourceSchema + '.' : ''}${sourceTable}`;
        const tableId = tableMap[tableKey];

        if (!tableId) {
            console.warn(
                `Table ${tableKey} not found in tableMap for PK constraint. Available tables: ${Object.keys(tableMap).join(', ')}`
            );
            return;
        }

        // Find the table in our tables array
        const table = tables.find((t) => t.id === tableId);
        if (!table) {
            console.warn(`Table with ID ${tableId} not found in tables array`);
            return;
        }

        // Mark columns as primary key
        pkColumns.forEach((colName) => {
            const column = table.columns.find((c) => c.name === colName);
            if (column) {
                console.log(`Marking column ${colName} as primary key`);
                column.primaryKey = true;
            } else {
                console.warn(
                    `Column ${colName} not found in table ${tableKey}`
                );
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

                console.log(
                    `Adding primary key index ${pkIndexName} with columns: ${pkColumns.join(', ')}`
                );
                table.indexes.push({
                    name: pkIndexName,
                    columns: pkColumns,
                    unique: true,
                });
            }
        }
    } catch (error) {
        console.error('Error processing primary key constraint:', error);
        console.log('Problematic statement:', statement);
    }
}

// Process PostgreSQL pg_dump unique constraints
function processUniqueConstraint(
    statement: string,
    tableMap: Record<string, string>,
    tables: SQLTable[]
): void {
    console.log('Processing UNIQUE constraint in statement:', statement);

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
            console.log('Unable to extract source table from statement');
            return;
        }

        // Extract source schema and table name
        const sourceSchema = tableMatch[1] || '';
        const sourceTable = tableMatch[2];

        console.log(
            `Extracted UNIQUE table: ${sourceSchema ? sourceSchema + '.' : ''}${sourceTable}`
        );

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
            console.log('Unable to extract UNIQUE columns from statement');
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

        console.log('Extracted UNIQUE columns:', uniqueColumns);

        // Find the table in our collection
        const tableKey = `${sourceSchema ? sourceSchema + '.' : ''}${sourceTable}`;
        const tableId = tableMap[tableKey];

        if (!tableId) {
            console.warn(
                `Table ${tableKey} not found in tableMap for UNIQUE constraint. Available tables: ${Object.keys(tableMap).join(', ')}`
            );
            return;
        }

        // Find the table in our tables array
        const table = tables.find((t) => t.id === tableId);
        if (!table) {
            console.warn(`Table with ID ${tableId} not found in tables array`);
            return;
        }

        // Mark columns as unique if it's a single column constraint
        if (uniqueColumns.length === 1) {
            const column = table.columns.find(
                (c) => c.name === uniqueColumns[0]
            );
            if (column) {
                console.log(`Marking column ${uniqueColumns[0]} as unique`);
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
                console.log(
                    `Adding unique index ${constraintName} with columns: ${uniqueColumns.join(', ')}`
                );
                table.indexes.push({
                    name: constraintName,
                    columns: uniqueColumns,
                    unique: true,
                });
            }
        }
    } catch (error) {
        console.error('Error processing unique constraint:', error);
        console.log('Problematic statement:', statement);
    }
}

// Process PostgreSQL pg_dump CREATE INDEX statements
function processCreateIndexStatement(
    statement: string,
    tableMap: Record<string, string>,
    tables: SQLTable[]
): void {
    console.log('Processing CREATE INDEX statement:', statement);

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
            console.log('Unable to extract index name');
            return;
        }

        // Extract table name and schema
        const tableRegex = /ON\s+(?:"?([^"\s.]+)"?\.)?(?:"?([^"\s.(]+)"?)/i;
        const tableMatch = statement.match(tableRegex);

        if (!tableMatch) {
            console.log(
                'Unable to extract table name from CREATE INDEX statement'
            );
            return;
        }

        const tableSchema = tableMatch[1] || '';
        const tableName = tableMatch[2];

        console.log(
            `Extracted index table: ${tableSchema ? tableSchema + '.' : ''}${tableName}`
        );

        // Extract index columns
        const columnsRegex = /\(\s*([^)]+)\)/i;
        const columnsMatch = statement.match(columnsRegex);

        if (!columnsMatch) {
            console.log('Unable to extract index columns');
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
            console.log('No valid columns extracted from index definition');
            return;
        }

        console.log(`Extracted index columns:`, indexColumns);

        // Find the table
        const tableKey = `${tableSchema ? tableSchema + '.' : ''}${tableName}`;
        const tableId = tableMap[tableKey];

        if (!tableId) {
            console.warn(
                `Table ${tableKey} not found in tableMap for CREATE INDEX. Available tables: ${Object.keys(tableMap).join(', ')}`
            );
            return;
        }

        const table = tables.find((t) => t.id === tableId);
        if (!table) {
            console.warn(`Table with ID ${tableId} not found in tables array`);
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
            console.log(`Adding index ${indexName} to table ${tableName}`);
            table.indexes.push({
                name: indexName,
                columns: indexColumns,
                unique: isUnique,
            });
        } else {
            console.log(
                `Index similar to ${indexName} already exists on table ${tableName}`
            );
        }
    } catch (error) {
        console.error('Error processing CREATE INDEX statement:', error);
        console.log('Problematic statement:', statement);
    }
}

// PostgreSQL dump-specific parsing logic - optimized for pg_dump output format
export function fromPostgresDump(sqlContent: string): SQLParserResult {
    console.log('PostgreSQL dump parser starting');
    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {}; // Maps table name to its ID

    // Extract statements for different types to process in the correct order
    const alterTableStatements: string[] = [];
    const createTableStatements: string[] = [];
    const createIndexStatements: string[] = [];

    // Split SQL dump into statements
    const statements = extractStatements(sqlContent);
    console.log('Extracted statements:', statements.length);

    for (const statement of statements) {
        if (statement.trim().startsWith('CREATE TABLE')) {
            createTableStatements.push(statement);
        } else if (statement.trim().startsWith('CREATE INDEX')) {
            createIndexStatements.push(statement);
        } else if (statement.trim().startsWith('ALTER TABLE')) {
            alterTableStatements.push(statement);
        }
    }

    console.log(
        'Statement breakdown:',
        createTableStatements.length,
        'CREATE TABLE,',
        createIndexStatements.length,
        'CREATE INDEX,',
        alterTableStatements.length,
        'ALTER TABLE'
    );

    try {
        // Phase 1: Process CREATE TABLE statements individually
        console.log('Processing CREATE TABLE statements to populate tableMap');
        for (const statement of createTableStatements) {
            try {
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
                            console.log(
                                `Extracted table name from regex: ${schemaName ? schemaName + '.' : ''}${tableName}`
                            );
                        } else {
                            console.log('Skipping table with empty name');
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
                            console.log(
                                `Extracted schema from SQL: ${schemaName}`
                            );
                        }
                    }

                    // Generate a unique ID for the table
                    const tableId = generateId();
                    const tableKey = `${schemaName ? schemaName + '.' : ''}${tableName}`;
                    tableMap[tableKey] = tableId;
                    console.log(
                        `Added table to tableMap with key: ${tableKey}`
                    );

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
                        console.log(
                            'No columns extracted from AST, trying regex approach'
                        );
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

                    console.log(`Adding table to results:`, {
                        name: table.name,
                        schema: table.schema,
                        columns: table.columns.length,
                        indexes: table.indexes.length,
                    });
                    tables.push(table);
                }
            } catch (error) {
                console.warn('Error parsing CREATE TABLE statement:', error);
                console.log('Problematic statement:', statement);

                // Fallback: extract table and columns using regex
                try {
                    const tableNameMatch = statement.match(
                        /CREATE\s+TABLE\s+(?:ONLY\s+)?(?:(?:"?([^"\s.]+)"?\.)?"?([^"\s.(]+)"?)/i
                    );
                    if (tableNameMatch) {
                        const schemaName = tableNameMatch[1] || '';
                        const tableName = tableNameMatch[2];
                        console.log(
                            `Fallback: extracted table name: ${schemaName ? schemaName + '.' : ''}${tableName}`
                        );

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

                        console.log(`Fallback: adding table to results:`, {
                            name: table.name,
                            schema: table.schema,
                            columns: table.columns.length,
                        });
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

        // Log all table keys to help with debugging
        console.log(
            'Table map keys after CREATE TABLE processing:',
            Object.keys(tableMap)
        );

        // Phase 2: Process CREATE INDEX statements
        console.log('Processing CREATE INDEX statements');
        for (const statement of createIndexStatements) {
            processCreateIndexStatement(statement, tableMap, tables);
        }

        // Phase 3: First process PRIMARY KEY constraints
        console.log('Processing ALTER TABLE statements for primary keys');
        for (const statement of alterTableStatements) {
            if (statement.includes('PRIMARY KEY')) {
                processPrimaryKeyConstraint(statement, tableMap, tables);
            }
        }

        // Phase 3.5: Then process UNIQUE constraints
        console.log('Processing ALTER TABLE statements for unique constraints');
        for (const statement of alterTableStatements) {
            if (
                statement.includes('UNIQUE') &&
                !statement.includes('PRIMARY KEY')
            ) {
                processUniqueConstraint(statement, tableMap, tables);
            }
        }

        // Phase 4: Then process FOREIGN KEY constraints
        console.log(
            'Processing ALTER TABLE statements for foreign keys now that all tables are loaded'
        );
        for (const statement of alterTableStatements) {
            if (statement.includes('FOREIGN KEY')) {
                processForeignKeyConstraint(statement, tableMap, relationships);
            }
        }

        // Filter out relationships with missing IDs
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
            `PostgreSQL dump parser finished with ${tables.length} tables and ${validRelationships.length} relationships`
        );
        return { tables, relationships: validRelationships };
    } catch (error: unknown) {
        console.error('Error in PostgreSQL dump parser:', error);
        throw new Error(
            `Error parsing PostgreSQL dump: ${(error as Error).message}`
        );
    }
}
