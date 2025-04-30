import React, { useMemo } from 'react';
import type { DBTable } from '@/lib/domain/db-table';
import { useChartDB } from '@/hooks/use-chartdb';
import { useTheme } from '@/hooks/use-theme';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import type { EffectiveTheme } from '@/context/theme-context/theme-context';
import { importer } from '@dbml/core';
import { exportBaseSQL } from '@/lib/data/export-metadata/export-sql-script';
import type { Diagram } from '@/lib/domain/diagram';
import { useToast } from '@/components/toast/use-toast';
import { setupDBMLLanguage } from '@/components/code-snippet/languages/dbml-language';
import { DatabaseType } from '@/lib/domain/database-type';

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

// Fix problematic field names in the diagram before passing to SQL generator
const fixProblematicFieldNames = (diagram: Diagram): Diagram => {
    const fixedTables =
        diagram.tables?.map((table) => {
            // Deep clone the table to avoid modifying the original
            const newTable = { ...table };

            // Fix field names if this is the "relation" table
            if (table.name === 'relation') {
                newTable.fields = table.fields.map((field) => {
                    // Create a new field to avoid modifying the original
                    const newField = { ...field };

                    // Fix the 'from' and 'to' fields which are SQL keywords
                    if (field.name === 'from') {
                        newField.name = 'source';
                    } else if (field.name === 'to') {
                        newField.name = 'target';
                    }

                    return newField;
                });
            }

            return newTable;
        }) || [];

    // Update relationships to point to the renamed fields
    const fixedRelationships =
        diagram.relationships?.map((rel) => {
            const relationTable = diagram.tables?.find(
                (t) => t.name === 'relation'
            );
            if (!relationTable) return rel;

            const newRel = { ...rel };

            // Fix relationships that were pointing to the 'from' field
            const fromField = relationTable.fields.find(
                (f) => f.name === 'from'
            );
            if (fromField && rel.targetFieldId === fromField.id) {
                // We need to look up the renamed field in our fixed tables
                const fixedRelationTable = fixedTables.find(
                    (t) => t.name === 'relation'
                );
                const sourceField = fixedRelationTable?.fields.find(
                    (f) => f.name === 'source'
                );
                if (sourceField) {
                    newRel.targetFieldId = sourceField.id;
                }
            }

            // Fix relationships that were pointing to the 'to' field
            const toField = relationTable.fields.find((f) => f.name === 'to');
            if (toField && rel.targetFieldId === toField.id) {
                // We need to look up the renamed field in our fixed tables
                const fixedRelationTable = fixedTables.find(
                    (t) => t.name === 'relation'
                );
                const targetField = fixedRelationTable?.fields.find(
                    (f) => f.name === 'target'
                );
                if (targetField) {
                    newRel.targetFieldId = targetField.id;
                }
            }

            return newRel;
        }) || [];

    // Return a new diagram with the fixes
    return {
        ...diagram,
        tables: fixedTables,
        relationships: fixedRelationships,
    };
};

// Function to sanitize SQL before passing to the importer
const sanitizeSQLforDBML = (sql: string): string => {
    // Replace special characters in identifiers
    let sanitized = sql;

    // Handle duplicate constraint names
    const constraintNames = new Set<string>();
    let constraintCounter = 0;

    sanitized = sanitized.replace(
        /ADD CONSTRAINT (\w+) FOREIGN KEY/g,
        (match, name) => {
            if (constraintNames.has(name)) {
                return `ADD CONSTRAINT ${name}_${++constraintCounter} FOREIGN KEY`;
            } else {
                constraintNames.add(name);
                return match;
            }
        }
    );

    // Replace any remaining problematic characters
    sanitized = sanitized.replace(/\?\?/g, '__');

    return sanitized;
};

