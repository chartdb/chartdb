import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import { fromPostgres } from './dialect-importers/postgresql/postgresql';
import { fromPostgresDump } from './dialect-importers/postgresql/postgresql-dump';
import { fromMySQL } from './dialect-importers/mysql/mysql';
import {
    fromMysqlDump,
    isMysqlDumpFormat,
} from './dialect-importers/mysql/mysql-dump';
import { fromSQLServer } from './dialect-importers/sqlserver/sqlserver';
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
 * Detect if SQL content is from SQL Server DDL format
 * @param sqlContent SQL content as string
 * @returns boolean indicating if the SQL is likely from SQL Server
 */
function isSQLServerFormat(sqlContent: string): boolean {
    // SQL Server output often contains specific markers
    const sqlServerMarkers = [
        'SET ANSI_NULLS ON',
        'SET QUOTED_IDENTIFIER ON',
        'SET ANSI_PADDING ON',
        'CREATE PROCEDURE',
        'EXEC sys.sp_',
        'EXECUTE sys.sp_',
        '[dbo].',
        'IDENTITY(',
        'NVARCHAR',
        'UNIQUEIDENTIFIER',
        'ALTER TABLE [',
        'CREATE TABLE [dbo]',
        'CREATE INDEX [dbo_',
        'datetime2',
    ];

    // Check for specific SQL Server patterns
    for (const marker of sqlServerMarkers) {
        if (sqlContent.includes(marker)) {
            console.log(`Detected SQL Server format (found marker: ${marker})`);
            return true;
        }
    }

    // Also check for brackets used in SQL Server syntax - [dbo].[TableName]
    if (sqlContent.match(/\[[^\]]+\]\.\[[^\]]+\]/)) {
        console.log('Detected SQL Server format (bracket notation)');
        return true;
    }

    return false;
}

/**
 * Auto-detect database type from SQL content
 * @param sqlContent SQL content as string
 * @returns Detected database type or null if can't determine
 */
export function detectDatabaseType(sqlContent: string): DatabaseType | null {
    // First check for PostgreSQL dump format
    if (isPgDumpFormat(sqlContent)) {
        console.log('Auto-detected PostgreSQL dump format');
        return DatabaseType.POSTGRESQL;
    }

    // Check for SQL Server format
    if (isSQLServerFormat(sqlContent)) {
        console.log('Auto-detected SQL Server format');
        return DatabaseType.SQL_SERVER;
    }

    // Check for MySQL dump format
    if (isMysqlDumpFormat(sqlContent)) {
        console.log('Auto-detected MySQL dump format');
        return DatabaseType.MYSQL;
    }

    // Look for database-specific keywords
    if (
        sqlContent.includes('SERIAL PRIMARY KEY') ||
        sqlContent.includes('CREATE EXTENSION') ||
        sqlContent.includes('WITH (OIDS') ||
        sqlContent.includes('RETURNS SETOF')
    ) {
        console.log('Auto-detected PostgreSQL format based on syntax');
        return DatabaseType.POSTGRESQL;
    }

    if (
        sqlContent.includes('AUTO_INCREMENT') ||
        sqlContent.includes('ENGINE=InnoDB') ||
        sqlContent.includes('DEFINER=')
    ) {
        console.log('Auto-detected MySQL format based on syntax');
        return DatabaseType.MYSQL;
    }

    // Could not determine the database type
    return null;
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

    // If source database type is GENERIC, try to auto-detect the type
    if (sourceDatabaseType === DatabaseType.GENERIC) {
        const detectedType = detectDatabaseType(sqlContent);
        if (detectedType) {
            console.log(`Auto-detected database type: ${detectedType}`);
            sourceDatabaseType = detectedType;
        } else {
            console.log(
                'Could not auto-detect database type, using PostgreSQL as fallback'
            );
            sourceDatabaseType = DatabaseType.POSTGRESQL;
        }
    }

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
        case DatabaseType.MYSQL:
            console.log('Using MySQL parser');
            // Check if the SQL is from MySQL dump and use the appropriate parser
            if (isMysqlDumpFormat(sqlContent)) {
                console.log(
                    'Detected MySQL dump format, using specialized parser'
                );
                parserResult = fromMysqlDump(sqlContent);
            } else {
                console.log('Using standard MySQL parser');
                parserResult = fromMySQL(sqlContent);
            }
            break;
        case DatabaseType.SQL_SERVER:
            console.log('Using SQL Server parser');
            parserResult = fromSQLServer(sqlContent);
            break;
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
            case DatabaseType.MYSQL:
                // MySQL validation - check format and use appropriate parser
                if (isMysqlDumpFormat(sqlContent)) {
                    fromMysqlDump(sqlContent);
                } else {
                    fromMySQL(sqlContent);
                }
                break;
            case DatabaseType.SQL_SERVER:
                // SQL Server validation
                fromSQLServer(sqlContent);
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
            if (error.message.includes('Error parsing')) {
                // Extract everything after the colon using regex
                const match = error.message.match(/Error parsing[^:]*:(.*)/);
                if (match && match[1]) {
                    errorMessage = match[1].trim();
                }
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
