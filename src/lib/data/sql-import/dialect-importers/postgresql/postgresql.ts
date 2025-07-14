import { generateId } from '@/lib/utils';
import type {
    SQLParserResult,
    SQLTable,
    SQLColumn,
    SQLIndex,
    SQLForeignKey,
    SQLEnumType,
} from '../../common';
import type {
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

interface ParsedStatement {
    type:
        | 'table'
        | 'index'
        | 'alter'
        | 'function'
        | 'policy'
        | 'trigger'
        | 'extension'
        | 'type'
        | 'comment'
        | 'other';
    sql: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed?: any;
}

interface PreprocessResult {
    statements: ParsedStatement[];
    warnings: string[];
}

/**
 * Preprocess SQL content to separate and categorize different statement types
 */
function preprocessSQL(sqlContent: string): PreprocessResult {
    const warnings: string[] = [];
    const statements: ParsedStatement[] = [];

    // Remove all comments before any processing to avoid formatting issues
    let cleanedSQL = sqlContent;

    // Remove multi-line comments /* ... */
    cleanedSQL = cleanedSQL.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove single-line comments -- ...
    // But be careful with strings that might contain --
    const lines = cleanedSQL.split('\n');
    const cleanedLines = lines.map((line) => {
        let result = '';
        let inString = false;
        let stringChar = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1] || '';

            // Handle string boundaries
            if (!inString && (char === "'" || char === '"')) {
                inString = true;
                stringChar = char;
                result += char;
            } else if (inString && char === stringChar) {
                // Check for escaped quote
                if (nextChar === stringChar) {
                    result += char + nextChar;
                    i++; // Skip the next quote
                } else {
                    inString = false;
                    result += char;
                }
            } else if (!inString && char === '-' && nextChar === '-') {
                // Found comment start, skip rest of line
                break;
            } else {
                result += char;
            }
        }

        return result;
    });

    cleanedSQL = cleanedLines.join('\n');

    // Split by semicolons but keep track of quoted strings
    const sqlStatements = splitSQLStatements(cleanedSQL);

    for (const stmt of sqlStatements) {
        const trimmedStmt = stmt.trim();
        if (!trimmedStmt) continue;

        const upperStmt = trimmedStmt.toUpperCase();

        // Categorize statement
        if (
            upperStmt.startsWith('CREATE TABLE') ||
            upperStmt.includes('CREATE TABLE')
        ) {
            statements.push({ type: 'table', sql: trimmedStmt });
        } else if (
            upperStmt.startsWith('CREATE TYPE') ||
            upperStmt.includes('CREATE TYPE')
        ) {
            // Don't add warning for ENUM types as they are supported
            if (!upperStmt.includes('AS ENUM')) {
                warnings.push(
                    'Non-enum type definitions are not supported and will be skipped'
                );
            }
            statements.push({ type: 'type', sql: trimmedStmt });
        } else if (
            upperStmt.startsWith('CREATE INDEX') ||
            upperStmt.startsWith('CREATE UNIQUE INDEX')
        ) {
            statements.push({ type: 'index', sql: trimmedStmt });
        } else if (upperStmt.startsWith('ALTER TABLE')) {
            // Check if it's a supported ALTER TABLE statement
            if (upperStmt.includes('ENABLE ROW LEVEL SECURITY')) {
                warnings.push(
                    'Row level security statements are not supported and will be skipped'
                );
                statements.push({ type: 'other', sql: trimmedStmt });
            } else {
                statements.push({ type: 'alter', sql: trimmedStmt });
            }
        } else if (
            upperStmt.startsWith('CREATE FUNCTION') ||
            upperStmt.startsWith('CREATE OR REPLACE FUNCTION')
        ) {
            warnings.push(
                'Function definitions are not supported and will be skipped'
            );
            statements.push({ type: 'function', sql: trimmedStmt });
        } else if (upperStmt.startsWith('CREATE POLICY')) {
            warnings.push(
                'Policy definitions are not supported and will be skipped'
            );
            statements.push({ type: 'policy', sql: trimmedStmt });
        } else if (upperStmt.startsWith('CREATE TRIGGER')) {
            warnings.push(
                'Trigger definitions are not supported and will be skipped'
            );
            statements.push({ type: 'trigger', sql: trimmedStmt });
        } else if (upperStmt.startsWith('CREATE EXTENSION')) {
            warnings.push(
                'Extension statements are not supported and will be skipped'
            );
            statements.push({ type: 'extension', sql: trimmedStmt });
        } else if (
            upperStmt.startsWith('--') &&
            !upperStmt.includes('CREATE TABLE') &&
            !upperStmt.includes('CREATE TYPE')
        ) {
            statements.push({ type: 'comment', sql: trimmedStmt });
        } else {
            statements.push({ type: 'other', sql: trimmedStmt });
        }
    }

    return { statements, warnings };
}

