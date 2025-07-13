import { generateId } from '@/lib/utils';
import type {
    SQLParserResult,
    SQLTable,
    SQLColumn,
    SQLIndex,
    SQLForeignKey,
    SQLEnum,
} from '../../common';
import { buildSQLFromAST } from '../../common';
import type {
    ColumnDefinition,
    ConstraintDefinition,
    CreateTableStatement,
    TableReference,
} from './mysql-common';
import { parserOpts, extractColumnName, getTypeArgs } from './mysql-common';

interface ParseOptions {
    includeWarnings?: boolean;
    skipValidation?: boolean;
}

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

function sanitizeSql(sql: string): string {
    // Remove all comments first, just like PostgreSQL does
    let cleanedSQL = sql;

    // Remove multi-line comments /* ... */
    cleanedSQL = cleanedSQL.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove single-line comments -- ... and # ...
    // But be careful with strings that might contain -- or #
    const lines = cleanedSQL.split('\n');
    const cleanedLines = lines.map((line) => {
        let result = '';
        let inString = false;
        let stringChar = '';
        let inBacktick = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1] || '';

            // Handle backticks (MySQL identifier quotes)
            if (!inString && char === '`') {
                inBacktick = !inBacktick;
                result += char;
            }
            // Handle string boundaries
            else if (
                !inBacktick &&
                !inString &&
                (char === "'" || char === '"')
            ) {
                inString = true;
                stringChar = char;
                result += char;
            } else if (!inBacktick && inString && char === stringChar) {
                // Check for escaped quote
                if (nextChar === stringChar) {
                    result += char + nextChar;
                    i++; // Skip the next quote
                } else {
                    inString = false;
                    result += char;
                }
            }
            // Handle MySQL comment styles
            else if (!inBacktick && !inString) {
                if (char === '-' && nextChar === '-') {
                    // Found -- comment, skip rest of line
                    break;
                } else if (char === '#') {
                    // Found # comment, skip rest of line
                    break;
                } else {
                    result += char;
                }
            } else {
                result += char;
            }
        }

        return result;
    });

    return cleanedLines.join('\n');
}

function extractStatements(sqlContent: string): string[] {
    const statements: string[] = [];
    let currentStatement = '';
    let inQuote = false;
    let quoteChar = '';
    let escaped = false;

    for (let i = 0; i < sqlContent.length; i++) {
        const char = sqlContent[i];
        const prevChar = i > 0 ? sqlContent[i - 1] : '';

        if (escaped) {
            currentStatement += char;
            escaped = false;
            continue;
        }

        if (char === '\\') {
            escaped = true;
            currentStatement += char;
            continue;
        }

        if ((char === '"' || char === "'" || char === '`') && !inQuote) {
            inQuote = true;
            quoteChar = char;
            currentStatement += char;
            continue;
        }

        if (char === quoteChar && inQuote && prevChar !== '\\') {
            inQuote = false;
            quoteChar = '';
            currentStatement += char;
            continue;
        }

        if (char === ';' && !inQuote) {
            currentStatement += char;
            const trimmed = currentStatement.trim();
            if (
                trimmed &&
                !trimmed.startsWith('--') &&
                !trimmed.startsWith('#')
            ) {
                statements.push(trimmed);
            }
            currentStatement = '';
            continue;
        }

        currentStatement += char;
    }

    if (currentStatement.trim()) {
        const trimmed = currentStatement.trim();
        if (trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('#')) {
            statements.push(trimmed);
        }
    }

    return statements;
}

