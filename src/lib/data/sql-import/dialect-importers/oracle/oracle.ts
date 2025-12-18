import { generateId } from '@/lib/utils';
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
    ConstraintDefinition,
    CreateIndexStatement,
    AlterTableStatement,
} from './oracle-common';
import {
    parserOpts,
    extractColumnName,
    findTableWithSchemaSupport,
    normalizeOracleIdentifier,
} from './oracle-common';

/**
 * Preprocess Oracle SQL script to remove or modify parts that the parser can't handle
 */
function preprocessOracleScript(sqlContent: string): string {
    // 1. Remove Oracle-specific SET commands
    sqlContent = sqlContent.replace(
        /SET\s+(DEFINE|ECHO|FEEDBACK|HEADING|LINESIZE|PAGESIZE|SERVEROUTPUT|TERMOUT|TIMING|VERIFY)\s+\w+\s*;?/gi,
        ''
    );

    // 2. Remove WHENEVER commands
    sqlContent = sqlContent.replace(/WHENEVER\s+\w+\s+[^;]*;?/gi, '');

    // 3. Remove PROMPT commands
    sqlContent = sqlContent.replace(/PROMPT\s+[^;]*;?/gi, '');

    // 4. Remove SPOOL commands
    sqlContent = sqlContent.replace(/SPOOL\s+[^;]*;?/gi, '');

    // 5. Remove EXIT/QUIT commands
    sqlContent = sqlContent.replace(/\b(EXIT|QUIT)\b\s*;?/gi, '');

    // 6. Remove REM (remark) comments
    sqlContent = sqlContent.replace(/^REM\s+.*$/gim, '');

    // 7. Remove slash command (Oracle script delimiter)
    sqlContent = sqlContent.replace(/^\s*\/\s*$/gm, '');

    // 8. Remove PL/SQL blocks (CREATE OR REPLACE PROCEDURE/FUNCTION/PACKAGE/TRIGGER)
    sqlContent = sqlContent.replace(
        /CREATE\s+(?:OR\s+REPLACE\s+)?(?:PROCEDURE|FUNCTION|PACKAGE(?:\s+BODY)?|TRIGGER)\s+[\s\S]*?(?:END\s*;|END\s+\w+\s*;)/gi,
        ''
    );

    // 9. Remove EXECUTE IMMEDIATE and dynamic SQL
    sqlContent = sqlContent.replace(/EXECUTE\s+IMMEDIATE\s+[^;]+;/gi, '');

    // 10. Handle Oracle GENERATED ALWAYS AS IDENTITY
    sqlContent = sqlContent.replace(
        /GENERATED\s+(?:ALWAYS|BY\s+DEFAULT)\s+AS\s+IDENTITY(?:\s*\([^)]*\))?/gi,
        'AUTO_INCREMENT'
    );

    // 11. Handle Oracle sequences with NEXTVAL for default values
    sqlContent = sqlContent.replace(
        /DEFAULT\s+(\w+)\.NEXTVAL/gi,
        "DEFAULT 'sequence'"
    );

    // 12. Remove STORAGE clauses
    sqlContent = sqlContent.replace(/STORAGE\s*\([^)]*\)/gi, '');

    // 13. Remove TABLESPACE clauses
    sqlContent = sqlContent.replace(/TABLESPACE\s+\w+/gi, '');

    // 14. Remove PCTFREE, PCTUSED, INITRANS, MAXTRANS clauses
    sqlContent = sqlContent.replace(
        /\b(PCTFREE|PCTUSED|INITRANS|MAXTRANS)\s+\d+/gi,
        ''
    );

    // 15. Remove LOGGING/NOLOGGING
    sqlContent = sqlContent.replace(/\b(LOGGING|NOLOGGING)\b/gi, '');

    // 16. Remove COMPRESS/NOCOMPRESS
    sqlContent = sqlContent.replace(/\b(COMPRESS|NOCOMPRESS)(?:\s+\d+)?/gi, '');

    // 17. Remove PARALLEL clause
    sqlContent = sqlContent.replace(
        /PARALLEL\s*(?:\(\s*DEGREE\s+\d+\s*\)|\d+)?/gi,
        ''
    );

    // 18. Remove ENABLE/DISABLE keywords for constraints
    sqlContent = sqlContent.replace(
        /\b(ENABLE|DISABLE)(?:\s+VALIDATE|\s+NOVALIDATE)?\b/gi,
        ''
    );

    // 19. Remove USING INDEX clause
    sqlContent = sqlContent.replace(
        /USING\s+INDEX\s*(?:\([^)]*\)|[\w."]+)?/gi,
        ''
    );

    // 20. Handle CHECK constraints - simplify them
    sqlContent = sqlContent.replace(
        /CHECK\s*\([^)]+\)/gi,
        '/* CHECK CONSTRAINT */'
    );

    // 21. Handle Oracle-specific default functions
    sqlContent = sqlContent.replace(/DEFAULT\s+SYSDATE/gi, "DEFAULT 'sysdate'");
    sqlContent = sqlContent.replace(
        /DEFAULT\s+SYSTIMESTAMP/gi,
        "DEFAULT 'systimestamp'"
    );
    sqlContent = sqlContent.replace(
        /DEFAULT\s+SYS_GUID\(\)/gi,
        "DEFAULT 'sys_guid'"
    );
    sqlContent = sqlContent.replace(/DEFAULT\s+USER/gi, "DEFAULT 'user'");
    sqlContent = sqlContent.replace(
        /DEFAULT\s+CURRENT_TIMESTAMP/gi,
        "DEFAULT 'current_timestamp'"
    );
    sqlContent = sqlContent.replace(
        /DEFAULT\s+CURRENT_DATE/gi,
        "DEFAULT 'current_date'"
    );

    // 22. Remove LOB storage clauses
    sqlContent = sqlContent.replace(
        /LOB\s*\([^)]+\)\s*STORE\s+AS\s*(?:\([^)]*\)|[^,)]+)/gi,
        ''
    );

    // 23. Remove SUPPLEMENTAL LOG clauses
    sqlContent = sqlContent.replace(/SUPPLEMENTAL\s+LOG\s+[^;]+;?/gi, '');

    // 24. Split into individual statements
    const statements = sqlContent
        .split(';')
        .filter((stmt) => stmt.trim().length > 0);

    // Filter to keep only CREATE TABLE, CREATE INDEX, and ALTER TABLE statements
    const filteredStatements = statements.filter((stmt) => {
        const trimmedStmt = stmt.trim().toUpperCase();
        return (
            trimmedStmt.includes('CREATE TABLE') ||
            trimmedStmt.includes('CREATE UNIQUE INDEX') ||
            trimmedStmt.includes('CREATE INDEX') ||
            trimmedStmt.includes('ALTER TABLE')
        );
    });

    return filteredStatements.join(';\n') + ';';
}

