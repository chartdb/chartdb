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
} from './sqlserver-common';
import {
    parserOpts,
    extractColumnName,
    findTableWithSchemaSupport,
} from './sqlserver-common';

/**
 * Preprocess SQL Server script to remove or modify parts that the parser can't handle
 */
function preprocessSQLServerScript(sqlContent: string): string {
    // 1. Remove USE statements
    sqlContent = sqlContent.replace(/USE\s+\[[^\]]+\]\s*;?/gi, '');

    // 2. Remove SET statements
    sqlContent = sqlContent.replace(/SET\s+\w+\s+\w+\s*;?/gi, '');

    // 3. Remove GO statements (batch separators)
    sqlContent = sqlContent.replace(/\bGO\b/gi, ';');

    // 4. Remove CREATE SCHEMA statements
    sqlContent = sqlContent.replace(/CREATE\s+SCHEMA\s+\[[^\]]+\]\s*;?/gi, '');

    // 5. Remove IF NOT EXISTS ... BEGIN ... END blocks
    sqlContent = sqlContent.replace(
        /IF\s+NOT\s+EXISTS\s*\([^)]+\)\s*BEGIN\s+[^;]+;\s*END;?/gi,
        ''
    );

    // 6. Remove any EXEC statements
    sqlContent = sqlContent.replace(/EXEC\s*\([^)]+\)\s*;?/gi, '');
    sqlContent = sqlContent.replace(/EXEC\s+[^;]+;/gi, '');

    // 7. Replace any remaining procedural code blocks
    sqlContent = sqlContent.replace(
        /BEGIN\s+TRANSACTION|COMMIT\s+TRANSACTION|ROLLBACK\s+TRANSACTION/gi,
        '-- $&'
    );

    // 8. Remove square brackets (SQL Server specific)
    sqlContent = sqlContent.replace(/\[/g, '');
    sqlContent = sqlContent.replace(/\]/g, '');

    // 9. Remove ON PRIMARY and TEXTIMAGE_ON PRIMARY clauses
    sqlContent = sqlContent.replace(
        /ON\s+PRIMARY(\s+TEXTIMAGE_ON\s+PRIMARY)?/gi,
        ''
    );

    // 10. Remove WITH options from constraints
    sqlContent = sqlContent.replace(/WITH\s*\([^)]+\)/gi, '');

    // 11. Handle default value expressions with functions
    sqlContent = sqlContent.replace(/DEFAULT\s+NEWID\(\)/gi, "DEFAULT 'newid'");
    sqlContent = sqlContent.replace(
        /DEFAULT\s+NEWSEQUENTIALID\(\)/gi,
        "DEFAULT 'newsequentialid'"
    );
    sqlContent = sqlContent.replace(
        /DEFAULT\s+GETDATE\(\)/gi,
        "DEFAULT 'getdate'"
    );
    sqlContent = sqlContent.replace(
        /DEFAULT\s+SYSDATETIME\(\)/gi,
        "DEFAULT 'sysdatetime'"
    );
    // Don't replace numeric defaults or simple values
    sqlContent = sqlContent.replace(/DEFAULT\s+'\([^)]+\)'/gi, "DEFAULT '0'");
    // Only replace function calls in DEFAULT, not numeric literals
    sqlContent = sqlContent.replace(
        /DEFAULT\s+(\w+)\s*\([^)]*\)/gi,
        "DEFAULT '0'"
    );

    // 12. Replace SQL Server specific data types with standard types
    // Note: We preserve varchar(max) and nvarchar(max) for accurate export
    sqlContent = sqlContent.replace(/\buniqueid\b/gi, 'uniqueidentifier'); // Fix common typo
    sqlContent = sqlContent.replace(
        /\bdatetime2\s*\(\s*\d+\s*\)/gi,
        'datetime2'
    );
    sqlContent = sqlContent.replace(/\btime\s*\(\s*\d+\s*\)/gi, 'time');
    sqlContent = sqlContent.replace(
        /\bdatetimeoffset\s*\(\s*\d+\s*\)/gi,
        'datetimeoffset'
    );

    // 13. Handle IDENTITY columns - convert to a simpler format
    sqlContent = sqlContent.replace(
        /IDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)/gi,
        'AUTO_INCREMENT'
    );
    sqlContent = sqlContent.replace(/IDENTITY/gi, 'AUTO_INCREMENT');

    // 14. Replace CHECK constraints with comments (parser doesn't handle well)
    sqlContent = sqlContent.replace(
        /CHECK\s*\([^)]+\)/gi,
        '/* CHECK CONSTRAINT */'
    );

    // 15. Handle FOREIGN KEY constraints within CREATE TABLE
    // Convert inline foreign key syntax to be more parser-friendly
    sqlContent = sqlContent.replace(
        /(\w+)\s+(\w+(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?)\s+(?:NOT\s+NULL\s+)?FOREIGN\s+KEY\s+REFERENCES\s+(\w+)\.?(\w+)\s*\((\w+)\)/gi,
        '$1 $2 /* FK TO $3.$4($5) */'
    );

    // Handle standalone FOREIGN KEY constraints
    sqlContent = sqlContent.replace(
        /CONSTRAINT\s+(\w+)\s+FOREIGN\s+KEY\s*\((\w+)\)\s+REFERENCES\s+(\w+)\.?(\w+)?\s*\((\w+)\)(?:\s+ON\s+DELETE\s+(\w+))?(?:\s+ON\s+UPDATE\s+(\w+))?/gi,
        '/* CONSTRAINT $1 FK($2) REF $3.$4($5) */'
    );

    // 16. Split into individual statements to handle them separately
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
 * Manual parsing of ALTER TABLE ADD CONSTRAINT statements
 * This is a fallback for when the node-sql-parser fails to properly parse the constraints
 */
function parseAlterTableAddConstraint(statements: string[]): SQLForeignKey[] {
    const fkData: SQLForeignKey[] = [];

    // Regular expressions to extract information from ALTER TABLE statements
    // Handle multi-line ALTER TABLE statements
    const alterTableRegex =
        /ALTER\s+TABLE\s+\[?([^\]]*)\]?\.?\[?([^\]]*)\]?\s+(?:WITH\s+CHECK\s+)?ADD\s+CONSTRAINT\s+\[?([^\]]*)\]?\s+FOREIGN\s+KEY\s*\(\[?([^\]]*)\]?\)\s*REFERENCES\s+\[?([^\]]*)\]?\.?\[?([^\]]*)\]?\s*\(\[?([^\]]*)\]?\)/is;

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
            let sourceSchema = 'dbo';
            let sourceTable = '';
            let targetSchema = 'dbo';
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
                name: constraintName,
                sourceTable: sourceTable,
                sourceSchema: sourceSchema,
                sourceColumn: sourceColumn,
                targetTable: targetTable,
                targetSchema: targetSchema,
                targetColumn: targetColumn,
                sourceTableId: '', // Will be filled by linkRelationships
                targetTableId: '', // Will be filled by linkRelationships
            });
        }
    }

    return fkData;
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
 * Manual parsing of CREATE TABLE statements when node-sql-parser fails
 */
