import type { Diagram } from '../../domain/diagram';
import { OPENAI_API_KEY, OPENAI_API_ENDPOINT, LLM_MODEL_NAME } from '@/lib/env';
import { DatabaseType } from '@/lib/domain/database-type';
import type { DBTable } from '@/lib/domain/db-table';
import type { DataType } from '../data-types/data-types';
import { generateCacheKey, getFromCache, setInCache } from './export-sql-cache';
import { exportMSSQL } from './export-per-type/mssql';
import { exportPostgreSQL } from './export-per-type/postgresql';
import { exportSQLite } from './export-per-type/sqlite';
import { exportMySQL } from './export-per-type/mysql';

// Function to simplify verbose data type names
const simplifyDataType = (typeName: string): string => {
    const typeMap: Record<string, string> = {
        'character varying': 'varchar',
        'char varying': 'varchar',
        integer: 'int',
        int4: 'int',
        int8: 'bigint',
        serial4: 'serial',
        serial8: 'bigserial',
        float8: 'double precision',
        float4: 'real',
        bool: 'boolean',
        character: 'char',
        'timestamp without time zone': 'timestamp',
        'timestamp with time zone': 'timestamptz',
        'time without time zone': 'time',
        'time with time zone': 'timetz',
    };

    return typeMap[typeName.toLowerCase()] || typeName;
};