/**
 * Manual parsing of ALTER TABLE ADD CONSTRAINT statements for Oracle
 */
function parseAlterTableAddConstraint(statements: string[]): SQLForeignKey[] {
    const fkData: SQLForeignKey[] = [];

    // Oracle ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY pattern
    const alterTableRegex =
        /ALTER\s+TABLE\s+"?(\w+)"?(?:\."?(\w+)"?)?\s+ADD\s+CONSTRAINT\s+"?(\w+)"?\s+FOREIGN\s+KEY\s*\("?([^")]+)"?\)\s*REFERENCES\s+"?(\w+)"?(?:\."?(\w+)"?)?\s*\("?([^")]+)"?\)/i;

    for (const stmt of statements) {
        const match = stmt.match(alterTableRegex);
        if (match) {
            const [
                ,
                sourceSchemaOrTable,
                sourceTableIfSchema,
                constraintName,
                sourceColumn,
                targetSchemaOrTable,
                targetTableIfSchema,
                targetColumn,
            ] = match;

            // Handle both schema.table and just table formats
            let sourceSchema = '';
            let sourceTable = '';
            let targetSchema = '';
            let targetTable = '';

            // If second group is empty, first group is the table name
            if (!sourceTableIfSchema) {
                sourceTable = sourceSchemaOrTable;
            } else {
                sourceSchema = sourceSchemaOrTable;
                sourceTable = sourceTableIfSchema;
            }

            if (!targetTableIfSchema) {
                targetTable = targetSchemaOrTable;
            } else {
                targetSchema = targetSchemaOrTable;
                targetTable = targetTableIfSchema;
            }

            fkData.push({
                name: normalizeOracleIdentifier(constraintName),
                sourceTable: normalizeOracleIdentifier(sourceTable),
                sourceSchema: normalizeOracleIdentifier(sourceSchema),
                sourceColumn: normalizeOracleIdentifier(sourceColumn),
                targetTable: normalizeOracleIdentifier(targetTable),
                targetSchema: normalizeOracleIdentifier(targetSchema),
                targetColumn: normalizeOracleIdentifier(targetColumn),
                sourceTableId: '', // Will be filled by linkRelationships
                targetTableId: '', // Will be filled by linkRelationships
            });
        }
    }

    return fkData;
}

