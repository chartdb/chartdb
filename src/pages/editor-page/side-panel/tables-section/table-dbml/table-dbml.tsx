import React, { useMemo } from 'react';
import type { DBTable } from '@/lib/domain/db-table';
import { useChartDB } from '@/hooks/use-chartdb';
import { useTheme } from '@/hooks/use-theme';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import type { EffectiveTheme } from '@/context/theme-context/theme-context';
import { importer } from '@dbml/core';
import { exportBaseSQL } from '@/lib/data/export-metadata/export-sql-script';
import type { Diagram } from '@/lib/domain/diagram';
import { AlertCircle } from 'lucide-react';
import { setupDBMLLanguage } from '@/components/code-snippet/languages/dbml-language';
import { DatabaseType } from '@/lib/domain/database-type';

// Define a type for DBML compiler error
interface DBMLCompilerError {
    diags?: Array<{
        message?: string;
        location?: unknown;
    }>;
    message?: string;
    stack?: string;
}

export interface TableDBMLProps {
    filteredTables: DBTable[];
}

const getEditorTheme = (theme: EffectiveTheme) => {
    return theme === 'dark' ? 'dbml-dark' : 'dbml-light';
};

const databaseTypeToImportFormat = (
    type: DatabaseType
): 'mysql' | 'postgres' | 'mssql' => {
    switch (type) {
        case DatabaseType.SQL_SERVER:
            return 'mssql';
        case DatabaseType.MYSQL:
        case DatabaseType.MARIADB:
            return 'mysql';
        case DatabaseType.POSTGRESQL:
        case DatabaseType.COCKROACHDB:
        case DatabaseType.SQLITE:
            return 'postgres';
        default:
            return 'postgres';
    }
};

