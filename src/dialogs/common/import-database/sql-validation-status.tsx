import React from 'react';
import {
    AlertCircle,
    CheckCircle,
    AlertTriangle,
    Lightbulb,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/alert/alert';
import type { ValidationResult } from '@/lib/data/sql-import/sql-validator';

interface SQLValidationStatusProps {
    validation: ValidationResult | null;
    errorMessage: string;
    isAutoFixing?: boolean;
    onErrorClick?: (line: number) => void;
}

export const SQLValidationStatus: React.FC<SQLValidationStatusProps> = ({
    validation,
    errorMessage,
    isAutoFixing = false,
    onErrorClick,
}) => {
    if (!validation && !errorMessage && !isAutoFixing) return null;

    const hasErrors = validation?.errors && validation.errors.length > 0;
    const hasWarnings = validation?.warnings && validation.warnings.length > 0;
    const wasAutoFixed =
        validation?.warnings?.some((w) => w.message.includes('Auto-fixed')) ||
        false;

    // If we have parser errors (errorMessage) after validation
    if (errorMessage && !hasErrors) {
        return (
            <Alert variant="destructive" className="mt-2">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-sm">
                    {errorMessage}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="mt-2 space-y-2">
            {isAutoFixing && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <Lightbulb className="size-4 animate-pulse text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                        Auto-fixing SQL syntax errors...
                    </AlertDescription>
                </Alert>
            )}

            {hasErrors && !isAutoFixing && (
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription className="space-y-1 text-sm">
                        <div className="font-medium">SQL Syntax Errors:</div>
                        {validation.errors.slice(0, 3).map((error, idx) => (
                            <div key={idx} className="ml-2">
                                •{' '}
                                <button
                                    onClick={() => onErrorClick?.(error.line)}
                                    className="rounded underline hover:text-red-600 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    type="button"
                                >
                                    Line {error.line}
                                </button>
                                : {error.message}
                                {error.suggestion && (
                                    <div className="ml-4 text-xs opacity-80">
                                        → {error.suggestion}
                                    </div>
                                )}
                            </div>
                        ))}
                        {validation.errors.length > 3 && (
                            <div className="ml-2 text-xs opacity-70">
                                ... and {validation.errors.length - 3} more
                                errors
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {wasAutoFixed && !hasErrors && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                        SQL syntax errors were automatically fixed. Your SQL is
                        now ready to import.
                    </AlertDescription>
                </Alert>
            )}

            {hasWarnings && !hasErrors && (
                <Alert>
                    <AlertTriangle className="size-4" />
                    <AlertDescription className="space-y-1 text-sm">
                        <div className="font-medium">Import Warnings:</div>
                        {validation.warnings.map((warning, idx) => (
                            <div key={idx} className="ml-2">
                                • {warning.message}
                            </div>
                        ))}
                    </AlertDescription>
                </Alert>
            )}

            {!hasErrors && !hasWarnings && !errorMessage && validation && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                        SQL syntax validated successfully
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};
