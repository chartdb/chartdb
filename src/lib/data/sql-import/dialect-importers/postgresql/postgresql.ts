import { generateId } from '@/lib/utils';
import type {
    SQLParserResult,
    SQLTable,
    SQLColumn,
    SQLIndex,
    SQLForeignKey,
    SQLEnumType,
    SQLCheckConstraint,
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
        | 'view'
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
            upperStmt.startsWith('CREATE VIEW') ||
            upperStmt.startsWith('CREATE OR REPLACE VIEW') ||
            upperStmt.includes('CREATE VIEW') ||
            upperStmt.includes('CREATE OR REPLACE VIEW')
        ) {
            statements.push({ type: 'view', sql: trimmedStmt });
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
 * Set of serial type names for O(1) lookup
 */
const SERIAL_TYPES = new Set([
    'SERIAL',
    'SERIAL2',
    'SERIAL4',
    'SERIAL8',
    'BIGSERIAL',
    'SMALLSERIAL',
]);

/**
 * Check if a type is a serial type
 */
function isSerialTypeName(typeName: string): boolean {
    return SERIAL_TYPES.has(typeName.toUpperCase().split('(')[0]);
}

/**
 * Check if a specific column has GENERATED AS IDENTITY syntax in the SQL
 * @param sql The SQL statement containing the column definition
 * @param columnName The name of the column to check
 * @returns true if the column has GENERATED AS IDENTITY
 */
function hasGeneratedIdentity(sql: string, columnName: string): boolean {
    // Create a regex pattern to find the column definition
    // Match the column name (quoted or unquoted) followed by its definition until the next comma or closing paren
    const escapedName = columnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
        `["']?${escapedName}["']?\\s+[^,)]*GENERATED\\s+(?:BY\\s+DEFAULT|ALWAYS)\\s+AS\\s+IDENTITY`,
        'i'
    );
    return pattern.test(sql);
}

/**
 * Normalize PostgreSQL type syntax to lowercase canonical form.
 * This function handles parsing-level normalization only - it converts
 * verbose SQL syntax to the preferred short form that getPreferredSynonym
 * expects. It preserves semantic types like serial (does NOT convert to integer).
 *
 * The optional `length` parameter is used to resolve ambiguous types where
 * the SQL parser returns a base type with a length modifier (e.g., 'SERIAL'
 * with length=2 for 'serial2', or 'INT' with length=8 for 'int8').
 *
 * Type synonym resolution (e.g., integer→int) is handled by getPreferredSynonym.
 */
