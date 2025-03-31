import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import { fromPostgres } from './dialect-importers/postgresql/postgresql';
import { fromPostgresDump } from './dialect-importers/postgresql/postgresql-dump';
import type { SQLParserResult } from './common';
import { convertToChartDBDiagram } from './common';

/**
 * Detect if SQL content is from pg_dump format
 * @param sqlContent SQL content as string
 * @returns boolean indicating if the SQL is likely from pg_dump
 */
function isPgDumpFormat(sqlContent: string): boolean {
    // pg_dump output often contains specific markers
    const pgDumpMarkers = [
        'SET statement_timeout',
        'SET lock_timeout',
        'SET client_encoding',
        'SET standard_conforming_strings',
        'SELECT pg_catalog.set_config',
        'ALTER TABLE ONLY',
        'COMMENT ON EXTENSION',
    ];

    // Check for specific pg_dump patterns
    for (const marker of pgDumpMarkers) {
        if (sqlContent.includes(marker)) {
            console.log(`Detected pg_dump format (found marker: ${marker})`);
            return true;
        }
    }

    // Check for other pg_dump patterns like COPY statements or specific comments
    if (
        (sqlContent.includes('COPY') && sqlContent.includes('FROM stdin')) ||
        sqlContent.match(/--\s+Name:.*Type:/i)
    ) {
        console.log(
            'Detected pg_dump format (COPY statements or specific comments)'
        );
        return true;
    }

    return false;
}

/**
 * Parse SQL statements and convert to a Diagram object
 * @param sqlContent SQL content as string
 * @param sourceDatabaseType Source database type
 * @param targetDatabaseType Target database type for the diagram
 * @returns Diagram object
 */
export function sqlImportToDiagram({
    sqlContent,
    sourceDatabaseType,
    targetDatabaseType = DatabaseType.GENERIC,
}: {
    sqlContent: string;
    sourceDatabaseType: DatabaseType;
    targetDatabaseType: DatabaseType;
}): Diagram {
    console.log('SQL Import starting with:', {
        contentLength: sqlContent.length,
        sourceDatabaseType,
        targetDatabaseType,
    });

    let parserResult: SQLParserResult;

    // Select the appropriate parser based on database type
    switch (sourceDatabaseType) {
        case DatabaseType.POSTGRESQL:
            console.log('Using PostgreSQL parser');
            // Check if the SQL is from pg_dump and use the appropriate parser
            if (isPgDumpFormat(sqlContent)) {
                console.log(
                    'Detected PostgreSQL dump format, using specialized parser'
                );
                parserResult = fromPostgresDump(sqlContent);
            } else {
                console.log('Using standard PostgreSQL parser');
                parserResult = fromPostgres(sqlContent);
            }
            break;
        // Add more database types here as they're implemented
        // case DatabaseType.MYSQL:
        //   parserResult = fromMySQL(sqlContent);
        //   break;
        // case DatabaseType.SQL_SERVER:
        //   parserResult = fromSQLServer(sqlContent);
        //   break;
        default:
            throw new Error(`Unsupported database type: ${sourceDatabaseType}`);
    }

    console.log('Parser result:', {
        tablesCount: parserResult.tables.length,
        relationshipsCount: parserResult.relationships.length,
        tables: parserResult.tables.map((t) => t.name),
    });

    // Convert the parsed SQL to a diagram
    const diagram = convertToChartDBDiagram(
        parserResult,
        sourceDatabaseType,
        targetDatabaseType
    );

    console.log('Generated diagram:', {
        tables: diagram.tables?.length || 0,
        relationships: diagram.relationships?.length || 0,
        tableNames: diagram.tables?.map((t) => t.name) || [],
    });

    return diagram;
}

/**
 * Parse SQL and identify any errors
 * @param sqlContent SQL content as string
 * @param sourceDatabaseType Source database type
 * @returns Object with success status and error information
 */
export function parseSQLError({
    sqlContent,
    sourceDatabaseType,
}: {
    sqlContent: string;
    sourceDatabaseType: DatabaseType;
}): { success: boolean; error?: string; line?: number; column?: number } {
    try {
        // Validate SQL based on the database type
        switch (sourceDatabaseType) {
            case DatabaseType.POSTGRESQL:
                // PostgreSQL validation - check format and use appropriate parser
                if (isPgDumpFormat(sqlContent)) {
                    fromPostgresDump(sqlContent);
                } else {
                    fromPostgres(sqlContent);
                }
                break;
            // Add more database types here
            default:
                throw new Error(
                    `Unsupported database type: ${sourceDatabaseType}`
                );
        }

        return { success: true };
    } catch (error: unknown) {
        // Extract line and column information from the error message
        let line: number | undefined;
        let column: number | undefined;
        let errorMessage: string;

        // Type guard to check if error is an object with a message property
        if (error instanceof Error) {
            errorMessage = error.message;

            // Parse error location if available
            const lineMatch = error.message.match(/line\s*(\d+)/i);
            if (lineMatch && lineMatch[1]) {
                line = parseInt(lineMatch[1], 10);
            }

            const columnMatch = error.message.match(/column\s*(\d+)/i);
            if (columnMatch && columnMatch[1]) {
                column = parseInt(columnMatch[1], 10);
            }

            // Clean up error message if needed
            if (error.message.includes('Error parsing PostgreSQL SQL:')) {
                errorMessage = error.message
                    .replace('Error parsing PostgreSQL SQL:', '')
                    .trim();
            } else if (
                error.message.includes('Error parsing PostgreSQL dump:')
            ) {
                errorMessage = error.message
                    .replace('Error parsing PostgreSQL dump:', '')
                    .trim();
            }
        } else {
            // Fallback for non-Error objects
            errorMessage = String(error);
        }

        return {
            success: false,
            error: errorMessage,
            line,
            column,
        };
    }
}
