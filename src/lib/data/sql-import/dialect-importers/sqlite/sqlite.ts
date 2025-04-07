import type {
    SQLParserResult,
    SQLTable,
    SQLColumn,
    SQLIndex,
    SQLForeignKey,
    SQLASTNode,
} from '../../common';
import type {
    TableReference,
    ColumnReference,
    ColumnDefinition,
    ConstraintDefinition,
    CreateTableStatement,
    CreateIndexStatement,
    AlterTableStatement,
} from './sqlite-common';
import {
    parserOpts,
    extractColumnName,
    getTypeArgs,
    getTableIdWithSchemaSupport,
    isValidForeignKeyRelationship,
} from './sqlite-common';

/**
 * SQLite-specific parsing logic
 */
export async function fromSQLite(sqlContent: string): Promise<SQLParserResult> {
    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {}; // Maps table name to its ID

    try {
        // Parse the SQL DDL statements
        const { Parser } = await import('node-sql-parser');
        const parser = new Parser();

        const ast = parser.astify(
            sqlContent,
            parserOpts
        ) as unknown as SQLASTNode[];

        if (!Array.isArray(ast)) {
            throw new Error('Failed to parse SQL DDL - AST is not an array');
        }

        // Process each statement
        ast.forEach((stmt: SQLASTNode) => {
            // Process CREATE TABLE statements
            if (stmt.type === 'create' && stmt.keyword === 'table') {
                processCreateTableStatement(
                    stmt as CreateTableStatement,
                    tables,
                    relationships,
                    tableMap
                );
            }
            // Process CREATE INDEX statements
            else if (stmt.type === 'create' && stmt.keyword === 'index') {
                processCreateIndexStatement(
                    stmt as CreateIndexStatement,
                    tables
                );
            }
            // Process ALTER TABLE statements
            else if (stmt.type === 'alter' && stmt.table) {
                processAlterTableStatement(stmt as AlterTableStatement, tables);
            }
        });

        // Use regex to find foreign keys that the parser might have missed
        findForeignKeysUsingRegex(sqlContent, tableMap, relationships);

        // Create placeholder tables for any missing referenced tables
        addPlaceholderTablesForFKReferences(tables, relationships, tableMap);

        // Filter out any invalid relationships
        const validRelationships = relationships.filter((rel) => {
            return isValidForeignKeyRelationship(rel, tables);
        });

        return { tables, relationships: validRelationships };
    } catch (error) {
        console.error('Error parsing SQLite SQL:', error);
        throw error;
    }
}

/**
 * Process a CREATE TABLE statement to extract table and column information
 */