/**
 * Map Oracle data type strings to normalized types
 */
function normalizeOracleDataType(dataType: string): string {
    const lowerType = dataType.toLowerCase().trim();

    switch (lowerType) {
        // Character types
        case 'varchar2':
        case 'varchar':
            return 'varchar2';
        case 'nvarchar2':
            return 'nvarchar2';
        case 'char':
            return 'char';
        case 'nchar':
            return 'nchar';
        case 'clob':
            return 'clob';
        case 'nclob':
            return 'nclob';
        case 'long':
            return 'long';

        // Numeric types
        case 'number':
        case 'numeric':
        case 'decimal':
            return 'number';
        case 'integer':
        case 'int':
            return 'integer';
        case 'smallint':
            return 'smallint';
        case 'float':
            return 'float';
        case 'binary_float':
            return 'binary_float';
        case 'binary_double':
            return 'binary_double';
        case 'real':
            return 'real';

        // Date/Time types
        case 'date':
            return 'date';
        case 'timestamp':
            return 'timestamp';
        case 'timestamp with time zone':
        case 'timestamp with local time zone':
            return 'timestamp';
        case 'interval year to month':
        case 'interval day to second':
            return 'interval';

        // Binary types
        case 'blob':
            return 'blob';
        case 'raw':
            return 'raw';
        case 'long raw':
            return 'long raw';
        case 'bfile':
            return 'bfile';

        // Other types
        case 'rowid':
            return 'rowid';
        case 'urowid':
            return 'urowid';
        case 'xmltype':
            return 'xmltype';
        case 'json':
            return 'json';
        case 'boolean':
            return 'boolean';

        default:
            return dataType;
    }
}

/**
 * Manual parsing of CREATE TABLE statements when node-sql-parser fails
 */
