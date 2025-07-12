import React from 'react';
import {
    AlertCircle,
    CheckCircle,
    AlertTriangle,
    Lightbulb,
} from 'lucide-react';
import {
    validatePostgreSQLSyntax,
    type ValidationResult,
} from './sql-validator';
import { Button } from '@/components/button/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';

interface SQLImportValidatorProps {
    sql: string;
    onImport: (sql: string) => void;
    onCancel: () => void;
}

export function SQLImportValidator({
    sql,
    onImport,
    onCancel,
}: SQLImportValidatorProps) {
    const [validationResult, setValidationResult] =
        React.useState<ValidationResult | null>(null);
    const [isValidating, setIsValidating] = React.useState(false);

    React.useEffect(() => {
        if (sql && sql.trim()) {
            setIsValidating(true);
            // Debounce validation
            const timer = setTimeout(() => {
                const result = validatePostgreSQLSyntax(sql);
                setValidationResult(result);
                setIsValidating(false);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [sql]);

    const handleImport = () => {
        if (validationResult?.isValid) {
            onImport(sql);
        } else if (validationResult?.fixedSQL) {
            // Use the auto-fixed SQL
            onImport(validationResult.fixedSQL);
        }
    };

    const handleAutoFix = () => {
        if (validationResult?.fixedSQL) {
            // You might want to update the editor content here
            onImport(validationResult.fixedSQL);
        }
    };

    if (!validationResult || isValidating) {
        return (
            <div className="flex items-center justify-between border-t p-4">
                <span className="text-sm text-muted-foreground">
                    Validating SQL...
                </span>
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        );
    }

    const { errors, warnings, fixedSQL, tableCount = 0 } = validationResult;
    const hasErrors = errors.length > 0;
    const hasWarnings = warnings.length > 0;
    const hasTables = tableCount > 0;

    return (
        <div className="space-y-4 border-t p-4">
            {/* Validation Status */}
            <div className="space-y-2">
                {hasErrors && (
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertTitle>SQL Syntax Errors Found</AlertTitle>
                        <AlertDescription className="mt-2 space-y-1">
                            {errors.slice(0, 3).map((error, idx) => (
                                <div key={idx} className="text-sm">
                                    <strong>Line {error.line}:</strong>{' '}
                                    {error.message}
                                    {error.suggestion && (
                                        <div className="ml-4 text-xs opacity-80">
                                            → {error.suggestion}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {errors.length > 3 && (
                                <div className="text-sm opacity-70">
                                    ... and {errors.length - 3} more errors
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {hasWarnings && !hasErrors && (
                    <Alert>
                        <AlertTriangle className="size-4" />
                        <AlertTitle>Import Info</AlertTitle>
                        <AlertDescription className="mt-2 space-y-1">
                            {warnings.map((warning, idx) => (
                                <div key={idx} className="text-sm">
                                    • {warning.message}
                                </div>
                            ))}
                        </AlertDescription>
                    </Alert>
                )}

                {!hasErrors && !hasWarnings && hasTables && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="size-4 text-green-600" />
                        <AlertTitle className="text-green-800">
                            SQL Validated Successfully
                        </AlertTitle>
                        <AlertDescription className="text-green-700">
                            Found {tableCount} table{tableCount > 1 ? 's' : ''}{' '}
                            ready to import.
                        </AlertDescription>
                    </Alert>
                )}

                {!hasErrors && !hasWarnings && !hasTables && (
                    <Alert>
                        <AlertTriangle className="size-4" />
                        <AlertTitle>No Tables Found</AlertTitle>
                        <AlertDescription>
                            No CREATE TABLE statements were found in the SQL.
                        </AlertDescription>
                    </Alert>
                )}

                {fixedSQL && (
                    <Alert className="border-blue-200 bg-blue-50">
                        <Lightbulb className="size-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">
                            Auto-fix Available
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            We can automatically fix the syntax errors in your
                            SQL.
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>

                {fixedSQL && hasTables && (
                    <Button
                        variant="default"
                        onClick={handleAutoFix}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Auto-fix & Import
                    </Button>
                )}

                {!hasErrors && hasTables && (
                    <Button
                        variant="default"
                        onClick={handleImport}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Import
                    </Button>
                )}
            </div>

            {/* Detailed Error Log (Collapsible) */}
            {hasErrors && errors.length > 3 && (
                <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        Show all {errors.length} errors
                    </summary>
                    <div className="mt-2 space-y-1 rounded bg-muted p-2 font-mono text-xs">
                        {errors.map((error, idx) => (
                            <div key={idx}>
                                Line {error.line}: {error.message}
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}

/**
 * Inline validation indicator for the SQL editor
 */
export function SQLValidationIndicator({ sql }: { sql: string }) {
    const [hasErrors, setHasErrors] = React.useState(false);

    React.useEffect(() => {
        if (sql) {
            const timer = setTimeout(() => {
                const result = validatePostgreSQLSyntax(sql);
                setHasErrors(result.errors.length > 0);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [sql]);

    if (!sql || !hasErrors) return null;

    return (
        <div className="absolute right-2 top-2 flex items-center gap-2 rounded bg-red-100 px-2 py-1 text-xs text-red-700">
            <AlertCircle className="size-3" />
            SQL syntax errors detected
        </div>
    );
}