export const TableDBML: React.FC<TableDBMLProps> = ({ filteredTables }) => {
    const { currentDiagram } = useChartDB();
    const { effectiveTheme } = useTheme();

    // State to track if DBML generation encountered an error
    const [hasError, setHasError] = React.useState(false);
    const [errorType, setErrorType] = React.useState<
        'duplicate_field' | 'general' | null
    >(null);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [errorDetails, setErrorDetails] = React.useState('');

    const generateDBML = useMemo(() => {
        const filteredDiagram: Diagram = {
            ...currentDiagram,
            tables: filteredTables,
            relationships:
                currentDiagram.relationships?.filter((rel) => {
                    const sourceTable = filteredTables.find(
                        (t) => t.id === rel.sourceTableId
                    );
                    const targetTable = filteredTables.find(
                        (t) => t.id === rel.targetTableId
                    );

                    return sourceTable && targetTable;
                }) ?? [],
        } satisfies Diagram;

        const filteredDiagramWithoutSpaces: Diagram = {
            ...filteredDiagram,
            tables:
                filteredDiagram.tables?.map((table) => ({
                    ...table,
                    name: table.name.replace(/\s/g, '_'),
                    fields: table.fields.map((field) => ({
                        ...field,
                        name: field.name.replace(/\s/g, '_'),
                    })),
                    indexes: table.indexes?.map((index) => ({
                        ...index,
                        name: index.name.replace(/\s/g, '_'),
                    })),
                })) ?? [],
        } satisfies Diagram;

        const baseScript = exportBaseSQL({
            diagram: filteredDiagramWithoutSpaces,
            targetDatabaseType: currentDiagram.databaseType,
            isDBMLFlow: true,
        });

        try {
            const importFormat = databaseTypeToImportFormat(
                currentDiagram.databaseType
            );
            return importer.import(baseScript, importFormat);
        } catch (e) {
            console.error(e);

            // Set error state
            setHasError(true);

            // Extract error details for common DBML errors
            let tempErrorMessage = 'Failed to generate DBML.';
            let tempErrorDetails = '';

            // CompilerError2 from DBML library is not an instance of Error
            // Need to check for its properties directly
            const err = e as DBMLCompilerError;

            if (err && err.diags && err.diags.length > 0) {
                // Handle DBML compiler error
                const firstDiag = err.diags[0];

                // Extract message and location
                const diagMessage = firstDiag.message || '';

                // Check for duplicate field error
                if (diagMessage.includes('existed in table')) {
                    setErrorType('duplicate_field');
                    const fieldMatch = diagMessage.match(
                        /Field "([^"]+)" existed in table "([^"]+)"/
                    );
                    if (fieldMatch && fieldMatch.length >= 3) {
                        const [, fieldName, tableName] = fieldMatch;
                        tempErrorMessage = `Error: Duplicate field`;
                        tempErrorDetails = `Field: "${fieldName}"
// Table: "${tableName}"
// Fix: Remove / Rename field`;
                    } else {
                        tempErrorMessage = `Error: Duplicate fields`;
                        tempErrorDetails = `Check for duplicate field names
// Remove or rename duplicate fields`;
                    }
                } else {
                    // Generic DBML compiler error
                    setErrorType('general');
                    tempErrorMessage = `Error: Schema issue`;
                    tempErrorDetails = `${diagMessage}
// Check for schema structure issues`;
                }
            } else if (e instanceof Error) {
                // Standard error object
                const errorStr = e.toString();
                const stack = e.stack || '';

                // Handle duplicate field error
                if (
                    errorStr.includes('existed in table') ||
                    stack.includes('Field2.error')
                ) {
                    setErrorType('duplicate_field');
                    const fieldMatch = errorStr.match(
                        /Field "([^"]+)" existed in table "([^"]+)"/
                    );
                    if (fieldMatch && fieldMatch.length >= 3) {
                        const [, fieldName, tableName] = fieldMatch;
                        tempErrorMessage = `Error: Duplicate field`;
                        tempErrorDetails = `Field: "${fieldName}"
// Table: "${tableName}"
// Fix: Remove / Rename field`;
                    } else {
                        tempErrorMessage = `Error: Duplicate fields`;
                        tempErrorDetails = `Check for duplicate field names
// Remove or rename duplicate fields`;
                    }
                } else if (stack.includes('Database2.processSchemaElements')) {
                    setErrorType('general');
                    tempErrorMessage = `Error: Schema issue`;
                    tempErrorDetails = `Check for:
// - Duplicate names
// - Invalid relationships
// - Missing primary keys
// - Invalid data types`;
                } else {
                    setErrorType('general');
                    tempErrorDetails = `Technical issue detected
// Check console for details`;
                }
            } else {
                // Unknown error type
                setErrorType('general');
                tempErrorMessage = `Error: Unknown issue`;
                tempErrorDetails = `The DBML generation failed
// Check console for details`;
            }

            // Set the state variables
            setErrorMessage(tempErrorMessage);
            setErrorDetails(tempErrorDetails);

            // Return a more visually distinct error message as DBML code
            return `// === DBML GENERATION ERROR ===
//
// ${tempErrorMessage}
//
// ${tempErrorDetails}
//
// ===============================
//
// Fix the issue to generate DBML.
`;
        }
    }, [currentDiagram, filteredTables]);

    return (
        <>
            {hasError ? (
                // Show only the error panel when there's an error
                <div className="flex h-full flex-col rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
                    <div className="mb-2 flex items-center gap-2">
                        <AlertCircle className="size-6 text-red-600 dark:text-red-400" />
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
                            {errorType === 'duplicate_field'
                                ? 'Duplicate Field Error'
                                : 'DBML Generation Error'}
                        </h3>
                    </div>

                    <div className="mb-4 rounded-md border border-red-300 bg-red-100 p-2 dark:border-red-800 dark:bg-red-900/30">
                        <code className="select-text whitespace-pre-wrap text-sm text-red-800 dark:text-red-300">
                            {errorMessage}
                            {errorDetails && (
                                <>
                                    <br />
                                    <br />
                                    {errorDetails.replace(/\/\/ /g, '')}
                                </>
                            )}
                        </code>
                    </div>

                    {errorType === 'duplicate_field' ? (
                        <div className="select-text text-red-700 dark:text-red-300">
                            <p className="mb-2">
                                Your diagram contains duplicate field names in
                                one or more tables.
                            </p>
                            <p className="mb-1 font-medium">How to fix:</p>
                            <ol className="ml-4 list-decimal space-y-1">
                                <li>
                                    Look for tables with duplicate field names
                                </li>
                                <li>
                                    Select and edit the table in the diagram
                                </li>
                                <li>
                                    Remove or rename one of the duplicate fields
                                </li>
                                <li>Save your changes and try again</li>
                            </ol>
                        </div>
                    ) : (
                        <div className="select-text text-red-700 dark:text-red-300">
                            <p className="mb-2">
                                There was an error generating the DBML code from
                                your diagram.
                            </p>
                            <p className="mb-1 font-medium">
                                Common issues to check:
                            </p>
                            <ul className="ml-4 list-disc space-y-1">
                                <li>Duplicate table or field names</li>
                                <li>Invalid relationships between tables</li>
                                <li>Missing required fields</li>
                                <li>Unsupported data types</li>
                                <li>
                                    SQL reserved keywords used as field names
                                    (e.g., order, select, from, where)
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                // Only show the CodeSnippet when there's no error
                <CodeSnippet
                    code={generateDBML}
                    className="my-0.5"
                    editorProps={{
                        height: '100%',
                        defaultLanguage: 'dbml',
                        beforeMount: setupDBMLLanguage,
                        loading: false,
                        theme: getEditorTheme(effectiveTheme),
                        options: {
                            wordWrap: 'off',
                            mouseWheelZoom: false,
                            domReadOnly: true,
                        },
                    }}
                />
            )}
        </>
    );
};