function parseCreateTableManually(
    statement: string,
    tables: SQLTable[],
    tableMap: Record<string, string>,
    relationships: SQLForeignKey[]
): void {
    // Extract table name and schema (handling quoted identifiers)
    const tableMatch = statement.match(
        /CREATE\s+TABLE\s+"?(\w+)"?(?:\."?(\w+)"?)?\s*\(/i
    );
    if (!tableMatch) return;

    let schema = '';
    let tableName = '';

    // If we have two captures, first is schema, second is table
    if (tableMatch[2]) {
        schema = normalizeOracleIdentifier(tableMatch[1]);
        tableName = normalizeOracleIdentifier(tableMatch[2]);
    } else {
        tableName = normalizeOracleIdentifier(tableMatch[1]);
    }

    // Generate table ID
    const tableId = generateId();
    const tableKey = schema ? `${schema}.${tableName}` : tableName;
    tableMap[tableKey] = tableId;
    tableMap[tableName] = tableId; // Also map by table name only

    // Extract column definitions
    const columns: SQLColumn[] = [];
    const indexes: SQLIndex[] = [];

    // Find the content between the parentheses
    const tableContentMatch = statement.match(
        /CREATE\s+TABLE\s+[^(]+\(([\s\S]*)\)\s*(?:TABLESPACE|STORAGE|PCTFREE|$)/i
    );
    if (!tableContentMatch) return;

    const tableContent = tableContentMatch[1];

    // Split table content by commas but not within parentheses
    const parts = [];
    let current = '';
    let parenDepth = 0;

    for (let i = 0; i < tableContent.length; i++) {
        const char = tableContent[i];
        if (char === '(') parenDepth++;
        else if (char === ')') parenDepth--;
        else if (char === ',' && parenDepth === 0) {
            parts.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    if (current.trim()) parts.push(current.trim());

    // Process each part (column or constraint)
    for (const part of parts) {
        // Handle standalone FOREIGN KEY definitions (without CONSTRAINT keyword)
        if (part.match(/^\s*FOREIGN\s+KEY/i)) {
            const fkMatch = part.match(
                /FOREIGN\s+KEY\s*\("?([^")]+)"?\)\s+REFERENCES\s+"?(\w+)"?(?:\."?(\w+)"?)?\s*\("?([^")]+)"?\)/i
            );
            if (fkMatch) {
                const [
                    ,
                    sourceCol,
                    targetSchemaOrTable,
                    targetTableIfSchema,
                    targetCol,
                ] = fkMatch;
                relationships.push({
                    name: `FK_${tableName}_${normalizeOracleIdentifier(sourceCol)}`,
                    sourceTable: tableName,
                    sourceSchema: schema,
                    sourceColumn: normalizeOracleIdentifier(sourceCol),
                    targetTable: normalizeOracleIdentifier(
                        targetTableIfSchema || targetSchemaOrTable
                    ),
                    targetSchema: targetTableIfSchema
                        ? normalizeOracleIdentifier(targetSchemaOrTable)
                        : '',
                    targetColumn: normalizeOracleIdentifier(targetCol),
                    sourceTableId: tableId,
                    targetTableId: '', // Will be filled later
                });
            }
            continue;
        }

        // Handle standalone PRIMARY KEY definitions
        if (part.match(/^\s*PRIMARY\s+KEY/i)) {
            const pkColumnsMatch = part.match(
                /PRIMARY\s+KEY\s*\(([\s\S]+?)\)/i
            );
            if (pkColumnsMatch) {
                const pkColumns = pkColumnsMatch[1]
                    .split(',')
                    .map((c) => normalizeOracleIdentifier(c.trim()));
                const isSingleColumnPK = pkColumns.length === 1;
                pkColumns.forEach((col) => {
                    const column = columns.find(
                        (c) => c.name.toUpperCase() === col.toUpperCase()
                    );
                    if (column) {
                        column.primaryKey = true;
                        // Only mark as unique if single-column PK
                        if (isSingleColumnPK) {
                            column.unique = true;
                        }
                    }
                });
            }
            continue;
        }

        // Handle constraint definitions
        if (part.match(/^\s*CONSTRAINT/i)) {
            const constraintMatch = part.match(
                /CONSTRAINT\s+"?(\w+)"?\s+(PRIMARY\s+KEY|UNIQUE|FOREIGN\s+KEY)/i
            );
            if (constraintMatch) {
                const [, constraintName, constraintType] = constraintMatch;

                if (constraintType.match(/PRIMARY\s+KEY/i)) {
                    // Extract columns from PRIMARY KEY constraint
                    const pkColumnsMatch = part.match(
                        /PRIMARY\s+KEY\s*\(([\s\S]+?)\)/i
                    );
                    if (pkColumnsMatch) {
                        const pkColumns = pkColumnsMatch[1]
                            .split(',')
                            .map((c) => normalizeOracleIdentifier(c.trim()));
                        const isSingleColumnPK = pkColumns.length === 1;
                        pkColumns.forEach((col) => {
                            const column = columns.find(
                                (c) =>
                                    c.name.toUpperCase() === col.toUpperCase()
                            );
                            if (column) {
                                column.primaryKey = true;
                                // Only mark as unique if single-column PK
                                if (isSingleColumnPK) {
                                    column.unique = true;
                                }
                            }
                        });
                    }
                } else if (constraintType === 'UNIQUE') {
                    // Extract columns from UNIQUE constraint
                    const uniqueColumnsMatch = part.match(
                        /UNIQUE\s*\(([\s\S]+?)\)/i
                    );
                    if (uniqueColumnsMatch) {
                        const uniqueColumns = uniqueColumnsMatch[1]
                            .split(',')
                            .map((c) => normalizeOracleIdentifier(c.trim()));
                        indexes.push({
                            name: normalizeOracleIdentifier(constraintName),
                            columns: uniqueColumns,
                            unique: true,
                        });
                    }
                } else if (constraintType.match(/FOREIGN\s+KEY/i)) {
                    // Parse foreign key constraint
                    const fkMatch = part.match(
                        /FOREIGN\s+KEY\s*\("?([^")]+)"?\)\s+REFERENCES\s+"?(\w+)"?(?:\."?(\w+)"?)?\s*\("?([^")]+)"?\)/i
                    );
                    if (fkMatch) {
                        const [
                            ,
                            sourceCol,
                            targetSchemaOrTable,
                            targetTableIfSchema,
                            targetCol,
                        ] = fkMatch;
                        relationships.push({
                            name: normalizeOracleIdentifier(constraintName),
                            sourceTable: tableName,
                            sourceSchema: schema,
                            sourceColumn: normalizeOracleIdentifier(sourceCol),
                            targetTable: normalizeOracleIdentifier(
                                targetTableIfSchema || targetSchemaOrTable
                            ),
                            targetSchema: targetTableIfSchema
                                ? normalizeOracleIdentifier(targetSchemaOrTable)
                                : '',
                            targetColumn: normalizeOracleIdentifier(targetCol),
                            sourceTableId: tableId,
                            targetTableId: '', // Will be filled later
                        });
                    }
                }
            }
            continue;
        }

        // Parse column definition
        // Handle Oracle format: column_name datatype(args) [constraints]
        const columnMatch = part.match(
            /^\s*"?(\w+)"?\s+(\w+)(?:\s*\(\s*(\d+(?:\s*,\s*\d+)?)\s*\))?(.*)$/i
        );

        if (columnMatch) {
            const [, colName, baseType, typeArgs, rest] = columnMatch;

            if (
                colName &&
                !colName.match(/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)$/i)
            ) {
                // Check for inline foreign key
                const inlineFkMatch = rest?.match(
                    /REFERENCES\s+"?(\w+)"?(?:\."?(\w+)"?)?\s*\("?([^")]+)"?\)/i
                );

                if (inlineFkMatch) {
                    const [
                        ,
                        targetSchemaOrTable,
                        targetTableIfSchema,
                        targetCol,
                    ] = inlineFkMatch;
                    relationships.push({
                        name: `FK_${tableName}_${normalizeOracleIdentifier(colName)}`,
                        sourceTable: tableName,
                        sourceSchema: schema,
                        sourceColumn: normalizeOracleIdentifier(colName),
                        targetTable: normalizeOracleIdentifier(
                            targetTableIfSchema || targetSchemaOrTable
                        ),
                        targetSchema: targetTableIfSchema
                            ? normalizeOracleIdentifier(targetSchemaOrTable)
                            : '',
                        targetColumn: normalizeOracleIdentifier(targetCol),
                        sourceTableId: tableId,
                        targetTableId: '', // Will be filled later
                    });
                }

                const isPrimaryKey = !!rest?.match(/PRIMARY\s+KEY/i);
                const isNotNull = !!rest?.match(/NOT\s+NULL/i);
                const isIdentity =
                    !!rest?.match(
                        /GENERATED\s+(?:ALWAYS|BY\s+DEFAULT)\s+AS\s+IDENTITY/i
                    ) || !!rest?.match(/AUTO_INCREMENT/i);
                const isUnique = !!rest?.match(/UNIQUE/i);
                const defaultMatch = rest?.match(/DEFAULT\s+([^,\s]+)/i);

                // Parse type arguments
                let parsedTypeArgs:
                    | { length?: number; precision?: number; scale?: number }
                    | undefined;
                if (typeArgs) {
                    const args = typeArgs
                        .split(',')
                        .map((a) => parseInt(a.trim()));
                    if (args.length === 1) {
                        parsedTypeArgs = { length: args[0] };
                    } else if (args.length >= 2) {
                        parsedTypeArgs = { precision: args[0], scale: args[1] };
                    }
                }

                const column: SQLColumn = {
                    name: normalizeOracleIdentifier(colName),
                    type: normalizeOracleDataType(baseType.trim()),
                    nullable: !isNotNull && !isPrimaryKey,
                    primaryKey: isPrimaryKey,
                    unique: isUnique,
                    increment: isIdentity,
                    default: defaultMatch ? defaultMatch[1].trim() : undefined,
                };

                if (parsedTypeArgs) {
                    column.typeArgs = parsedTypeArgs;
                }

                columns.push(column);
            }
        }
    }

    // Add the table
    tables.push({
        id: tableId,
        name: tableName,
        schema: schema || undefined,
        columns,
        indexes,
        order: tables.length,
    });
}