export const exportBaseSQL = ({
    diagram,
    targetDatabaseType,
    isDBMLFlow = false,
    onlyRelationships = false,
}: {
    diagram: Diagram;
    targetDatabaseType: DatabaseType;
    isDBMLFlow?: boolean;
    onlyRelationships?: boolean;
}): string => {
    const { tables, relationships } = diagram;

    if (!tables || tables.length === 0) {
        return '';
    }

    if (!isDBMLFlow && diagram.databaseType === targetDatabaseType) {
        switch (diagram.databaseType) {
            case DatabaseType.SQL_SERVER:
                return exportMSSQL({ diagram, onlyRelationships });
            case DatabaseType.POSTGRESQL:
                return exportPostgreSQL({ diagram, onlyRelationships });
            case DatabaseType.SQLITE:
                return exportSQLite({ diagram, onlyRelationships });
            case DatabaseType.MYSQL:
            case DatabaseType.MARIADB:
                return exportMySQL({ diagram, onlyRelationships });
            default:
                return exportPostgreSQL({ diagram, onlyRelationships });
        }
    }

    // Filter out the tables that are views
    const nonViewTables = tables.filter((table) => !table.isView);

    // Align the data types based on foreign key relationships
    alignForeignKeyDataTypes(diagram);

    // Initialize the SQL script string
    let sqlScript = '';

    // First create the CREATE SCHEMA statements for all the found schemas based on tables
    const schemas = new Set<string>();
    tables.forEach((table) => {
        if (table.schema) {
            schemas.add(table.schema);
        }
    });

    // Add CREATE SCHEMA statements if any schemas exist
    schemas.forEach((schema) => {
        sqlScript += `CREATE SCHEMA IF NOT EXISTS ${schema};\n`;
    });
    if (schemas.size > 0) sqlScript += '\n'; // Add newline only if schemas were added

    // Add CREATE TYPE statements for ENUMs and COMPOSITE types from diagram.customTypes
    if (diagram.customTypes && diagram.customTypes.length > 0) {
        diagram.customTypes.forEach((customType) => {
            const typeNameWithSchema = customType.schema
                ? `${customType.schema}.${customType.name}`
                : customType.name;

            if (
                customType.kind === 'enum' &&
                customType.values &&
                customType.values.length > 0
            ) {
                // For PostgreSQL, generate CREATE TYPE ... AS ENUM
                // For other DBs, this might need adjustment or be omitted if not supported directly
                // or if we rely on the DBML generator to create Enums separately (as currently done)
                // For now, let's assume PostgreSQL-style for demonstration if isDBMLFlow is false.
                // If isDBMLFlow is true, we let TableDBML.tsx handle Enum syntax directly.
                if (
                    targetDatabaseType === DatabaseType.POSTGRESQL &&
                    !isDBMLFlow
                ) {
                    const enumValues = customType.values
                        .map((v) => `'${v.replace(/'/g, "''")}'`)
                        .join(', ');
                    sqlScript += `CREATE TYPE ${typeNameWithSchema} AS ENUM (${enumValues});\n`;
                }
            } else if (
                customType.kind === 'composite' &&
                customType.fields &&
                customType.fields.length > 0
            ) {
                // For PostgreSQL, generate CREATE TYPE ... AS (...)
                // This is crucial for composite types to be recognized by the DBML importer
                if (
                    targetDatabaseType === DatabaseType.POSTGRESQL ||
                    isDBMLFlow
                ) {
                    // Assume other DBs might not support this or DBML flow needs it
                    const compositeFields = customType.fields
                        .map((f) => `${f.field} ${simplifyDataType(f.type)}`)
                        .join(',\n    ');
                    sqlScript += `CREATE TYPE ${typeNameWithSchema} AS (\n    ${compositeFields}\n);\n`;
                }
            }
        });
        if (
            diagram.customTypes.some(
                (ct) =>
                    (ct.kind === 'enum' &&
                        ct.values &&
                        ct.values.length > 0 &&
                        targetDatabaseType === DatabaseType.POSTGRESQL &&
                        !isDBMLFlow) ||
                    (ct.kind === 'composite' &&
                        ct.fields &&
                        ct.fields.length > 0 &&
                        (targetDatabaseType === DatabaseType.POSTGRESQL ||
                            isDBMLFlow))
            )
        ) {
            sqlScript += '\n';
        }
    }

    // Add CREATE SEQUENCE statements
    const sequences = new Set<string>();

    tables.forEach((table) => {
        table.fields.forEach((field) => {
            if (field.default) {
                // Match nextval('schema.sequence_name') or nextval('sequence_name')
                const match = field.default.match(
                    /nextval\('([^']+)'(?:::[^)]+)?\)/
                );
                if (match) {
                    sequences.add(match[1]);
                }
            }
        });
    });

    sequences.forEach((sequence) => {
        sqlScript += `CREATE SEQUENCE IF NOT EXISTS ${sequence};\n`;
    });
    if (sequences.size > 0) {
        sqlScript += '\n';
    }

    // Loop through each non-view table to generate the SQL statements
    nonViewTables.forEach((table) => {
        const tableName = table.schema
            ? `${table.schema}.${table.name}`
            : table.name;
        sqlScript += `CREATE TABLE ${tableName} (\n`;

        // Check for composite primary keys
        const primaryKeyFields = table.fields.filter(
            (field) => field.primaryKey
        );
        const hasCompositePrimaryKey = primaryKeyFields.length > 1;

        table.fields.forEach((field, index) => {
            let typeName = simplifyDataType(field.type.name);

            // Handle ENUM type
            // If we are generating SQL for DBML flow, and we ALREADY generated CREATE TYPE for enums (e.g., for PG),
            // then we should use the enum type name. Otherwise, map to text.
            // However, the current TableDBML.tsx generates its own Enum blocks, so for DBML flow,
            // converting to TEXT here might still be the safest bet to avoid conflicts if SQL enums aren't perfectly parsed.
            // Let's adjust: if it's a known custom enum type, use its name for PG, otherwise TEXT.
            const customEnumType = diagram.customTypes?.find(
                (ct) =>
                    ct.name === field.type.name &&
                    ct.kind === 'enum' &&
                    (ct.schema ? ct.schema === table.schema : true)
            );

            if (
                customEnumType &&
                targetDatabaseType === DatabaseType.POSTGRESQL &&
                !isDBMLFlow
            ) {
                typeName = customEnumType.schema
                    ? `${customEnumType.schema}.${customEnumType.name}`
                    : customEnumType.name;
            } else if (typeName.toLowerCase() === 'enum') {
                // Fallback for non-PG or if custom type not found, or for DBML flow if not handled by CREATE TYPE above
                typeName = 'text';
            }

            // Check if the field type is a known composite custom type
            const customCompositeType = diagram.customTypes?.find(
                (ct) =>
                    ct.name === field.type.name &&
                    ct.kind === 'composite' &&
                    (ct.schema ? ct.schema === table.schema : true)
            );

            if (customCompositeType) {
                typeName = customCompositeType.schema
                    ? `${customCompositeType.schema}.${customCompositeType.name}`
                    : customCompositeType.name;
            } else if (typeName.toLowerCase() === 'user-defined') {
                // If it's 'user-defined' but not a known composite, fallback to TEXT
                typeName = 'text';
            }

            // Temp fix for 'array' to be text[]
            if (typeName.toLowerCase() === 'array') {
                typeName = 'text[]';
            }

            // Handle special types
            if (
                typeName.toLowerCase() === 'char' &&
                !field.characterMaximumLength
            ) {
                // Default char without length to char(1)
                typeName = 'char';
            }

            sqlScript += `  ${field.name} ${typeName}`;

            // Add size for character types
            if (
                field.characterMaximumLength &&
                parseInt(field.characterMaximumLength) > 0 &&
                field.type.name.toLowerCase() !== 'decimal'
            ) {
                sqlScript += `(${field.characterMaximumLength})`;
            } else if (field.type.name.toLowerCase().includes('varchar')) {
                // Keep varchar sizing, but don't apply to TEXT (previously enum)
                sqlScript += `(500)`;
            } else if (
                typeName.toLowerCase() === 'char' &&
                !field.characterMaximumLength
            ) {
                // Default char without explicit length to char(1) for compatibility
                sqlScript += `(1)`;
            }

            // Add precision and scale for numeric types
            if (field.precision && field.scale) {
                sqlScript += `(${field.precision}, ${field.scale})`;
            } else if (field.precision) {
                sqlScript += `(${field.precision})`;
            }

            // Handle NOT NULL constraint
            if (!field.nullable) {
                sqlScript += ' NOT NULL';
            }

            // Handle UNIQUE value
            if (!field.primaryKey && field.unique) {
                sqlScript += ` UNIQUE`;
            }

            // Handle DEFAULT value
            if (field.default) {
                // Temp remove default user-define value when it have it
                let fieldDefault = field.default;

                // Skip invalid default values for DBML export
                if (
                    fieldDefault === 'has default' ||
                    fieldDefault === 'DEFAULT has default'
                ) {
                    // Skip this default value as it's invalid SQL
                } else {
                    // Remove the type cast part after :: if it exists
                    if (fieldDefault.includes('::')) {
                        const endedWithParentheses = fieldDefault.endsWith(')');
                        fieldDefault = fieldDefault.split('::')[0];

                        if (
                            (fieldDefault.startsWith('(') &&
                                !fieldDefault.endsWith(')')) ||
                            endedWithParentheses
                        ) {
                            fieldDefault += ')';
                        }
                    }

                    if (fieldDefault === `('now')`) {
                        fieldDefault = `now()`;
                    }

                    sqlScript += ` DEFAULT ${fieldDefault}`;
                }
            }

            // Handle PRIMARY KEY constraint - only add inline if not composite
            if (field.primaryKey && !hasCompositePrimaryKey) {
                sqlScript += ' PRIMARY KEY';
            }

            // Add a comma after each field except the last one (or before composite primary key)
            if (index < table.fields.length - 1 || hasCompositePrimaryKey) {
                sqlScript += ',\n';
            }
        });

        // Add composite primary key constraint if needed
        if (hasCompositePrimaryKey) {
            const pkFieldNames = primaryKeyFields.map((f) => f.name).join(', ');
            sqlScript += `\n  PRIMARY KEY (${pkFieldNames})`;
        }

        sqlScript += '\n);\n';

        // Add table comment
        if (table.comments) {
            sqlScript += `COMMENT ON TABLE ${tableName} IS '${table.comments.replace(/'/g, "''")}';\n`;
        }

        table.fields.forEach((field) => {
            // Add column comment
            if (field.comments) {
                sqlScript += `COMMENT ON COLUMN ${tableName}.${field.name} IS '${field.comments.replace(/'/g, "''")}';\n`;
            }
        });

        // Generate SQL for indexes
        table.indexes.forEach((index) => {
            const fieldNames = index.fieldIds
                .map(
                    (fieldId) =>
                        table.fields.find((field) => field.id === fieldId)?.name
                )
                .filter(Boolean)
                .join(', ');

            if (fieldNames) {
                const indexName =
                    table.schema && !isDBMLFlow
                        ? `${table.schema}_${index.name}`
                        : index.name;
                sqlScript += `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName} (${fieldNames});\n`;
            }
        });
    });

    if (nonViewTables.length > 0 && (relationships?.length ?? 0) > 0) {
        sqlScript += '\n';
    }

    // Handle relationships (foreign keys)
    relationships?.forEach((relationship) => {
        const sourceTable = nonViewTables.find(
            (table) => table.id === relationship.sourceTableId
        );
        const targetTable = nonViewTables.find(
            (table) => table.id === relationship.targetTableId
        );

        const sourceTableField = sourceTable?.fields.find(
            (field) => field.id === relationship.sourceFieldId
        );
        const targetTableField = targetTable?.fields.find(
            (field) => field.id === relationship.targetFieldId
        );

        if (
            sourceTable &&
            targetTable &&
            sourceTableField &&
            targetTableField
        ) {
            // Determine which table should have the foreign key based on cardinality
            // In a 1:many relationship, the foreign key goes on the "many" side
            // If source is "one" and target is "many", FK goes on target table
            // If source is "many" and target is "one", FK goes on source table
            let fkTable, fkField, refTable, refField;

            if (
                relationship.sourceCardinality === 'one' &&
                relationship.targetCardinality === 'many'
            ) {
                // FK goes on target table
                fkTable = targetTable;
                fkField = targetTableField;
                refTable = sourceTable;
                refField = sourceTableField;
            } else if (
                relationship.sourceCardinality === 'many' &&
                relationship.targetCardinality === 'one'
            ) {
                // FK goes on source table
                fkTable = sourceTable;
                fkField = sourceTableField;
                refTable = targetTable;
                refField = targetTableField;
            } else if (
                relationship.sourceCardinality === 'one' &&
                relationship.targetCardinality === 'one'
            ) {
                // For 1:1, FK can go on either side, but typically goes on the table that references the other
                // We'll keep the current behavior for 1:1
                fkTable = sourceTable;
                fkField = sourceTableField;
                refTable = targetTable;
                refField = targetTableField;
            } else {
                // Many-to-many relationships need a junction table, skip for now
                return;
            }

            const fkTableName = fkTable.schema
                ? `${fkTable.schema}.${fkTable.name}`
                : fkTable.name;
            const refTableName = refTable.schema
                ? `${refTable.schema}.${refTable.name}`
                : refTable.name;
            sqlScript += `ALTER TABLE ${fkTableName} ADD CONSTRAINT ${relationship.name} FOREIGN KEY (${fkField.name}) REFERENCES ${refTableName} (${refField.name});\n`;
        }
    });

    return sqlScript;
};

