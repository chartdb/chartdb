import { generateId } from '@/lib/utils';
import type {
    SQLParserResult,
    SQLTable,
    SQLColumn,
    SQLIndex,
    SQLForeignKey,
    SQLASTNode,
} from '../../common';
import { buildSQLFromAST } from '../../common';
import { DatabaseType } from '@/lib/domain/database-type';
import type {
    TableReference,
    ColumnReference,
    ColumnDefinition,
    ConstraintDefinition,
    CreateTableStatement,
    CreateIndexStatement,
    AlterTableStatement,
} from './sqlserver-common';
import {
    parserOpts,
    extractColumnName,
    getTypeArgs,
    findTableWithSchemaSupport,
} from './sqlserver-common';

/**
 * Helper function to safely build SQL from AST nodes, handling null/undefined/invalid cases
 */
function safelyBuildSQLFromAST(ast: unknown): string | undefined {
    if (!ast) return undefined;

    // Make sure it's a valid AST node with a 'type' property
    if (typeof ast === 'object' && ast !== null && 'type' in ast) {
        return buildSQLFromAST(ast as SQLASTNode, DatabaseType.SQL_SERVER);
    }

    // Return string representation for non-AST objects
    if (ast !== null && (typeof ast === 'string' || typeof ast === 'number')) {
        return String(ast);
    }

    return undefined;
}

/**
 * Preprocess SQL Server script to remove or modify parts that the parser can't handle
 */
function preprocessSQLServerScript(sqlContent: string): string {
    // 1. Remove IF NOT EXISTS ... BEGIN ... END blocks (typically used for schema creation)
    sqlContent = sqlContent.replace(
        /IF\s+NOT\s+EXISTS\s*\([^)]+\)\s*BEGIN\s+[^;]+;\s*END;?/gi,
        ''
    );

    // 2. Remove any GO statements (batch separators)
    sqlContent = sqlContent.replace(/\bGO\b/gi, ';');

    // 3. Remove any EXEC statements
    sqlContent = sqlContent.replace(/EXEC\s*\([^)]+\)\s*;?/gi, '');
    sqlContent = sqlContent.replace(/EXEC\s+[^;]+;/gi, '');

    // 4. Replace any remaining procedural code blocks that might cause issues
    sqlContent = sqlContent.replace(
        /BEGIN\s+TRANSACTION|COMMIT\s+TRANSACTION|ROLLBACK\s+TRANSACTION/gi,
        '-- $&'
    );

    // 5. Special handling for CREATE TABLE with reserved keywords as column names
    // Find CREATE TABLE statements
    const createTablePattern =
        /CREATE\s+TABLE\s+\[?([^\]]*)\]?\.?\[?([^\]]*)\]?\s*\(([^;]*)\)/gi;

    sqlContent = sqlContent.replace(
        createTablePattern,
        (_, schema, tableName, columnDefs) => {
            // Process column definitions to rename problematic columns
            let processedColumnDefs = columnDefs;

            // Replace any column named "column" with "column_name"
            processedColumnDefs = processedColumnDefs.replace(
                /\[column\]/gi,
                '[column_name]'
            );

            // Replace any column named "int" with "int_col"
            processedColumnDefs = processedColumnDefs.replace(
                /\[int\]/gi,
                '[int_col]'
            );

            // Replace any column named "time" with "time_col"
            processedColumnDefs = processedColumnDefs.replace(
                /\[time\]/gi,
                '[time_col]'
            );

            // Replace any column named "order" with "order_column"
            processedColumnDefs = processedColumnDefs.replace(
                /\[order\]/gi,
                '[order_column]'
            );

            // Rebuild the CREATE TABLE statement
            return `CREATE TABLE [${schema || 'dbo'}].[${tableName}] (${processedColumnDefs})`;
        }
    );

    // 6. Handle default value expressions with functions - replace with simpler defaults
    sqlContent = sqlContent.replace(/DEFAULT\s+'\([^)]+\)'/gi, "DEFAULT '0'");
    sqlContent = sqlContent.replace(/DEFAULT\s+\([^)]+\)/gi, 'DEFAULT 0');

    // 7. Split into individual statements to handle them separately
    const statements = sqlContent
        .split(';')
        .filter((stmt) => stmt.trim().length > 0);

    // Filter to keep only CREATE TABLE, CREATE INDEX, and ALTER TABLE statements
    const filteredStatements = statements.filter((stmt) => {
        const trimmedStmt = stmt.trim().toUpperCase();
        return (
            trimmedStmt.startsWith('CREATE TABLE') ||
            trimmedStmt.startsWith('CREATE UNIQUE INDEX') ||
            trimmedStmt.startsWith('CREATE INDEX') ||
            trimmedStmt.startsWith('ALTER TABLE')
        );
    });

    return filteredStatements.join(';') + ';';
}

