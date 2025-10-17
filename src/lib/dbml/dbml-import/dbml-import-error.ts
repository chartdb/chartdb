import type { CompilerError } from '@dbml/core/types/parse/error';
import { DatabaseType } from '@/lib/domain/database-type';

export interface DBMLError {
    message: string;
    line: number;
    column: number;
}

export class DBMLValidationError extends Error {
    public readonly dbmlError: DBMLError;

    constructor(message: string, line: number, column: number = 1) {
        super(message);
        this.name = 'DBMLValidationError';
        this.dbmlError = { message, line, column };
    }
}

/**
 * Validates that array types are not used in databases that don't support them.
 * Arrays are only supported in PostgreSQL and CockroachDB.
 * This should be called BEFORE preprocessing, as preprocessing removes the [] syntax.
 *
 * @param content - The DBML content to validate
 * @param databaseType - The target database type
 * @throws {DBMLValidationError} If array types are found in unsupported databases
 */
export const validateArrayTypesForDatabase = (
    content: string,
    databaseType: DatabaseType
): void => {
    // Only validate if database doesn't support arrays (skip for PostgreSQL/CockroachDB)
    if (
        databaseType === DatabaseType.POSTGRESQL ||
        databaseType === DatabaseType.COCKROACHDB
    ) {
        return;
    }

    const arrayFieldPattern = /"?(\w+)"?\s+(\w+(?:\(\d+(?:,\s*\d+)?\))?)\[\]/g;
    const matches = [...content.matchAll(arrayFieldPattern)];

    for (const match of matches) {
        const fieldName = match[1];
        const dataType = match[2];
        const lines = content.substring(0, match.index).split('\n');
        const lineNumber = lines.length;
        const columnNumber = lines[lines.length - 1].length + 1;

        throw new DBMLValidationError(
            `Array types are not supported for ${databaseType} database. Field "${fieldName}" has array type "${dataType}[]" which is not allowed.`,
            lineNumber,
            columnNumber
        );
    }
};

export function parseDBMLError(error: unknown): DBMLError | null {
    try {
        // Check for our custom DBMLValidationError
        if (error instanceof DBMLValidationError) {
            return error.dbmlError;
        }

        if (typeof error === 'string') {
            const parsed = JSON.parse(error);
            if (parsed.diags?.[0]) {
                const parsedError = parsed as CompilerError;
                return getFirstErrorFromCompileError(parsedError);
            }
        } else if (error && typeof error === 'object' && 'diags' in error) {
            const parsed = error as CompilerError;
            return getFirstErrorFromCompileError(parsed);
        }
    } catch (e) {
        console.error('Error parsing DBML error:', e);
    }

    return null;
}

const getFirstErrorFromCompileError = (
    error: CompilerError
): DBMLError | null => {
    const diags = (error.diags ?? []).sort((a, b) => {
        if (a.location.start.line === b.location.start.line) {
            return a.location.start.column - b.location.start.column;
        }
        return a.location.start.line - b.location.start.line;
    });

    if (diags.length > 0) {
        const firstDiag = diags[0];
        return {
            message: firstDiag.message,
            line: firstDiag.location.start.line,
            column: firstDiag.location.start.column,
        };
    }

    return null;
};
