/* eslint-disable */
import type { ViewInfo } from '../data/import-metadata/metadata-types/view-info';
import { DatabaseType } from './database-type';
import { schemaNameToSchemaId } from './db-schema';
import type { DBTable } from './db-table';
import { generateId } from '@/lib/utils';
import { Parser } from 'node-sql-parser';

export interface DBDependency {
    id: string;
    schema?: string;
    tableId: string;
    dependentSchema?: string;
    dependentTableId: string;
    createdAt: number;
}

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
    [DatabaseType.MYSQL]: 'mysql',
    [DatabaseType.MARIADB]: 'mariadb',
    [DatabaseType.GENERIC]: 'postgresql',
    [DatabaseType.SQLITE]: 'sqlite',
    [DatabaseType.SQL_SERVER]: 'postgresql',
};

export const createDependenciesFromMetadata = ({
    views,
    tables,
    databaseType,
}: {
    views: ViewInfo[];
    tables: DBTable[];
    databaseType: DatabaseType;
}): DBDependency[] => {
    const parser = new Parser();

    const dependencies = views
        .flatMap((view) => {
            const sourceTable = tables.find(
                (table) =>
                    table.name === view.view_name &&
                    table.schema === view.schema
            );

            if (!sourceTable) {
                console.warn(
                    `Source table for view ${view.schema}.${view.view_name} not found`
                );
                return []; // Skip this view and proceed to the next
            }

            if (view.view_definition) {
                try {

                    // Pre-process the view_definition
                    const modifiedViewDefinition = preprocessViewDefinition(
                        view.view_definition
                    );

                    // Parse using PostgreSQL dialect
                    const ast = parser.astify(modifiedViewDefinition, {
                        database: astDatabaseTypes[databaseType],
                    });

                    const dependentTables = extractTablesFromAST(ast, view.schema);

                    return dependentTables.map((depTable) => {
                        const depSchema = depTable.schema ?? view.schema; // Use view's schema if depSchema is undefined
                        const depTableName = depTable.tableName;

                        const targetTable = tables.find(
                            (table) =>
                                table.name === depTableName &&
                                table.schema === depSchema
                        );

                        if (targetTable) {
                            const dependency: DBDependency = {
                                id: generateId(),
                                schema: view.schema,
                                tableId: sourceTable.id,
                                dependentSchema: targetTable.schema,
                                dependentTableId: targetTable.id,
                                createdAt: Date.now(),
                            };
                            return dependency;
                        } else {
                            console.warn(
                                `Dependent table ${depSchema}.${depTableName} not found for view ${view.schema}.${view.view_name}`
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

// Preprocess the view_definition to remove schema from CREATE VIEW
function preprocessViewDefinition(viewDefinition: string): string {
    if (!viewDefinition) {
        return '';
    }

    // Replace 'CREATE MATERIALIZED VIEW' with 'CREATE VIEW'
    viewDefinition = viewDefinition.replace(/CREATE\s+MATERIALIZED\s+VIEW/i, 'CREATE VIEW');

    // Regular expression to match 'CREATE VIEW [schema.]view_name [ (column definitions) ] AS'
    // This regex captures the view name and skips any content between the view name and 'AS'
    const regex = /CREATE\s+VIEW\s+(?:(?:`[^`]+`|"[^"]+"|\w+)\.)?(?:`([^`]+)`|"([^"]+)"|(\w+))[\s\S]*?\bAS\b\s+/i;

    const match = viewDefinition.match(regex);
    let modifiedDefinition: string;

    if (match) {
        const viewName = match[1] || match[2] || match[3];
        // Extract the SQL after the 'AS' keyword
        const restOfDefinition = viewDefinition.substring(match.index! + match[0].length);

        // Replace double-quoted identifiers with unquoted ones
        let modifiedSQL = restOfDefinition.replace(/"(\w+)"/g, '$1');

        // Replace '::' type casts with 'CAST' expressions
        modifiedSQL = modifiedSQL.replace(/\(([^()]+)\)::(\w+)/g, 'CAST($1 AS $2)');

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

function extractTablesFromAST(
    ast: any,
    defaultSchema: string
): { schema?: string; tableName: string }[] {
    const tablesMap = new Map<string, { schema: string; tableName: string }>();
    const visitedNodes = new Set();

    function traverse(node: any) {
        if (!node || visitedNodes.has(node)) return;
        visitedNodes.add(node);

        if (Array.isArray(node)) {
            node.forEach(traverse);
        } else if (typeof node === 'object') {
            // Check if node represents a table
            if (
                node.hasOwnProperty('table') &&
                typeof node.table === 'string'
            ) {
                let schema = node.db || node.schema;
                const tableName = node.table;
                if (tableName) {
                    // Assign default schema if undefined
                    schema = schema || defaultSchema;
                    const key = `${schema}.${tableName}`;
                    if (!tablesMap.has(key)) {
                        tablesMap.set(key, { schema, tableName });
                    }
                }
            }

            // Recursively traverse all properties
            for (const key in node) {
                if (node.hasOwnProperty(key)) {
                    traverse(node[key]);
                }
            }
        }
    }

    traverse(ast);

    return Array.from(tablesMap.values());
}