/**
 * Split SQL statements by semicolons, accounting for quoted strings and function bodies
 */
function splitSQLStatements(sql: string): string[] {
    const statements: string[] = [];
    let currentStatement = '';
    let inString = false;
    let stringChar = '';
    let inDollarQuote = false;
    let dollarQuoteTag = '';

    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const nextChar = sql[i + 1] || '';

        // Handle dollar quotes (PostgreSQL specific)
        if (!inString && char === '$') {
            const dollarMatch = sql.substring(i).match(/^\$([a-zA-Z_]*)\$/);
            if (dollarMatch) {
                if (!inDollarQuote) {
                    inDollarQuote = true;
                    dollarQuoteTag = dollarMatch[0];
                    currentStatement += dollarMatch[0];
                    i += dollarMatch[0].length - 1;
                    continue;
                } else if (sql.substring(i).startsWith(dollarQuoteTag)) {
                    inDollarQuote = false;
                    currentStatement += dollarQuoteTag;
                    i += dollarQuoteTag.length - 1;
                    continue;
                }
            }
        }

        // Handle regular quotes
        if (!inDollarQuote && (char === "'" || char === '"')) {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                // Check for escaped quote
                if (nextChar === char) {
                    currentStatement += char + nextChar;
                    i++;
                    continue;
                }
                inString = false;
            }
        }

        // Handle semicolons
        if (char === ';' && !inString && !inDollarQuote) {
            currentStatement += char;
            statements.push(currentStatement.trim());
            currentStatement = '';
            continue;
        }

        currentStatement += char;
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
    }

    return statements;
}

/**
 * Normalize PostgreSQL type aliases to standard types
 */
function normalizePostgreSQLType(type: string): string {
    const upperType = type.toUpperCase();

    // Handle types with parameters - more complex regex to handle CHARACTER VARYING
    const typeMatch = upperType.match(/^([\w\s]+?)(\(.+\))?$/);
    if (!typeMatch) return type;

    const baseType = typeMatch[1].trim();
    const params = typeMatch[2] || '';

    let normalizedBase: string;
    switch (baseType) {
        // Serial types
        case 'SERIAL':
        case 'SERIAL4':
            normalizedBase = 'INTEGER';
            break;
        case 'BIGSERIAL':
        case 'SERIAL8':
            normalizedBase = 'BIGINT';
            break;
        case 'SMALLSERIAL':
        case 'SERIAL2':
            normalizedBase = 'SMALLINT';
            break;
        // Integer aliases
        case 'INT':
        case 'INT4':
            normalizedBase = 'INTEGER';
            break;
        case 'INT2':
            normalizedBase = 'SMALLINT';
            break;
        case 'INT8':
            normalizedBase = 'BIGINT';
            break;
        // Boolean aliases
        case 'BOOL':
            normalizedBase = 'BOOLEAN';
            break;
        // Character types - use common names
        case 'CHARACTER VARYING':
        case 'VARCHAR':
            normalizedBase = 'VARCHAR';
            break;
        case 'CHARACTER':
        case 'CHAR':
            normalizedBase = 'CHAR';
            break;
        // Timestamp aliases
        case 'TIMESTAMPTZ':
        case 'TIMESTAMP WITH TIME ZONE':
            normalizedBase = 'TIMESTAMPTZ';
            break;
        default:
            // For unknown types (like enums), preserve original case
            return type;
    }

    // Return normalized type with original parameters preserved
    return normalizedBase + params;
}

/**
 * Extract columns from SQL using regex as a fallback when parser fails
 */
