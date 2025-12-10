/**
 * Unified SQL Validator
 * Delegates to appropriate dialect validators based on database type
 */

import { DatabaseType } from '@/lib/domain/database-type';
import {
    validatePostgreSQLDialect,
    type ValidationResult,
    type ValidationError,
    type ValidationWarning,
} from './validators/postgresql-validator';
import { validateMySQLDialect } from './validators/mysql-validator';
import { validateSQLServerDialect } from './validators/sqlserver-validator';
import { validateSQLiteDialect } from './validators/sqlite-validator';
import { validateOracleDialect } from './validators/oracle-validator';

// Re-export types for backward compatibility
export type { ValidationResult, ValidationError, ValidationWarning };

/**
 * Validate SQL based on the database type
 * @param sql - The SQL string to validate
 * @param databaseType - The target database type
 * @returns ValidationResult with errors, warnings, and optional fixed SQL
 */
export function validateSQL(
    sql: string,
    databaseType: DatabaseType
): ValidationResult {
    switch (databaseType) {
        case DatabaseType.POSTGRESQL:
            return validatePostgreSQLDialect(sql);

        case DatabaseType.MYSQL:
            return validateMySQLDialect(sql);

        case DatabaseType.SQL_SERVER:
            return validateSQLServerDialect(sql);

        case DatabaseType.SQLITE:
            return validateSQLiteDialect(sql);

        case DatabaseType.MARIADB:
            // MariaDB uses MySQL validator
            return validateMySQLDialect(sql);

        case DatabaseType.ORACLE:
            return validateOracleDialect(sql);

        default:
            return {
                isValid: false,
                errors: [
                    {
                        line: 1,
                        message: `Unsupported database type: ${databaseType}`,
                        type: 'unsupported',
                    },
                ],
                warnings: [],
            };
    }
}