function parseCreateTableManually(
    statement: string,
    tables: SQLTable[],
    tableMap: Record<string, string>,
    relationships: SQLForeignKey[]
): void {
    // Extract table name and schema (handling square brackets)
    const tableMatch = statement.match(
        /CREATE\s+TABLE\s+(?:\[?(\w+)\]?\.)??\[?(\w+)\]?\s*\(/i
    );
    if (!tableMatch) return;

    const [, schema = 'dbo', tableName] = tableMatch;

    // Generate table ID
    const tableId = generateId();
    const tableKey = `${schema}.${tableName}`;
    tableMap[tableKey] = tableId;

    // Extract column definitions
    const columns: SQLColumn[] = [];
    const indexes: SQLIndex[] = [];

    // Find the content between the parentheses
    const tableContentMatch = statement.match(
        /CREATE\s+TABLE\s+[^(]+\(([\s\S]*)\)\s*(?:ON\s+|$)/i
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
        // Format: FOREIGN KEY (column) REFERENCES Table(column)
        if (part.match(/^\s*FOREIGN\s+KEY/i)) {
            const fkMatch = part.match(
                /FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(?:\[?(\w+)\]?\.)??\[?(\w+)\]?\s*\(([^)]+)\)/i
            );
            if (fkMatch) {
                const [
                    ,
                    sourceCol,
                    targetSchema = 'dbo',
                    targetTable,
                    targetCol,
                ] = fkMatch;
                relationships.push({
                    name: `FK_${tableName}_${sourceCol.trim().replace(/\[|\]/g, '')}`,
                    sourceTable: tableName,
                    sourceSchema: schema,
                    sourceColumn: sourceCol.trim().replace(/\[|\]/g, ''),
                    targetTable: targetTable || targetSchema,
                    targetSchema: targetTable ? targetSchema : 'dbo',
                    targetColumn: targetCol.trim().replace(/\[|\]/g, ''),
                    sourceTableId: tableId,
                    targetTableId: '', // Will be filled later
                });
            }
            continue;
        }

        // Handle standalone PRIMARY KEY definitions (without CONSTRAINT keyword)
        // Format: PRIMARY KEY (column1, column2, ...)
        if (part.match(/^\s*PRIMARY\s+KEY/i)) {
            const pkColumnsMatch = part.match(
                /PRIMARY\s+KEY(?:\s+CLUSTERED)?\s*\(([\s\S]+?)\)/i
            );
            if (pkColumnsMatch) {
                const pkColumns = pkColumnsMatch[1].split(',').map((c) =>
                    c
                        .trim()
                        .replace(/\[|\]|\s+(ASC|DESC)/gi, '')
                        .trim()
                );
                const isSingleColumnPK = pkColumns.length === 1;
                pkColumns.forEach((col) => {
                    const column = columns.find((c) => c.name === col);
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
            // Parse constraints
            const constraintMatch = part.match(
                /CONSTRAINT\s+\[?(\w+)\]?\s+(PRIMARY\s+KEY|UNIQUE|FOREIGN\s+KEY)/i
            );
            if (constraintMatch) {
                const [, constraintName, constraintType] = constraintMatch;

                if (constraintType.match(/PRIMARY\s+KEY/i)) {
                    // Extract columns from PRIMARY KEY constraint - handle multi-line format
                    const pkColumnsMatch = part.match(
                        /PRIMARY\s+KEY(?:\s+CLUSTERED)?\s*\(([\s\S]+?)\)/i
                    );
                    if (pkColumnsMatch) {
                        const pkColumns = pkColumnsMatch[1]
                            .split(',')
                            .map((c) =>
                                c
                                    .trim()
                                    .replace(/\[|\]|\s+(ASC|DESC)/gi, '')
                                    .trim()
                            );
                        const isSingleColumnPK = pkColumns.length === 1;
                        pkColumns.forEach((col) => {
                            const column = columns.find((c) => c.name === col);
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
                        /UNIQUE(?:\s+NONCLUSTERED)?\s*\(([\s\S]+?)\)/i
                    );
                    if (uniqueColumnsMatch) {
                        const uniqueColumns = uniqueColumnsMatch[1]
                            .split(',')
                            .map((c) =>
                                c
                                    .trim()
                                    .replace(/\[|\]|\s+(ASC|DESC)/gi, '')
                                    .trim()
                            );
                        indexes.push({
                            name: constraintName,
                            columns: uniqueColumns,
                            unique: true,
                        });
                    }
                } else if (constraintType.match(/FOREIGN\s+KEY/i)) {
                    // Parse foreign key constraint
                    const fkMatch = part.match(
                        /FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(?:\[?(\w+)\]?\.)??\[?(\w+)\]?\s*\(([^)]+)\)/i
                    );
                    if (fkMatch) {
                        const [
                            ,
                            sourceCol,
                            targetSchema = 'dbo',
                            targetTable,
                            targetCol,
                        ] = fkMatch;
                        relationships.push({
                            name: constraintName,
                            sourceTable: tableName,
                            sourceSchema: schema,
                            sourceColumn: sourceCol
                                .trim()
                                .replace(/\[|\]/g, ''),
                            targetTable: targetTable,
                            targetSchema: targetSchema,
                            targetColumn: targetCol
                                .trim()
                                .replace(/\[|\]/g, ''),
                            sourceTableId: tableId,
                            targetTableId: '', // Will be filled later
                        });
                    }
                }
            }
            continue;
        }

        // Parse column definition - handle both numeric args and 'max'
        // Handle brackets around column names and types
        let columnMatch = part.match(
            /^\s*\[?(\w+)\]?\s+\[?(\w+)\]?(?:\s*\(\s*([\d,\s]+|max)\s*\))?(.*)$/i
        );

        // If no match, try pattern for preprocessed types without parentheses
        if (!columnMatch) {
            columnMatch = part.match(/^\s*(\w+)\s+(\w+)\s+([\d,\s]+)\s+(.*)$/i);
        }

        // Handle unusual format: [COLUMN_NAME] (VARCHAR)(32)
        if (!columnMatch) {
            columnMatch = part.match(
                /^\s*\[?(\w+)\]?\s+\((\w+)\)\s*\(([\d,\s]+|max)\)(.*)$/i
            );
        }

        if (columnMatch) {
            const [, colName, baseType, typeArgs, rest] = columnMatch;

            if (
                colName &&
                !colName.match(/^(PRIMARY|FOREIGN|UNIQUE|CHECK)$/i)
            ) {
                // Check for inline foreign key
                const inlineFkMatch = rest.match(
                    /FOREIGN\s+KEY\s+REFERENCES\s+(?:\[?(\w+)\]?\.)??\[?(\w+)\]?\s*\(([^)]+)\)/i
                );

                // Also check if there's a FOREIGN KEY after a comma with column name
                // Format: , FOREIGN KEY (columnname) REFERENCES Table(column)
                if (!inlineFkMatch && rest.includes('FOREIGN KEY')) {
                    const fkWithColumnMatch = rest.match(
                        /,\s*FOREIGN\s+KEY\s*\((\w+)\)\s+REFERENCES\s+(?:\[?(\w+)\]?\.)??\[?(\w+)\]?\s*\(([^)]+)\)/i
                    );
                    if (fkWithColumnMatch) {
                        const [, srcCol, targetSchema, targetTable, targetCol] =
                            fkWithColumnMatch;
                        // Only process if srcCol matches current colName (case-insensitive)
                        if (srcCol.toLowerCase() === colName.toLowerCase()) {
                            // Create FK relationship
                            relationships.push({
                                name: `FK_${tableName}_${colName}`,
                                sourceTable: tableName,
                                sourceSchema: schema,
                                sourceColumn: colName,
                                targetTable: targetTable || targetSchema,
                                targetSchema: targetTable
                                    ? targetSchema || 'dbo'
                                    : 'dbo',
                                targetColumn: targetCol
                                    .trim()
                                    .replace(/\[|\]/g, ''),
                                sourceTableId: tableId,
                                targetTableId: '', // Will be filled later
                            });
                        }
                    }
                } else if (inlineFkMatch) {
                    const [, targetSchema = 'dbo', targetTable, targetCol] =
                        inlineFkMatch;
                    relationships.push({
                        name: `FK_${tableName}_${colName}`,
                        sourceTable: tableName,
                        sourceSchema: schema,
                        sourceColumn: colName,
                        targetTable: targetTable,
                        targetSchema: targetSchema,
                        targetColumn: targetCol.trim().replace(/\[|\]/g, ''),
                        sourceTableId: tableId,
                        targetTableId: '', // Will be filled later
                    });
                }

                const isPrimaryKey = !!rest.match(/PRIMARY\s+KEY/i);
                const isNotNull = !!rest.match(/NOT\s+NULL/i);
                const isIdentity = !!rest.match(
                    /IDENTITY(?:\s*\(\s*\d+\s*,\s*\d+\s*\))?/i
                );
                const isUnique = !!rest.match(/UNIQUE/i);
                const defaultMatch = rest.match(/DEFAULT\s+([^,]+)/i);

                // Parse type arguments
                let parsedTypeArgs: number[] | string | undefined;
                if (typeArgs) {
                    if (typeArgs.toLowerCase() === 'max') {
                        // Preserve 'max' keyword for varchar/nvarchar types
                        parsedTypeArgs = 'max';
                    } else {
                        // Parse numeric args
                        parsedTypeArgs = typeArgs
                            .split(',')
                            .map((arg) => parseInt(arg.trim()));
                    }
                }

                const column: SQLColumn = {
                    name: colName,
                    type: normalizeSQLServerDataType(baseType.trim()),
                    nullable: !isNotNull && !isPrimaryKey,
                    primaryKey: isPrimaryKey,
                    unique: isUnique,
                    increment: isIdentity,
                    default: defaultMatch ? defaultMatch[1].trim() : undefined,
                };

                // Add type arguments if present
                if (parsedTypeArgs) {
                    if (typeof parsedTypeArgs === 'string') {
                        // For 'max' keyword
                        column.typeArgs = parsedTypeArgs;
                    } else if (parsedTypeArgs.length > 0) {
                        // For numeric arguments
                        column.typeArgs = parsedTypeArgs;
                    }
                }

                columns.push(column);
            }
        }
    }

    // Add the table
    tables.push({
        id: tableId,
        name: tableName,
        schema: schema,
        columns,
        indexes,
        order: tables.length,
    });
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
        // First, handle ALTER TABLE statements for foreign keys
        // Split by GO or semicolon for SQL Server
        let statements = sqlContent
            .split(/(?:GO\s*$|;\s*$)/im)
            .filter((stmt) => stmt.trim().length > 0);

        // Additional splitting for CREATE TABLE statements that might not be separated by semicolons
        // If we have a statement with multiple CREATE TABLE, split them
        const expandedStatements: string[] = [];
        for (const stmt of statements) {
            // Check if this statement contains multiple CREATE TABLE statements
            if ((stmt.match(/CREATE\s+TABLE/gi) || []).length > 1) {
                // Split by ") ON [PRIMARY]" followed by CREATE TABLE
                const parts = stmt.split(
                    /\)\s*ON\s*\[PRIMARY\]\s*(?=CREATE\s+TABLE)/gi
                );
                for (let i = 0; i < parts.length; i++) {
                    let part = parts[i].trim();
                    // Re-add ") ON [PRIMARY]" to all parts except the last (which should already have it)
                    if (i < parts.length - 1 && part.length > 0) {
                        part += ') ON [PRIMARY]';
                    }
                    if (part.trim().length > 0) {
                        expandedStatements.push(part);
                    }
                }
            } else {
                expandedStatements.push(stmt);
            }
        }
        statements = expandedStatements;

        const alterTableStatements = statements.filter(
            (stmt) =>
                stmt.trim().toUpperCase().includes('ALTER TABLE') &&
                stmt.includes('FOREIGN KEY')
        );

        if (alterTableStatements.length > 0) {
            const fkData = parseAlterTableAddConstraint(alterTableStatements);
            // Store foreign key relationships for later processing
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
        const preprocessedSQL = preprocessSQLServerScript(sqlContent);

        // Try to use node-sql-parser for additional parsing
        try {
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
                stmt.trim().toUpperCase().includes('INDEX')
        );

        for (const stmt of createIndexStatements) {
            const indexMatch = stmt.match(
                /CREATE\s+(UNIQUE\s+)?INDEX\s+\[?(\w+)\]?\s+ON\s+(?:\[?(\w+)\]?\.)??\[?(\w+)\]?\s*\(([^)]+)\)/i
            );
            if (indexMatch) {
                const [
                    ,
                    unique,
                    indexName,
                    schema = 'dbo',
                    tableName,
                    columnsStr,
                ] = indexMatch;
                const table = tables.find(
                    (t) => t.name === tableName && t.schema === schema
                );
                if (table) {
                    const columns = columnsStr
                        .split(',')
                        .map((c) => c.trim().replace(/\[|\]/g, ''));
                    table.indexes.push({
                        name: indexName,
                        columns,
                        unique: !!unique,
                    });
                }
            }
        }

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
