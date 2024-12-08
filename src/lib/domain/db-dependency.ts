import { z } from 'zod';
import type { ViewInfo } from '../data/import-metadata/metadata-types/view-info';
import { DatabaseType } from './database-type';
import {
    schemaNameToDomainSchemaName,
    schemaNameToSchemaId,
} from './db-schema';
import { decodeViewDefinition, type DBTable } from './db-table';
import { generateId } from '@/lib/utils';
import type { AST } from 'node-sql-parser';

export interface DBDependency {
    id: string;
    schema?: string;
    tableId: string;
    dependentSchema?: string;
    dependentTableId: string;
    createdAt: number;
}

export const dbDependencySchema: z.ZodType<DBDependency> = z.object({
    id: z.string(),
    schema: z.string().optional(),
    tableId: z.string(),
    dependentSchema: z.string().optional(),
    dependentTableId: z.string(),
    createdAt: z.number(),
});

export const shouldShowDependencyBySchemaFilter = (
    dependency: DBDependency,
    filteredSchemas?: string[]
): boolean =>
    !filteredSchemas ||
    !dependency.schema ||
    !dependency.dependentSchema ||
    (filteredSchemas.includes(schemaNameToSchemaId(dependency.schema)) &&
        filteredSchemas.includes(
            schemaNameToSchemaId(dependency.dependentSchema)
        ));

const astDatabaseTypes: Record<DatabaseType, string> = {
    [DatabaseType.POSTGRESQL]: 'postgresql',
    [DatabaseType.MYSQL]: 'postgresql',
    [DatabaseType.MARIADB]: 'postgresql',
    [DatabaseType.GENERIC]: 'postgresql',
    [DatabaseType.SQLITE]: 'postgresql',
    [DatabaseType.SQL_SERVER]: 'postgresql',
    [DatabaseType.CLICKHOUSE]: 'postgresql',
    [DatabaseType.COCKROACHDB]: 'postgresql',
};

export const createDependenciesFromMetadata = async ({
    views,
    tables,
    databaseType,
}: {
    views: ViewInfo[];
    tables: DBTable[];
    databaseType: DatabaseType;
}): Promise<DBDependency[]> => {
    const { Parser } = await import('node-sql-parser');
    const parser = new Parser();

    const dependencies = views
        .flatMap((view) => {
            const viewSchema = schemaNameToDomainSchemaName(view.schema);
            const viewTable = tables.find(
                (table) =>
                    table.name === view.view_name && viewSchema === table.schema
            );

            if (!viewTable) {
                console.warn(
                    `Source table for view ${view.view_name} not found (schema: ${viewSchema})`
                );
                return []; // Skip this view and proceed to the next
            }

            if (view.view_definition) {
                try {
                    const decodedViewDefinition = decodeViewDefinition(
                        databaseType,
                        view.view_definition
                    );

                    let modifiedViewDefinition = '';
                    if (
                        databaseType === DatabaseType.MYSQL ||
                        databaseType === DatabaseType.MARIADB
                    ) {
                        modifiedViewDefinition = preprocessViewDefinitionMySQL(
                            decodedViewDefinition
                        );
                    } else if (databaseType === DatabaseType.SQL_SERVER) {
                        modifiedViewDefinition =
                            preprocessViewDefinitionSQLServer(
                                decodedViewDefinition
                            );
                    } else {
                        modifiedViewDefinition = preprocessViewDefinition(
                            decodedViewDefinition
                        );
                    }

                    // Parse using the appropriate dialect
                    const ast = parser.astify(modifiedViewDefinition, {
                        database: astDatabaseTypes[databaseType],
                        type: 'select', // Parsing a SELECT statement
                    });

                    let relatedTables = extractTablesFromAST(ast);

                    // Filter out duplicate tables without schema
                    relatedTables = filterDuplicateTables(relatedTables);

                    return relatedTables.map((relTable) => {
                        const relSchema = relTable.schema || view.schema; // Use view's schema if relSchema is undefined
                        const relTableName = relTable.tableName;

                        const table = tables.find(
                            (table) =>
                                table.name === relTableName &&
                                (table.schema || '') === relSchema
                        );

                        if (table) {
                            const dependency: DBDependency = {
                                id: generateId(),
                                schema: view.schema,
                                tableId: table.id, // related table
                                dependentSchema: table.schema,
                                dependentTableId: viewTable.id, // dependent view
                                createdAt: Date.now(),
                            };

                            return dependency;
                        } else {
                            console.warn(
                                `Dependent table ${relSchema}.${relTableName} not found for view ${view.schema}.${view.view_name}`
                            );
                            return null;
                        }
                    });
                } catch (error) {
                    console.error(
                        `Error parsing view ${view.schema}.${view.view_name}:`,
                        error
                    );
                    return [];
                }
            } else {
                console.warn(
                    `View definition missing for ${view.schema}.${view.view_name}`
                );
                return [];
            }
        })
        .filter((dependency) => dependency !== null);

    return dependencies;
};