/**
 * Manual parsing of ALTER TABLE ADD CONSTRAINT statements
 * This is a fallback for when the node-sql-parser fails to properly parse the constraints
 */
function parseAlterTableAddConstraint(statements: string[]): {
    fkData: SQLForeignKey[];
    tableMap: Record<string, string>;
} {
    const fkData: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {};

    // Regular expressions to extract information from ALTER TABLE statements
    const alterTableRegex =
        /ALTER\s+TABLE\s+\[?([^\]]*)\]?\.?\[?([^\]]*)\]?\s+ADD\s+CONSTRAINT\s+\[?([^\]]*)\]?\s+FOREIGN\s+KEY\s*\(\[?([^\]]*)\]?\)\s+REFERENCES\s+\[?([^\]]*)\]?\.?\[?([^\]]*)\]?\s*\(\[?([^\]]*)\]?\)/i;

    for (const stmt of statements) {
        const match = stmt.match(alterTableRegex);
        if (match) {
            const [
                ,
                sourceSchema = 'dbo',
                sourceTable,
                constraintName,
                sourceColumn,
                targetSchema = 'dbo',
                targetTable,
                targetColumn,
            ] = match;

            // Generate IDs for tables if they don't already exist
            const sourceTableKey = `${sourceSchema}.${sourceTable}`;
            const targetTableKey = `${targetSchema}.${targetTable}`;

            if (!tableMap[sourceTableKey]) {
                tableMap[sourceTableKey] = generateId();
            }

            if (!tableMap[targetTableKey]) {
                tableMap[targetTableKey] = generateId();
            }

            fkData.push({
                name: constraintName,
                sourceTable: sourceTable,
                sourceSchema: sourceSchema,
                sourceColumn: sourceColumn,
                targetTable: targetTable,
                targetSchema: targetSchema,
                targetColumn: targetColumn,
                sourceTableId: tableMap[sourceTableKey],
                targetTableId: tableMap[targetTableKey],
            });
        }
    }

    return { fkData, tableMap };
}

/**
 * Map SQL Server data type strings to normalized types
 * This ensures consistent type handling across the application
 */
function normalizeSQLServerDataType(dataType: string): string {
    // Convert to lowercase for consistent comparison
    const lowerType = dataType.toLowerCase().trim();

    // Handle SQL Server specific types
    switch (lowerType) {
        // Exact numeric types
        case 'tinyint':
            return 'tinyint';
        case 'smallint':
            return 'smallint';
        case 'int':
            return 'int';
        case 'bigint':
            return 'bigint';
        case 'decimal':
        case 'numeric':
            return lowerType;
        case 'money':
        case 'smallmoney':
            return lowerType;

        // Approximate numeric types
        case 'float':
        case 'real':
            return lowerType;

        // Date and time types
        case 'date':
            return 'date';
        case 'datetime':
            return 'datetime';
        case 'datetime2':
            return 'datetime2';
        case 'datetimeoffset':
            return 'datetimeoffset';
        case 'smalldatetime':
            return 'smalldatetime';
        case 'time':
            return 'time';

        // Character strings
        case 'char':
        case 'varchar':
        case 'text':
            return lowerType;

        // Unicode character strings
        case 'nchar':
        case 'nvarchar':
        case 'ntext':
            return lowerType;

        // Binary strings
        case 'binary':
        case 'varbinary':
        case 'image':
            return lowerType;

        // Other data types
        case 'bit':
            return 'bit';
        case 'uniqueidentifier':
            return 'uniqueidentifier';
        case 'xml':
            return 'xml';
        case 'json':
            return 'json';

        // Default fallback
        default:
            return dataType;
    }
}

/**
 * Parse SQL Server DDL scripts and extract database structure
 * @param sqlContent SQL Server DDL content as string
 * @returns Parsed structure including tables, columns, and relationships
 */