const validateConfiguration = () => {
    const apiKey = window?.env?.OPENAI_API_KEY ?? OPENAI_API_KEY;
    const baseUrl = window?.env?.OPENAI_API_ENDPOINT ?? OPENAI_API_ENDPOINT;
    const modelName = window?.env?.LLM_MODEL_NAME ?? LLM_MODEL_NAME;

    // If using custom endpoint and model, don't require OpenAI API key
    if (baseUrl && modelName) {
        return { useCustomEndpoint: true };
    }

    // If using OpenAI's service, require API key
    if (apiKey) {
        return { useCustomEndpoint: false };
    }

    throw new Error(
        'Configuration Error: Either provide an OpenAI API key or both a custom endpoint and model name'
    );
};

export const exportSQL = async (
    diagram: Diagram,
    databaseType: DatabaseType,
    options?: {
        stream: boolean;
        onResultStream: (text: string) => void;
        signal?: AbortSignal;
    }
): Promise<string> => {
    const sqlScript = exportBaseSQL({
        diagram,
        targetDatabaseType: databaseType,
    });

    if (databaseType === diagram.databaseType) {
        return sqlScript;
    }

    const cacheKey = await generateCacheKey(databaseType, sqlScript);

    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // Validate configuration before proceeding
    const { useCustomEndpoint } = validateConfiguration();

    const [{ streamText, generateText }, { createOpenAI }] = await Promise.all([
        import('ai'),
        import('@ai-sdk/openai'),
    ]);

    const apiKey = window?.env?.OPENAI_API_KEY ?? OPENAI_API_KEY;
    const baseUrl = window?.env?.OPENAI_API_ENDPOINT ?? OPENAI_API_ENDPOINT;
    const modelName =
        window?.env?.LLM_MODEL_NAME ??
        LLM_MODEL_NAME ??
        'gpt-4o-mini-2024-07-18';

    let config: { apiKey: string; baseUrl?: string };

    if (useCustomEndpoint) {
        config = {
            apiKey: apiKey,
            baseUrl: baseUrl,
        };
    } else {
        config = {
            apiKey: apiKey,
        };
    }

    const openai = createOpenAI(config);

    const prompt = generateSQLPrompt(databaseType, sqlScript);

    try {
        if (options?.stream) {
            const { textStream, text: textPromise } = await streamText({
                model: openai(modelName),
                prompt: prompt,
            });

            for await (const textPart of textStream) {
                if (options.signal?.aborted) {
                    return '';
                }
                options.onResultStream(textPart);
            }

            const text = await textPromise;

            setInCache(cacheKey, text);
            return text;
        }

        const { text } = await generateText({
            model: openai(modelName),
            prompt: prompt,
        });

        setInCache(cacheKey, text);
        return text;
    } catch (error: unknown) {
        console.error('Error generating SQL:', error);
        if (error instanceof Error && error.message.includes('API key')) {
            throw new Error(
                'Error: Please check your API configuration. If using a custom endpoint, make sure the endpoint URL is correct.'
            );
        }
        throw new Error(
            'Error generating SQL script. Please check your configuration and try again.'
        );
    }
};

