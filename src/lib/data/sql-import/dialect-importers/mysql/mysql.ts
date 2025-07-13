import type { SQLParserResult } from '../../common';
import { fromMySQLImproved } from './mysql-improved';

/**
 * Detect if SQL content is from MySQL or MariaDB dump format
 * @param sqlContent SQL content as string
 * @returns boolean indicating if the SQL is likely from MySQL or MariaDB
 */
export function isMySQLFormat(sqlContent: string): boolean {
    // MySQL/MariaDB output often contains specific markers
    const mysqlMarkers = [
        'ENGINE=InnoDB',
        'ENGINE=MyISAM',
        'ENGINE=Aria', // MariaDB specific
        'ENGINE=COLUMNSTORE', // MariaDB specific
        'AUTO_INCREMENT',
        'DEFAULT CHARSET=',
        'COLLATE=',
        '/*!40101',
        '/*!40014',
        '/*!40000',
        '/*!50503', // MariaDB version comments
        '/*!100100', // MariaDB version comments
        'SET NAMES utf8',
        'SET SQL_MODE',
        'UNLOCK TABLES',
        'LOCK TABLES',
        'MariaDB dump', // MariaDB specific dump header
    ];

    // Check for specific MySQL patterns
    for (const marker of mysqlMarkers) {
        if (sqlContent.includes(marker)) {
            return true;
        }
    }

    // Check for MySQL-specific data types and syntax
    if (
        sqlContent.match(/\bTINYINT\b/i) ||
        sqlContent.match(/\bMEDIUMINT\b/i) ||
        sqlContent.match(/\bBIGINT\b/i) ||
        sqlContent.match(/\bDOUBLE\s+PRECISION\b/i) ||
        sqlContent.match(/\bENUM\s*\(/i) ||
        sqlContent.match(/\bSET\s*\(/i)
    ) {
        return true;
    }

    return false;
}

export async function fromMySQL(sqlContent: string): Promise<SQLParserResult> {
    // Use the improved MySQL parser which now handles sanitization first, then validation
    // This matches PostgreSQL behavior: sanitize -> validate -> parse
    return fromMySQLImproved(sqlContent);
}