export async function fromSQLServer(
    sqlContent: string
): Promise<SQLParserResult> {
    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {}; // Maps table name to its ID

    try {
        // Preprocess the SQL content to handle T-SQL specific syntax
        const preprocessedSQL = preprocessSQLServerScript(sqlContent);

        const statements = sqlContent
            .split(';')
            .filter((stmt) => stmt.trim().length > 0);
        const alterTableStatements = statements.filter(
            (stmt) =>
                stmt.trim().toUpperCase().startsWith('ALTER TABLE') &&
                stmt.includes('FOREIGN KEY')
        );

        if (alterTableStatements.length > 0) {
            const { fkData, tableMap: fkTableMap } =
                parseAlterTableAddConstraint(alterTableStatements);

            // Store table IDs from alter statements
            Object.assign(tableMap, fkTableMap);

            // Store foreign key relationships for later processing
            relationships.push(...fkData);
        }

        const { Parser } = await import('node-sql-parser');
        const parser = new Parser();
        let ast;
        try {
            ast = parser.astify(preprocessedSQL, parserOpts);
        } catch {
            // Fallback: Try to parse each statement individually
            const statements = preprocessedSQL
                .split(';')
                .filter((stmt) => stmt.trim().length > 0);
            ast = [];

            for (const stmt of statements) {
                try {
                    const stmtAst = parser.astify(stmt + ';', parserOpts);
                    if (Array.isArray(stmtAst)) {
                        ast.push(...stmtAst);
                    } else if (stmtAst) {
                        ast.push(stmtAst);
                    }
                } catch {
                    // Skip statements that can't be parsed
                }
            }
        }

        if (!Array.isArray(ast) || ast.length === 0) {
            throw new Error('Failed to parse SQL DDL - Empty or invalid AST');
        }

        // Process each statement
        (ast as unknown as SQLASTNode[]).forEach((stmt) => {
            // Process CREATE TABLE statements
            if (stmt.type === 'create' && stmt.keyword === 'table') {
                processCreateTable(
                    stmt as CreateTableStatement,
                    tables,
                    tableMap,
                    relationships
                );
            }
            // Process CREATE INDEX statements
            else if (stmt.type === 'create' && stmt.keyword === 'index') {
                processCreateIndex(stmt as CreateIndexStatement, tables);
            }
            // Process ALTER TABLE statements
            else if (stmt.type === 'alter' && stmt.keyword === 'table') {
                processAlterTable(
                    stmt as AlterTableStatement,
                    tables,
                    relationships
                );
            }
        });

        // Link relationships to ensure all targetTableId and sourceTableId fields are filled
        const validRelationships = linkRelationships(
            tables,
            relationships,
            tableMap
        );

        // Sort tables by dependency (for better visualization)
        const sortedTables = [...tables];
        sortedTables.sort((a, b) => a.order - b.order);

        return {
            tables: sortedTables,
            relationships: validRelationships,
        };
    } catch (error) {
        console.error('Error parsing SQL Server DDL:', error);
        throw new Error(`Error parsing SQL Server DDL: ${error}`);
    }
}

/**
 * Process a CREATE TABLE statement
 */