function getMySQLDataTypeSize(type: DataType) {
    return (
        {
            tinyint: 1,
            smallint: 2,
            mediumint: 3,
            integer: 4,
            bigint: 8,
            float: 4,
            double: 8,
            decimal: 16,
            numeric: 16,
            // Add other relevant data types if needed
        }[type.name.toLowerCase()] || 0
    );
}

function alignForeignKeyDataTypes(diagram: Diagram) {
    const { tables, relationships } = diagram;

    if (
        !tables ||
        tables.length === 0 ||
        !relationships ||
        relationships.length === 0
    ) {
        return;
    }

    // Convert tables to a map for quick lookup
    const tableMap = new Map<string, DBTable>();
    tables.forEach((table) => {
        tableMap.set(table.id, table);
    });

    // Iterate through each relationship to update the child table column data types
    relationships.forEach((relationship) => {
        const { sourceTableId, sourceFieldId, targetTableId, targetFieldId } =
            relationship;

        const sourceTable = tableMap.get(sourceTableId);
        const targetTable = tableMap.get(targetTableId);

        if (sourceTable && targetTable) {
            const sourceField = sourceTable.fields.find(
                (field: { id: string }) => field.id === sourceFieldId
            );
            const targetField = targetTable.fields.find(
                (field: { id: string }) => field.id === targetFieldId
            );

            if (sourceField && targetField) {
                const sourceSize = getMySQLDataTypeSize(sourceField.type);
                const targetSize = getMySQLDataTypeSize(targetField.type);

                if (sourceSize > targetSize) {
                    // Adjust the child field data type to the larger data type
                    targetField.type = sourceField.type;
                } else if (targetSize > sourceSize) {
                    // Adjust the child field data type to the larger data type
                    sourceField.type = targetField.type;
                }
            }
        }
    });
}