function extractColumnsFromCreateTable(statement: string): SQLColumn[] {
    const columns: SQLColumn[] = [];

    // Extract everything between the first opening and last closing parenthesis
    const columnMatch = statement.match(/CREATE\s+TABLE.*?\((.*)\)[^)]*;?$/is);
    if (!columnMatch || !columnMatch[1]) {
        return columns;
    }

    const columnDefs = columnMatch[1].trim();
    const columnLines: string[] = [];
    let currentLine = '';
    let parenDepth = 0;
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < columnDefs.length; i++) {
        const char = columnDefs[i];

        if ((char === '"' || char === "'" || char === '`') && !inQuote) {
            inQuote = true;
            quoteChar = char;
        } else if (char === quoteChar && inQuote) {
            inQuote = false;
            quoteChar = '';
        }

        if (!inQuote) {
            if (char === '(') parenDepth++;
            if (char === ')') parenDepth--;
            if (char === ',' && parenDepth === 0) {
                columnLines.push(currentLine.trim());
                currentLine = '';
                continue;
            }
        }

        currentLine += char;
    }

    if (currentLine.trim()) {
        columnLines.push(currentLine.trim());
    }

    for (const columnLine of columnLines) {
        const line = columnLine.trim();

        // Skip constraints at the table level
        if (
            line.toUpperCase().startsWith('CONSTRAINT') ||
            line.toUpperCase().startsWith('PRIMARY KEY') ||
            line.toUpperCase().startsWith('FOREIGN KEY') ||
            line.toUpperCase().startsWith('UNIQUE') ||
            line.toUpperCase().startsWith('INDEX') ||
            line.toUpperCase().startsWith('KEY') ||
            line.toUpperCase().startsWith('CHECK') ||
            line.toUpperCase().includes('FOREIGN KEY')
        ) {
            continue;
        }

        // Extract column name and definition
        const columnNameMatch = line.match(/^`?([^`\s]+)`?\s+(.+)$/);
        if (columnNameMatch) {
            const columnName = columnNameMatch[1];
            const definition = columnNameMatch[2];

            // Determine if column is nullable
            const nullable = !definition.toUpperCase().includes('NOT NULL');

            // Determine if column is primary key
            const primaryKey = definition.toUpperCase().includes('PRIMARY KEY');

            // Extract data type
            const typeMatch = definition.match(/^([A-Za-z]+)(?:\(([^)]+)\))?/);
            const dataType = typeMatch ? typeMatch[1].toUpperCase() : '';

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

function processCreateIndexStatement(
    statement: string,
    tableMap: Record<string, string>,
    tables: SQLTable[]
): void {
    if (
        !statement.toUpperCase().includes('CREATE') ||
        !statement.toUpperCase().includes('INDEX')
    ) {
        return;
    }

    try {
        const isUnique = statement.toUpperCase().includes('UNIQUE');

        // Extract index name
        const indexNameRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+`?([^`\s]+)`?/i;
        const indexNameMatch = statement.match(indexNameRegex);
        const indexName = indexNameMatch ? indexNameMatch[1] : '';

        if (!indexName) {
            return;
        }

        // Extract table name
        const tableRegex = /ON\s+`?([^`\s.(]+)`?/i;
        const tableMatch = statement.match(tableRegex);

        if (!tableMatch) {
            return;
        }

        const tableName = tableMatch[1];

        // Extract index columns
        const columnsRegex = /\(\s*([^)]+)\)/i;
        const columnsMatch = statement.match(columnsRegex);

        if (!columnsMatch) {
            return;
        }

        const columnsStr = columnsMatch[1];
        const indexColumns = columnsStr.split(',').map((col) => {
            return col
                .trim()
                .replace(/^`(.*)`$/, '$1')
                .replace(/\s+(ASC|DESC)$/i, '');
        });

        if (indexColumns.length === 0) {
            return;
        }

        const tableId = tableMap[tableName];
        if (!tableId) {
            return;
        }

        const table = tables.find((t) => t.id === tableId);
        if (!table) {
            return;
        }

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

import {
    validateMySQLSyntax,
    formatValidationMessage,
} from './mysql-validator';

export async function fromMySQLImproved(
    sqlContent: string,
    options: ParseOptions = {}
): Promise<SQLParserResult> {
    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const enums: SQLEnum[] = [];
    const warnings: string[] = [];
    const tableMap: Record<string, string> = {};
    const pendingForeignKeys: PendingForeignKey[] = [];
    // Removed unused variable - addedRelationships

    try {
        // FIRST: Sanitize SQL (remove all comments) - just like PostgreSQL
        const sanitizedSql = sanitizeSql(sqlContent);

        // THEN: Validate the sanitized SQL if validation is enabled
        if (!options.skipValidation) {
            const validation = validateMySQLSyntax(sanitizedSql);
            if (!validation.isValid) {
                const errorMessage = formatValidationMessage(validation);
                throw new Error(errorMessage);
            }

            // Add validation warnings to the result
            if (validation.warnings.length > 0 && options.includeWarnings) {
                validation.warnings.forEach((w) => warnings.push(w.message));
            }
        }

        // Extract statements from sanitized SQL
        const statements = extractStatements(sanitizedSql);

        // Process each statement
        for (const statement of statements) {
            const trimmedStmt = statement.trim();
            const upperStmt = trimmedStmt.toUpperCase();

            // Handle CREATE TABLE statements
            if (upperStmt.startsWith('CREATE TABLE')) {
                try {
                    const { Parser } = await import('node-sql-parser');
                    const parser = new Parser();

                    let ast;
                    try {
                        ast = parser.astify(trimmedStmt, parserOpts);
                    } catch {
                        // Fallback to regex parsing
                        const tableNameMatch = trimmedStmt.match(
                            /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([^`\s(]+)`?/i
                        );

                        if (tableNameMatch) {
                            const tableName = tableNameMatch[1];
                            const tableId = generateId();
                            tableMap[tableName] = tableId;

                            const columns =
                                extractColumnsFromCreateTable(trimmedStmt);

                            tables.push({
                                id: tableId,
                                name: tableName,
                                columns:
                                    columns.length > 0
                                        ? columns
                                        : [
                                              {
                                                  name: 'id',
                                                  type: 'INT',
                                                  nullable: false,
                                                  primaryKey: true,
                                                  unique: true,
                                              },
                                          ],
                                indexes: [],
                                order: tables.length,
                            });
                        }
                        continue;
                    }

                    if (
                        Array.isArray(ast) &&
                        ast.length > 0 &&
                        ast[0].type === 'create' &&
                        ast[0].keyword === 'table'
                    ) {
                        const createTableStmt = ast[0] as CreateTableStatement;

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

                        tableName = tableName.replace(/`/g, '');

                        if (tableName) {
                            const tableId = generateId();
                            tableMap[tableName] = tableId;

                            const columns: SQLColumn[] = [];
                            const indexes: SQLIndex[] = [];

                            if (
                                createTableStmt.create_definitions &&
                                Array.isArray(
                                    createTableStmt.create_definitions
                                )
                            ) {
                                for (const def of createTableStmt.create_definitions) {
                                    if (def.resource === 'column') {
                                        const columnDef =
                                            def as ColumnDefinition;
                                        let columnName = extractColumnName(
                                            columnDef.column
                                        );
                                        columnName = columnName.replace(
                                            /`/g,
                                            ''
                                        );

                                        const dataType =
                                            columnDef.definition?.dataType ||
                                            '';
                                        const isPrimaryKey =
                                            columnDef.primary_key ===
                                                'primary key' ||
                                            columnDef.definition?.constraint ===
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
                                                columnDef.unique === 'unique' ||
                                                columnDef.definition
                                                    ?.constraint === 'unique',
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
                                    } else if (def.resource === 'constraint') {
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
                                                            ).replace(/`/g, '')
                                                        );

                                                for (const colName of pkColumns) {
                                                    const col = columns.find(
                                                        (c) =>
                                                            c.name === colName
                                                    );
                                                    if (col) {
                                                        col.primaryKey = true;
                                                    }
                                                }

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
                                                'unique' ||
                                            constraintDef.constraint_type ===
                                                'unique key' ||
                                            constraintDef.constraint_type ===
                                                'UNIQUE' ||
                                            constraintDef.constraint_type ===
                                                'UNIQUE KEY'
                                        ) {
                                            const uniqueColumns = Array.isArray(
                                                constraintDef.definition
                                            )
                                                ? constraintDef.definition.map(
                                                      (colDef) =>
                                                          extractColumnName(
                                                              colDef
                                                          ).replace(/`/g, '')
                                                  )
                                                : [];

                                            if (uniqueColumns.length > 0) {
                                                const indexName =
                                                    constraintDef.constraint_name ||
                                                    (
                                                        constraintDef as {
                                                            index?: string;
                                                        }
                                                    ).index ||
                                                    `${tableName}_${uniqueColumns[0]}_key`;
                                                indexes.push({
                                                    name: indexName.replace(
                                                        /`/g,
                                                        ''
                                                    ),
                                                    columns: uniqueColumns,
                                                    unique: true,
                                                });
                                            }
                                        }
                                        // Handle INDEX/KEY constraints
                                        else if (
                                            constraintDef.constraint_type ===
                                                'index' ||
                                            constraintDef.constraint_type ===
                                                'key' ||
                                            constraintDef.constraint_type ===
                                                'INDEX' ||
                                            constraintDef.constraint_type ===
                                                'KEY'
                                        ) {
                                            const indexColumns = Array.isArray(
                                                constraintDef.definition
                                            )
                                                ? constraintDef.definition.map(
                                                      (colDef) =>
                                                          extractColumnName(
                                                              colDef
                                                          ).replace(/`/g, '')
                                                  )
                                                : [];

                                            if (indexColumns.length > 0) {
                                                indexes.push({
                                                    name: constraintDef.constraint_name
                                                        ? constraintDef.constraint_name.replace(
                                                              /`/g,
                                                              ''
                                                          )
                                                        : `idx_${tableName}_${indexColumns[0]}`,
                                                    columns: indexColumns,
                                                    unique: false,
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
                                            let sourceColumns: string[] = [];
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

                                            const reference =
                                                constraintDef.reference_definition ||
                                                constraintDef.reference;

                                            if (
                                                reference &&
                                                sourceColumns.length > 0
                                            ) {
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
                                                    targetTable =
                                                        targetTable.replace(
                                                            /`/g,
                                                            ''
                                                        );
                                                }

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

                                                if (
                                                    targetTable &&
                                                    targetColumns.length > 0
                                                ) {
                                                    const targetTableId =
                                                        tableMap[targetTable];

                                                    if (!targetTableId) {
                                                        const pendingFk: PendingForeignKey =
                                                            {
                                                                name:
                                                                    constraintDef.constraint_name ||
                                                                    (
                                                                        constraintDef as {
                                                                            constraint?: string;
                                                                        }
                                                                    ).constraint
                                                                        ? (
                                                                              constraintDef.constraint_name ||
                                                                              (
                                                                                  constraintDef as {
                                                                                      constraint?: string;
                                                                                  }
                                                                              )
                                                                                  .constraint
                                                                          ).replace(
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
                                                                    reference.on_update ||
                                                                    reference.on_action
                                                                        ?.find(
                                                                            (a: {
                                                                                type: string;
                                                                            }) =>
                                                                                a.type ===
                                                                                'on update'
                                                                        )
                                                                        ?.value?.value?.toUpperCase(),
                                                                deleteAction:
                                                                    reference.on_delete ||
                                                                    reference.on_action
                                                                        ?.find(
                                                                            (a: {
                                                                                type: string;
                                                                            }) =>
                                                                                a.type ===
                                                                                'on delete'
                                                                        )
                                                                        ?.value?.value?.toUpperCase(),
                                                            };
                                                        pendingForeignKeys.push(
                                                            pendingFk
                                                        );
                                                    } else {
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
                                                                    name:
                                                                        constraintDef.constraint_name ||
                                                                        (
                                                                            constraintDef as {
                                                                                constraint?: string;
                                                                            }
                                                                        )
                                                                            .constraint
                                                                            ? (
                                                                                  constraintDef.constraint_name ||
                                                                                  (
                                                                                      constraintDef as {
                                                                                          constraint?: string;
                                                                                      }
                                                                                  )
                                                                                      .constraint
                                                                              ).replace(
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
                                                                        reference.on_update ||
                                                                        reference.on_action
                                                                            ?.find(
                                                                                (a: {
                                                                                    type: string;
                                                                                }) =>
                                                                                    a.type ===
                                                                                    'on update'
                                                                            )
                                                                            ?.value?.value?.toUpperCase(),
                                                                    deleteAction:
                                                                        reference.on_delete ||
                                                                        reference.on_action
                                                                            ?.find(
                                                                                (a: {
                                                                                    type: string;
                                                                                }) =>
                                                                                    a.type ===
                                                                                    'on delete'
                                                                            )
                                                                            ?.value?.value?.toUpperCase(),
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
                                    // Handle INDEX resource type (separate from constraint)
                                    else if (def.resource === 'index') {
                                        const indexDef = def as {
                                            index?: string;
                                            definition?: Array<{
                                                column?: string;
                                            }>;
                                            unique?: boolean;
                                            keyword?: string;
                                        };
                                        const indexColumns = Array.isArray(
                                            indexDef.definition
                                        )
                                            ? indexDef.definition.map(
                                                  (colDef) =>
                                                      colDef.column || ''
                                              )
                                            : [];

                                        if (indexColumns.length > 0) {
                                            indexes.push({
                                                name:
                                                    indexDef.index ||
                                                    `idx_${tableName}_${indexColumns[0]}`,
                                                columns: indexColumns,
                                                unique:
                                                    indexDef.unique === true ||
                                                    indexDef.keyword ===
                                                        'unique',
                                            });
                                        }
                                    }
                                }
                            } else {
                                // Fallback to regex extraction
                                const extractedColumns =
                                    extractColumnsFromCreateTable(trimmedStmt);
                                if (extractedColumns.length > 0) {
                                    columns.push(...extractedColumns);
                                }
                            }

                            tables.push({
                                id: tableId,
                                name: tableName,
                                columns:
                                    columns.length > 0
                                        ? columns
                                        : [
                                              {
                                                  name: 'id',
                                                  type: 'INT',
                                                  nullable: false,
                                                  primaryKey: true,
                                                  unique: true,
                                              },
                                          ],
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
                    if (options.includeWarnings) {
                        warnings.push(`Failed to parse CREATE TABLE statement`);
                    }
                }
            }
            // Handle CREATE INDEX statements
            else if (
                upperStmt.includes('CREATE') &&
                upperStmt.includes('INDEX')
            ) {
                processCreateIndexStatement(trimmedStmt, tableMap, tables);
            }
            // Handle ALTER TABLE ... ADD FOREIGN KEY statements
            else if (
                upperStmt.startsWith('ALTER TABLE') &&
                upperStmt.includes('FOREIGN KEY')
            ) {
                try {
                    const tableRegex = /ALTER\s+TABLE\s+`?([^`\s.(]+)`?\s+/i;
                    const tableMatch = statement.match(tableRegex);

                    if (!tableMatch) continue;

                    const sourceTable = tableMatch[1];
                    const sourceTableId = tableMap[sourceTable];

                    if (!sourceTableId) {
                        continue;
                    }

                    let constraintName = '';
                    const constraintMatch = statement.match(
                        /ADD\s+CONSTRAINT\s+`?([^`\s(]+)`?\s+/i
                    );
                    if (constraintMatch) {
                        constraintName = constraintMatch[1].replace(/`/g, '');
                    }

                    const sourceColMatch = statement.match(
                        /FOREIGN\s+KEY\s*\(([^)]+)\)/i
                    );
                    if (!sourceColMatch) continue;

                    const sourceColumns = sourceColMatch[1]
                        .split(',')
                        .map((col) => col.trim().replace(/`/g, ''));

                    const targetMatch = statement.match(
                        /REFERENCES\s+`?([^`\s(]+)`?\s*\(([^)]+)\)/i
                    );
                    if (!targetMatch) continue;

                    const targetTable = targetMatch[1];
                    const targetColumns = targetMatch[2]
                        .split(',')
                        .map((col) => col.trim().replace(/`/g, ''));

                    const targetTableId = tableMap[targetTable];
                    if (!targetTableId) {
                        continue;
                    }

                    let updateAction: string | undefined;
                    let deleteAction: string | undefined;

                    const onDeleteMatch = statement.match(
                        /ON\s+DELETE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION)/i
                    );
                    if (onDeleteMatch) {
                        deleteAction = onDeleteMatch[1].trim().toUpperCase();
                    }

                    const onUpdateMatch = statement.match(
                        /ON\s+UPDATE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION)/i
                    );
                    if (onUpdateMatch) {
                        updateAction = onUpdateMatch[1].trim().toUpperCase();
                    }

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
                    if (options.includeWarnings) {
                        warnings.push(
                            `Failed to parse ALTER TABLE ... FOREIGN KEY statement`
                        );
                    }
                }
            }
            // Handle MySQL-specific features with warnings
            else if (upperStmt.startsWith('CREATE TRIGGER')) {
                if (options.includeWarnings) {
                    warnings.push(
                        'Triggers are not currently supported and were skipped'
                    );
                }
            } else if (
                upperStmt.startsWith('CREATE PROCEDURE') ||
                upperStmt.startsWith('CREATE FUNCTION')
            ) {
                if (options.includeWarnings) {
                    warnings.push(
                        'Stored procedures and functions are not currently supported and were skipped'
                    );
                }
            } else if (upperStmt.startsWith('CREATE VIEW')) {
                if (options.includeWarnings) {
                    warnings.push(
                        'Views are not currently supported and were skipped'
                    );
                }
            } else if (upperStmt.startsWith('CREATE EVENT')) {
                if (options.includeWarnings) {
                    warnings.push(
                        'Events are not currently supported and were skipped'
                    );
                }
            }
        }

        // Process pending foreign keys
        for (const pendingFk of pendingForeignKeys) {
            const targetTableId = tableMap[pendingFk.targetTable];
            if (!targetTableId) {
                continue;
            }

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

        // Try to find additional foreign keys using regex as fallback
        // findForeignKeysUsingRegex(sqlContent, tableMap, relationships, addedRelationships);

        const result: SQLParserResult = {
            tables,
            relationships,
            enums,
        };

        if (options.includeWarnings && warnings.length > 0) {
            result.warnings = warnings;
        }

        return result;
    } catch (error) {
        console.error('Error in MySQL improved parser:', error);
        throw new Error(`Error parsing MySQL: ${(error as Error).message}`);
    }
}

// Removed unused function findForeignKeysUsingRegex
