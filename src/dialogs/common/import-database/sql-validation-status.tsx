import React, { useMemo } from 'react';
import { CheckCircle, AlertTriangle, MessageCircleWarning } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/alert/alert';
import type { ValidationResult } from '@/lib/data/sql-import/sql-validator';
import { Separator } from '@/components/separator/separator';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { Spinner } from '@/components/spinner/spinner';

interface SQLValidationStatusProps {
    validation?: ValidationResult | null;
    errorMessage: string;
    isAutoFixing?: boolean;
    onErrorClick?: (line: number) => void;
    importMethod?: 'ddl' | 'dbml' | 'query';
}

export const SQLValidationStatus: React.FC<SQLValidationStatusProps> = ({
    validation,
    errorMessage,
    isAutoFixing = false,
    onErrorClick,
    importMethod = 'ddl',
}) => {
    const hasErrors = useMemo(
        () => validation?.errors.length && validation.errors.length > 0,
        [validation?.errors]
    );
    const hasWarnings = useMemo(
        () => validation?.warnings && validation.warnings.length > 0,
        [validation?.warnings]
    );
    const wasAutoFixed = useMemo(
        () =>
            validation?.warnings?.some((w) =>
                w.message.includes('Auto-fixed')
            ) || false,
        [validation?.warnings]
    );

    if (!validation && !errorMessage && !isAutoFixing) return null;

    if (isAutoFixing) {
        return (
            <>
                <Separator className="mb-1 mt-2" />
                <div className="rounded-md border border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950">
                    <div className="space-y-3 p-3 pt-2 text-sky-700 dark:text-sky-300">
                        <div className="flex items-start gap-2">
                            <Spinner className="mt-0.5 size-4 shrink-0 text-sky-700 dark:text-sky-300" />
                            <div className="flex-1 text-sm text-sky-700 dark:text-sky-300">
                                Auto-fixing SQL syntax errors...
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // If we have parser errors (errorMessage) after validation
    if (errorMessage && !hasErrors) {
        return (
            <>
                <Separator className="mb-1 mt-2" />
                <div className="mb-1 flex shrink-0 items-center gap-2">
                    <p className="text-xs text-red-700">{errorMessage}</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Separator className="mb-1 mt-2" />

            {hasErrors ? (
                <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <ScrollArea className="h-fit max-h-24">
                        <div className="space-y-3 p-3 pt-2 text-red-700 dark:text-red-300">
                            {validation?.errors
                                .slice(0, 3)
                                .map((error, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-2"
                                    >
                                        <MessageCircleWarning className="mt-0.5 size-4 shrink-0 text-red-700 dark:text-red-300" />
                                        <div className="flex-1 text-sm text-red-700 dark:text-red-300">
                                            <button
                                                onClick={() =>
                                                    onErrorClick?.(error.line)
                                                }
                                                className="rounded font-medium underline hover:text-red-600 focus:outline-none focus:ring-1 focus:ring-red-500 dark:hover:text-red-200"
                                                type="button"
                                            >
                                                Line {error.line}
                                            </button>
                                            <span className="mx-1">:</span>
                                            <span className="text-xs">
                                                {error.message}
                                            </span>
                                            {error.suggestion && (
                                                <div className="mt-1 flex items-start gap-2">
                                                    <span className="text-xs font-medium ">
                                                        {error.suggestion}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            {validation?.errors &&
                            validation?.errors.length > 3 ? (
                                <div className="flex items-center gap-2">
                                    <MessageCircleWarning className="mt-0.5 size-4 shrink-0 text-red-700 dark:text-red-300" />
                                    <span className="text-xs font-medium">
                                        {validation.errors.length - 3} more
                                        error
                                        {validation.errors.length - 3 > 1
                                            ? 's'
                                            : ''}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </ScrollArea>
                </div>
            ) : null}

            {wasAutoFixed && !hasErrors ? (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                        SQL syntax errors were automatically fixed. Your SQL is
                        now ready to import.
                    </AlertDescription>
                </Alert>
            ) : null}

            {hasWarnings && !hasErrors ? (
                <div className="rounded-md border border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950">
                    <ScrollArea className="h-fit max-h-24">
                        <div className="space-y-3 p-3 pt-2 text-sky-700 dark:text-sky-300">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-sky-700 dark:text-sky-300" />
                                <div className="flex-1 text-sm text-sky-700 dark:text-sky-300">
                                    <div className="mb-1 font-medium">
                                        Import Info:
                                    </div>
                                    {validation?.warnings.map(
                                        (warning, idx) => (
                                            <div
                                                key={idx}
                                                className="ml-2 text-xs"
                                            >
                                                • {warning.message}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            ) : null}

            {!hasErrors && !hasWarnings && !errorMessage && validation ? (
                <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <div className="space-y-3 p-3 pt-2 text-green-700 dark:text-green-300">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-700 dark:text-green-300" />
                            <div className="flex-1 text-sm text-green-700 dark:text-green-300">
                                <div>
                                    {importMethod === 'dbml'
                                        ? 'DBML syntax validated successfully'
                                        : 'SQL syntax validated successfully'}
                                </div>
                                {(validation.tableCount !== undefined ||
                                    validation.relationshipCount !==
                                        undefined) && (
                                    <div className="mt-1 flex gap-2 text-xs">
                                        {validation.tableCount !== undefined &&
                                            validation.tableCount > 0 && (
                                                <span>
                                                    <span className="font-semibold">
                                                        {validation.tableCount}
                                                    </span>{' '}
                                                    table
                                                    {validation.tableCount !== 1
                                                        ? 's'
                                                        : ''}
                                                </span>
                                            )}
                                        {validation.relationshipCount !==
                                            undefined &&
                                            validation.relationshipCount >
                                                0 && (
                                                <span>
                                                    <span className="font-semibold">
                                                        {
                                                            validation.relationshipCount
                                                        }
                                                    </span>{' '}
                                                    relationship
                                                    {validation.relationshipCount !==
                                                    1
                                                        ? 's'
                                                        : ''}
                                                </span>
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
};