function normalizePostgreSQLType(
    type: string,
    length?: number | undefined
): string {
    const upperType = type.toUpperCase();

    // Handle types with parameters (e.g., VARCHAR(255), NUMERIC(10,2))
    const typeMatch = upperType.match(/^([\w\s]+?)(\(.+\))?$/);
    if (!typeMatch) return type.toLowerCase();

    const baseType = typeMatch[1].trim();
    const params = typeMatch[2] || '';

    let normalizedBase: string;
    switch (baseType) {
        // Serial types - preserve as-is (they are valid PostgreSQL types)
        // Handle parser quirk: 'SERIAL' with length=2 means 'serial2' (smallserial)
        case 'SERIAL':
            if (length === 2) {
                normalizedBase = 'smallserial';
            } else if (length === 8) {
                normalizedBase = 'bigserial';
            } else {
                normalizedBase = 'serial';
            }
            break;
        case 'SERIAL4':
            normalizedBase = 'serial';
            break;
        case 'BIGSERIAL':
        case 'SERIAL8':
            normalizedBase = 'bigserial';
            break;
        case 'SMALLSERIAL':
        case 'SERIAL2':
            normalizedBase = 'smallserial';
            break;
        // Integer types - normalize to lowercase canonical form
        // Handle parser quirk: 'INT' with length=2 means 'int2' (smallint)
        case 'INT':
            if (length === 2) {
                normalizedBase = 'smallint';
            } else if (length === 8) {
                normalizedBase = 'bigint';
            } else {
                normalizedBase = 'integer';
            }
            break;
        case 'INT4':
        case 'INTEGER':
            normalizedBase = 'integer';
            break;
        case 'INT2':
        case 'SMALLINT':
            normalizedBase = 'smallint';
            break;
        case 'INT8':
        case 'BIGINT':
            normalizedBase = 'bigint';
            break;
        // Boolean
        case 'BOOL':
        case 'BOOLEAN':
            normalizedBase = 'boolean';
            break;
        // Character types - normalize verbose forms
        case 'CHARACTER VARYING':
            normalizedBase = 'varchar';
            break;
        case 'VARCHAR':
            normalizedBase = 'varchar';
            break;
        case 'CHARACTER':
            normalizedBase = 'char';
            break;
        case 'CHAR':
            normalizedBase = 'char';
            break;
        // Timestamp types
        case 'TIMESTAMPTZ':
        case 'TIMESTAMP WITH TIME ZONE':
            normalizedBase = 'timestamptz';
            break;
        case 'TIMESTAMP WITHOUT TIME ZONE':
        case 'TIMESTAMP':
            normalizedBase = 'timestamp';
            break;
        // Time types
        case 'TIMETZ':
        case 'TIME WITH TIME ZONE':
            normalizedBase = 'timetz';
            break;
        case 'TIME WITHOUT TIME ZONE':
        case 'TIME':
            normalizedBase = 'time';
            break;
        // Floating point
        case 'FLOAT4':
        case 'REAL':
            normalizedBase = 'real';
            break;
        case 'FLOAT8':
        case 'DOUBLE PRECISION':
            normalizedBase = 'double precision';
            break;
        // Bit types
        case 'BIT VARYING':
            normalizedBase = 'varbit';
            break;
        // Numeric types
        case 'DECIMAL':
            normalizedBase = 'numeric';
            break;
        case 'NUMERIC':
            normalizedBase = 'numeric';
            break;
        default:
            // For unknown types (like enums, user-defined), preserve original in lowercase
            return type.toLowerCase();
    }

    // Return normalized type with parameters preserved (lowercase)
    return normalizedBase + params.toLowerCase();
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
        // First extract column name and everything after it
        const columnMatch = trimmedLine.match(/^\s*["']?(\w+)["']?\s+(.+)/i);
        if (columnMatch) {
            const columnName = columnMatch[1];
            const restOfLine = columnMatch[2];

            // Now extract the type from the rest of the line
            // Match type which could be multi-word (like CHARACTER VARYING) with optional params
            const typeMatch = restOfLine.match(
                /^((?:CHARACTER\s+VARYING|DOUBLE\s+PRECISION|[\w]+)(?:\([^)]+\))?(?:\[\])?)/i
            );

            if (!typeMatch) continue;
            let columnType = typeMatch[1].trim();

            // Normalize PostGIS types
            if (columnType.toUpperCase().startsWith('GEOGRAPHY')) {
                columnType = 'GEOGRAPHY';
            } else if (columnType.toUpperCase().startsWith('GEOMETRY')) {
                columnType = 'GEOMETRY';
            }

            // Check if it's a serial type for increment flag
            const isSerialType = isSerialTypeName(columnType);

            // Normalize the type (preserves serial types)
            columnType = normalizePostgreSQLType(columnType);

            // Check for common constraints
            const isPrimary = trimmedLine.match(/PRIMARY\s+KEY/i) !== null;
            const isNotNull = trimmedLine.match(/NOT\s+NULL/i) !== null;
            const isUnique = trimmedLine.match(/\bUNIQUE\b/i) !== null;

            // Extract default value
            let defaultValue: string | undefined;
            // Updated regex to handle casting with :: operator
            const defaultMatch = trimmedLine.match(
                /DEFAULT\s+((?:'[^']*'|"[^"]*"|\S+)(?:::\w+)?)/i
            );
            if (defaultMatch) {
                let defVal = defaultMatch[1].trim();
                // Remove trailing comma if present
                defVal = defVal.replace(/,$/, '').trim();
                // Handle string literals
                if (defVal.startsWith("'") && defVal.endsWith("'")) {
                    // Keep the quotes for string literals
                    defaultValue = defVal;
                } else if (defVal.match(/^\d+(\.\d+)?$/)) {
                    // Numeric value
                    defaultValue = defVal;
                } else if (
                    defVal.toUpperCase() === 'TRUE' ||
                    defVal.toUpperCase() === 'FALSE'
                ) {
                    // Boolean value
                    defaultValue = defVal.toUpperCase();
                } else if (defVal.toUpperCase() === 'NULL') {
                    // NULL value
                    defaultValue = 'NULL';
                } else if (defVal.includes('(') && defVal.includes(')')) {
                    // Function call (like gen_random_uuid())
                    // Normalize PostgreSQL function names to uppercase
                    const funcMatch = defVal.match(/^(\w+)\(/);
                    if (funcMatch) {
                        const funcName = funcMatch[1];
                        const pgFunctions = [
                            'now',
                            'current_timestamp',
                            'current_date',
                            'current_time',
                            'gen_random_uuid',
                            'random',
                            'nextval',
                            'currval',
                        ];
                        if (pgFunctions.includes(funcName.toLowerCase())) {
                            defaultValue = defVal.replace(
                                funcName,
                                funcName.toUpperCase()
                            );
                        } else {
                            defaultValue = defVal;
                        }
                    } else {
                        defaultValue = defVal;
                    }
                } else {
                    // Other expressions
                    defaultValue = defVal;
                }
            }

            columns.push({
                name: columnName,
                type: columnType,
                nullable: !isNotNull && !isPrimary,
                primaryKey: isPrimary,
                unique: isUnique || isPrimary,
                default: defaultValue,
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
 * Extract columns from a CREATE VIEW statement
 * Views can have explicit column names or derive them from the SELECT
 */
function extractColumnsFromView(sql: string): SQLColumn[] {
    const columns: SQLColumn[] = [];

    // First, try to extract explicit column list from CREATE VIEW viewname (col1, col2, ...) AS
    const explicitColumnsMatch = sql.match(
        /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:(?:"[^"]+"|[^"\s.]+)\.)?(?:"[^"]+"|[^"\s.(]+)\s*\(([^)]+)\)\s*AS/i
    );

    if (explicitColumnsMatch) {
        // Parse explicit column list
        const columnList = explicitColumnsMatch[1];
        const columnNames = columnList
            .split(',')
            .map((col) => col.trim().replace(/^["']|["']$/g, ''));

        for (const colName of columnNames) {
            if (colName) {
                columns.push({
                    name: colName,
                    type: 'text', // Default type for views since we don't know the actual type
                    nullable: true,
                    primaryKey: false,
                    unique: false,
                });
            }
        }

        return columns;
    }

    // If no explicit columns, try to extract from SELECT clause
    // Match: AS SELECT ... FROM (extracting the column references)
    const selectMatch = sql.match(/\bAS\s+SELECT\s+([\s\S]+?)\s+FROM\s+/i);

    if (selectMatch) {
        const selectClause = selectMatch[1];

        // Handle SELECT * - we can't determine columns
        if (selectClause.trim() === '*') {
            return columns;
        }

        // Split by comma, but be careful of nested functions/expressions
        let depth = 0;
        let currentCol = '';
        const selectParts: string[] = [];

        for (const char of selectClause) {
            if (char === '(' || char === '[') depth++;
            else if (char === ')' || char === ']') depth--;
            else if (char === ',' && depth === 0) {
                selectParts.push(currentCol.trim());
                currentCol = '';
                continue;
            }
            currentCol += char;
        }
        if (currentCol.trim()) {
            selectParts.push(currentCol.trim());
        }

        for (const part of selectParts) {
            // Extract column name - handle aliases (AS name), qualified names (table.col), and expressions
            let columnName = '';

            // Check for alias: ... AS "name" or ... AS name
            const aliasMatch = part.match(/\s+AS\s+["']?(\w+)["']?\s*$/i);
            if (aliasMatch) {
                columnName = aliasMatch[1];
            } else {
                // Try to extract the column reference
                // Handle: col, table.col, "col", table."col"
                const colRefMatch = part.match(
                    /(?:[\w"]+\.)?["']?(\w+)["']?\s*$/
                );
                if (colRefMatch) {
                    columnName = colRefMatch[1];
                }
            }

            if (columnName && columnName !== '*') {
                columns.push({
                    name: columnName,
                    type: 'text', // Default type for views
                    nullable: true,
                    primaryKey: false,
                    unique: false,
                });
            }
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

    // Pattern for inline REFERENCES - handles quoted and unquoted identifiers
    const inlineRefPattern =
        /(?:"([^"]+)"|([^"\s,()]+))\s+(?:\w+(?:\([^)]*\))?(?:\[[^\]]*\])?(?:\s+\w+)*\s+)?REFERENCES\s+(?:(?:"([^"]+)"|([^"\s.]+))\.)?(?:"([^"]+)"|([^"\s.(]+))\s*\(\s*(?:"([^"]+)"|([^"\s,)]+))\s*\)/gi;

    let match;
    while ((match = inlineRefPattern.exec(tableBody)) !== null) {
        // Extract values from appropriate match groups
        // Groups: 1=quoted source col, 2=unquoted source col,
        //         3=quoted schema, 4=unquoted schema,
        //         5=quoted target table, 6=unquoted target table,
        //         7=quoted target col, 8=unquoted target col
        const sourceColumn = match[1] || match[2];
        const targetSchema = match[3] || match[4] || 'public';
        const targetTable = match[5] || match[6];
        const targetColumn = match[7] || match[8];

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

    // Pattern for FOREIGN KEY constraints - handles quoted and unquoted identifiers
    const fkConstraintPattern =
        /FOREIGN\s+KEY\s*\(\s*(?:"([^"]+)"|([^"\s,)]+))\s*\)\s*REFERENCES\s+(?:(?:"([^"]+)"|([^"\s.]+))\.)?(?:"([^"]+)"|([^"\s.(]+))\s*\(\s*(?:"([^"]+)"|([^"\s,)]+))\s*\)/gi;

    while ((match = fkConstraintPattern.exec(tableBody)) !== null) {
        // Extract values from appropriate match groups
        const sourceColumn = match[1] || match[2];
        const targetSchema = match[3] || match[4] || 'public';
        const targetTable = match[5] || match[6];
        const targetColumn = match[7] || match[8];

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
 * Extract CHECK constraints from CREATE TABLE statements
 * Handles both inline column-level and table-level CHECK constraints
 */
function extractCheckConstraintsFromCreateTable(
    sql: string
): SQLCheckConstraint[] {
    const constraints: SQLCheckConstraint[] = [];

    // Extract the table body
    const tableBodyMatch = sql.match(/\(([\s\S]+)\)/);
    if (!tableBodyMatch) return constraints;

    const tableBody = tableBodyMatch[1];

    // Pattern for table-level CHECK constraints:
    // CHECK (expression) or CONSTRAINT name CHECK (expression)
    // We need to handle nested parentheses in the expression
    const checkPattern = /(?:CONSTRAINT\s+(?:"[^"]+"|[^\s]+)\s+)?CHECK\s*\(/gi;
    let match;

    while ((match = checkPattern.exec(tableBody)) !== null) {
        const startIdx = match.index + match[0].length;
        let depth = 1;
        let endIdx = startIdx;

        // Find the matching closing parenthesis
        for (let i = startIdx; i < tableBody.length && depth > 0; i++) {
            if (tableBody[i] === '(') depth++;
            else if (tableBody[i] === ')') depth--;
            endIdx = i;
        }

        if (depth === 0) {
            const expression = tableBody.substring(startIdx, endIdx).trim();
            if (expression) {
                constraints.push({ expression });
            }
        }
    }

    return constraints;
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

    // First pass: collect all table names, view names, and custom types
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

            // Updated regex to properly handle quoted identifiers with special characters
            // Matches: schema.table, "schema"."table", "schema".table, schema."table"
            const tableMatch = sqlFromCreate.match(
                /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?(?:\s+ONLY)?\s+(?:(?:"([^"]+)"|([^"\s.]+))\.)?(?:"([^"]+)"|([^"\s.(]+))/i
            );
            if (tableMatch) {
                // Extract schema and table names from the appropriate match groups
                // Groups: 1=quoted schema, 2=unquoted schema, 3=quoted table, 4=unquoted table
                const schemaName = tableMatch[1] || tableMatch[2] || 'public';
                const tableName = tableMatch[3] || tableMatch[4];
                const tableKey = `${schemaName}.${tableName}`;
                tableMap[tableKey] = generateId();
            }
        } else if (stmt.type === 'view') {
            // Extract view name similar to table
            const createViewIndex = stmt.sql.toUpperCase().indexOf('CREATE');
            const sqlFromCreate =
                createViewIndex >= 0
                    ? stmt.sql.substring(createViewIndex)
                    : stmt.sql;

            // Matches: CREATE [OR REPLACE] VIEW [schema.]viewname
            const viewMatch = sqlFromCreate.match(
                /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:(?:"([^"]+)"|([^"\s.]+))\.)?(?:"([^"]+)"|([^"\s.(]+))/i
            );
            if (viewMatch) {
                const schemaName = viewMatch[1] || viewMatch[2] || 'public';
                const viewName = viewMatch[3] || viewMatch[4];
                const viewKey = `${schemaName}.${viewName}`;
                tableMap[viewKey] = generateId();
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
            stmt.type === 'view' ||
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
                if (stmt.type === 'table' || stmt.type === 'view') {
                    stmt.parsed = null; // Mark as failed but still a table/view
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

                            // Check if it's a serial type
                            const isSerialType = isSerialTypeName(rawDataType);
                            const typeLength = columnDef.definition?.length as
                                | number
                                | undefined;

                            // Check if this is an array type (node-sql-parser stores this separately)
                            const arrayInfo = definition?.array as
                                | { dimension?: number }
                                | undefined;
                            const isArrayType =
                                arrayInfo?.dimension !== undefined ||
                                rawDataType.endsWith('[]');

                            // Normalize the type (pass length to handle parser quirks like INT with length=8)
                            let finalDataType = normalizePostgreSQLType(
                                rawDataType,
                                typeLength
                            );

                            // Add type parameters for non-serial, non-integer types
                            if (!isSerialType) {
                                const precision =
                                    columnDef.definition?.precision;
                                const scale = columnDef.definition?.scale;
                                const suffix = (
                                    columnDef.definition as Record<
                                        string,
                                        unknown
                                    >
                                )?.suffix;

                                // Skip adding parameters to integer types (they don't have size params)
                                const isIntegerType = [
                                    'integer',
                                    'bigint',
                                    'smallint',
                                ].includes(finalDataType);

                                if (!isIntegerType) {
                                    if (
                                        suffix &&
                                        Array.isArray(suffix) &&
                                        suffix.length > 0
                                    ) {
                                        const params = suffix
                                            .map((s: unknown) =>
                                                typeof s === 'object' &&
                                                s !== null &&
                                                'value' in s
                                                    ? String(
                                                          (
                                                              s as {
                                                                  value: unknown;
                                                              }
                                                          ).value
                                                      )
                                                    : String(s)
                                            )
                                            .join(',');
                                        finalDataType = `${finalDataType}(${params})`;
                                    } else if (precision !== undefined) {
                                        finalDataType =
                                            scale !== undefined
                                                ? `${finalDataType}(${precision},${scale})`
                                                : `${finalDataType}(${precision})`;
                                    } else if (
                                        scale !== undefined &&
                                        typeLength !== undefined
                                    ) {
                                        // For NUMERIC, node-sql-parser stores precision as 'length'
                                        finalDataType = `${finalDataType}(${typeLength},${scale})`;
                                    } else if (
                                        typeLength !== undefined &&
                                        typeLength !== null
                                    ) {
                                        finalDataType = `${finalDataType}(${typeLength})`;
                                    }
                                }
                            }

                            // Add array suffix if this is an array type
                            // (only if not already present from rawDataType)
                            if (isArrayType && !finalDataType.endsWith('[]')) {
                                finalDataType = `${finalDataType}[]`;
                            }

                            if (columnName) {
                                const isPrimaryKey =
                                    columnDef.primary_key === 'primary key' ||
                                    columnDef.definition?.constraint ===
                                        'primary key';

                                columns.push({
                                    name: columnName,
                                    type: finalDataType,
                                    nullable:
                                        isSerialType || isPrimaryKey
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
                                        // Check if the SQL contains GENERATED IDENTITY for this specific column
                                        hasGeneratedIdentity(
                                            stmt.sql,
                                            columnName
                                        ),
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
                                    const pkColumns = constraintDef.definition;
                                    const isSingleColumnPK =
                                        pkColumns.length === 1;

                                    pkColumns.forEach(
                                        (colDef: ColumnReference) => {
                                            const pkColumnName =
                                                extractColumnName(colDef);
                                            const column = columns.find(
                                                (col) =>
                                                    col.name === pkColumnName
                                            );
                                            if (column) {
                                                column.primaryKey = true;
                                                // Only mark as unique if it's a single-column primary key
                                                // Composite primary keys don't guarantee uniqueness of individual columns
                                                if (isSingleColumnPK) {
                                                    column.unique = true;
                                                }
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

            // Extract check constraints from the original SQL
            const checkConstraints = extractCheckConstraintsFromCreateTable(
                stmt.sql
            );

            // Create table object
            const table: SQLTable = {
                id: tableId,
                name: tableName,
                schema: schemaName,
                columns,
                indexes,
                checkConstraints:
                    checkConstraints.length > 0 ? checkConstraints : undefined,
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

            // Updated regex to properly handle quoted identifiers with special characters
            // Matches: schema.table, "schema"."table", "schema".table, schema."table"
            const tableMatch = sqlFromCreate.match(
                /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?(?:\s+ONLY)?\s+(?:(?:"([^"]+)"|([^"\s.]+))\.)?(?:"([^"]+)"|([^"\s.(]+))/i
            );
            if (tableMatch) {
                // Extract schema and table names from the appropriate match groups
                // Groups: 1=quoted schema, 2=unquoted schema, 3=quoted table, 4=unquoted table
                const schemaName = tableMatch[1] || tableMatch[2] || 'public';
                const tableName = tableMatch[3] || tableMatch[4];
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

                    // Extract check constraints
                    const checkConstraints =
                        extractCheckConstraintsFromCreateTable(stmt.sql);

                    // Create table object
                    const table: SQLTable = {
                        id: tableId,
                        name: tableName,
                        schema: schemaName,
                        columns,
                        indexes: [],
                        checkConstraints:
                            checkConstraints.length > 0
                                ? checkConstraints
                                : undefined,
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

    // Third pass (continued): extract view definitions
    for (const stmt of statements) {
        if (stmt.type === 'view') {
            // Extract view name
            const createViewIndex = stmt.sql.toUpperCase().indexOf('CREATE');
            const sqlFromCreate =
                createViewIndex >= 0
                    ? stmt.sql.substring(createViewIndex)
                    : stmt.sql;

            const viewMatch = sqlFromCreate.match(
                /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:(?:"([^"]+)"|([^"\s.]+))\.)?(?:"([^"]+)"|([^"\s.(]+))/i
            );

            if (viewMatch) {
                const schemaName = viewMatch[1] || viewMatch[2] || 'public';
                const viewName = viewMatch[3] || viewMatch[4];
                const viewKey = `${schemaName}.${viewName}`;
                const viewId = tableMap[viewKey];

                if (viewId) {
                    // Extract columns from the view definition
                    const columns = extractColumnsFromView(stmt.sql);

                    // Create view object (as a table with isView: true)
                    const view: SQLTable = {
                        id: viewId,
                        name: viewName,
                        schema: schemaName,
                        columns,
                        indexes: [], // Views don't have indexes
                        order: tables.length,
                        isView: true,
                    };

                    tables.push(view);
                }
            }
        }
    }

    // Fourth pass: process ALTER TABLE statements for foreign keys and ADD COLUMN
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

            // Process ALTER TABLE expressions
            if (alterTableStmt.expr && Array.isArray(alterTableStmt.expr)) {
                alterTableStmt.expr.forEach((expr: AlterTableExprItem) => {
                    // Handle ALTER COLUMN TYPE
                    if (expr.action === 'alter' && expr.resource === 'column') {
                        // Extract column name
                        let columnName: string | undefined;
                        if (
                            typeof expr.column === 'object' &&
                            'column' in expr.column
                        ) {
                            const innerColumn = expr.column.column;
                            if (
                                typeof innerColumn === 'object' &&
                                'expr' in innerColumn &&
                                innerColumn.expr?.value
                            ) {
                                columnName = innerColumn.expr.value;
                            } else if (typeof innerColumn === 'string') {
                                columnName = innerColumn;
                            }
                        } else if (typeof expr.column === 'string') {
                            columnName = expr.column;
                        }

                        // Check if it's a TYPE change
                        if (
                            columnName &&
                            expr.type === 'alter' &&
                            expr.definition?.dataType
                        ) {
                            // Find the column in the table and update its type
                            const column = table.columns.find(
                                (col) => (col as SQLColumn).name === columnName
                            );
                            if (column) {
                                const definition = expr.definition;
                                const rawDataType = String(definition.dataType);

                                // console.log('ALTER TYPE expr:', JSON.stringify(expr, null, 2));

                                // Normalize the type
                                let normalizedType =
                                    normalizePostgreSQLType(rawDataType);

                                // Handle type parameters
                                if (
                                    definition.scale !== undefined &&
                                    definition.scale !== null
                                ) {
                                    // For NUMERIC/DECIMAL with scale, length is actually precision
                                    const precision =
                                        definition.length ||
                                        definition.precision;
                                    normalizedType = `${normalizedType}(${precision},${definition.scale})`;
                                } else if (
                                    definition.length !== undefined &&
                                    definition.length !== null
                                ) {
                                    normalizedType = `${normalizedType}(${definition.length})`;
                                } else if (definition.precision !== undefined) {
                                    normalizedType = `${normalizedType}(${definition.precision})`;
                                } else if (
                                    definition.suffix &&
                                    Array.isArray(definition.suffix) &&
                                    definition.suffix.length > 0
                                ) {
                                    const params = definition.suffix
                                        .map((s: unknown) => {
                                            if (
                                                typeof s === 'object' &&
                                                s !== null &&
                                                'value' in s
                                            ) {
                                                return String(s.value);
                                            }
                                            return String(s);
                                        })
                                        .join(',');
                                    normalizedType = `${normalizedType}(${params})`;
                                }

                                // Update the column type
                                (column as SQLColumn).type = normalizedType;

                                // Update typeArgs if applicable
                                if (
                                    definition.scale !== undefined &&
                                    definition.scale !== null
                                ) {
                                    // For NUMERIC/DECIMAL with scale
                                    const precision =
                                        definition.length ||
                                        definition.precision;
                                    (column as SQLColumn).typeArgs = {
                                        precision: precision,
                                        scale: definition.scale,
                                    };
                                } else if (definition.length) {
                                    (column as SQLColumn).typeArgs = {
                                        length: definition.length,
                                    };
                                } else if (definition.precision) {
                                    (column as SQLColumn).typeArgs = {
                                        precision: definition.precision,
                                    };
                                }
                            }
                        }
                        // Handle ADD COLUMN
                    } else if (
                        expr.action === 'add' &&
                        expr.resource === 'column'
                    ) {
                        // Handle ADD COLUMN directly from expr structure
                        // Extract column name from the nested structure
                        let columnName: string | undefined;
                        if (
                            typeof expr.column === 'object' &&
                            'column' in expr.column
                        ) {
                            const innerColumn = expr.column.column;
                            if (
                                typeof innerColumn === 'object' &&
                                'expr' in innerColumn &&
                                innerColumn.expr?.value
                            ) {
                                columnName = innerColumn.expr.value;
                            } else if (typeof innerColumn === 'string') {
                                columnName = innerColumn;
                            }
                        } else if (typeof expr.column === 'string') {
                            columnName = expr.column;
                        }

                        if (columnName && typeof columnName === 'string') {
                            const definition = expr.definition || {};
                            const rawDataType = String(
                                definition?.dataType || 'TEXT'
                            );

                            // Check if it's a serial type
                            const isSerialType = isSerialTypeName(rawDataType);
                            const typeLength = definition?.length as
                                | number
                                | undefined;

                            // Normalize the type (pass length to handle parser quirks)
                            let finalDataType = normalizePostgreSQLType(
                                rawDataType,
                                typeLength
                            );

                            // Add type parameters for non-serial, non-integer types
                            if (!isSerialType) {
                                const precision = definition?.precision;
                                const scale = definition?.scale;
                                const suffix =
                                    (definition?.suffix as unknown[]) || [];

                                const isIntegerType = [
                                    'integer',
                                    'bigint',
                                    'smallint',
                                ].includes(finalDataType);

                                if (!isIntegerType) {
                                    if (suffix.length > 0) {
                                        const params = suffix
                                            .map((s: unknown) =>
                                                typeof s === 'object' &&
                                                s !== null &&
                                                'value' in s
                                                    ? String(
                                                          (
                                                              s as {
                                                                  value: unknown;
                                                              }
                                                          ).value
                                                      )
                                                    : String(s)
                                            )
                                            .join(',');
                                        finalDataType = `${finalDataType}(${params})`;
                                    } else if (precision !== undefined) {
                                        finalDataType =
                                            scale !== undefined
                                                ? `${finalDataType}(${precision},${scale})`
                                                : `${finalDataType}(${precision})`;
                                    } else if (
                                        typeLength !== undefined &&
                                        typeLength !== null
                                    ) {
                                        finalDataType = `${finalDataType}(${typeLength})`;
                                    }
                                }
                            }

                            // Check for nullable constraint
                            let nullable = true;
                            if (isSerialType) {
                                nullable = false;
                            } else if (
                                expr.nullable &&
                                expr.nullable.type === 'not null'
                            ) {
                                nullable = false;
                            } else if (
                                definition?.nullable &&
                                definition.nullable.type === 'not null'
                            ) {
                                nullable = false;
                            }

                            // Check for unique constraint
                            const isUnique =
                                expr.unique === 'unique' ||
                                definition?.unique === 'unique';

                            // Check for default value
                            let defaultValue: string | undefined;
                            const defaultVal =
                                expr.default_val || definition?.default_val;
                            if (defaultVal && !isSerialType) {
                                // Create a temporary columnDef to use the getDefaultValueString function
                                const tempColumnDef = {
                                    default_val: defaultVal,
                                } as ColumnDefinition;
                                defaultValue =
                                    getDefaultValueString(tempColumnDef);
                            }

                            // Create the new column object
                            const newColumn: SQLColumn = {
                                name: columnName,
                                type: finalDataType,
                                nullable: nullable,
                                primaryKey:
                                    definition?.primary_key === 'primary key' ||
                                    definition?.constraint === 'primary key' ||
                                    isSerialType,
                                unique: isUnique,
                                default: defaultValue,
                                increment:
                                    isSerialType ||
                                    definition?.auto_increment ===
                                        'auto_increment' ||
                                    hasGeneratedIdentity(stmt.sql, columnName),
                            };

                            // Add the column to the table if it doesn't already exist
                            const tableColumns = table.columns as SQLColumn[];
                            if (
                                !tableColumns.some(
                                    (col) => col.name === columnName
                                )
                            ) {
                                tableColumns.push(newColumn);
                            }
                        }
                    } else if (
                        expr.action === 'add' &&
                        expr.create_definitions
                    ) {
                        const createDefs = expr.create_definitions;

                        // Check if it's adding a column (legacy structure)
                        if (createDefs.resource === 'column') {
                            const columnDef =
                                createDefs as unknown as ColumnDefinition;
                            const columnName = extractColumnName(
                                columnDef.column
                            );

                            if (columnName) {
                                // Extract the column type and properties
                                const definition =
                                    columnDef.definition as Record<
                                        string,
                                        unknown
                                    >;
                                const rawDataType = String(
                                    definition?.dataType || 'TEXT'
                                );

                                // Check if it's a serial type
                                const isSerialType =
                                    isSerialTypeName(rawDataType);
                                const typeLength = definition?.length as
                                    | number
                                    | undefined;

                                // Normalize the type (pass length to handle parser quirks)
                                let finalDataType = normalizePostgreSQLType(
                                    rawDataType,
                                    typeLength
                                );

                                // Add type parameters for non-serial, non-integer types
                                if (!isSerialType) {
                                    const precision =
                                        columnDef.definition?.precision;
                                    const scale = columnDef.definition?.scale;
                                    const suffix =
                                        (definition?.suffix as unknown[]) || [];

                                    const isIntegerType = [
                                        'integer',
                                        'bigint',
                                        'smallint',
                                    ].includes(finalDataType);

                                    if (!isIntegerType) {
                                        if (suffix.length > 0) {
                                            const params = suffix
                                                .map((s: unknown) =>
                                                    typeof s === 'object' &&
                                                    s !== null &&
                                                    'value' in s
                                                        ? String(
                                                              (
                                                                  s as {
                                                                      value: unknown;
                                                                  }
                                                              ).value
                                                          )
                                                        : String(s)
                                                )
                                                .join(',');
                                            finalDataType = `${finalDataType}(${params})`;
                                        } else if (precision !== undefined) {
                                            finalDataType =
                                                scale !== undefined
                                                    ? `${finalDataType}(${precision},${scale})`
                                                    : `${finalDataType}(${precision})`;
                                        } else if (
                                            typeLength !== undefined &&
                                            typeLength !== null
                                        ) {
                                            finalDataType = `${finalDataType}(${typeLength})`;
                                        }
                                    }
                                }

                                // Create the new column object
                                const newColumn: SQLColumn = {
                                    name: columnName,
                                    type: finalDataType,
                                    nullable: isSerialType
                                        ? false
                                        : columnDef.nullable?.type !==
                                          'not null',
                                    primaryKey:
                                        columnDef.primary_key ===
                                            'primary key' ||
                                        columnDef.definition?.constraint ===
                                            'primary key' ||
                                        isSerialType,
                                    unique: columnDef.unique === 'unique',
                                    typeArgs: getTypeArgs(columnDef.definition),
                                    default: isSerialType
                                        ? undefined
                                        : getDefaultValueString(columnDef),
                                    increment:
                                        isSerialType ||
                                        columnDef.auto_increment ===
                                            'auto_increment' ||
                                        hasGeneratedIdentity(
                                            stmt.sql,
                                            columnName
                                        ),
                                };

                                // Add the column to the table if it doesn't already exist
                                const tableColumns2 =
                                    table.columns as SQLColumn[];
                                if (
                                    !tableColumns2.some(
                                        (col) => col.name === columnName
                                    )
                                ) {
                                    tableColumns2.push(newColumn);
                                }
                            }
                        } else if (
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

            // First try to extract ALTER COLUMN TYPE statements
            const alterTypeMatch = stmt.sql.match(
                /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:(?:"([^"]+)"|([^"\s.]+))\.)?(?:"([^"]+)"|([^"\s.(]+))\s+ALTER\s+COLUMN\s+(?:"([^"]+)"|([^"\s]+))\s+TYPE\s+([\w_]+(?:\([^)]*\))?(?:\[\])?)/i
            );

            if (alterTypeMatch) {
                const schemaName =
                    alterTypeMatch[1] || alterTypeMatch[2] || 'public';
                const tableName = alterTypeMatch[3] || alterTypeMatch[4];
                const columnName = alterTypeMatch[5] || alterTypeMatch[6];
                let columnType = alterTypeMatch[7];

                const table = findTableWithSchemaSupport(
                    tables,
                    tableName,
                    schemaName
                );
                if (table && columnName) {
                    const column = (table.columns as SQLColumn[]).find(
                        (col) => col.name === columnName
                    );
                    if (column) {
                        // Normalize and update the type
                        columnType = normalizePostgreSQLType(columnType);
                        column.type = columnType;

                        // Extract and update typeArgs if present
                        const typeMatch = columnType.match(
                            /^(\w+)(?:\(([^)]+)\))?$/
                        );
                        if (typeMatch && typeMatch[2]) {
                            const params = typeMatch[2]
                                .split(',')
                                .map((p) => p.trim());
                            if (params.length === 1) {
                                column.typeArgs = {
                                    length: parseInt(params[0]),
                                };
                            } else if (params.length === 2) {
                                column.typeArgs = {
                                    precision: parseInt(params[0]),
                                    scale: parseInt(params[1]),
                                };
                            }
                        }
                    }
                }
            }

            // Then try to extract ADD COLUMN statements
            const alterColumnMatch = stmt.sql.match(
                /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:(?:"([^"]+)"|([^"\s.]+))\.)?(?:"([^"]+)"|([^"\s.(]+))\s+ADD\s+COLUMN\s+(?:"([^"]+)"|([^"\s]+))\s+([\w_]+(?:\([^)]*\))?(?:\[\])?)/i
            );

            if (alterColumnMatch) {
                const schemaName =
                    alterColumnMatch[1] || alterColumnMatch[2] || 'public';
                const tableName = alterColumnMatch[3] || alterColumnMatch[4];
                const columnName = alterColumnMatch[5] || alterColumnMatch[6];
                let columnType = alterColumnMatch[7];

                const table = findTableWithSchemaSupport(
                    tables,
                    tableName,
                    schemaName
                );
                if (table && columnName) {
                    const tableColumns = table.columns as SQLColumn[];
                    if (!tableColumns.some((col) => col.name === columnName)) {
                        // Normalize the type
                        columnType = normalizePostgreSQLType(columnType);

                        // Check for constraints in the statement
                        const columnDefPart = stmt.sql.substring(
                            stmt.sql.indexOf(columnName)
                        );
                        const isPrimary =
                            columnDefPart.match(/PRIMARY\s+KEY/i) !== null;
                        const isNotNull =
                            columnDefPart.match(/NOT\s+NULL/i) !== null;
                        const isUnique =
                            columnDefPart.match(/\bUNIQUE\b/i) !== null;
                        // Extract default value
                        let defaultValue: string | undefined;
                        // Updated regex to handle casting with :: operator
                        const defaultMatch = columnDefPart.match(
                            /DEFAULT\s+((?:'[^']*'|"[^"]*"|\S+)(?:::\w+)?)/i
                        );
                        if (defaultMatch) {
                            let defVal = defaultMatch[1].trim();
                            // Remove trailing comma or semicolon if present
                            defVal = defVal.replace(/[,;]$/, '').trim();
                            // Handle string literals
                            if (
                                defVal.startsWith("'") &&
                                defVal.endsWith("'")
                            ) {
                                // Keep the quotes for string literals
                                defaultValue = defVal;
                            } else if (defVal.match(/^\d+(\.\d+)?$/)) {
                                // Numeric value
                                defaultValue = defVal;
                            } else if (
                                defVal.toUpperCase() === 'TRUE' ||
                                defVal.toUpperCase() === 'FALSE'
                            ) {
                                // Boolean value
                                defaultValue = defVal.toUpperCase();
                            } else if (defVal.toUpperCase() === 'NULL') {
                                // NULL value
                                defaultValue = 'NULL';
                            } else if (
                                defVal.includes('(') &&
                                defVal.includes(')')
                            ) {
                                // Function call
                                // Normalize PostgreSQL function names to uppercase
                                const funcMatch = defVal.match(/^(\w+)\(/);
                                if (funcMatch) {
                                    const funcName = funcMatch[1];
                                    const pgFunctions = [
                                        'now',
                                        'current_timestamp',
                                        'current_date',
                                        'current_time',
                                        'gen_random_uuid',
                                        'random',
                                        'nextval',
                                        'currval',
                                    ];
                                    if (
                                        pgFunctions.includes(
                                            funcName.toLowerCase()
                                        )
                                    ) {
                                        defaultValue = defVal.replace(
                                            funcName,
                                            funcName.toUpperCase()
                                        );
                                    } else {
                                        defaultValue = defVal;
                                    }
                                } else {
                                    defaultValue = defVal;
                                }
                            } else {
                                // Other expressions
                                defaultValue = defVal;
                            }
                        }

                        tableColumns.push({
                            name: columnName,
                            type: columnType,
                            nullable: !isNotNull && !isPrimary,
                            primaryKey: isPrimary,
                            unique: isUnique || isPrimary,
                            default: defaultValue,
                            increment: false,
                        });
                    }
                }
            }

            // Extract foreign keys using regex as fallback
            // Updated regex to handle quoted identifiers properly
            const alterFKMatch = stmt.sql.match(
                /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:(?:"([^"]+)"|([^"\s.]+))\.)?(?:"([^"]+)"|([^"\s.(]+))\s+ADD\s+CONSTRAINT\s+(?:"([^"]+)"|([^"\s]+))\s+FOREIGN\s+KEY\s*\((?:"([^"]+)"|([^"\s)]+))\)\s+REFERENCES\s+(?:(?:"([^"]+)"|([^"\s.]+))\.)?(?:"([^"]+)"|([^"\s.(]+))\s*\((?:"([^"]+)"|([^"\s)]+))\)/i
            );

            if (alterFKMatch) {
                // Extract values from appropriate match groups
                const sourceSchema =
                    alterFKMatch[1] || alterFKMatch[2] || 'public';
                const sourceTable = alterFKMatch[3] || alterFKMatch[4];
                const constraintName = alterFKMatch[5] || alterFKMatch[6];
                const sourceColumn = alterFKMatch[7] || alterFKMatch[8];
                const targetSchema =
                    alterFKMatch[9] || alterFKMatch[10] || 'public';
                const targetTable = alterFKMatch[11] || alterFKMatch[12];
                const targetColumn = alterFKMatch[13] || alterFKMatch[14];

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

                        // Extract index type from USING clause (e.g., USING GIN, USING HASH)
                        // The parser may store this in different properties
                        let indexType: string | undefined;
                        const indexUsing = createIndexStmt.index_using;
                        if (typeof indexUsing === 'string') {
                            indexType = indexUsing.toLowerCase();
                        } else if (
                            indexUsing &&
                            typeof indexUsing === 'object' &&
                            'type' in indexUsing
                        ) {
                            indexType = String(
                                (indexUsing as { type: unknown }).type
                            ).toLowerCase();
                        }

                        table.indexes.push({
                            name: indexName,
                            columns,
                            unique:
                                createIndexStmt.index_type === 'unique' ||
                                createIndexStmt.unique === true,
                            type: indexType,
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
    const defVal = columnDef.default_val;

    if (defVal === undefined || defVal === null) return undefined;

    // Use buildSQLFromAST to reconstruct the default value
    return buildSQLFromAST(defVal, DatabaseType.POSTGRESQL);
}
