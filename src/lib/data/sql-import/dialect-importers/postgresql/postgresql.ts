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

/**
 * Uses regular expressions to find foreign key relationships in PostgreSQL SQL content.
 * This is a fallback method to catch relationships that might be missed by the parser.
 */
function findForeignKeysUsingRegex(
    sqlContent: string,
    tableMap: Record<string, string>,
    relationships: SQLForeignKey[]
): void {
    // Track already added relationships to avoid duplicates
    const addedRelationships = new Set<string>();

    // Build a set of existing relationships to avoid duplicates
    relationships.forEach((rel) => {
        const relationshipKey = `${rel.sourceTable}.${rel.sourceColumn}-${rel.targetTable}.${rel.targetColumn}`;
        addedRelationships.add(relationshipKey);
    });

    // Normalize SQL content: replace multiple whitespaces and newlines with single space
    // This helps handle DDL with unusual formatting like linebreaks in column definitions
    const normalizedSQL = sqlContent
        .replace(/\s+/g, ' ')
        // Replace common bracket/brace formatting issues
        .replace(/\[\s*(\d+)\s*\]/g, '[$1]')
        .replace(/\{\s*(\d+)\s*\}/g, '{$1}');

    // First extract all table names to ensure they're in the tableMap
    const tableNamePattern =
        /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?(?:\s+ONLY)?\s+(?:"?([^"\s.]+)"?\.)?["'`]?([^"'`\s.(]+)["'`]?/gi;
    let match;

    tableNamePattern.lastIndex = 0;
    while ((match = tableNamePattern.exec(normalizedSQL)) !== null) {
        const schemaName = match[1] || 'public';
        const tableName = match[2];

        // Skip invalid table names
        if (!tableName || tableName.toUpperCase() === 'CREATE') continue;

        // Ensure the table is in our tableMap
        const tableKey = `${schemaName}.${tableName}`;
        if (!tableMap[tableKey]) {
            const tableId = generateId();
            tableMap[tableKey] = tableId;
        }
    }

    // Extract original column names from CREATE TABLE statements
    const createTablePattern =
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"?([^"\s.]+)"?\.)?["'`]?([^"'`\s.(]+)["'`]?\s*\((.*?)(?:,\s*(?:CONSTRAINT|PRIMARY|UNIQUE|CHECK|FOREIGN|INDEX|EXCLUDE)\s|,\s*\);|\);)/gis;

    // Map to store column names by table
    const tableColumns: Record<string, string[]> = {};

    createTablePattern.lastIndex = 0;
    while ((match = createTablePattern.exec(normalizedSQL)) !== null) {
        const schemaName = match[1] || 'public';
        const tableName = match[2];
        const columnDefinitions = match[3];

        if (!tableName || !columnDefinitions) continue;

        const tableKey = `${schemaName}.${tableName}`;

        // Extract column names from definitions
        const columns: string[] = [];
        const columnPattern = /["'`]?(\w+)["'`]?\s+\w+/g;
        let columnMatch;

        while ((columnMatch = columnPattern.exec(columnDefinitions)) !== null) {
            if (
                columnMatch[1] &&
                !columnMatch[1].match(
                    /^(CONSTRAINT|PRIMARY|UNIQUE|CHECK|FOREIGN|KEY|INDEX|EXCLUDE)$/i
                )
            ) {
                columns.push(columnMatch[1]);
            }
        }

        tableColumns[tableKey] = columns;
    }

    // Define patterns for finding foreign keys in PostgreSQL DDL
    const foreignKeyPatterns = [
        // In-line column references pattern - more flexible for odd formatting
        /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?(?:\s+ONLY)?\s+(?:"?([^"\s.]+)"?\.)?["'`]?([^"'`\s.(]+)["'`]?.*?["'`]?(\w+)["'`]?\s+\w+(?:\([^)]*\))?\s+(?:NOT\s+NULL\s+)?REFERENCES\s+(?:"?([^"\s.]+)"?\.)?["'`]?([^"'`\s.(]+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)/gi,

        // Multi-line foreign key declarations with better support for varied formatting
        /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?(?:\s+ONLY)?\s+(?:"?([^"\s.]+)"?\.)?["'`]?([^"'`\s.(]+)["'`]?.*?FOREIGN\s+KEY\s*\(\s*["'`]?(\w+)["'`]?\s*\)\s+REFERENCES\s+(?:"?([^"\s.]+)"?\.)?["'`]?([^"'`\s.(]+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)/gi,

        // ALTER TABLE pattern with improved matching
        /ALTER\s+TABLE(?:\s+ONLY)?\s+(?:"?([^"\s.]+)"?\.)?["'`]?([^"'`\s.(]+)["'`]?\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\(\s*["'`]?(\w+)["'`]?\s*\)\s+REFERENCES\s+(?:"?([^"\s.]+)"?\.)?["'`]?([^"'`\s.(]+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)/gi,
    ];

    // Process each pattern
    for (const pattern of foreignKeyPatterns) {
        pattern.lastIndex = 0;
        while ((match = pattern.exec(normalizedSQL)) !== null) {
            const sourceSchema = match[1] || 'public';
            const sourceTable = match[2];
            const sourceColumn = match[3];
            const targetSchema = match[4] || 'public';
            const targetTable = match[5];
            const targetColumn = match[6];

            // Skip if any part is invalid
            if (!sourceTable || !sourceColumn || !targetTable || !targetColumn)
                continue;

            // Create a unique key to track this relationship
            const relationshipKey = `${sourceTable}.${sourceColumn}-${targetTable}.${targetColumn}`;

            // Skip if we've already added this relationship
            if (addedRelationships.has(relationshipKey)) continue;
            addedRelationships.add(relationshipKey);

            // Get table IDs
            const sourceTableKey = `${sourceSchema}.${sourceTable}`;
            const targetTableKey = `${targetSchema}.${targetTable}`;

            const sourceTableId = tableMap[sourceTableKey];
            const targetTableId = tableMap[targetTableKey];

            // Skip if either table ID is missing
            if (!sourceTableId || !targetTableId) continue;

            // Add the relationship
            relationships.push({
                name: `FK_${sourceTable}_${sourceColumn}_${targetTable}`,
                sourceTable,
                sourceSchema,
                sourceColumn,
                targetTable,
                targetSchema,
                targetColumn,
                sourceTableId,
                targetTableId,
            });
        }
    }

    // Special handling for CHECK constraints with REFERENCES pattern
    // This captures the cases where column definitions have CHECK constraints
    // that might interfere with FK detection
    const checkWithReferencesPattern =
        /CREATE\s+TABLE.*?["'`]?([^"'`\s.(]+)["'`]?.*?CHECK\s*\(\s*(\w+)\s+(?:IN|=|REFERENCES)\s+(?:"?([^"\s.]+)"?\.)?["'`]?([^"'`\s.(]+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)/gi;

    checkWithReferencesPattern.lastIndex = 0;
    while ((match = checkWithReferencesPattern.exec(normalizedSQL)) !== null) {
        // Extract potential FK information from CHECK constraints
        // This is a best-effort approach for particularly complex DDL
        // Only continue processing if it looks like a valid relationship
        if (match.length >= 5 && match[1] && match[2] && match[4] && match[5]) {
            // Confirm it's a potential relationship by checking the column exists
            const sourceTable = match[1];
            const sourceColumn = match[2];
            const targetSchema = match[3] || 'public';
            const targetTable = match[4];
            const targetColumn = match[5];

            const sourceTableKey = `public.${sourceTable}`;
            const tableColumnList = tableColumns[sourceTableKey] || [];

            // Only if the column actually exists in the table
            if (tableColumnList.includes(sourceColumn)) {
                // Create a unique key to track this relationship
                const relationshipKey = `${sourceTable}.${sourceColumn}-${targetTable}.${targetColumn}`;

                // Skip if we've already added this relationship
                if (addedRelationships.has(relationshipKey)) continue;
                addedRelationships.add(relationshipKey);

                // Get table IDs
                const sourceTableId = tableMap[sourceTableKey];
                const targetTableKey = `${targetSchema}.${targetTable}`;
                const targetTableId = tableMap[targetTableKey];

                // Skip if either table ID is missing
                if (!sourceTableId || !targetTableId) continue;

                // Add the relationship
                relationships.push({
                    name: `FK_${sourceTable}_${sourceColumn}_${targetTable}`,
                    sourceTable,
                    sourceSchema: 'public',
                    sourceColumn,
                    targetTable,
                    targetSchema,
                    targetColumn,
                    sourceTableId,
                    targetTableId,
                });
            }
        }
    }
}

function getDefaultValueString(
    columnDef: ColumnDefinition,
    columnName: string
): string | undefined {
    let defVal = columnDef.default_val;

    // Unwrap {type: 'default', value: ...}
    if (
        defVal &&
        typeof defVal === 'object' &&
        defVal.type === 'default' &&
        'value' in defVal
    ) {
        defVal = defVal.value;
    }

    if (defVal === undefined || defVal === null) return undefined;

    let value: string | undefined;
    console.log(`AST for column '${columnName}':`, defVal);

    switch (typeof defVal) {
        case 'string':
            value = defVal;
            break;
        case 'number':
            value = String(defVal);
            break;
        case 'boolean':
            value = defVal ? 'TRUE' : 'FALSE';
            break;
        case 'object':
            if ('value' in defVal && typeof defVal.value === 'string') {
                value = defVal.value;
            } else if ('raw' in defVal && typeof defVal.raw === 'string') {
                value = defVal.raw;
            } else if (defVal.type === 'bool') {
                value = defVal.value ? 'TRUE' : 'FALSE';
            } else if (defVal.type === 'function' && defVal.name) {
                // Handle nested structure: { name: { name: [{ value: ... }] } }
                const fnName = defVal.name;
                if (
                    fnName &&
                    typeof fnName === 'object' &&
                    Array.isArray(fnName.name) &&
                    fnName.name.length > 0 &&
                    fnName.name[0].value
                ) {
                    value = fnName.name[0].value.toUpperCase();
                } else if (typeof fnName === 'string') {
                    value = fnName.toUpperCase();
                } else {
                    value = 'UNKNOWN_FUNCTION';
                }
            } else {
                const built = buildSQLFromAST(defVal);
                console.log(
                    `buildSQLFromAST for column '${columnName}':`,
                    built
                );
                value =
                    typeof built === 'string' ? built : JSON.stringify(built);
            }
            break;
        default:
            value = undefined;
    }

    return value;
}

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
                                const rawDataType =
                                    columnDef.definition?.dataType?.toUpperCase() ||
                                    '';
                                let finalDataType = rawDataType;
                                let isSerialType = false;

                                if (rawDataType === 'SERIAL') {
                                    finalDataType = 'INTEGER';
                                    isSerialType = true;
                                } else if (rawDataType === 'BIGSERIAL') {
                                    finalDataType = 'BIGINT';
                                    isSerialType = true;
                                } else if (rawDataType === 'SMALLSERIAL') {
                                    finalDataType = 'SMALLINT';
                                    isSerialType = true;
                                }

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
                                        type: finalDataType,
                                        nullable: isSerialType
                                            ? false
                                            : columnDef.nullable?.type !==
                                              'not null',
                                        primaryKey:
                                            isPrimaryKey || isSerialType,
                                        unique: columnDef.unique === 'unique',
                                        typeArgs: getTypeArgs(
                                            columnDef.definition
                                        ),
                                        default: isSerialType
                                            ? undefined
                                            : getDefaultValueString(
                                                  columnDef,
                                                  columnName
                                              ),
                                        increment:
                                            isSerialType ||
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

        // Use regex as fallback to find additional foreign keys that the parser may have missed
        findForeignKeysUsingRegex(sqlContent, tableMap, relationships);

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