function extractColumnsFromSQL(sql: string): SQLColumn[] {
    const columns: SQLColumn[] = [];

    // Extract the table body (including empty tables)
    const tableBodyMatch = sql.match(/\(([\s\S]*)\)/);
    if (!tableBodyMatch) return columns;

    const tableBody = tableBodyMatch[1].trim();

    // Handle empty tables
    if (!tableBody) return columns;

    // First, normalize multi-line type definitions (like GEOGRAPHY(POINT,\n4326))
    const normalizedBody = tableBody.replace(/\s*\n\s*/g, ' ');

    // Split by commas but be careful of nested parentheses
    const lines = normalizedBody.split(/,(?![^(]*\))/);

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip constraint definitions
        if (
            trimmedLine.match(
                /^\s*(CONSTRAINT|PRIMARY\s+KEY|UNIQUE|FOREIGN\s+KEY|CHECK)/i
            )
        ) {
            continue;
        }

        // Try to extract column definition
        // Match: column_name TYPE[(params)][array]
        // Updated regex to handle complex types like GEOGRAPHY(POINT, 4326) and custom types like subscription_status
        const columnMatch = trimmedLine.match(
            /^\s*["']?(\w+)["']?\s+([\w_]+(?:\([^)]+\))?(?:\[\])?)/i
        );
        if (columnMatch) {
            const columnName = columnMatch[1];
            let columnType = columnMatch[2];

            // Normalize PostGIS types
            if (columnType.toUpperCase().startsWith('GEOGRAPHY')) {
                columnType = 'GEOGRAPHY';
            } else if (columnType.toUpperCase().startsWith('GEOMETRY')) {
                columnType = 'GEOMETRY';
            }

            // Check if it's a serial type for increment flag
            const upperType = columnType.toUpperCase();
            const isSerialType = [
                'SERIAL',
                'SERIAL2',
                'SERIAL4',
                'SERIAL8',
                'BIGSERIAL',
                'SMALLSERIAL',
            ].includes(upperType.split('(')[0]);

            // Normalize the type
            columnType = normalizePostgreSQLType(columnType);

            // Check for common constraints
            const isPrimary = trimmedLine.match(/PRIMARY\s+KEY/i) !== null;
            const isNotNull = trimmedLine.match(/NOT\s+NULL/i) !== null;
            const isUnique = trimmedLine.match(/\bUNIQUE\b/i) !== null;
            const hasDefault = trimmedLine.match(/DEFAULT\s+/i) !== null;

            columns.push({
                name: columnName,
                type: columnType,
                nullable: !isNotNull && !isPrimary,
                primaryKey: isPrimary,
                unique: isUnique || isPrimary,
                default: hasDefault ? 'has default' : undefined,
                increment:
                    isSerialType ||
                    trimmedLine.includes('gen_random_uuid()') ||
                    trimmedLine.includes('uuid_generate_v4()') ||
                    trimmedLine.includes('GENERATED ALWAYS AS IDENTITY') ||
                    trimmedLine.includes('GENERATED BY DEFAULT AS IDENTITY'),
            });
        }
    }

    return columns;
}

/**
 * Extract enum type definition from CREATE TYPE statement
 */
function extractEnumFromSQL(sql: string): SQLEnumType | null {
    // Match CREATE TYPE name AS ENUM (values)
    // Support both unquoted identifiers and schema-qualified quoted identifiers
    // Use [\s\S] to match any character including newlines
    const enumMatch = sql.match(
        /CREATE\s+TYPE\s+(?:"?([^"\s.]+)"?\.)?["']?([^"'\s.(]+)["']?\s+AS\s+ENUM\s*\(([\s\S]*?)\)/i
    );

    if (!enumMatch) return null;

    // enumMatch[1] is the schema (if present), enumMatch[2] is the type name, enumMatch[3] is the values
    const typeName = enumMatch[2];
    const valuesString = enumMatch[3];

    // Extract values from the enum definition
    const values: string[] = [];
    let currentValue = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < valuesString.length; i++) {
        const char = valuesString[i];

        if (!inString) {
            if (char === "'" || char === '"') {
                inString = true;
                stringChar = char;
                currentValue = '';
            } else if (char === ',' && currentValue) {
                // We've finished a value (shouldn't happen, but just in case)
                values.push(currentValue);
                currentValue = '';
            }
        } else {
            if (char === stringChar) {
                // Check if it's escaped (doubled quote)
                if (
                    i + 1 < valuesString.length &&
                    valuesString[i + 1] === stringChar
                ) {
                    currentValue += char;
                    i++; // Skip the next quote
                } else {
                    // End of string
                    inString = false;
                    values.push(currentValue);
                    currentValue = '';
                }
            } else {
                currentValue += char;
            }
        }
    }

    // Add any remaining value
    if (currentValue && inString === false) {
        values.push(currentValue);
    }

    if (values.length === 0) return null;

    return {
        name: typeName,
        values,
    };
}

