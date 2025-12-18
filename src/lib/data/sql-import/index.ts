import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import { fromPostgres } from './dialect-importers/postgresql/postgresql';
import { fromPostgresDump } from './dialect-importers/postgresql/postgresql-dump';

import { fromSQLServer } from './dialect-importers/sqlserver/sqlserver';
import { fromSQLite } from './dialect-importers/sqlite/sqlite';
import { fromOracle, isOracleFormat } from './dialect-importers/oracle/oracle';
import type { SQLParserResult } from './common';
import { convertToChartDBDiagram } from './common';
import { adjustTablePositions } from '@/lib/domain/db-table';
import { fromMySQL, isMySQLFormat } from './dialect-importers/mysql/mysql';
import { getTableIndexesWithPrimaryKey } from '@/lib/domain/db-index';

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
            return true;
        }
    }

    // Check for other pg_dump patterns like COPY statements or specific comments
    if (
        (sqlContent.includes('COPY') && sqlContent.includes('FROM stdin')) ||
        sqlContent.match(/--\s+Name:.*Type:/i)
    ) {
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
            return true;
        }
    }

    // Also check for brackets used in SQL Server syntax - [dbo].[TableName]
    if (sqlContent.match(/\[[^\]]+\]\.\[[^\]]+\]/)) {
        return true;
    }

    return false;
}

/**
 * Detect if SQL content is from SQLite format
 * @param sqlContent SQL content as string
 * @returns boolean indicating if the SQL is likely from SQLite
 */
function isSQLiteFormat(sqlContent: string): boolean {
    // SQLite output often contains specific markers
    const sqliteMarkers = [
        'PRAGMA',
        'INTEGER PRIMARY KEY AUTOINCREMENT',
        'DEFAULT (datetime(',
        'sqlite_sequence',
        'CREATE TRIGGER',
        'BEGIN',
        'END;',
    ];

    // Check for specific SQLite patterns
    for (const marker of sqliteMarkers) {
        if (sqlContent.includes(marker)) {
            return true;
        }
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
        return DatabaseType.POSTGRESQL;
    }

    // Check for SQL Server format
    if (isSQLServerFormat(sqlContent)) {
        return DatabaseType.SQL_SERVER;
    }

    // Check for MySQL dump format
    if (isMySQLFormat(sqlContent)) {
        return DatabaseType.MYSQL;
    }

    // Check for SQLite format
    if (isSQLiteFormat(sqlContent)) {
        return DatabaseType.SQLITE;
    }

    // Check for Oracle format
    if (isOracleFormat(sqlContent)) {
        return DatabaseType.ORACLE;
    }

    // Look for database-specific keywords
    if (
        sqlContent.includes('SERIAL PRIMARY KEY') ||
        sqlContent.includes('CREATE EXTENSION') ||
        sqlContent.includes('WITH (OIDS') ||
        sqlContent.includes('RETURNS SETOF')
    ) {
        return DatabaseType.POSTGRESQL;
    }

    if (
        sqlContent.includes('AUTO_INCREMENT') ||
        sqlContent.includes('ENGINE=InnoDB') ||
        sqlContent.includes('DEFINER=')
    ) {
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
export async function sqlImportToDiagram({
    sqlContent,
    sourceDatabaseType,
    targetDatabaseType = DatabaseType.GENERIC,
}: {
    sqlContent: string;
    sourceDatabaseType: DatabaseType;
    targetDatabaseType: DatabaseType;
}): Promise<Diagram> {
    // If source database type is GENERIC, try to auto-detect the type
    if (sourceDatabaseType === DatabaseType.GENERIC) {
        const detectedType = detectDatabaseType(sqlContent);
        if (detectedType) {
            sourceDatabaseType = detectedType;
        } else {
            sourceDatabaseType = DatabaseType.POSTGRESQL;
        }
    }

    let parserResult: SQLParserResult;

    // Select the appropriate parser based on database type
    switch (sourceDatabaseType) {
        case DatabaseType.POSTGRESQL:
            // Check if the SQL is from pg_dump and use the appropriate parser
            if (isPgDumpFormat(sqlContent)) {
                parserResult = await fromPostgresDump(sqlContent);
            } else {
                parserResult = await fromPostgres(sqlContent);
            }
            break;
        case DatabaseType.MYSQL:
        case DatabaseType.MARIADB:
            // Check if the SQL is from MySQL dump and use the appropriate parser
            parserResult = await fromMySQL(sqlContent);

            break;
        case DatabaseType.SQL_SERVER:
            parserResult = await fromSQLServer(sqlContent);
            break;
        case DatabaseType.SQLITE:
            parserResult = await fromSQLite(sqlContent);
            break;
        case DatabaseType.ORACLE:
            parserResult = await fromOracle(sqlContent);
            break;
        default:
            throw new Error(`Unsupported database type: ${sourceDatabaseType}`);
    }

    // Convert the parsed SQL to a diagram
    const diagram = convertToChartDBDiagram(
        parserResult,
        sourceDatabaseType,
        targetDatabaseType
    );

    const adjustedTables = adjustTablePositions({
        tables: diagram.tables ?? [],
        relationships: diagram.relationships ?? [],
        mode: 'perSchema',
    });

    const sortedTables = adjustedTables
        .map((table) => ({
            ...table,
            indexes: getTableIndexesWithPrimaryKey({ table }),
        }))
        .sort((a, b) => {
            if (a.isView === b.isView) {
                // Both are either tables or views, so sort alphabetically by name
                return a.name.localeCompare(b.name);
            }
            // If one is a view and the other is not, put tables first
            return a.isView ? 1 : -1;
        });

    return {
        ...diagram,
        tables: sortedTables,
    };
}

/**
 * Parse SQL and identify any errors
 * @param sqlContent SQL content as string
 * @param sourceDatabaseType Source database type
 * @returns Object with success status and error information
 */
export async function parseSQLError({
    sqlContent,
    sourceDatabaseType,
}: {
    sqlContent: string;
    sourceDatabaseType: DatabaseType;
}): Promise<{
    success: boolean;
    error?: string;
    line?: number;
    column?: number;
}> {
    try {
        // Validate SQL based on the database type
        switch (sourceDatabaseType) {
            case DatabaseType.POSTGRESQL:
                // PostgreSQL validation - check format and use appropriate parser
                if (isPgDumpFormat(sqlContent)) {
                    await fromPostgresDump(sqlContent);
                } else {
                    await fromPostgres(sqlContent);
                }
                break;
            case DatabaseType.MYSQL:
            case DatabaseType.MARIADB:
                await fromMySQL(sqlContent);

                break;
            case DatabaseType.SQL_SERVER:
                // SQL Server validation
                await fromSQLServer(sqlContent);
                break;
            case DatabaseType.SQLITE:
                // SQLite validation
                await fromSQLite(sqlContent);
                break;
            case DatabaseType.ORACLE:
                // Oracle validation
                await fromOracle(sqlContent);
                break;
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