function processCreateTable(
    stmt: CreateTableStatement,
    tables: SQLTable[],
    tableMap: Record<string, string>,
    relationships: SQLForeignKey[]
): void {
    let tableName = '';
    let schemaName = '';

    // Extract table name and schema
    if (stmt.table && typeof stmt.table === 'object') {
        // Handle array of tables if needed
        if (Array.isArray(stmt.table) && stmt.table.length > 0) {
            const tableObj = stmt.table[0];
            tableName = tableObj.table || '';
            // SQL Server uses 'schema' or 'db' field
            schemaName = tableObj.schema || tableObj.db || '';
        } else {
            // Direct object reference
            const tableObj = stmt.table as TableReference;
            tableName = tableObj.table || '';
            schemaName = tableObj.schema || tableObj.db || '';
        }
    }

    if (!tableName) {
        return;
    }

    // If no schema specified, use default 'dbo' schema for SQL Server
    if (!schemaName) {
        schemaName = 'dbo';
    }

    // Generate a unique ID for the table
    const tableId = generateId();
    const tableKey = `${schemaName ? schemaName + '.' : ''}${tableName}`;
    tableMap[tableKey] = tableId;

    // Process table columns
    const columns: SQLColumn[] = [];
    const indexes: SQLIndex[] = [];

    if (stmt.create_definitions && Array.isArray(stmt.create_definitions)) {
        stmt.create_definitions.forEach(
            (def: ColumnDefinition | ConstraintDefinition) => {
                if (def.resource === 'column') {
                    // Process column definition
                    const columnDef = def as ColumnDefinition;
                    const columnName = extractColumnName(columnDef.column);
                    const rawDataType = columnDef.definition?.dataType || '';
                    const normalizedDataType =
                        normalizeSQLServerDataType(rawDataType);

                    if (columnName) {
                        // Check for SQL Server specific column properties
                        const isPrimaryKey =
                            columnDef.primary_key === 'primary key';

                        // For SQL Server, check for IDENTITY property in suffixes
                        const hasIdentity = columnDef.definition?.suffix?.some(
                            (suffix) =>
                                suffix.toLowerCase().includes('identity')
                        );

                        columns.push({
                            name: columnName,
                            type: normalizedDataType,
                            nullable: columnDef.nullable?.type !== 'not null',
                            primaryKey: isPrimaryKey,
                            unique: columnDef.unique === 'unique',
                            typeArgs: getTypeArgs(columnDef.definition),
                            default: columnDef.default_val
                                ? safelyBuildSQLFromAST(columnDef.default_val)
                                : undefined,
                            increment: hasIdentity,
                        });
                    }
                } else if (def.resource === 'constraint') {
                    // Handle constraint definitions
                    const constraintDef = def as ConstraintDefinition;

                    // Handle PRIMARY KEY constraints
                    if (constraintDef.constraint_type === 'primary key') {
                        if (Array.isArray(constraintDef.definition)) {
                            // Extract column names from primary key constraint
                            for (const colDef of constraintDef.definition) {
                                if (
                                    colDef &&
                                    typeof colDef === 'object' &&
                                    'type' in colDef &&
                                    colDef.type === 'column_ref' &&
                                    'column' in colDef
                                ) {
                                    const pkColumnName = extractColumnName(
                                        colDef as ColumnReference
                                    );
                                    // Find and mark the column as primary key
                                    const column = columns.find(
                                        (col) => col.name === pkColumnName
                                    );
                                    if (column) {
                                        column.primaryKey = true;
                                    }
                                }
                            }
                        }
                    }
                    // Handle UNIQUE constraints
                    else if (constraintDef.constraint_type === 'unique') {
                        if (Array.isArray(constraintDef.definition)) {
                            const uniqueColumns: string[] = [];
                            // Extract column names from unique constraint
                            for (const colDef of constraintDef.definition) {
                                if (
                                    colDef &&
                                    typeof colDef === 'object' &&
                                    'type' in colDef &&
                                    colDef.type === 'column_ref' &&
                                    'column' in colDef
                                ) {
                                    const uniqueColumnName = extractColumnName(
                                        colDef as ColumnReference
                                    );
                                    uniqueColumns.push(uniqueColumnName);
                                }
                            }

                            // Add as an index
                            if (uniqueColumns.length > 0) {
                                indexes.push({
                                    name:
                                        constraintDef.constraint ||
                                        `unique_${tableName}_${uniqueColumns.join('_')}`,
                                    columns: uniqueColumns,
                                    unique: true,
                                });
                            }
                        }
                    }
                    // Handle FOREIGN KEY constraints
                    else if (
                        constraintDef.constraint_type === 'foreign key' &&
                        constraintDef.reference
                    ) {
                        const reference = constraintDef.reference;
                        if (
                            reference &&
                            reference.table &&
                            reference.columns &&
                            reference.columns.length > 0
                        ) {
                            // Extract target table info
                            const targetTable =
                                reference.table as TableReference;
                            const targetTableName = targetTable.table;
                            const targetSchemaName =
                                targetTable.schema || targetTable.db || 'dbo';

                            // Extract source column
                            let sourceColumnName = '';
                            if (
                                Array.isArray(constraintDef.definition) &&
                                constraintDef.definition.length > 0
                            ) {
                                const sourceColDef =
                                    constraintDef.definition[0];
                                if (
                                    sourceColDef &&
                                    typeof sourceColDef === 'object' &&
                                    'type' in sourceColDef &&
                                    sourceColDef.type === 'column_ref'
                                ) {
                                    sourceColumnName = extractColumnName(
                                        sourceColDef as ColumnReference
                                    );
                                }
                            }

                            // Extract target column
                            const targetColumnName = extractColumnName(
                                reference.columns[0]
                            );

                            if (
                                sourceColumnName &&
                                targetTableName &&
                                targetColumnName
                            ) {
                                // Create a foreign key relationship
                                relationships.push({
                                    name:
                                        constraintDef.constraint ||
                                        `fk_${tableName}_${sourceColumnName}`,
                                    sourceTable: tableName,
                                    sourceSchema: schemaName,
                                    sourceColumn: sourceColumnName,
                                    targetTable: targetTableName,
                                    targetSchema: targetSchemaName,
                                    targetColumn: targetColumnName,
                                    sourceTableId: tableId,
                                    targetTableId: '', // Will be filled later
                                    updateAction: reference.on_update,
                                    deleteAction: reference.on_delete,
                                });
                            }
                        }
                    }
                }
            }
        );
    }

    // Create the table object
    tables.push({
        id: tableId,
        name: tableName,
        schema: schemaName,
        columns,
        indexes,
        order: tables.length,
    });
}