/**
 * Extract foreign key relationships from CREATE TABLE statements
 */
function extractForeignKeysFromCreateTable(
    sql: string,
    tableName: string,
    tableSchema: string,
    tableId: string,
    tableMap: Record<string, string>
): SQLForeignKey[] {
    const relationships: SQLForeignKey[] = [];

    // Extract column definitions
    const tableBodyMatch = sql.match(/\(([\s\S]+)\)/);
    if (!tableBodyMatch) return relationships;

    const tableBody = tableBodyMatch[1];

    // Pattern for inline REFERENCES - more flexible to handle various formats
    const inlineRefPattern =
        /["']?(\w+)["']?\s+(?:\w+(?:\([^)]*\))?(?:\[[^\]]*\])?(?:\s+\w+)*\s+)?REFERENCES\s+(?:["']?(\w+)["']?\.)?["']?(\w+)["']?\s*\(\s*["']?(\w+)["']?\s*\)/gi;

    let match;
    while ((match = inlineRefPattern.exec(tableBody)) !== null) {
        const sourceColumn = match[1];
        const targetSchema = match[2] || 'public';
        const targetTable = match[3];
        const targetColumn = match[4];

        const targetTableKey = `${targetSchema}.${targetTable}`;
        const targetTableId = tableMap[targetTableKey];

        if (targetTableId) {
            relationships.push({
                name: `fk_${tableName}_${sourceColumn}_${targetTable}`,
                sourceTable: tableName,
                sourceSchema: tableSchema,
                sourceColumn,
                targetTable,
                targetSchema,
                targetColumn,
                sourceTableId: tableId,
                targetTableId,
                sourceCardinality: 'many',
                targetCardinality: 'one',
            });
        }
    }

    // Pattern for FOREIGN KEY constraints
    const fkConstraintPattern =
        /FOREIGN\s+KEY\s*\(\s*["']?(\w+)["']?\s*\)\s*REFERENCES\s+(?:["']?(\w+)["']?\.)?["']?(\w+)["']?\s*\(\s*["']?(\w+)["']?\s*\)/gi;

    while ((match = fkConstraintPattern.exec(tableBody)) !== null) {
        const sourceColumn = match[1];
        const targetSchema = match[2] || 'public';
        const targetTable = match[3];
        const targetColumn = match[4];

        const targetTableKey = `${targetSchema}.${targetTable}`;
        const targetTableId = tableMap[targetTableKey];

        if (targetTableId) {
            relationships.push({
                name: `fk_${tableName}_${sourceColumn}_${targetTable}`,
                sourceTable: tableName,
                sourceSchema: tableSchema,
                sourceColumn,
                targetTable,
                targetSchema,
                targetColumn,
                sourceTableId: tableId,
                targetTableId,
                sourceCardinality: 'many',
                targetCardinality: 'one',
            });
        }
    }

    return relationships;
}

/**
 * Parse PostgreSQL SQL with improved error handling and statement filtering
 */
export async function fromPostgres(
    sqlContent: string
): Promise<SQLParserResult & { warnings?: string[] }> {
    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {};
    const processedStatements: string[] = [];
    const enumTypes: SQLEnumType[] = [];

    // Preprocess SQL - removes all comments to avoid formatting issues
    const { statements, warnings } = preprocessSQL(sqlContent);

    // Import parser
    const { Parser } = await import('node-sql-parser');
    const parser = new Parser();

    // First pass: collect all table names and custom types
    for (const stmt of statements) {
        if (stmt.type === 'table') {
            // Extract just the CREATE TABLE part if there are comments
            const createTableIndex = stmt.sql
                .toUpperCase()
                .indexOf('CREATE TABLE');
            const sqlFromCreate =
                createTableIndex >= 0
                    ? stmt.sql.substring(createTableIndex)
                    : stmt.sql;

            const tableMatch = sqlFromCreate.match(
                /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?(?:\s+ONLY)?\s+(?:"?([^"\s.]+)"?\.)?["'`]?([^"'`\s.(]+)["'`]?/i
            );
            if (tableMatch) {
                const schemaName = tableMatch[1] || 'public';
                const tableName = tableMatch[2];
                const tableKey = `${schemaName}.${tableName}`;
                tableMap[tableKey] = generateId();
            }
        } else if (stmt.type === 'type') {
            // Extract enum type definition
            const enumType = extractEnumFromSQL(stmt.sql);
            if (enumType) {
                enumTypes.push(enumType);
            }
        }
    }

    // Second pass: parse supported statements
    for (const stmt of statements) {
        if (
            stmt.type === 'table' ||
            stmt.type === 'index' ||
            stmt.type === 'alter'
        ) {
            try {
                // If statement has comments before CREATE, extract just the CREATE part for parsing
                const createIndex = stmt.sql.toUpperCase().indexOf('CREATE');
                const sqlToParse =
                    createIndex > 0 &&
                    stmt.sql.substring(0, createIndex).includes('--')
                        ? stmt.sql.substring(createIndex)
                        : stmt.sql;

                const ast = parser.astify(
                    sqlToParse.endsWith(';') ? sqlToParse : sqlToParse + ';',
                    parserOpts
                );
                stmt.parsed = Array.isArray(ast) ? ast[0] : ast;
                processedStatements.push(stmt.sql);
            } catch {
                warnings.push(
                    `Failed to parse statement: ${stmt.sql.substring(0, 50)}...`
                );

                // Mark the statement as having parse errors but keep it for fallback processing
                if (stmt.type === 'table') {
                    stmt.parsed = null; // Mark as failed but still a table
                }
            }
        }
    }

    // Third pass: extract table definitions
    for (const stmt of statements) {
        if (stmt.type === 'table' && stmt.parsed) {
            const createTableStmt = stmt.parsed as CreateTableStatement;

            let tableName = '';
            let schemaName = '';

            if (
                createTableStmt.table &&
                typeof createTableStmt.table === 'object'
            ) {
                if (
                    Array.isArray(createTableStmt.table) &&
                    createTableStmt.table.length > 0
                ) {
                    const tableObj = createTableStmt.table[0];

                    // Handle case where parser interprets empty table as function
                    const tableObjWithExpr = tableObj as TableReference & {
                        expr?: {
                            type: string;
                            name?: {
                                name: { value: string }[];
                            };
                        };
                    };

                    if (
                        tableObjWithExpr.expr &&
                        tableObjWithExpr.expr.type === 'function' &&
                        tableObjWithExpr.expr.name
                    ) {
                        const nameObj = tableObjWithExpr.expr.name;
                        if (
                            nameObj.name &&
                            Array.isArray(nameObj.name) &&
                            nameObj.name.length > 0
                        ) {
                            tableName = nameObj.name[0].value || '';
                        }
                    } else {
                        tableName = tableObj.table || '';
                        schemaName = tableObj.schema || tableObj.db || '';
                    }
                } else {
                    const tableObj = createTableStmt.table as TableReference;
                    tableName = tableObj.table || '';
                    schemaName = tableObj.schema || tableObj.db || '';
                }
            }

            if (!tableName) continue;
            if (!schemaName) schemaName = 'public';

            const tableKey = `${schemaName}.${tableName}`;
            const tableId = tableMap[tableKey];

            if (!tableId) {
                // Table wasn't found in first pass, skip it
                continue;
            }

            // Process columns
            const columns: SQLColumn[] = [];
            const indexes: SQLIndex[] = [];

            // Handle both cases: create_definitions exists (even if empty) or doesn't exist
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
                            // Check for the full AST structure to get the original type
                            const definition = columnDef.definition as Record<
                                string,
                                unknown
                            >;
                            let rawDataType = String(
                                definition?.dataType || 'TEXT'
                            );

                            // Workaround for parser bug: character(n) is incorrectly parsed as CHARACTER VARYING
                            // Check the original SQL to detect this case
                            if (
                                rawDataType === 'CHARACTER VARYING' &&
                                columnName
                            ) {
                                // Look for the column definition in the original SQL
                                const columnRegex = new RegExp(
                                    `\\b${columnName}\\s+(character|char)\\s*\\(`,
                                    'i'
                                );
                                if (columnRegex.test(stmt.sql)) {
                                    // This is actually a CHARACTER type, not CHARACTER VARYING
                                    rawDataType = 'CHARACTER';
                                }
                            }

                            // First normalize the base type
                            let normalizedBaseType = rawDataType;
                            let isSerialType = false;

                            // Check if it's a serial type first
                            const upperType = rawDataType.toUpperCase();
                            const typeLength = definition?.length as
                                | number
                                | undefined;

                            if (upperType === 'SERIAL') {
                                // Use length to determine the actual serial type
                                if (typeLength === 2) {
                                    normalizedBaseType = 'SMALLINT';
                                    isSerialType = true;
                                } else if (typeLength === 8) {
                                    normalizedBaseType = 'BIGINT';
                                    isSerialType = true;
                                } else {
                                    // Default serial or serial4
                                    normalizedBaseType = 'INTEGER';
                                    isSerialType = true;
                                }
                            } else if (upperType === 'INT') {
                                // Use length to determine the actual int type
                                if (typeLength === 2) {
                                    normalizedBaseType = 'SMALLINT';
                                } else if (typeLength === 8) {
                                    normalizedBaseType = 'BIGINT';
                                } else {
                                    // Default int or int4
                                    normalizedBaseType = 'INTEGER';
                                }
                            } else {
                                // Apply normalization for other types
                                normalizedBaseType =
                                    normalizePostgreSQLType(rawDataType);
                            }

                            // Now handle parameters - but skip for integer types that shouldn't have them
                            let finalDataType = normalizedBaseType;

                            // Don't add parameters to INTEGER types that come from int4, int8, etc.
                            const isNormalizedIntegerType =
                                ['INTEGER', 'BIGINT', 'SMALLINT'].includes(
                                    normalizedBaseType
                                ) &&
                                (upperType === 'INT' || upperType === 'SERIAL');

                            if (!isSerialType && !isNormalizedIntegerType) {
                                // Include precision/scale/length in the type string if available
                                const precision =
                                    columnDef.definition?.precision;
                                const scale = columnDef.definition?.scale;
                                const length = columnDef.definition?.length;

                                // Also check if there's a suffix that includes the precision/scale
                                const definition =
                                    columnDef.definition as Record<
                                        string,
                                        unknown
                                    >;
                                const suffix = definition?.suffix;

                                if (
                                    suffix &&
                                    Array.isArray(suffix) &&
                                    suffix.length > 0
                                ) {
                                    // The suffix contains the full type parameters like (10,2)
                                    const params = suffix
                                        .map((s: unknown) => {
                                            if (
                                                typeof s === 'object' &&
                                                s !== null &&
                                                'value' in s
                                            ) {
                                                return String(
                                                    (s as { value: unknown })
                                                        .value
                                                );
                                            }
                                            return String(s);
                                        })
                                        .join(',');
                                    finalDataType = `${normalizedBaseType}(${params})`;
                                } else if (precision !== undefined) {
                                    if (scale !== undefined) {
                                        finalDataType = `${normalizedBaseType}(${precision},${scale})`;
                                    } else {
                                        finalDataType = `${normalizedBaseType}(${precision})`;
                                    }
                                } else if (
                                    length !== undefined &&
                                    length !== null
                                ) {
                                    // For VARCHAR, CHAR, etc.
                                    finalDataType = `${normalizedBaseType}(${length})`;
                                }
                            }

                            if (columnName) {
                                const isPrimaryKey =
                                    columnDef.primary_key === 'primary key' ||
                                    columnDef.definition?.constraint ===
                                        'primary key';

                                columns.push({
                                    name: columnName,
                                    type: finalDataType,
                                    nullable: isSerialType
                                        ? false
                                        : columnDef.nullable?.type !==
                                          'not null',
                                    primaryKey: isPrimaryKey || isSerialType,
                                    unique: columnDef.unique === 'unique',
                                    typeArgs: getTypeArgs(columnDef.definition),
                                    default: isSerialType
                                        ? undefined
                                        : getDefaultValueString(columnDef),
                                    increment:
                                        isSerialType ||
                                        columnDef.auto_increment ===
                                            'auto_increment' ||
                                        // Check if the SQL contains GENERATED IDENTITY for this column
                                        (stmt.sql
                                            .toUpperCase()
                                            .includes('GENERATED') &&
                                            stmt.sql
                                                .toUpperCase()
                                                .includes('IDENTITY')),
                                });
                            }
                        } else if (def.resource === 'constraint') {
                            // Handle constraints (primary key, unique, etc.)
                            const constraintDef = def as ConstraintDefinition;

                            if (
                                constraintDef.constraint_type === 'primary key'
                            ) {
                                // Process primary key constraint
                                if (Array.isArray(constraintDef.definition)) {
                                    constraintDef.definition.forEach(
                                        (colDef: ColumnReference) => {
                                            const pkColumnName =
                                                extractColumnName(colDef);
                                            const column = columns.find(
                                                (col) =>
                                                    col.name === pkColumnName
                                            );
                                            if (column) {
                                                column.primaryKey = true;
                                            }
                                        }
                                    );
                                }
                            }
                        }
                    }
                );
            }

            // Extract foreign keys from the original SQL
            const tableFKs = extractForeignKeysFromCreateTable(
                stmt.sql,
                tableName,
                schemaName,
                tableId,
                tableMap
            );
            relationships.push(...tableFKs);

            // Create table object
            const table: SQLTable = {
                id: tableId,
                name: tableName,
                schema: schemaName,
                columns,
                indexes,
                order: tables.length,
            };

            tables.push(table);
        } else if (stmt.type === 'table' && stmt.parsed === null) {
            // Handle tables that failed to parse - extract basic information

            // Extract just the CREATE TABLE part if there are comments
            const createTableIndex = stmt.sql
                .toUpperCase()
                .indexOf('CREATE TABLE');
            const sqlFromCreate =
                createTableIndex >= 0
                    ? stmt.sql.substring(createTableIndex)
                    : stmt.sql;

            const tableMatch = sqlFromCreate.match(
                /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?(?:\s+ONLY)?\s+(?:"?([^"\s.]+)"?\.)?["'`]?([^"'`\s.(]+)["'`]?/i
            );
            if (tableMatch) {
                const schemaName = tableMatch[1] || 'public';
                const tableName = tableMatch[2];
                const tableKey = `${schemaName}.${tableName}`;
                const tableId = tableMap[tableKey];

                if (tableId) {
                    // Extract columns using regex as fallback
                    const columns: SQLColumn[] = extractColumnsFromSQL(
                        stmt.sql
                    );

                    // Extract foreign keys
                    const fks = extractForeignKeysFromCreateTable(
                        stmt.sql,
                        tableName,
                        schemaName,
                        tableId,
                        tableMap
                    );
                    relationships.push(...fks);

                    // Create table object
                    const table: SQLTable = {
                        id: tableId,
                        name: tableName,
                        schema: schemaName,
                        columns,
                        indexes: [],
                        order: tables.length,
                    };

                    tables.push(table);
                    warnings.push(
                        `Table ${tableName} was parsed with limited column information due to complex syntax`
                    );
                }
            }
        }
    }

    // Fourth pass: process ALTER TABLE statements for foreign keys
    for (const stmt of statements) {
        if (stmt.type === 'alter' && stmt.parsed) {
            const alterTableStmt = stmt.parsed as AlterTableStatement;

            let tableName = '';
            let schemaName = '';

            if (
                Array.isArray(alterTableStmt.table) &&
                alterTableStmt.table.length > 0
            ) {
                const tableObj = alterTableStmt.table[0];
                tableName = tableObj.table || '';
                schemaName = tableObj.schema || tableObj.db || '';
            } else if (typeof alterTableStmt.table === 'object') {
                const tableRef = alterTableStmt.table as TableReference;
                tableName = tableRef.table || '';
                schemaName = tableRef.schema || tableRef.db || '';
            }

            if (!schemaName) schemaName = 'public';

            const table = findTableWithSchemaSupport(
                tables,
                tableName,
                schemaName
            );
            if (!table) continue;

            // Process foreign key constraints in ALTER TABLE
            if (alterTableStmt.expr && Array.isArray(alterTableStmt.expr)) {
                alterTableStmt.expr.forEach((expr: AlterTableExprItem) => {
                    if (expr.action === 'add' && expr.create_definitions) {
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
                                    (col: ColumnReference) =>
                                        extractColumnName(col)
                                );
                            }

                            // Extract target information
                            const reference = createDefs.reference_definition;
                            if (
                                reference &&
                                reference.table &&
                                sourceColumns.length > 0
                            ) {
                                let targetTable = '';
                                let targetSchema = 'public';
                                let targetColumns: string[] = [];

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
                                            'public';
                                    } else {
                                        const tableRef =
                                            reference.table as TableReference;
                                        targetTable = tableRef.table || '';
                                        targetSchema =
                                            tableRef.schema ||
                                            tableRef.db ||
                                            'public';
                                    }
                                } else {
                                    targetTable = reference.table as string;
                                }

                                if (
                                    reference.definition &&
                                    Array.isArray(reference.definition)
                                ) {
                                    targetColumns = reference.definition.map(
                                        (col: ColumnReference) =>
                                            extractColumnName(col)
                                    );
                                }

                                // Create relationships
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

                                    if (sourceTableId && targetTableId) {
                                        relationships.push({
                                            name:
                                                createDefs.constraint ||
                                                `${tableName}_${sourceColumns[i]}_fkey`,
                                            sourceTable: tableName,
                                            sourceSchema: schemaName,
                                            sourceColumn: sourceColumns[i],
                                            targetTable,
                                            targetSchema,
                                            targetColumn: targetColumns[i],
                                            sourceTableId,
                                            targetTableId,
                                            updateAction: reference.on_update,
                                            deleteAction: reference.on_delete,
                                            sourceCardinality: 'many',
                                            targetCardinality: 'one',
                                        });
                                    }
                                }
                            }
                        }
                    }
                });
            }
        } else if (stmt.type === 'alter' && !stmt.parsed) {
            // Handle ALTER TABLE statements that failed to parse
            // Extract foreign keys using regex as fallback
            const alterFKMatch = stmt.sql.match(
                /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:"?([^"\s.]+)"?\.)?["']?([^"'\s.(]+)["']?\s+ADD\s+CONSTRAINT\s+["']?([^"'\s]+)["']?\s+FOREIGN\s+KEY\s*\(["']?([^"'\s)]+)["']?\)\s+REFERENCES\s+(?:"?([^"\s.]+)"?\.)?["']?([^"'\s.(]+)["']?\s*\(["']?([^"'\s)]+)["']?\)/i
            );

            if (alterFKMatch) {
                const sourceSchema = alterFKMatch[1] || 'public';
                const sourceTable = alterFKMatch[2];
                const constraintName = alterFKMatch[3];
                const sourceColumn = alterFKMatch[4];
                const targetSchema = alterFKMatch[5] || 'public';
                const targetTable = alterFKMatch[6];
                const targetColumn = alterFKMatch[7];

                const sourceTableId = getTableIdWithSchemaSupport(
                    tableMap,
                    sourceTable,
                    sourceSchema
                );
                const targetTableId = getTableIdWithSchemaSupport(
                    tableMap,
                    targetTable,
                    targetSchema
                );

                if (sourceTableId && targetTableId) {
                    relationships.push({
                        name: constraintName,
                        sourceTable,
                        sourceSchema,
                        sourceColumn,
                        targetTable,
                        targetSchema,
                        targetColumn,
                        sourceTableId,
                        targetTableId,
                        sourceCardinality: 'many',
                        targetCardinality: 'one',
                    });
                }
            }
        }
    }

    // Fifth pass: process CREATE INDEX statements
    for (const stmt of statements) {
        if (stmt.type === 'index' && stmt.parsed) {
            const createIndexStmt = stmt.parsed as CreateIndexStatement;

            if (createIndexStmt.table) {
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
                    tableName = createIndexStmt.table.table || '';
                    schemaName = createIndexStmt.table.schema || '';
                }

                if (!schemaName) schemaName = 'public';

                const table = findTableWithSchemaSupport(
                    tables,
                    tableName,
                    schemaName
                );
                if (table) {
                    let columns: string[] = [];

                    if (
                        createIndexStmt.columns &&
                        Array.isArray(createIndexStmt.columns)
                    ) {
                        columns = createIndexStmt.columns
                            .map((col: ColumnReference) =>
                                extractColumnName(col)
                            )
                            .filter((col: string) => col !== '');
                    } else if (
                        createIndexStmt.index_columns &&
                        Array.isArray(createIndexStmt.index_columns)
                    ) {
                        columns = createIndexStmt.index_columns
                            .map(
                                (
                                    col:
                                        | { column?: ColumnReference }
                                        | ColumnReference
                                ) => {
                                    const colRef =
                                        'column' in col ? col.column : col;
                                    return extractColumnName(colRef || col);
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
        }
    }

    // Remove duplicate relationships
    const uniqueRelationships = relationships.filter((rel, index) => {
        const key = `${rel.sourceTable}.${rel.sourceColumn}-${rel.targetTable}.${rel.targetColumn}`;
        return (
            index ===
            relationships.findIndex(
                (r) =>
                    `${r.sourceTable}.${r.sourceColumn}-${r.targetTable}.${r.targetColumn}` ===
                    key
            )
        );
    });

    return {
        tables,
        relationships: uniqueRelationships,
        enums: enumTypes.length > 0 ? enumTypes : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

function getDefaultValueString(
    columnDef: ColumnDefinition
): string | undefined {
    let defVal = columnDef.default_val;

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
            }
            break;
        default:
            value = undefined;
    }

    return value;
}
