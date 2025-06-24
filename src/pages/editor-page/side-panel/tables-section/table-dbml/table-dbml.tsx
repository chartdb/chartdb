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
import { ArrowLeftRight } from 'lucide-react';
import { type DBField } from '@/lib/domain/db-field';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import { DBCustomTypeKind } from '@/lib/domain/db-custom-type';

export interface TableDBMLProps {
    filteredTables: DBTable[];
}

// Use DBCustomType for generating Enum DBML
const generateEnumsDBML = (customTypes: DBCustomType[] | undefined): string => {
    if (!customTypes || customTypes.length === 0) {
        return '';
    }

    // Filter for enum types and map them
    return customTypes
        .filter((ct) => ct.kind === DBCustomTypeKind.enum)
        .map((enumDef) => {
            const enumIdentifier = enumDef.schema
                ? `"${enumDef.schema}"."${enumDef.name.replace(/"/g, '\\"')}"`
                : `"${enumDef.name.replace(/"/g, '\\"')}"`;

            const valuesString = (enumDef.values || []) // Ensure values array exists
                .map((valueName) => {
                    // valueName is a string as per DBCustomType
                    const valLine = `    "${valueName.replace(/"/g, '\\"')}"`;
                    // If you have notes per enum value, you'd need to adjust DBCustomType
                    // For now, assuming no notes per value in DBCustomType
                    return valLine;
                })
                .join('\n');
            return `Enum ${enumIdentifier} {\n${valuesString}\n}\n`;
        })
        .join('\n');
};

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
        case DatabaseType.ORACLE:
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

    // Comment out self-referencing foreign keys to prevent "Two endpoints are the same" error
    // Example: ALTER TABLE public.class ADD CONSTRAINT ... FOREIGN KEY (class_id) REFERENCES public.class (class_id);
    const lines = sanitized.split('\n');
    const processedLines = lines.map((line) => {
        const selfRefFKPattern =
            /ALTER\s+TABLE\s+(?:\S+\.)?(\S+)\s+ADD\s+CONSTRAINT\s+\S+\s+FOREIGN\s+KEY\s*\([^)]+\)\s+REFERENCES\s+(?:\S+\.)?\1\s*\([^)]+\)\s*;/i;
        if (selfRefFKPattern.test(line)) {
            return `-- ${line}`; // Comment out the line
        }
        return line;
    });
    sanitized = processedLines.join('\n');

    // Fix PostgreSQL type casting syntax that the DBML parser doesn't understand
    sanitized = sanitized.replace(/::regclass/g, '');
    sanitized = sanitized.replace(/: :regclass/g, ''); // Fix corrupted version

    // Fix duplicate columns in index definitions
    sanitized = sanitized.replace(
        /CREATE\s+(?:UNIQUE\s+)?INDEX\s+\S+\s+ON\s+\S+\s*\(([^)]+)\)/gi,
        (match, columnList) => {
            const columns = columnList
                .split(',')
                .map((col: string) => col.trim());
            const uniqueColumns = [...new Set(columns)]; // Remove duplicates
            return match.replace(columnList, uniqueColumns.join(', '));
        }
    );

    // Replace any remaining problematic characters
    sanitized = sanitized.replace(/\?\?/g, '__');

    return sanitized;
};

// Post-process DBML to convert separate Ref statements to inline refs
const convertToInlineRefs = (dbml: string): string => {
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
        refs.push({
            refName: match[1], // Reference name
            sourceTable: match[2], // Source table
            sourceField: match[3], // Source field
            direction: match[4], // Direction (<, >)
            targetTable: match[5], // Target table
            targetField: match[6], // Target field
        });
    }

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

    if (refs.length === 0 || Object.keys(tables).length === 0) {
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
                    _fieldName,
                    existingAttributes,
                    commentPart
                ) => {
                    // Avoid adding duplicate refs
                    if (lineMatch.includes('[ref:')) {
                        return lineMatch;
                    }

                    return `${fieldPart.trim()} ${inlineRefSyntax}${existingAttributes || ''}${commentPart || ''}`;
                }
            );

            // Update the table content if modified
            if (newContent !== tableData.content) {
                tableData.content = newContent;
                tableMap.set(targetTableName, tableData);
            }
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

    return finalDbml;
};