const generateSQLPrompt = (databaseType: DatabaseType, sqlScript: string) => {
    const basePrompt = `
        You are generating SQL scripts for creating database tables and sequences, handling primary keys, indices, and other table attributes.
        The following instructions will guide you in optimizing the scripts for the ${databaseType} dialect:
        - **Column Names**: Do **not** modify the names of columns. Ensure that all column names in the generated SQL script are exactly as provided in the input schema. If the input specifies a column name, it must appear in the output script unchanged.
        - **Column Name Conflicts**: When a column name conflicts with a data type or reserved keyword (e.g., fulltext, Primary, Column), escape the column name by enclosing it.
    `;

    const dialectInstructionMap: Record<DatabaseType, string> = {
        generic: '',
        postgresql: `
        - **Sequence Creation**: Use \`CREATE SEQUENCE IF NOT EXISTS\` for sequence creation.
        - **Table and Index Creation**: Use \`CREATE TABLE IF NOT EXISTS\` and \`CREATE INDEX IF NOT EXISTS\` to avoid errors if the object already exists.
        - **Serial and Identity Columns**: For auto-increment columns, use \`SERIAL\` or \`GENERATED BY DEFAULT AS IDENTITY\`.
        - **Conditional Statements**: Utilize PostgreSQL's support for \`IF NOT EXISTS\` in relevant \`CREATE\` statements.
    `,
        mysql: `
        - **Table Creation**: Use \`CREATE TABLE IF NOT EXISTS\` for creating tables. While creating the table structure, ensure that all foreign key columns use the correct data types as determined in the foreign key review.
        - **Auto-Increment**: Use \`AUTO_INCREMENT\` for auto-incrementing primary key columns.
        - **Index Creation**: Place all \`CREATE INDEX\` statements separately after the \`CREATE TABLE\` statement. Avoid using \`IF NOT EXISTS\` in \`CREATE INDEX\` statements.
        - **Indexing TEXT/BLOB Columns**: Do **not** create regular indexes on \`TEXT\` or \`BLOB\` columns. If indexing these types is required, use \`FULLTEXT\` indexes specifically for \`TEXT\` columns where appropriate, or consider alternative strategies.
        - **Date Column Defaults**: Avoid using \`CURRENT_DATE\` as a default for \`DATE\` columns. Instead, consider using \`DEFAULT NULL\` or handle default values programmatically.
        - **Timestamp Default Value**: Use \`DEFAULT CURRENT_TIMESTAMP\` for \`TIMESTAMP\` columns. Only one \`TIMESTAMP\` column can have \`CURRENT_TIMESTAMP\` as the default without specifying \`ON UPDATE\`.
        - **Boolean Columns**: Use \`TINYINT(1)\` instead of \`BOOLEAN\` for better compatibility with MySQL/MariaDB versions that might not fully support the \`BOOLEAN\` data type.
        - **TEXT and BLOB Constraints**: Do not use \`NOT NULL\` with \`TEXT\` or \`BLOB\` columns, as these types do not support the \`NOT NULL\` constraint in MariaDB.
        - **ENUM Data Type**: Ensure that default values are compatible and that the \`ENUM\` declaration adheres to MariaDB's syntax requirements.
        - **Default Values**: Ensure that default values for columns, especially \`DECIMAL\` and \`ENUM\`, are correctly formatted and comply with MariaDB's SQL syntax.
        - **Sequences**: Recognize that MySQL does not natively support sequences. Use \`AUTO_INCREMENT\` instead.

        **Reminder**: Ensure all column names that conflict with reserved keywords or data types (like \`fulltext\`) are escaped using backticks (\`).
    `,
        sql_server: `
        - **Sequence Creation**: Use \`CREATE SEQUENCE\` without \`IF NOT EXISTS\`, and employ conditional logic (\`IF NOT EXISTS\`) to check for sequence existence before creation.
        - **Identity Columns**: Always prefer using the \`IDENTITY\` keyword (e.g., \`INT IDENTITY(1,1)\`) for auto-incrementing primary key columns when possible.
        - **Conditional Logic**: Use a conditional block like \`IF NOT EXISTS (SELECT * FROM sys.objects WHERE ...)\` since SQL Server doesn't support \`IF NOT EXISTS\` directly in \`CREATE\` statements.
        - **Avoid Unsupported Syntax**: Ensure the script does not include unsupported statements like \`CREATE TABLE IF NOT EXISTS\`.

        **Reminder**: Ensure all column names that conflict with reserved keywords or data types (e.g., key, primary, column, table), escape the column name by enclosing it.
    `,
        mariadb: `
        - **Table Creation**: Use \`CREATE TABLE IF NOT EXISTS\` for creating tables. While creating the table structure, ensure that all foreign key columns use the correct data types as determined in the foreign key review.
        - **Auto-Increment**: Use \`AUTO_INCREMENT\` for auto-incrementing primary key columns.
        - **Index Creation**: Place all \`CREATE INDEX\` statements separately after the \`CREATE TABLE\` statement. Avoid using \`IF NOT EXISTS\` in \`CREATE INDEX\` statements.
        - **Indexing TEXT/BLOB Columns**: Do **not** create regular indexes on \`TEXT\` or \`BLOB\` columns. If indexing these types is required, use \`FULLTEXT\` indexes specifically for \`TEXT\` columns where appropriate, or consider alternative strategies.
        - **Date Column Defaults**: Avoid using \`CURRENT_DATE\` as a default for \`DATE\` columns. Instead, consider using \`DEFAULT NULL\` or handle default values programmatically.
        - **Timestamp Default Value**: Use \`DEFAULT CURRENT_TIMESTAMP\` for \`TIMESTAMP\` columns. Only one \`TIMESTAMP\` column can have \`CURRENT_TIMESTAMP\` as the default without specifying \`ON UPDATE\`.
        - **Boolean Columns**: Use \`TINYINT(1)\` instead of \`BOOLEAN\` for better compatibility with MySQL/MariaDB versions that might not fully support the \`BOOLEAN\` data type.
        - **TEXT and BLOB Constraints**: Do not use \`NOT NULL\` with \`TEXT\` or \`BLOB\` columns, as these types do not support the \`NOT NULL\` constraint in MariaDB.
        - **ENUM Data Type**: Ensure that default values are compatible and that the \`ENUM\` declaration adheres to MariaDB's syntax requirements.
        - **Default Values**: Ensure that default values for columns, especially \`DECIMAL\` and \`ENUM\`, are correctly formatted and comply with MariaDB's SQL syntax.
        - **Sequences**: Recognize that MySQL does not natively support sequences. Use \`AUTO_INCREMENT\` instead.

        **Reminder**: Ensure all column names that conflict with reserved keywords or data types (like \`fulltext\`) are escaped using backticks (\`).
        `,
        sqlite: `
        - **Table Creation**: Use \`CREATE TABLE IF NOT EXISTS\`.
        - **Auto-Increment**: Use \`AUTOINCREMENT\` with \`INTEGER PRIMARY KEY\` for auto-increment functionality.
        - **No Sequence Support**: SQLite does not support sequences; rely solely on \`AUTOINCREMENT\` for similar functionality.
        - **Foreign Key Constraints**: Do not use \`ALTER TABLE\` to add foreign key constraints. SQLite does not support adding foreign keys to an existing table after it has been created. Always define foreign key constraints during the \`CREATE TABLE\` statement. Avoid using named constraints in foreign key definitions.
        - **Adding Foreign Keys to Existing Tables**: If adding a foreign key to an existing table is required, suggest creating a new table with the foreign key constraint, migrating the data, and renaming the new table to the original name.
        - **General SQLite Constraints**: Remember, \`ALTER TABLE\` in SQLite is limited and cannot add constraints after the table is created.
        - **Conditional Logic**: Ensure the script uses SQLite-compatible syntax and does not include unsupported features.
    `,
        clickhouse: '',
        cockroachdb: `
        - **Sequence Creation**: Use \`CREATE SEQUENCE IF NOT EXISTS\` for sequence creation.
        - **Table and Index Creation**: Use \`CREATE TABLE IF NOT EXISTS\` and \`CREATE INDEX IF NOT EXISTS\` to avoid errors if the object already exists.
        - **Serial and Identity Columns**: For auto-increment columns, use \`SERIAL\` or \`GENERATED BY DEFAULT AS IDENTITY\`.
        - **Conditional Statements**: Utilize PostgreSQL's support for \`IF NOT EXISTS\` in relevant \`CREATE\` statements.
    `,
        oracle: '',
    };

    const dialectInstruction = dialectInstructionMap[databaseType] ?? '';

    const additionalInstructions = `
    **Provide just the SQL commands without markdown tags.**

    Just answer with the script with no additional details.

    No images are allowed. Do not try to generate or link images, including base64 data URLs.

    Feel free to suggest corrections for suspected typos.
    `;

    return `${basePrompt}\n${dialectInstruction}\n
        - **Validation**: After generating the script, validate it against the respective SQL dialect by attempting to execute it in a corresponding database environment.
        - **Syntax Checking**: Use SQL linting tools specific to each dialect to ensure the script is free from syntax errors.
        - **Manual Review**: Include a step where a knowledgeable developer reviews the generated script to ensure it meets the required specifications and adheres to best practices.

        Here is the SQL script that needs to be optimized or generated according to the instructions above:

        ${sqlScript}

        ${additionalInstructions}
    `;
};