function processCreateTableStatement(
    createTableStmt: CreateTableStatement,
    tables: SQLTable[],
    _: SQLForeignKey[],
    tableMap: Record<string, string>
): void {
    // Extract table name and schema
    let tableName = '';
    let schemaName = '';

    if (createTableStmt.table && typeof createTableStmt.table === 'object') {
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
            const tableObj = createTableStmt.table as TableReference;
            tableName = tableObj.table || '';
            schemaName = tableObj.schema || '';
        }
    }

    // Skip if table name is empty
    if (!tableName) {
        return;
    }

    // Generate a unique ID for the table
    const tableId = getTableIdWithSchemaSupport(tableName, schemaName);

    // Store the table ID in the map for later reference
    tableMap[`${schemaName ? schemaName + '.' : ''}${tableName}`] = tableId;
    tableMap[tableName] = tableId; // Also store without schema for easier lookup

    // Initialize column and index arrays
    const columns: SQLColumn[] = [];
    const indexes: SQLIndex[] = [];
    let primaryKeyColumns: string[] = [];

    // Process column definitions and constraints
    if (
        createTableStmt.create_definitions &&
        Array.isArray(createTableStmt.create_definitions)
    ) {
        createTableStmt.create_definitions.forEach((def) => {
            if ('column' in def) {
                // Process column definition
                const columnDef = def as ColumnDefinition;
                const columnName = extractColumnName(columnDef.column);

                if (!columnName) {
                    return;
                }

                // Extract type information - handle nullable dataType field
                let typeName = 'text'; // Default to text if no type specified
                const typeArgs = {
                    length: undefined as number | undefined,
                    precision: undefined as number | undefined,
                    scale: undefined as number | undefined,
                };

                if (columnDef.dataType) {
                    typeName = columnDef.dataType.dataType || 'text';
                    const args = getTypeArgs(columnDef.dataType);
                    typeArgs.length = args.size > 0 ? args.size : undefined;
                    typeArgs.precision = args.precision;
                    typeArgs.scale = args.scale;
                }

                // Check if this column is part of the primary key
                const isPrimaryKey = !!columnDef.primary_key;
                if (isPrimaryKey) {
                    primaryKeyColumns.push(columnName);
                }

                // Process default value if present
                let defaultValue = '';
                if (columnDef.default_val) {
                    defaultValue = String(columnDef.default_val.value);
                }

                // Add the column to our collection
                columns.push({
                    name: columnName,
                    type: typeName,
                    nullable: !columnDef.notNull,
                    primaryKey: isPrimaryKey,
                    unique: !!columnDef.unique,
                    default: defaultValue,
                    increment:
                        isPrimaryKey && typeName.toLowerCase() === 'integer',
                    typeArgs:
                        typeArgs.length || typeArgs.precision || typeArgs.scale
                            ? typeArgs
                            : undefined,
                });
            } else if ('constraint_type' in def) {
                // Process constraint definition
                const constraintDef = def as ConstraintDefinition;

                // Process PRIMARY KEY constraint
                if (
                    constraintDef.constraint_type === 'primary key' &&
                    constraintDef.columns
                ) {
                    primaryKeyColumns = constraintDef.columns
                        .map(extractColumnName)
                        .filter(Boolean);
                }

                // Process UNIQUE constraint
                if (
                    constraintDef.constraint_type === 'unique' &&
                    constraintDef.columns
                ) {
                    const uniqueColumns = constraintDef.columns
                        .map(extractColumnName)
                        .filter(Boolean);

                    // Create a unique index for this constraint
                    if (uniqueColumns.length > 0) {
                        const uniqueIndexName =
                            constraintDef.constraint_name ||
                            `uk_${tableName}_${uniqueColumns.join('_')}`;
                        indexes.push({
                            name: uniqueIndexName,
                            columns: uniqueColumns,
                            unique: true,
                        });
                    }
                }
            }
        });
    }

    // Update primary key flags in columns
    if (primaryKeyColumns.length > 0) {
        columns.forEach((column) => {
            if (primaryKeyColumns.includes(column.name)) {
                column.primaryKey = true;

                // In SQLite, INTEGER PRIMARY KEY is automatically an alias for ROWID (auto-incrementing)
                if (column.type.toLowerCase() === 'integer') {
                    column.increment = true;
                }
            }
        });
    }

    // Create the table object
    tables.push({
        id: tableId,
        name: tableName,
        schema: schemaName || undefined,
        columns,
        indexes,
        order: tables.length,
    });
}

/**
 * Process a CREATE INDEX statement to extract index information
 */
function processCreateIndexStatement(
    createIndexStmt: CreateIndexStatement,
    tables: SQLTable[]
): void {
    if (!createIndexStmt.index || !createIndexStmt.table) {
        return;
    }

    // Extract table and index information
    const indexName = createIndexStmt.index.name;
    let tableName = '';
    let schemaName = '';

    if (typeof createIndexStmt.table === 'object') {
        if (
            Array.isArray(createIndexStmt.table) &&
            createIndexStmt.table.length > 0
        ) {
            tableName = createIndexStmt.table[0].table || '';
            schemaName = createIndexStmt.table[0].schema || '';
        } else {
            const tableRef = createIndexStmt.table as TableReference;
            tableName = tableRef.table || '';
            schemaName = tableRef.schema || '';
        }
    }

    // Find the table in our collection
    const table = tables.find(
        (t) => t.name === tableName && (!schemaName || t.schema === schemaName)
    );

    if (table) {
        // Extract column names from index columns
        let columns: string[] = [];

        if (createIndexStmt.columns && Array.isArray(createIndexStmt.columns)) {
            columns = createIndexStmt.columns
                .map((col: ColumnReference) => extractColumnName(col))
                .filter((col: string) => col !== '');
        }

        if (columns.length > 0) {
            // Create the index
            table.indexes.push({
                name: indexName,
                columns: columns,
                unique: !!createIndexStmt.unique,
            });
        }
    }
}

/**
 * Process an ALTER TABLE statement to extract changes to table structure
 */
