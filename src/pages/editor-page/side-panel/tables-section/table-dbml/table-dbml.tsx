import React, { useMemo, useState, useEffect } from 'react';
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
import { Button } from '@/components/button/button';
import { ArrowLeftRight, Copy, CopyCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { type DBField } from '@/lib/domain/db-field';

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

// Post-process DBML to convert separate Ref statements to inline refs
const convertToInlineRefs = (dbml: string): string => {
    console.log('Original DBML to convert:', dbml);

    // Extract all Ref statements - Corrected pattern
    const refPattern =
        /Ref\s+"([^"]+)"\s*:\s*"([^"]+)"\."([^"]+)"\s*([<>*])\s*"([^"]+)"\."([^"]+)"/g;
    const refs: Array<{
        refName: string;
        sourceTable: string;
        sourceField: string;
        direction: string;
        targetTable: string;
        targetField: string;
    }> = [];

    let match;
    while ((match = refPattern.exec(dbml)) !== null) {
        console.log('Matched reference:', match[0]);
        refs.push({
            refName: match[1], // Reference name
            sourceTable: match[2], // Source table
            sourceField: match[3], // Source field
            direction: match[4], // Direction (<, >)
            targetTable: match[5], // Target table
            targetField: match[6], // Target field
        });
    }
    console.log('Found references:', refs);

    // Extract all table definitions - Corrected pattern and handling
    const tables: {
        [key: string]: { start: number; end: number; content: string };
    } = {};
    const tablePattern = /Table\s+"([^"]+)"\s*{([^}]*)}/g; // Simpler pattern, assuming content doesn't have {}

    let tableMatch;
    while ((tableMatch = tablePattern.exec(dbml)) !== null) {
        const tableName = tableMatch[1];
        tables[tableName] = {
            start: tableMatch.index,
            end: tableMatch.index + tableMatch[0].length,
            content: tableMatch[2],
        };
    }
    console.log('Found tables:', Object.keys(tables));

    if (refs.length === 0 || Object.keys(tables).length === 0) {
        console.log(
            'No valid references or tables found for conversion, returning original DBML.'
        );
        return dbml; // Return original if parsing failed
    }

    // Create a map for faster table lookup
    const tableMap = new Map(Object.entries(tables));

    // 1. Add inline refs to table contents
    refs.forEach((ref) => {
        let targetTableName, fieldNameToModify, inlineRefSyntax;

        if (ref.direction === '<') {
            targetTableName = ref.targetTable;
            fieldNameToModify = ref.targetField;
            inlineRefSyntax = `[ref: < "${ref.sourceTable}"."${ref.sourceField}"]`;
        } else {
            targetTableName = ref.sourceTable;
            fieldNameToModify = ref.sourceField;
            inlineRefSyntax = `[ref: > "${ref.targetTable}"."${ref.targetField}"]`;
        }

        const tableData = tableMap.get(targetTableName);
        if (tableData) {
            const fieldPattern = new RegExp(
                `("(${fieldNameToModify})"[^\n]*?)([ \t]*[[].*?[]])?([ \t]*//.*)?$`,
                'm'
            );
            let newContent = tableData.content;

            newContent = newContent.replace(
                fieldPattern,
                (
                    lineMatch,
                    fieldPart,
                    fieldName,
                    existingAttributes,
                    commentPart
                ) => {
                    // Avoid adding duplicate refs
                    if (lineMatch.includes('[ref:')) {
                        return lineMatch;
                    }
                    console.log(
                        `Adding inline ref to ${targetTableName}.${fieldName}`
                    );
                    return `${fieldPart.trim()} ${inlineRefSyntax}${existingAttributes || ''}${commentPart || ''}`;
                }
            );

            // Update the table content if modified
            if (newContent !== tableData.content) {
                tableData.content = newContent;
                tableMap.set(targetTableName, tableData);
            }
        } else {
            console.log(
                `Target table "${targetTableName}" not found for ref: ${ref.refName}`
            );
        }
    });

    // 2. Reconstruct DBML with modified tables
    let reconstructedDbml = '';
    let lastIndex = 0;
    const sortedTables = Object.entries(tables).sort(
        ([, a], [, b]) => a.start - b.start
    );

    for (const [tableName, tableData] of sortedTables) {
        reconstructedDbml += dbml.substring(lastIndex, tableData.start);
        reconstructedDbml += `Table "${tableName}" {${tableData.content}}`;
        lastIndex = tableData.end;
    }
    reconstructedDbml += dbml.substring(lastIndex);

    // 3. Remove original Ref lines
    const finalLines = reconstructedDbml
        .split('\n')
        .filter((line) => !line.trim().startsWith('Ref '));
    const finalDbml = finalLines.join('\n').trim();

    console.log('Converted DBML:', finalDbml);
    return finalDbml;
};