// Function to check for SQL keywords (add more if needed)
const isSQLKeyword = (name: string): boolean => {
    const keywords = new Set(['CASE', 'ORDER', 'GROUP', 'FROM', 'TO', 'USER']); // Add common keywords
    return keywords.has(name.toUpperCase());
};

// Function to remove duplicate relationships from the diagram
const deduplicateRelationships = (diagram: Diagram): Diagram => {
    if (!diagram.relationships) return diagram;

    const seenRelationships = new Set<string>();
    const uniqueRelationships = diagram.relationships.filter((rel) => {
        // Create a unique key based on the relationship endpoints
        const relationshipKey = `${rel.sourceTableId}-${rel.sourceFieldId}->${rel.targetTableId}-${rel.targetFieldId}`;

        if (seenRelationships.has(relationshipKey)) {
            return false; // Skip duplicate
        }

        seenRelationships.add(relationshipKey);
        return true; // Keep unique relationship
    });

    return {
        ...diagram,
        relationships: uniqueRelationships,
    };
};

// Function to append comment statements for renamed tables and fields
const appendRenameComments = (
    baseScript: string,
    sqlRenamedTables: Map<string, string>,
    fieldRenames: Array<{
        table: string;
        originalName: string;
        newName: string;
    }>,
    finalDiagramForExport: Diagram
): string => {
    let script = baseScript;

    // Append COMMENTS for tables renamed due to SQL keywords
    sqlRenamedTables.forEach((originalName, newName) => {
        const escapedOriginal = originalName.replace(/'/g, "\\'");
        // Find the table to get its schema
        const table = finalDiagramForExport.tables?.find(
            (t) => t.name === newName
        );
        const tableIdentifier = table?.schema
            ? `"${table.schema}"."${newName}"`
            : `"${newName}"`;
        script += `\nCOMMENT ON TABLE ${tableIdentifier} IS 'Original name was "${escapedOriginal}" (renamed due to SQL keyword conflict).';`;
    });

    // Append COMMENTS for fields renamed due to SQL keyword conflicts
    fieldRenames.forEach(({ table, originalName, newName }) => {
        const escapedOriginal = originalName.replace(/'/g, "\\'");
        // Find the table to get its schema
        const tableObj = finalDiagramForExport.tables?.find(
            (t) => t.name === table
        );
        const tableIdentifier = tableObj?.schema
            ? `"${tableObj.schema}"."${table}"`
            : `"${table}"`;
        script += `\nCOMMENT ON COLUMN ${tableIdentifier}."${newName}" IS 'Original name was "${escapedOriginal}" (renamed due to SQL keyword conflict).';`;
    });

    return script;
};

// Fix DBML formatting to ensure consistent display of char and varchar types
const normalizeCharTypeFormat = (dbml: string): string => {
    // Replace "char (N)" with "char(N)" to match varchar's formatting
    return dbml
        .replace(/"char "/g, 'char')
        .replace(/"char \(([0-9]+)\)"/g, 'char($1)')
        .replace(/"character \(([0-9]+)\)"/g, 'character($1)');
};

export const TableDBML: React.FC<TableDBMLProps> = ({ filteredTables }) => {
    const { currentDiagram } = useChartDB();
    const { effectiveTheme } = useTheme();
    const { toast } = useToast();
    const [dbmlFormat, setDbmlFormat] = useState<'inline' | 'standard'>(
        'inline'
    );

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

        // Remove duplicate tables (keep first occurrence by table name)
        const seenTableNames = new Set<string>();
        const uniqueTables = sanitizedTables.filter((table) => {
            if (seenTableNames.has(table.name)) {
                return false; // Skip duplicate
            }
            seenTableNames.add(table.name);
            return true; // Keep unique table
        });

        // Create the base filtered diagram structure
        const filteredDiagram: Diagram = {
            ...currentDiagram,
            tables: uniqueTables,
            relationships:
                currentDiagram.relationships?.filter((rel) => {
                    const sourceTable = uniqueTables.find(
                        (t) => t.id === rel.sourceTableId
                    );
                    const targetTable = uniqueTables.find(
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
        const shouldRenameKeywords =
            currentDiagram.databaseType === DatabaseType.POSTGRESQL ||
            currentDiagram.databaseType === DatabaseType.SQLITE;
        const sqlRenamedTables = new Map<string, string>();
        const fieldRenames: Array<{
            table: string;
            originalName: string;
            newName: string;
        }> = [];

        const processTable = (table: DBTable) => {
            const originalName = table.name;
            let safeTableName = originalName.replace(/[^\w]/g, '_');

            // Rename table if SQL keyword (PostgreSQL only)
            if (shouldRenameKeywords && isSQLKeyword(safeTableName)) {
                const newName = `${safeTableName}_table`;
                sqlRenamedTables.set(newName, originalName);
                safeTableName = newName;
            }

            const fieldNameCounts = new Map<string, number>();
            const processedFields = table.fields.map((field) => {
                const originalSafeName = field.name.replace(/[^\w]/g, '_');
                let finalSafeName = originalSafeName;

                // Handle duplicate field names
                const count = fieldNameCounts.get(originalSafeName) || 0;
                if (count > 0) {
                    finalSafeName = `${originalSafeName}_${count + 1}`;
                }
                fieldNameCounts.set(originalSafeName, count + 1);

                // Create sanitized field
                const sanitizedField: DBField = {
                    ...field,
                    name: finalSafeName,
                };
                delete sanitizedField.comments;

                // Rename field if SQL keyword (PostgreSQL only)
                if (shouldRenameKeywords && isSQLKeyword(finalSafeName)) {
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
                fields: processedFields,
                indexes: (table.indexes || []).map((index) => ({
                    ...index,
                    name: index.name
                        ? index.name.replace(/[^\w]/g, '_')
                        : `idx_${Math.random().toString(36).substring(2, 8)}`,
                })),
            };
        };

        const finalDiagramForExport: Diagram = deduplicateRelationships({
            ...cleanDiagram,
            tables: cleanDiagram.tables?.map(processTable) ?? [],
            relationships:
                cleanDiagram.relationships?.map((rel, index) => ({
                    ...rel,
                    name: `fk_${index}_${rel.name ? rel.name.replace(/[^\w]/g, '_') : Math.random().toString(36).substring(2, 8)}`,
                })) ?? [],
        } as Diagram);

        let standard = '';
        let inline = '';
        let baseScript = ''; // Define baseScript outside try

        // Use finalDiagramForExport.customTypes which should be DBCustomType[]
        const enumsDBML = generateEnumsDBML(finalDiagramForExport.customTypes);

        try {
            baseScript = exportBaseSQL({
                diagram: finalDiagramForExport, // Use final diagram
                targetDatabaseType: currentDiagram.databaseType,
                isDBMLFlow: true,
            });

            baseScript = sanitizeSQLforDBML(baseScript);

            // Append comments for renamed tables and fields (PostgreSQL only)
            if (shouldRenameKeywords) {
                baseScript = appendRenameComments(
                    baseScript,
                    sqlRenamedTables,
                    fieldRenames,
                    finalDiagramForExport
                );
            }

            standard = normalizeCharTypeFormat(
                importer.import(
                    baseScript,
                    databaseTypeToImportFormat(currentDiagram.databaseType)
                )
            );

            // Prepend Enum DBML to the standard output
            standard = enumsDBML + '\n' + standard;

            inline = normalizeCharTypeFormat(convertToInlineRefs(standard));
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

            // If an error occurred, still prepend enums if they exist, or they'll be lost.
            // The error message will then follow.
            if (standard.startsWith('// Error generating DBML:')) {
                standard = enumsDBML + standard;
            }
            if (inline.startsWith('// Error generating DBML:')) {
                inline = enumsDBML + inline;
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

    return (
        <CodeSnippet
            code={dbmlToDisplay}
            className="my-0.5"
            actions={[
                {
                    label: `Show ${dbmlFormat === 'inline' ? 'Standard' : 'Inline'} Refs`,
                    icon: ArrowLeftRight,
                    onClick: toggleFormat,
                },
            ]}
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