function processAlterTableStatement(
    alterTableStmt: AlterTableStatement,
    tables: SQLTable[]
): void {
    if (!alterTableStmt.table || !alterTableStmt.expr) {
        return;
    }

    const tableName = alterTableStmt.table.table;
    const schemaName = alterTableStmt.table.schema || '';

    // Find the target table
    const table = tables.find(
        (t) => t.name === tableName && (!schemaName || t.schema === schemaName)
    );

    if (!table) {
        return;
    }

    // Note: We're relying on the regex approach to find foreign keys from ALTER TABLE statements
}

/**
 * Uses regular expressions to find foreign key relationships in the SQL content
 */
function findForeignKeysUsingRegex(
    sqlContent: string,
    tableMap: Record<string, string>,
    relationships: SQLForeignKey[]
): void {
    // Define patterns to find foreign keys
    const foreignKeyPatterns = [
        // Pattern for inline column references - REFERENCES table_name(column_name)
        /\b(\w+)\b\s+\w+(?:\([^)]*\))?\s+(?:NOT\s+NULL\s+)?(?:REFERENCES)\s+["'`]?(\w+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)/gi,

        // Pattern: FOREIGN KEY (column_name) REFERENCES table_name(column_name)
        /FOREIGN\s+KEY\s*\(\s*["'`]?(\w+)["'`]?\s*\)\s+REFERENCES\s+["'`]?(\w+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)/gi,

        // Pattern for quoted column names with optional ON DELETE/UPDATE clauses
        /["'`](\w+)["'`]\s+\w+(?:\([^)]*\))?\s+(?:NOT\s+NULL\s+)?REFERENCES\s+["'`]?(\w+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)(?:\s+ON\s+(?:DELETE|UPDATE)\s+[^,)]+)?/gi,
    ];

    // First pass: identify all tables
    const tableNamePattern =
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?/gi;
    let match;

    tableNamePattern.lastIndex = 0;
    while ((match = tableNamePattern.exec(sqlContent)) !== null) {
        const tableName = match[1];

        // Skip invalid table names
        if (!tableName || tableName === 'CREATE') continue;

        // Ensure the table is in our tableMap
        if (!tableMap[tableName]) {
            const tableId = getTableIdWithSchemaSupport(tableName);
            tableMap[tableName] = tableId;
        }
    }

    // Track already added relationships to avoid duplicates
    const addedRelationships = new Set<string>();

    // Second pass: find foreign keys using regex
    for (const pattern of foreignKeyPatterns) {
        pattern.lastIndex = 0;
        while ((match = pattern.exec(sqlContent)) !== null) {
            const sourceColumn = match[1];
            const targetTable = match[2];
            const targetColumn = match[3];

            // Skip if any required component is missing
            if (!sourceColumn || !targetTable || !targetColumn) continue;

            // Skip invalid column names that might be SQL keywords
            if (
                sourceColumn.toUpperCase() === 'CREATE' ||
                sourceColumn.toUpperCase() === 'FOREIGN' ||
                sourceColumn.toUpperCase() === 'KEY'
            )
                continue;

            // Find the source table by examining the CREATE TABLE statement
            const tableSection = sqlContent.substring(0, match.index);
            const lastCreateTablePos = tableSection.lastIndexOf('CREATE TABLE');

            if (lastCreateTablePos === -1) continue; // Skip if not in a CREATE TABLE

            const tableSubstring = tableSection.substring(lastCreateTablePos);
            const tableMatch =
                /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?/i.exec(
                    tableSubstring
                );

            if (!tableMatch || !tableMatch[1]) continue; // Skip if we can't determine the table

            const sourceTable = tableMatch[1];

            // Create a unique key to track this relationship
            const relationshipKey = `${sourceTable}.${sourceColumn}-${targetTable}.${targetColumn}`;

            // Skip if we've already added this relationship
            if (addedRelationships.has(relationshipKey)) continue;
            addedRelationships.add(relationshipKey);

            // Get table IDs
            const sourceTableId =
                tableMap[sourceTable] ||
                getTableIdWithSchemaSupport(sourceTable);
            const targetTableId =
                tableMap[targetTable] ||
                getTableIdWithSchemaSupport(targetTable);

            // Add the relationship
            relationships.push({
                name: `FK_${sourceTable}_${sourceColumn}_${targetTable}`,
                sourceTable,
                sourceSchema: '',
                sourceColumn,
                targetTable,
                targetSchema: '',
                targetColumn,
                sourceTableId,
                targetTableId,
            });
        }
    }

    // Look for additional foreign keys using a more specific pattern for multi-line declarations
    const multiLineFkPattern =
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?[^;]+?FOREIGN\s+KEY\s*\(\s*["'`]?(\w+)["'`]?\s*\)\s+REFERENCES\s+["'`]?(\w+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)/gi;

    multiLineFkPattern.lastIndex = 0;
    while ((match = multiLineFkPattern.exec(sqlContent)) !== null) {
        const sourceTable = match[1];
        const sourceColumn = match[2];
        const targetTable = match[3];
        const targetColumn = match[4];

        // Skip if any part is invalid
        if (!sourceTable || !sourceColumn || !targetTable || !targetColumn)
            continue;

        // Create a unique key to track this relationship
        const relationshipKey = `${sourceTable}.${sourceColumn}-${targetTable}.${targetColumn}`;

        // Skip if we've already added this relationship
        if (addedRelationships.has(relationshipKey)) continue;
        addedRelationships.add(relationshipKey);

        // Get table IDs
        const sourceTableId =
            tableMap[sourceTable] || getTableIdWithSchemaSupport(sourceTable);
        const targetTableId =
            tableMap[targetTable] || getTableIdWithSchemaSupport(targetTable);

        // Add the relationship
        relationships.push({
            name: `FK_${sourceTable}_${sourceColumn}_${targetTable}`,
            sourceTable,
            sourceSchema: '',
            sourceColumn,
            targetTable,
            targetSchema: '',
            targetColumn,
            sourceTableId,
            targetTableId,
        });
    }

    // Filter out relationships to non-existent tables
    const validRelationships = relationships.filter((rel) => {
        // Ensure source table exists
        if (!tableMap[rel.sourceTable]) {
            return false;
        }

        // Don't filter out if the column name is suspicious
        if (
            rel.sourceColumn.toUpperCase() === 'CREATE' ||
            rel.sourceColumn.toUpperCase() === 'FOREIGN' ||
            rel.sourceColumn.toUpperCase() === 'KEY'
        ) {
            return false;
        }

        return true;
    });

    // Replace the relationships array with the filtered list
    relationships.length = 0;
    validRelationships.forEach((rel) => relationships.push(rel));
}

/**
 * Adds placeholder tables for tables referenced in foreign keys that don't exist in the schema
 */
function addPlaceholderTablesForFKReferences(
    tables: SQLTable[],
    relationships: SQLForeignKey[],
    tableMap: Record<string, string>
): void {
    // Get all existing table names
    const existingTableNames = new Set(tables.map((t) => t.name));

    // Find all target tables mentioned in relationships that don't exist
    const missingTableNames = new Set<string>();

    relationships.forEach((rel) => {
        if (rel.targetTable && !existingTableNames.has(rel.targetTable)) {
            missingTableNames.add(rel.targetTable);
        }
    });

    // Add placeholder tables for missing tables
    missingTableNames.forEach((tableName) => {
        // Generate a table ID
        const tableId = getTableIdWithSchemaSupport(tableName);

        // Add to table map
        tableMap[tableName] = tableId;

        // Create minimal placeholder table with the target column as PK
        const targetColumns = new Set<string>();

        // Collect all referenced columns for this table
        relationships.forEach((rel) => {
            if (rel.targetTable === tableName) {
                targetColumns.add(rel.targetColumn);
            }
        });

        // Create columns for the placeholder table
        const columns: SQLColumn[] = Array.from(targetColumns).map(
            (colName) => ({
                name: colName,
                type: 'unknown',
                primaryKey: true, // Assume it's a primary key since it's referenced
                unique: true,
                nullable: false,
            })
        );

        // Add a generic ID column if no columns were found
        if (columns.length === 0) {
            columns.push({
                name: 'id',
                type: 'unknown',
                primaryKey: true,
                unique: true,
                nullable: false,
            });
        }

        // Add the placeholder table
        tables.push({
            id: getTableIdWithSchemaSupport(tableName),
            name: tableName,
            columns,
            indexes: [],
            order: tables.length,
            // This is a placeholder table for a missing referenced table
        });
    });
}