// Function to check for SQL keywords (add more if needed)
const isSQLKeyword = (name: string): boolean => {
    const keywords = new Set(['CASE', 'ORDER', 'GROUP', 'FROM', 'TO', 'USER']); // Add common keywords
    return keywords.has(name.toUpperCase());
};

export const TableDBML: React.FC<TableDBMLProps> = ({ filteredTables }) => {
    const { currentDiagram } = useChartDB();
    const { effectiveTheme } = useTheme();
    const { toast } = useToast();
    const { t } = useTranslation();
    const [dbmlFormat, setDbmlFormat] = useState<'inline' | 'standard'>(
        'standard'
    );
    const [isCopied, setIsCopied] = useState(false);
    const [tooltipOpen, setTooltipOpen] = React.useState(false);

    // --- Effect for handling empty field name warnings ---
    useEffect(() => {
        let foundInvalidFields = false;
        const invalidTableNames = new Set<string>();

        filteredTables.forEach((table) => {
            table.fields.forEach((field) => {
                if (field.name === '') {
                    foundInvalidFields = true;
                    invalidTableNames.add(table.name);
                }
            });
        });

        if (foundInvalidFields) {
            const tableNamesString = Array.from(invalidTableNames).join(', ');
            toast({
                title: 'Warning',
                description: `Some fields had empty names in tables: [${tableNamesString}] and were excluded from the DBML export.`,
                variant: 'default',
            });
        }
    }, [filteredTables, toast]); // Depend on filteredTables and toast

    // Generate both standard and inline DBML formats
    const { standardDbml, inlineDbml } = useMemo(() => {
        // Filter out fields with empty names
        const sanitizedTables = filteredTables.map((table) => {
            const validFields = table.fields.filter(
                (field) => field.name !== ''
            );
            return {
                ...table,
                fields: validFields,
            };
        });

        // Create the base filtered diagram structure
        const filteredDiagram: Diagram = {
            ...currentDiagram,
            tables: sanitizedTables,
            relationships:
                currentDiagram.relationships?.filter((rel) => {
                    const sourceTable = sanitizedTables.find(
                        (t) => t.id === rel.sourceTableId
                    );
                    const targetTable = sanitizedTables.find(
                        (t) => t.id === rel.targetTableId
                    );
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

        // Sanitize field names ('from'/'to' in 'relation' table)
        const cleanDiagram = fixProblematicFieldNames(filteredDiagram);

        // --- Final sanitization and renaming pass ---
        // Track tables renamed due to SQL keyword conflicts
        const sqlRenamedTables = new Map<string, string>();
        // Track fields renamed due to SQL keyword conflicts
        const fieldRenames: Array<{
            table: string;
            originalName: string;
            newName: string;
        }> = [];
        const finalDiagramForExport: Diagram = {
            ...cleanDiagram,
            tables:
                cleanDiagram.tables?.map((table) => {
                    const originalName = table.name;
                    // Sanitize table name
                    let safeTableName = originalName.replace(/[^\w]/g, '_');
                    // Rename if SQL keyword
                    if (isSQLKeyword(safeTableName)) {
                        const newName = `${safeTableName}_table`;
                        sqlRenamedTables.set(newName, originalName);
                        safeTableName = newName;
                    }

                    const fieldNameCounts = new Map<string, number>();
                    const processedFields = table.fields.map((field) => {
                        const originalSafeName = field.name.replace(
                            /[^\w]/g,
                            '_'
                        );
                        let finalSafeName = originalSafeName;
                        const count =
                            fieldNameCounts.get(originalSafeName) || 0;

                        if (count > 0) {
                            finalSafeName = `${originalSafeName}_${count + 1}`; // Rename duplicate
                        }
                        fieldNameCounts.set(originalSafeName, count + 1);

                        // Create a copy and remove comments
                        const sanitizedField: DBField = {
                            ...field,
                            name: finalSafeName,
                        };
                        delete sanitizedField.comments;

                        // Rename if SQL keyword
                        if (isSQLKeyword(finalSafeName)) {
                            const newFieldName = `${finalSafeName}_field`;
                            fieldRenames.push({
                                table: safeTableName,
                                originalName: finalSafeName,
                                newName: newFieldName,
                            });
                            sanitizedField.name = newFieldName;
                        }
                        return sanitizedField;
                    });

                    return {
                        ...table,
                        name: safeTableName,
                        fields: processedFields, // Use fields with renamed duplicates
                        indexes: (table.indexes || []).map((index) => ({
                            ...index,
                            name: index.name
                                ? index.name.replace(/[^\w]/g, '_')
                                : `idx_${Math.random().toString(36).substring(2, 8)}`,
                        })),
                    };
                }) ?? [],
            relationships:
                cleanDiagram.relationships?.map((rel, index) => ({
                    ...rel,
                    name: `fk_${index}_${rel.name ? rel.name.replace(/[^\w]/g, '_') : Math.random().toString(36).substring(2, 8)}`,
                })) ?? [],
        } as Diagram;

        let standard = '';
        let inline = '';
        let baseScript = ''; // Define baseScript outside try

        try {
            baseScript = exportBaseSQL({
                diagram: finalDiagramForExport, // Use final diagram
                targetDatabaseType: currentDiagram.databaseType,
                isDBMLFlow: true,
            });

            baseScript = sanitizeSQLforDBML(baseScript);

            // Append COMMENTS for tables renamed due to SQL keywords
            sqlRenamedTables.forEach((originalName, newName) => {
                const escapedOriginal = originalName.replace(/'/g, "\\'");
                baseScript += `\nCOMMENT ON TABLE "${newName}" IS 'Original name was "${escapedOriginal}" (renamed due to SQL keyword conflict).';`;
            });

            // Append COMMENTS for fields renamed due to SQL keyword conflicts
            fieldRenames.forEach(({ table, originalName, newName }) => {
                const escapedOriginal = originalName.replace(/'/g, "\\'");
                baseScript += `\nCOMMENT ON COLUMN "${table}"."${newName}" IS 'Original name was "${escapedOriginal}" (renamed due to SQL keyword conflict).';`;
            });

            standard = importer.import(
                baseScript,
                databaseTypeToImportFormat(currentDiagram.databaseType)
            );

            inline = convertToInlineRefs(standard);
        } catch (error: unknown) {
            console.error(
                'Error during DBML generation process:',
                error,
                'Input SQL was:',
                baseScript // Log the SQL that caused the error
            );
            const errorMessage = `// Error generating DBML: ${error instanceof Error ? error.message : 'Unknown error'}`;
            standard = errorMessage;
            inline = errorMessage;

            // Handle different error types for toast
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
        }
        return { standardDbml: standard, inlineDbml: inline };
    }, [currentDiagram, filteredTables, toast]); // Keep toast dependency for now, although direct call is removed

    // Determine which DBML string to display
    const dbmlToDisplay = dbmlFormat === 'inline' ? inlineDbml : standardDbml;

    // Toggle function
    const toggleFormat = () => {
        setDbmlFormat((prev) => (prev === 'inline' ? 'standard' : 'inline'));
    };

    // Copy function (extracted from CodeSnippet for reuse)
    const copyToClipboard = React.useCallback(async () => {
        if (!navigator?.clipboard) {
            toast({
                title: t('copy_to_clipboard_toast.unsupported.title'),
                variant: 'destructive',
                description: t(
                    'copy_to_clipboard_toast.unsupported.description'
                ),
            });
            return;
        }

        try {
            await navigator.clipboard.writeText(dbmlToDisplay);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 1500);
        } catch {
            setIsCopied(false);
            toast({
                title: t('copy_to_clipboard_toast.failed.title'),
                variant: 'destructive',
                description: t('copy_to_clipboard_toast.failed.description'),
            });
        }
    }, [dbmlToDisplay, t, toast]);

    return (
        <div className="relative h-full flex-1">
            {/* Buttons Container - Absolutely positioned top-right, column layout */}
            <div className="absolute right-1 top-1 z-10 flex flex-col gap-1">
                {/* Copy Button (Top) */}
                <Tooltip
                    onOpenChange={setTooltipOpen}
                    open={isCopied || tooltipOpen}
                >
                    <TooltipTrigger asChild>
                        <Button
                            className="h-fit p-1.5"
                            variant="outline"
                            size="sm"
                            onClick={copyToClipboard}
                        >
                            {isCopied ? (
                                <CopyCheck size={16} />
                            ) : (
                                <Copy size={16} />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t(isCopied ? 'copied' : 'copy_to_clipboard')}
                    </TooltipContent>
                </Tooltip>

                {/* Toggle Button (Bottom) */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-fit p-1.5"
                            onClick={toggleFormat}
                        >
                            <ArrowLeftRight size={16} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={4}>
                        {dbmlFormat === 'inline'
                            ? 'Show Standard Refs'
                            : 'Show Inline Refs'}
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* CodeSnippet fills the container */}
            <CodeSnippet
                code={dbmlToDisplay}
                className="absolute inset-0 my-0.5"
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
                // Set isComplete to true to hide the blinking dot
                // (this will also show the default copy button)
                isComplete={true}
            />
        </div>
    );
};