/**
 * Process a CREATE INDEX statement
 */
function processCreateIndex(
    stmt: CreateIndexStatement,
    tables: SQLTable[]
): void {
    if (!stmt.table || !stmt.columns || stmt.columns.length === 0) {
        return;
    }

    // Extract table name and schema
    let tableName = '';
    let schemaName = '';

    if (typeof stmt.table === 'object') {
        // Handle array of tables if needed
        if (Array.isArray(stmt.table) && stmt.table.length > 0) {
            const tableObj = stmt.table[0];
            tableName = tableObj.table || '';
            schemaName = tableObj.schema || tableObj.db || '';
        } else {
            // Direct object reference
            const tableObj = stmt.table as TableReference;
            tableName = tableObj.table || '';
            schemaName = tableObj.schema || tableObj.db || '';
        }
    }

    if (!tableName) {
        return;
    }

    // If no schema specified, use default 'dbo' schema for SQL Server
    if (!schemaName) {
        schemaName = 'dbo';
    }

    // Find the table
    const table = findTableWithSchemaSupport(tables, tableName, schemaName);
    if (!table) {
        return;
    }

    // Extract column names from the index definition
    const indexColumns = stmt.columns.map((col) => extractColumnName(col));
    if (indexColumns.length === 0) {
        return;
    }

    // Create the index
    const indexName =
        stmt.index || `idx_${tableName}_${indexColumns.join('_')}`;
    const isUnique = stmt.constraint === 'unique';

    // Add index to the table
    const tableObj = tables.find((t) => t.id === table.id);
    if (tableObj) {
        tableObj.indexes.push({
            name: indexName,
            columns: indexColumns,
            unique: isUnique,
        });
    }
}

/**
 * Process an ALTER TABLE statement
 */
