import type { ViewInfo } from '../data/import-metadata/metadata-types/view-info';
import { DatabaseType } from './database-type';
import {
    schemaNameToDomainSchemaName,
    schemaNameToSchemaId,
} from './db-schema';
import type { DBTable } from './db-table';
import { generateId } from '@/lib/utils';
import type { AST } from 'node-sql-parser';
import { Parser } from 'node-sql-parser';
import { Buffer } from 'buffer';

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
    [DatabaseType.SQLITE]: 'postgresql',
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
            const viewSchema = schemaNameToDomainSchemaName(view.schema);
            const sourceTable = tables.find(
                (table) =>
                    table.name === view.view_name && viewSchema === table.schema
            );

            if (!sourceTable) {
                console.warn(
                    `Source table for view ${view.view_name} not found (schema: ${viewSchema})`
                );
                return []; // Skip this view and proceed to the next
            }

            if (view.view_definition) {
                try {
                    let decodedViewDefinition: string;

                    // For other database types, decode the base64-encoded view definition
                    if (databaseType === DatabaseType.SQL_SERVER) {
                        decodedViewDefinition = Buffer.from(
                            view.view_definition,
                            'base64'
                        ).toString('utf16le');
                    } else {
                        decodedViewDefinition = Buffer.from(
                            view.view_definition,
                            'base64'
                        ).toString('utf-8');
                    }

                    let modifiedViewDefinition = '';
                    if (
                        databaseType === DatabaseType.MYSQL ||
                        databaseType === DatabaseType.MARIADB
                    ) {
                        modifiedViewDefinition = preprocessViewDefinitionMySQL(
                            decodedViewDefinition,
                            view.view_name
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
                    });

                    const dependentTables = extractTablesFromAST(
                        ast,
                        viewSchema
                    );

                    return dependentTables.map((depTable) => {
                        const depSchema = depTable.schema ?? view.schema; // Use view's schema if depSchema is undefined
                        const depTableName = depTable.tableName;

                        const targetTable = tables.find(
                            (table) =>
                                table.name === depTableName &&
                                (table.schema || '') === depSchema
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
function preprocessViewDefinitionMySQL(
    viewDefinition: string,
    viewName: string
): string {
    if (!viewDefinition) {
        return '';
    }

    // Check if viewDefinition starts with 'CREATE VIEW', case-insensitive
    if (!/^\s*CREATE\s+VIEW/i.test(viewDefinition)) {
        // Prepend 'CREATE VIEW view_name AS ' if missing
        viewDefinition = `CREATE VIEW ${viewName} AS ${viewDefinition}`;
    }

    // Regular expression to match 'CREATE VIEW [schema.]view_name ... AS'
    const regex = /CREATE\s+VIEW\s+(?:`?(\w+)`?\.)?`?(\w+)`?[\s\S]*?\bAS\b\s+/i;
    const match = viewDefinition.match(regex);
    let modifiedDefinition: string;

    if (match) {
        const extractedViewName = match[2];
        // Extract the SQL after the 'AS' keyword
        let modifiedSQL = viewDefinition.substring(
            match.index! + match[0].length
        );

        // Remove database names from fully qualified identifiers
        modifiedSQL = modifiedSQL.replace(
            /`(\w+)`\.`(\w+)`\.`(\w+)`/g,
            '`$2`.`$3`'
        );
        modifiedSQL = modifiedSQL.replace(/`(\w+)`\.`(\w+)`/g, '`$2`');

        // Remove outermost parentheses around the FROM clause
        modifiedSQL = modifiedSQL.replace(
            /FROM\s*\(\s*([\s\S]+?)\s*\)/i,
            'FROM $1'
        );

        // Remove extra parentheses around JOIN expressions
        modifiedSQL = modifiedSQL.replace(
            /\(\s*(`?\w+`?\s+(?:JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN)[\s\S]+?)\s*\)/gi,
            '$1'
        );

        // Simplify nested parentheses in ON conditions (carefully)
        modifiedSQL = modifiedSQL.replace(
            /ON\s*\(\s*\(([\s\S]+?)\)\s*\)/gi,
            'ON ($1)'
        );
        modifiedSQL = modifiedSQL.replace(
            /ON\s*\(\s*([\s\S]+?)\s*\)/gi,
            'ON $1'
        );

        // Preserve backticks (MySQL uses backticks for identifiers)
        modifiedDefinition = `CREATE VIEW \`${extractedViewName}\` AS ${modifiedSQL}`;
    } else {
        console.warn('Could not preprocess view definition:', viewDefinition);
        modifiedDefinition = viewDefinition;
    }

    return modifiedDefinition;
}

function extractTablesFromAST(
    ast: AST | AST[],
    defaultSchema?: string
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
                    schema =
                        schemaNameToDomainSchemaName(schema) ||
                        defaultSchema ||
                        '';
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
