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

                    const dependentTables = extractTablesFromAST(ast);

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

    // Regular expression to match 'CREATE VIEW [schema.]view_name [ (column definitions) ] AS'
    const regex =
        /CREATE\s+VIEW\s+(?:(?:`[^`]+`|"[^"]+"|\w+)\.)?(?:`([^`]+)`|"([^"]+)"|(\w+))(?:\s*\([^\)]*\))?\s+AS\s+/i;

    const match = viewDefinition.match(regex);
    if (match) {
        const viewName = match[1] || match[2] || match[3];
        const restOfDefinition = viewDefinition.substring(
            match.index! + match[0].length
        );
        const modifiedDefinition = `CREATE VIEW ${viewName} AS ${restOfDefinition}`;

        return modifiedDefinition;
    } else {
        console.warn('Could not preprocess view definition:', viewDefinition);
        return viewDefinition;
    }
}

// Updated helper function to extract table names from the AST
function extractTablesFromAST(
    ast: any
): { schema?: string; tableName: string }[] {
    const tablesMap = new Map<string, { schema?: string; tableName: string }>();

    function traverseFromClause(node: any) {
        if (!node) return;

        if (Array.isArray(node)) {
            node.forEach(traverseFromClause);
        } else if (typeof node === 'object') {
            // Check if node represents a table in 'FROM' clause or a join
            if (
                node.hasOwnProperty('table') &&
                typeof node.table === 'string'
            ) {
                const schema = node.db || node.schema;
                const tableName = node.table;
                if (tableName) {
                    const key = `${schema || ''}.${tableName}`;
                    if (!tablesMap.has(key)) {
                        tablesMap.set(key, { schema, tableName });
                    }
                }
            }
            // Traverse 'left' and 'right' in joins
            if (node.left) traverseFromClause(node.left);
            if (node.right) traverseFromClause(node.right);
        }
    }

    if (ast && ast.select && ast.select.from) {
        traverseFromClause(ast.select.from);
    }

    return Array.from(tablesMap.values());
}