function processAlterTable(
    stmt: AlterTableStatement,
    tables: SQLTable[],
    relationships: SQLForeignKey[]
): void {
    if (!stmt.table || !stmt.expr || !Array.isArray(stmt.expr)) {
        return;
    }

    // Extract table name and schema
    let tableName = '';
    let schemaName = '';

    if (typeof stmt.table === 'object') {
        // Handle array of tables if needed
        if (Array.isArray(stmt.table) && stmt.table.length > 0) {
            const tableObj = stmt.table[0];
            tableName = tableObj.table || '';
            schemaName = tableObj.schema || tableObj.db || '';
        } else {
            // Direct object reference
            const tableObj = stmt.table as TableReference;
            tableName = tableObj.table || '';
            schemaName = tableObj.schema || tableObj.db || '';
        }
    }

    if (!tableName) {
        return;
    }

    // If no schema specified, use default 'dbo' schema for SQL Server
    if (!schemaName) {
        schemaName = 'dbo';
    }

    // Find the table
    const table = findTableWithSchemaSupport(tables, tableName, schemaName);
    if (!table) {
        return;
    }

    // Process each expression in the ALTER TABLE statement
    for (const expr of stmt.expr) {
        const action = expr.action;

        // Handle ADD CONSTRAINT for foreign keys
        if (action === 'add' && expr.resource === 'constraint') {
            const constraintDef = expr as unknown as ConstraintDefinition;

            if (
                constraintDef.constraint_type === 'foreign key' &&
                constraintDef.reference
            ) {
                const reference = constraintDef.reference;
                if (
                    reference &&
                    reference.table &&
                    reference.columns &&
                    reference.columns.length > 0
                ) {
                    // Extract target table info
                    const targetTable = reference.table as TableReference;
                    const targetTableName = targetTable.table;
                    const targetSchemaName =
                        targetTable.schema || targetTable.db || 'dbo';

                    // Extract source column
                    let sourceColumnName = '';
                    if (
                        Array.isArray(constraintDef.definition) &&
                        constraintDef.definition.length > 0
                    ) {
                        const sourceColDef = constraintDef.definition[0];
                        if (
                            sourceColDef &&
                            typeof sourceColDef === 'object' &&
                            'type' in sourceColDef &&
                            sourceColDef.type === 'column_ref'
                        ) {
                            sourceColumnName = extractColumnName(
                                sourceColDef as ColumnReference
                            );
                        }
                    }

                    // Extract target column
                    const targetColumnName = extractColumnName(
                        reference.columns[0]
                    );

                    if (
                        sourceColumnName &&
                        targetTableName &&
                        targetColumnName
                    ) {
                        // Create a foreign key relationship
                        relationships.push({
                            name:
                                constraintDef.constraint ||
                                `fk_${tableName}_${sourceColumnName}`,
                            sourceTable: tableName,
                            sourceSchema: schemaName,
                            sourceColumn: sourceColumnName,
                            targetTable: targetTableName,
                            targetSchema: targetSchemaName,
                            targetColumn: targetColumnName,
                            sourceTableId: table.id,
                            targetTableId: '', // Will be filled later
                            updateAction: reference.on_update,
                            deleteAction: reference.on_delete,
                        });
                    }
                }
            }
        }
    }
}

/**
 * Post-process the tables and relationships to ensure all targetTableId and sourceTableId fields are filled
 */
function linkRelationships(
    tables: SQLTable[],
    relationships: SQLForeignKey[],
    tableMap: Record<string, string>
): SQLForeignKey[] {
    // First, ensure all table keys are normalized
    const normalizedTableMap: Record<string, string> = {};
    for (const [key, id] of Object.entries(tableMap)) {
        // Normalize key format to ensure consistent lookups
        let normalizedKey = key;
        if (!key.includes('.')) {
            normalizedKey = `dbo.${key}`;
        }
        normalizedTableMap[normalizedKey.toLowerCase()] = id;

        // Also add without schema for fallback
        const tableName = key.includes('.') ? key.split('.')[1] : key;
        normalizedTableMap[tableName.toLowerCase()] = id;
    }

    // Add all tables to the normalized map
    for (const table of tables) {
        const tableKey = `${table.schema || 'dbo'}.${table.name}`;
        normalizedTableMap[tableKey.toLowerCase()] = table.id;
        normalizedTableMap[table.name.toLowerCase()] = table.id;
    }

    // Process all relationships
    const validRelationships = relationships.filter((rel) => {
        // Normalize keys for lookup
        const sourceTableKey = `${rel.sourceSchema || 'dbo'}.${rel.sourceTable}`;
        const targetTableKey = `${rel.targetSchema || 'dbo'}.${rel.targetTable}`;

        // Get the source table ID if it's not already set
        if (!rel.sourceTableId || rel.sourceTableId === '') {
            const sourceId =
                normalizedTableMap[sourceTableKey.toLowerCase()] ||
                normalizedTableMap[rel.sourceTable.toLowerCase()];

            if (sourceId) {
                rel.sourceTableId = sourceId;
            } else {
                return false;
            }
        }

        // Get the target table ID
        if (!rel.targetTableId || rel.targetTableId === '') {
            const targetId =
                normalizedTableMap[targetTableKey.toLowerCase()] ||
                normalizedTableMap[rel.targetTable.toLowerCase()];

            if (targetId) {
                rel.targetTableId = targetId;
            } else {
                return false;
            }
        }

        return true;
    });

    return validRelationships;
}