export const TableDBML: React.FC<TableDBMLProps> = ({ filteredTables }) => {
    const { currentDiagram } = useChartDB();
    const { effectiveTheme } = useTheme();
    const { toast } = useToast();

    const generateDBML = useMemo(() => {
        // Filter out fields with empty names and track if any were found
        let foundInvalidFields = false;
        const invalidTableNames = new Set<string>(); // Use a Set to store unique table names

        const sanitizedTables = filteredTables.map((table) => {
            const validFields = table.fields.filter((field) => {
                if (field.name === '') {
                    foundInvalidFields = true;
                    invalidTableNames.add(table.name); // Add table name to the set
                    return false; // Exclude this field
                }
                return true; // Keep this field
            });
            return {
                ...table,
                fields: validFields,
            };
        });

        if (foundInvalidFields) {
            const tableNamesString = Array.from(invalidTableNames).join(', ');
            toast({
                title: 'Warning',
                description: `Some fields had empty names in tables: [${tableNamesString}] and were excluded from the DBML export.`,
                variant: 'default',
            });
        }

        const filteredDiagram: Diagram = {
            ...currentDiagram,
            tables: sanitizedTables, // Use sanitized tables
            relationships:
                currentDiagram.relationships?.filter((rel) => {
                    // Update relationship filtering to use sanitizedTables
                    const sourceTable = sanitizedTables.find(
                        (t) => t.id === rel.sourceTableId
                    );
                    const targetTable = sanitizedTables.find(
                        (t) => t.id === rel.targetTableId
                    );
                    // Also check if the related fields still exist after sanitization
                    const sourceFieldExists = sourceTable?.fields.some(
                        (f) => f.id === rel.sourceFieldId
                    );
                    const targetFieldExists = targetTable?.fields.some(
                        (f) => f.id === rel.targetFieldId
                    );

                    return (
                        sourceTable &&
                        targetTable &&
                        sourceFieldExists &&
                        targetFieldExists
                    );
                }) ?? [],
        };

        // Sanitize field names to avoid SQL/DBML parser issues
        const cleanDiagram = fixProblematicFieldNames(filteredDiagram);

        // Ensure unique, sanitized names for all identifiers
        const filteredDiagramWithoutSpaces: Diagram = {
            ...cleanDiagram,
            tables:
                cleanDiagram.tables?.map((table) => ({
                    ...table,
                    name: table.name.replace(/[^\w]/g, '_'),
                    fields: table.fields.map((field) => ({
                        ...field,
                        name: field.name.replace(/[^\w]/g, '_'),
                    })),
                    indexes: (table.indexes || []).map((index) => ({
                        ...index,
                        name: index.name
                            ? index.name.replace(/[^\w]/g, '_')
                            : `idx_${Math.random().toString(36).substring(2, 8)}`,
                    })),
                })) ?? [],
            relationships:
                cleanDiagram.relationships?.map((rel, index) => ({
                    ...rel,
                    // Ensure each relationship has a unique name
                    name: `fk_${index}_${rel.name ? rel.name.replace(/[^\w]/g, '_') : Math.random().toString(36).substring(2, 8)}`,
                })) ?? [],
        } as Diagram;

        try {
            // Generate SQL script
            let baseScript = exportBaseSQL({
                diagram: filteredDiagramWithoutSpaces,
                targetDatabaseType: currentDiagram.databaseType,
                isDBMLFlow: true,
            });

            // Apply sanitization to the SQL script
            baseScript = sanitizeSQLforDBML(baseScript);

            // Import the sanitized SQL to DBML
            return importer.import(
                baseScript,
                databaseTypeToImportFormat(currentDiagram.databaseType)
            );
        } catch (error: unknown) {
            console.error('DBML Import Error:', error);

            // Handle different error types
            if (error instanceof Error) {
                toast({
                    title: 'DBML Export Error',
                    description: `Could not generate DBML: ${error.message.substring(0, 100)}${error.message.length > 100 ? '...' : ''}`,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'DBML Export Error',
                    description:
                        'Could not generate DBML due to an unknown error',
                    variant: 'destructive',
                });
            }

            // Return an informative error message as DBML
            return `// Error generating DBML from the diagram
// Please check for the following potential issues:
// - Tables with problematic column names (with special characters)
// - Reserved keywords used as column names
// - Relationships with invalid configurations
//
// You can view more details in the browser console.`;
        }
    }, [currentDiagram, filteredTables, toast]);

    return (
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
    );
};
