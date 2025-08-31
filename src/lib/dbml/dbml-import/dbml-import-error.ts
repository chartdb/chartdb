import type { CompilerError } from '@dbml/core/types/parse/error';

export interface DBMLError {
    message: string;
    line: number;
    column: number;
}

export function parseDBMLError(error: unknown): DBMLError | null {
    try {
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