/**
 * Parse Oracle DDL scripts and extract database structure
 * @param sqlContent Oracle DDL content as string
 * @returns Parsed structure including tables, columns, and relationships
 */
export async function fromOracle(sqlContent: string): Promise<SQLParserResult> {
    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {}; // Maps table name to its ID

    try {
        // First, split by semicolon for Oracle
        const statements = sqlContent
            .split(';')
            .filter((stmt) => stmt.trim().length > 0);

        // Handle ALTER TABLE statements for foreign keys
        const alterTableStatements = statements.filter(
            (stmt) =>
                stmt.trim().toUpperCase().includes('ALTER TABLE') &&
                stmt.toUpperCase().includes('FOREIGN KEY')
        );

        if (alterTableStatements.length > 0) {
            const fkData = parseAlterTableAddConstraint(alterTableStatements);
            relationships.push(...fkData);
        }

        // Parse CREATE TABLE statements manually first
        const createTableStatements = statements.filter((stmt) =>
            stmt.trim().toUpperCase().includes('CREATE TABLE')
        );

        for (const stmt of createTableStatements) {
            parseCreateTableManually(stmt, tables, tableMap, relationships);
        }

        // Preprocess the SQL content for node-sql-parser
        const preprocessedSQL = preprocessOracleScript(sqlContent);

        // Try to use node-sql-parser for additional parsing
        try {
            const { Parser } = await import('node-sql-parser');
            const parser = new Parser();
            let ast;
            try {
                ast = parser.astify(preprocessedSQL, parserOpts);
            } catch {
                // Fallback: Try to parse each statement individually
                const stmts = preprocessedSQL
                    .split(';')
                    .filter((stmt) => stmt.trim().length > 0);
                ast = [];

                for (const stmt of stmts) {
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

            if (Array.isArray(ast) && ast.length > 0) {
                // Process each statement
                (ast as unknown as SQLASTNode[]).forEach((stmt) => {
                    // Process CREATE INDEX statements
                    if (stmt.type === 'create' && stmt.keyword === 'index') {
                        processCreateIndex(
                            stmt as CreateIndexStatement,
                            tables
                        );
                    }
                    // Process ALTER TABLE statements for non-FK constraints
                    else if (
                        stmt.type === 'alter' &&
                        stmt.keyword === 'table'
                    ) {
                        processAlterTable(
                            stmt as AlterTableStatement,
                            tables,
                            relationships
                        );
                    }
                });
            }
        } catch (parserError) {
            // If parser fails completely, continue with manual parsing results
            console.warn(
                'node-sql-parser failed, using manual parsing only:',
                parserError
            );
        }

        // Parse CREATE INDEX statements manually
        const createIndexStatements = statements.filter(
            (stmt) =>
                stmt.trim().toUpperCase().includes('CREATE') &&
                stmt.trim().toUpperCase().includes('INDEX') &&
                !stmt.trim().toUpperCase().includes('CREATE TABLE')
        );

        for (const stmt of createIndexStatements) {
            // Handle both schema-qualified and non-qualified index names
            // Format: CREATE [UNIQUE] INDEX [schema.]index_name ON [schema.]table_name(columns)
            const indexMatch = stmt.match(
                /CREATE\s+(UNIQUE\s+)?INDEX\s+(?:"?(\w+)"?\.)?"?(\w+)"?\s+ON\s+"?(\w+)"?(?:\."?(\w+)"?)?\s*\(([^)]+)\)/i
            );
            if (indexMatch) {
                const [
                    ,
                    unique,
                    ,
                    indexName,
                    schemaOrTable,
                    tableIfSchema,
                    columnsStr,
                ] = indexMatch;

                const targetTable = tableIfSchema || schemaOrTable;
                const targetSchema = tableIfSchema ? schemaOrTable : '';

                const table = tables.find(
                    (t) =>
                        t.name.toUpperCase() === targetTable.toUpperCase() &&
                        (!targetSchema ||
                            t.schema?.toUpperCase() ===
                                targetSchema.toUpperCase())
                );

                if (table) {
                    const columns = columnsStr
                        .split(',')
                        .map((c) => normalizeOracleIdentifier(c.trim()));

                    // Check if this index already exists
                    const existingIndex = table.indexes.find(
                        (i) =>
                            i.name.toUpperCase() ===
                            normalizeOracleIdentifier(indexName).toUpperCase()
                    );
                    if (!existingIndex) {
                        table.indexes.push({
                            name: normalizeOracleIdentifier(indexName),
                            columns,
                            unique: !!unique,
                        });
                    }
                }
            }
        }

        // Link relationships to ensure all targetTableId and sourceTableId fields are filled
        const validRelationships = linkRelationships(
            tables,
            relationships,
            tableMap
        );

        // Sort tables by order
        const sortedTables = [...tables];
        sortedTables.sort((a, b) => a.order - b.order);

        return {
            tables: sortedTables,
            relationships: validRelationships,
        };
    } catch (error) {
        console.error('Error parsing Oracle DDL:', error);
        throw new Error(`Error parsing Oracle DDL: ${error}`);
    }
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
        if (Array.isArray(stmt.table) && stmt.table.length > 0) {
            const tableObj = stmt.table[0];
            tableName = tableObj.table || '';
            schemaName = tableObj.schema || tableObj.db || '';
        } else {
            const tableObj = stmt.table as TableReference;
            tableName = tableObj.table || '';
            schemaName = tableObj.schema || tableObj.db || '';
        }
    }

    if (!tableName) {
        return;
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

    // Add index to the table if it doesn't already exist
    const tableObj = tables.find((t) => t.id === table.id);
    if (tableObj) {
        const existingIndex = tableObj.indexes.find(
            (i) => i.name.toUpperCase() === indexName.toUpperCase()
        );
        if (!existingIndex) {
            tableObj.indexes.push({
                name: indexName,
                columns: indexColumns,
                unique: isUnique,
            });
        }
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
        if (Array.isArray(stmt.table) && stmt.table.length > 0) {
            const tableObj = stmt.table[0];
            tableName = tableObj.table || '';
            schemaName = tableObj.schema || tableObj.db || '';
        } else {
            const tableObj = stmt.table as TableReference;
            tableName = tableObj.table || '';
            schemaName = tableObj.schema || tableObj.db || '';
        }
    }

    if (!tableName) {
        return;
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
                        targetTable.schema || targetTable.db || '';

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
                            (sourceColDef as { type: string }).type ===
                                'column_ref'
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
                        // Check if this relationship already exists
                        const existingRel = relationships.find(
                            (r) =>
                                r.sourceTable.toUpperCase() ===
                                    tableName.toUpperCase() &&
                                r.sourceColumn.toUpperCase() ===
                                    sourceColumnName.toUpperCase() &&
                                r.targetTable.toUpperCase() ===
                                    targetTableName.toUpperCase()
                        );

                        if (!existingRel) {
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
        normalizedTableMap[key.toUpperCase()] = id;

        // Also add without schema for fallback
        if (key.includes('.')) {
            const tableName = key.split('.')[1];
            normalizedTableMap[tableName.toUpperCase()] = id;
        }
    }

    // Add all tables to the normalized map
    for (const table of tables) {
        if (table.schema) {
            const tableKey = `${table.schema}.${table.name}`;
            normalizedTableMap[tableKey.toUpperCase()] = table.id;
        }
        normalizedTableMap[table.name.toUpperCase()] = table.id;
    }

    // Process all relationships
    const validRelationships = relationships.filter((rel) => {
        // Normalize keys for lookup
        const sourceTableKey = rel.sourceSchema
            ? `${rel.sourceSchema}.${rel.sourceTable}`
            : rel.sourceTable;
        const targetTableKey = rel.targetSchema
            ? `${rel.targetSchema}.${rel.targetTable}`
            : rel.targetTable;

        // Get the source table ID if it's not already set
        if (!rel.sourceTableId || rel.sourceTableId === '') {
            const sourceId =
                normalizedTableMap[sourceTableKey.toUpperCase()] ||
                normalizedTableMap[rel.sourceTable.toUpperCase()];

            if (sourceId) {
                rel.sourceTableId = sourceId;
            } else {
                return false;
            }
        }

        // Get the target table ID
        if (!rel.targetTableId || rel.targetTableId === '') {
            const targetId =
                normalizedTableMap[targetTableKey.toUpperCase()] ||
                normalizedTableMap[rel.targetTable.toUpperCase()];

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

/**
 * Detect if SQL content is from Oracle format
 * @param sqlContent SQL content as string
 * @returns boolean indicating if the SQL is likely from Oracle
 */
export function isOracleFormat(sqlContent: string): boolean {
    const oracleMarkers = [
        'VARCHAR2',
        'NUMBER(',
        'SYSDATE',
        'SYSTIMESTAMP',
        'SYS_GUID',
        'GENERATED ALWAYS AS IDENTITY',
        'GENERATED BY DEFAULT AS IDENTITY',
        '.NEXTVAL',
        'TABLESPACE',
        'PCTFREE',
        'STORAGE (',
        'NVARCHAR2',
        'CLOB',
        'NCLOB',
        'BLOB',
        'BFILE',
        'BINARY_FLOAT',
        'BINARY_DOUBLE',
        'ROWID',
        'XMLTYPE',
        'CREATE SEQUENCE',
        'CREATE OR REPLACE',
        'CONSTRAINT .* PRIMARY KEY.*ENABLE',
    ];

    // Check for specific Oracle patterns
    for (const marker of oracleMarkers) {
        if (marker.includes('.*')) {
            // Handle regex patterns
            const regex = new RegExp(marker, 'i');
            if (regex.test(sqlContent)) {
                return true;
            }
        } else if (sqlContent.toUpperCase().includes(marker.toUpperCase())) {
            return true;
        }
    }

    return false;
}