// Add this new function to filter out duplicate tables
function filterDuplicateTables(
    tables: { schema?: string; tableName: string }[]
): { schema?: string; tableName: string }[] {
    const tableMap = new Map<string, { schema?: string; tableName: string }>();

    for (const table of tables) {
        const key = table.tableName;
        const existingTable = tableMap.get(key);

        if (!existingTable || (table.schema && !existingTable.schema)) {
            tableMap.set(key, table);
        }
    }

    return Array.from(tableMap.values());
}

// Preprocess the view_definition to remove schema from CREATE VIEW
function preprocessViewDefinition(viewDefinition: string): string {
    if (!viewDefinition) {
        return '';
    }

    // Remove leading and trailing whitespace
    viewDefinition = viewDefinition.replace(/\s+/g, ' ').trim();

    // Replace escaped double quotes with regular ones
    viewDefinition = viewDefinition.replace(/\\"/g, '"');

    // Replace 'CREATE MATERIALIZED VIEW' with 'CREATE VIEW'
    viewDefinition = viewDefinition.replace(
        /CREATE\s+MATERIALIZED\s+VIEW/i,
        'CREATE VIEW'
    );

    // Regular expression to match 'CREATE VIEW [schema.]view_name [ (column definitions) ] AS'
    // This regex captures the view name and skips any content between the view name and 'AS'
    const regex =
        /CREATE\s+VIEW\s+(?:(?:`[^`]+`|"[^"]+"|\w+)\.)?(?:`([^`]+)`|"([^"]+)"|(\w+))[\s\S]*?\bAS\b\s+/i;

    const match = viewDefinition.match(regex);
    let modifiedDefinition: string;

    if (match) {
        const viewName = match[1] || match[2] || match[3];
        // Extract the SQL after the 'AS' keyword
        const restOfDefinition = viewDefinition.substring(
            match.index! + match[0].length
        );

        // Replace double-quoted identifiers with unquoted ones
        let modifiedSQL = restOfDefinition.replace(/"(\w+)"/g, '$1');

        // Replace '::' type casts with 'CAST' expressions
        modifiedSQL = modifiedSQL.replace(
            /\(([^()]+)\)::(\w+)/g,
            'CAST($1 AS $2)'
        );

        // Remove ClickHouse-specific syntax that may still be present
        // For example, remove SETTINGS clauses inside the SELECT statement
        modifiedSQL = modifiedSQL.replace(/\bSETTINGS\b[\s\S]*$/i, '');

        modifiedDefinition = `CREATE VIEW ${viewName} AS ${modifiedSQL}`;
    } else {
        console.warn('Could not preprocess view definition:', viewDefinition);
        modifiedDefinition = viewDefinition;
    }

    return modifiedDefinition;
}

// Preprocess the view_definition for SQL Server
function preprocessViewDefinitionSQLServer(viewDefinition: string): string {
    if (!viewDefinition) {
        return '';
    }

    // Remove BOM if present
    viewDefinition = viewDefinition.replace(/^\uFEFF/, '');

    // Normalize whitespace
    viewDefinition = viewDefinition.replace(/\s+/g, ' ').trim();

    // Remove square brackets and replace with double quotes
    viewDefinition = viewDefinition.replace(/\[([^\]]+)\]/g, '"$1"');

    // Remove database names from fully qualified identifiers
    viewDefinition = viewDefinition.replace(
        /"([a-zA-Z0-9_]+)"\."([a-zA-Z0-9_]+)"\."([a-zA-Z0-9_]+)"/g,
        '"$2"."$3"'
    );

    // Replace SQL Server functions with PostgreSQL equivalents
    viewDefinition = viewDefinition.replace(/\bGETDATE\(\)/gi, 'NOW()');
    viewDefinition = viewDefinition.replace(/\bISNULL\(/gi, 'COALESCE(');

    // Replace 'TOP N' with 'LIMIT N' at the end of the query
    const topMatch = viewDefinition.match(/SELECT\s+TOP\s+(\d+)/i);
    if (topMatch) {
        const topN = topMatch[1];
        viewDefinition = viewDefinition.replace(
            /SELECT\s+TOP\s+\d+/i,
            'SELECT'
        );
        viewDefinition = viewDefinition.replace(/;+\s*$/, ''); // Remove semicolons at the end
        viewDefinition += ` LIMIT ${topN}`;
    }

    viewDefinition = viewDefinition.replace(/\n/g, ''); // Remove newlines

    // Adjust CREATE VIEW syntax
    const regex =
        /CREATE\s+VIEW\s+(?:"?([^".\s]+)"?\.)?"?([^".\s]+)"?\s+AS\s+/i;
    const match = viewDefinition.match(regex);
    let modifiedDefinition: string;

    if (match) {
        const viewName = match[2];
        const modifiedSQL = viewDefinition.substring(
            match.index! + match[0].length
        );

        // Remove semicolons at the end
        const finalSQL = modifiedSQL.replace(/;+\s*$/, '');

        modifiedDefinition = `CREATE VIEW "${viewName}" AS ${finalSQL}`;
    } else {
        console.warn('Could not preprocess view definition:', viewDefinition);
        modifiedDefinition = viewDefinition;
    }

    return modifiedDefinition;
}

// Preprocess the view_definition to remove schema from CREATE VIEW
function preprocessViewDefinitionMySQL(viewDefinition: string): string {
    if (!viewDefinition) {
        return '';
    }

    // Remove any trailing semicolons
    viewDefinition = viewDefinition.replace(/;\s*$/, '');

    // Remove backticks from identifiers
    viewDefinition = viewDefinition.replace(/`/g, '');

    // Remove unnecessary parentheses around joins and ON clauses
    viewDefinition = removeRedundantParentheses(viewDefinition);

    return viewDefinition;
}

function removeRedundantParentheses(sql: string): string {
    // Regular expressions to match unnecessary parentheses
    const patterns = [
        /\(\s*(JOIN\s+[^()]+?)\s*\)/gi,
        /\(\s*(ON\s+[^()]+?)\s*\)/gi,
        // Additional patterns if necessary
    ];

    let prevSql;
    do {
        prevSql = sql;
        patterns.forEach((pattern) => {
            sql = sql.replace(pattern, '$1');
        });
    } while (sql !== prevSql);

    return sql;
}

function extractTablesFromAST(
    ast: AST | AST[]
): { schema?: string; tableName: string }[] {
    const tablesMap = new Map<string, { schema: string; tableName: string }>();
    const visitedNodes = new Set();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function traverse(node: any) {
        if (!node || visitedNodes.has(node)) return;
        visitedNodes.add(node);

        if (Array.isArray(node)) {
            node.forEach(traverse);
        } else if (typeof node === 'object') {
            // Check if node represents a table
            if (
                Object.hasOwnProperty.call(node, 'table') &&
                typeof node.table === 'string'
            ) {
                let schema = node.db || node.schema;
                const tableName = node.table;
                if (tableName) {
                    // Assign default schema if undefined
                    schema = schemaNameToDomainSchemaName(schema) || '';
                    const key = `${schema}.${tableName}`;
                    if (!tablesMap.has(key)) {
                        tablesMap.set(key, { schema, tableName });
                    }
                }
            }

            // Recursively traverse all properties
            for (const key in node) {
                if (Object.hasOwnProperty.call(node, key)) {
                    traverse(node[key]);
                }
            }
        }
    }

    traverse(ast);

    return Array.from(tablesMap.values());
}
