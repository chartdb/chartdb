import { importer } from '@dbml/core';
import { exportBaseSQL } from '@/lib/data/export-metadata/export-sql-script';
import type { Diagram } from '@/lib/domain/diagram';
import { DatabaseType } from '@/lib/domain/database-type';
import type { DBTable } from '@/lib/domain/db-table';
import { type DBField } from '@/lib/domain/db-field';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import { DBCustomTypeKind } from '@/lib/domain/db-custom-type';
import { defaultSchemas } from '@/lib/data/default-schemas';

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
export const sanitizeSQLforDBML = (sql: string): string => {
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

    // Fix char type with space before parenthesis
    sanitized = sanitized.replace(/char\s+\(/g, 'char(');
    sanitized = sanitized.replace(/character\s+\(/g, 'character(');

    // Fix DEFAULT EUR and similar cases by quoting them
    sanitized = sanitized.replace(
        /DEFAULT\s+([A-Z]{3})(?=\s|,|$)/g,
        "DEFAULT '$1'"
    );
    // Also handle single letter defaults
    sanitized = sanitized.replace(
        /DEFAULT\s+([A-Z])(?=\s|,|$)/g,
        "DEFAULT '$1'"
    );

    // Fix DEFAULT NOW by replacing with NOW()
    sanitized = sanitized.replace(/DEFAULT\s+NOW(?=\s|,|$)/gi, 'DEFAULT NOW()');

    // Replace any remaining problematic characters
    sanitized = sanitized.replace(/\?\?/g, '__');

    return sanitized;
};

// Post-process DBML to convert separate Ref statements to inline refs
const convertToInlineRefs = (dbml: string): string => {
    // Extract all Ref statements - Updated pattern to handle schema.table.field format
    // Matches both "table"."field" and "schema"."table"."field" formats
    const refPattern =
        /Ref\s+"([^"]+)"\s*:\s*(?:"([^"]+)"\.)?"([^"]+)"\."([^"]+)"\s*([<>*])\s*(?:"([^"]+)"\.)?"([^"]+)"\."([^"]+)"/g;
    const refs: Array<{
        refName: string;
        sourceSchema?: string;
        sourceTable: string;
        sourceField: string;
        direction: string;
        targetSchema?: string;
        targetTable: string;
        targetField: string;
    }> = [];

    let match;
    while ((match = refPattern.exec(dbml)) !== null) {
        refs.push({
            refName: match[1], // Reference name
            sourceSchema: match[2] || undefined, // Source schema (optional)
            sourceTable: match[3], // Source table
            sourceField: match[4], // Source field
            direction: match[5], // Direction (<, >)
            targetSchema: match[6] || undefined, // Target schema (optional)
            targetTable: match[7], // Target table
            targetField: match[8], // Target field
        });
    }

    // Extract all table definitions - Support both quoted and bracketed table names
    const tables: {
        [key: string]: {
            start: number;
            end: number;
            content: string;
            fullMatch: string;
        };
    } = {};
    // Updated pattern to handle various table name formats including schema.table
    const tablePattern =
        /Table\s+(?:"([^"]+)"(?:\."([^"]+)")?|(\[?[^\s[]+\]?\.\[?[^\s\]]+\]?)|(\[?[^\s[{]+\]?))\s*{([^}]*)}/g;

    let tableMatch;
    while ((tableMatch = tablePattern.exec(dbml)) !== null) {
        // Extract table name - handle schema.table format
        let tableName;
        if (tableMatch[1] && tableMatch[2]) {
            // Format: "schema"."table"
            tableName = `${tableMatch[1]}.${tableMatch[2]}`;
        } else if (tableMatch[1]) {
            // Format: "table" (no schema)
            tableName = tableMatch[1];
        } else {
            // Other formats
            tableName = tableMatch[3] || tableMatch[4];
        }

        // Clean up any bracket syntax from table names
        const cleanTableName = tableName.replace(/\[([^\]]+)\]/g, '$1');

        tables[cleanTableName] = {
            start: tableMatch.index,
            end: tableMatch.index + tableMatch[0].length,
            content: tableMatch[5],
            fullMatch: tableMatch[0],
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
            targetTableName = ref.targetSchema
                ? `${ref.targetSchema}.${ref.targetTable}`
                : ref.targetTable;
            fieldNameToModify = ref.targetField;
            const sourceRef = ref.sourceSchema
                ? `"${ref.sourceSchema}"."${ref.sourceTable}"."${ref.sourceField}"`
                : `"${ref.sourceTable}"."${ref.sourceField}"`;
            inlineRefSyntax = `ref: < ${sourceRef}`;
        } else {
            targetTableName = ref.sourceSchema
                ? `${ref.sourceSchema}.${ref.sourceTable}`
                : ref.sourceTable;
            fieldNameToModify = ref.sourceField;
            const targetRef = ref.targetSchema
                ? `"${ref.targetSchema}"."${ref.targetTable}"."${ref.targetField}"`
                : `"${ref.targetTable}"."${ref.targetField}"`;
            inlineRefSyntax = `ref: > ${targetRef}`;
        }

        const tableData = tableMap.get(targetTableName);
        if (tableData) {
            // Updated pattern to capture field definition and all existing attributes in brackets
            const fieldPattern = new RegExp(
                `^([ \t]*"${fieldNameToModify}"[^\\n]*?)(?:\\s*(\\[[^\\]]*\\]))*\\s*(//.*)?$`,
                'gm'
            );
            let newContent = tableData.content;

            newContent = newContent.replace(
                fieldPattern,
                (lineMatch, fieldPart, existingBrackets, commentPart) => {
                    // Avoid adding duplicate refs
                    if (lineMatch.includes('ref:')) {
                        return lineMatch;
                    }

                    // Collect all attributes from existing brackets
                    const allAttributes: string[] = [];
                    if (existingBrackets) {
                        // Extract all bracket contents
                        const bracketPattern = /\[([^\]]*)\]/g;
                        let bracketMatch;
                        while (
                            (bracketMatch = bracketPattern.exec(lineMatch)) !==
                            null
                        ) {
                            const content = bracketMatch[1].trim();
                            if (content) {
                                allAttributes.push(content);
                            }
                        }
                    }

                    // Add the new ref
                    allAttributes.push(inlineRefSyntax);

                    // Combine all attributes into a single bracket
                    const combinedAttributes = allAttributes.join(', ');

                    // Preserve original spacing from fieldPart
                    const leadingSpaces = fieldPart.match(/^(\s*)/)?.[1] || '';
                    const fieldDefWithoutSpaces = fieldPart.trim();
                    return `${leadingSpaces}${fieldDefWithoutSpaces} [${combinedAttributes}]${commentPart || ''}`;
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

    for (const [, tableData] of sortedTables) {
        reconstructedDbml += dbml.substring(lastIndex, tableData.start);
        // Preserve the original table definition format but with updated content
        const originalTableDef = tableData.fullMatch;
        const updatedTableDef = originalTableDef.replace(
            /{[^}]*}/,
            `{${tableData.content}}`
        );
        reconstructedDbml += updatedTableDef;
        lastIndex = tableData.end;
    }
    reconstructedDbml += dbml.substring(lastIndex);

    // 3. Remove original Ref lines
    const finalLines = reconstructedDbml
        .split('\n')
        .filter((line) => !line.trim().startsWith('Ref '));
    const finalDbml = finalLines.join('\n').trim();

    // Clean up excessive empty lines - replace multiple consecutive empty lines with just one
    const cleanedDbml = finalDbml.replace(/\n\s*\n\s*\n/g, '\n\n');

    return cleanedDbml;
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
        .replace(/"char "/g, '"char"')
        .replace(/char \(([0-9]+)\)/g, 'char($1)')
        .replace(/"char \(([0-9]+)\)"/g, '"char($1)"')
        .replace(/"character \(([0-9]+)\)"/g, '"character($1)"')
        .replace(/character \(([0-9]+)\)/g, 'character($1)');
};

// Fix table definitions with incorrect bracket syntax
const fixTableBracketSyntax = (dbml: string): string => {
    // Fix patterns like Table [schema].[table] to Table "schema"."table"
    return dbml.replace(
        /Table\s+\[([^\]]+)\]\.\[([^\]]+)\]/g,
        'Table "$1"."$2"'
    );
};

// Restore schema information that may have been stripped by the DBML importer
const restoreTableSchemas = (dbml: string, diagram: Diagram): string => {
    if (!diagram.tables) return dbml;

    // Group tables by name to handle duplicates
    const tablesByName = new Map<
        string,
        Array<{ table: (typeof diagram.tables)[0]; index: number }>
    >();
    diagram.tables.forEach((table, index) => {
        const existing = tablesByName.get(table.name) || [];
        existing.push({ table, index });
        tablesByName.set(table.name, existing);
    });

    let result = dbml;

    // Process each group of tables with the same name
    tablesByName.forEach((tablesGroup, tableName) => {
        if (tablesGroup.length === 1) {
            // Single table with this name - simple case
            const table = tablesGroup[0].table;
            if (table.schema) {
                // Match table definition without schema (e.g., Table "users" {)
                const tablePattern = new RegExp(
                    `Table\\s+"${table.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*{`,
                    'g'
                );
                const schemaTableName = `Table "${table.schema}"."${table.name}" {`;
                result = result.replace(tablePattern, schemaTableName);

                // Update references in Ref statements
                const escapedTableName = table.name.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    '\\$&'
                );

                // Pattern 1: In Ref definitions - :"tablename"."field"
                const refDefPattern = new RegExp(
                    `(Ref\\s+"[^"]+")\\s*:\\s*"${escapedTableName}"\\."([^"]+)"`,
                    'g'
                );
                result = result.replace(
                    refDefPattern,
                    `$1:"${table.schema}"."${table.name}"."$2"`
                );

                // Pattern 2: In Ref targets - [<>] "tablename"."field"
                const refTargetPattern = new RegExp(
                    `([<>])\\s*"${escapedTableName}"\\."([^"]+)"`,
                    'g'
                );
                result = result.replace(
                    refTargetPattern,
                    `$1 "${table.schema}"."${table.name}"."$2"`
                );
            }
        } else {
            // Multiple tables with the same name - need to be more careful
            const defaultSchema = defaultSchemas[diagram.databaseType];

            // Separate tables by whether they have the default schema or not
            const defaultSchemaTable = tablesGroup.find(
                ({ table }) => table.schema === defaultSchema
            );
            const nonDefaultSchemaTables = tablesGroup.filter(
                ({ table }) => table.schema && table.schema !== defaultSchema
            );

            // Find all table definitions for this name
            const escapedTableName = tableName.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            );

            // First, handle tables that already have schema in DBML
            const schemaTablePattern = new RegExp(
                `Table\\s+"[^"]+"\\.\\s*"${escapedTableName}"\\s*{`,
                'g'
            );
            result = result.replace(schemaTablePattern, (match) => {
                // This table already has a schema, keep it as is
                return match;
            });

            // Then handle tables without schema in DBML
            const noSchemaTablePattern = new RegExp(
                `Table\\s+"${escapedTableName}"\\s*{`,
                'g'
            );

            let noSchemaMatchIndex = 0;
            result = result.replace(noSchemaTablePattern, (match) => {
                // If we have a table with the default schema and this is the first match without schema,
                // it should be the default schema table
                if (noSchemaMatchIndex === 0 && defaultSchemaTable) {
                    noSchemaMatchIndex++;
                    return `Table "${defaultSchema}"."${tableName}" {`;
                }
                // Otherwise, try to match with non-default schema tables
                const remainingNonDefault =
                    nonDefaultSchemaTables[
                        noSchemaMatchIndex - (defaultSchemaTable ? 1 : 0)
                    ];
                if (remainingNonDefault) {
                    noSchemaMatchIndex++;
                    return `Table "${remainingNonDefault.table.schema}"."${tableName}" {`;
                }
                return match;
            });
        }
    });

    return result;
};

export interface DBMLExportResult {
    standardDbml: string;
    inlineDbml: string;
    error?: string;
}

export function generateDBMLFromDiagram(diagram: Diagram): DBMLExportResult {
    // Filter out fields with empty names
    const sanitizedTables =
        diagram.tables?.map((table) => {
            const validFields = table.fields.filter(
                (field) => field.name !== ''
            );
            return {
                ...table,
                fields: validFields,
            };
        }) ?? [];

    // Remove duplicate tables (consider both schema and table name)
    const seenTableIdentifiers = new Set<string>();
    const uniqueTables = sanitizedTables.filter((table) => {
        // Create a unique identifier combining schema and table name
        const tableIdentifier = table.schema
            ? `${table.schema}.${table.name}`
            : table.name;

        if (seenTableIdentifiers.has(tableIdentifier)) {
            return false; // Skip duplicate
        }
        seenTableIdentifiers.add(tableIdentifier);
        return true; // Keep unique table
    });

    // Create the base filtered diagram structure
    const filteredDiagram: Diagram = {
        ...diagram,
        tables: uniqueTables,
        relationships:
            diagram.relationships?.filter((rel) => {
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
        diagram.databaseType === DatabaseType.POSTGRESQL ||
        diagram.databaseType === DatabaseType.SQLITE;
    const sqlRenamedTables = new Map<string, string>();
    const fieldRenames: Array<{
        table: string;
        originalName: string;
        newName: string;
    }> = [];

    const processTable = (table: DBTable) => {
        const originalName = table.name;
        let safeTableName = originalName;

        // If name contains spaces or special characters, wrap in quotes
        if (/[^\w]/.test(originalName)) {
            safeTableName = `"${originalName.replace(/"/g, '\\"')}"`;
        }

        // Rename table if SQL keyword (PostgreSQL only)
        if (shouldRenameKeywords && isSQLKeyword(originalName)) {
            const newName = `${originalName}_table`;
            sqlRenamedTables.set(newName, originalName);
            safeTableName = /[^\w]/.test(newName)
                ? `"${newName.replace(/"/g, '\\"')}"`
                : newName;
        }

        const fieldNameCounts = new Map<string, number>();
        const processedFields = table.fields.map((field) => {
            let finalSafeName = field.name;

            // If field name contains spaces or special characters, wrap in quotes
            if (/[^\w]/.test(field.name)) {
                finalSafeName = `"${field.name.replace(/"/g, '\\"')}"`;
            }

            // Handle duplicate field names
            const count = fieldNameCounts.get(field.name) || 0;
            if (count > 0) {
                const newName = `${field.name}_${count + 1}`;
                finalSafeName = /[^\w]/.test(newName)
                    ? `"${newName.replace(/"/g, '\\"')}"`
                    : newName;
            }
            fieldNameCounts.set(field.name, count + 1);

            // Create sanitized field
            const sanitizedField: DBField = {
                ...field,
                name: finalSafeName,
            };

            // Rename field if SQL keyword (PostgreSQL only)
            if (shouldRenameKeywords && isSQLKeyword(field.name)) {
                const newFieldName = `${field.name}_field`;
                fieldRenames.push({
                    table: safeTableName,
                    originalName: field.name,
                    newName: newFieldName,
                });
                sanitizedField.name = /[^\w]/.test(newFieldName)
                    ? `"${newFieldName.replace(/"/g, '\\"')}"`
                    : newFieldName;
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
                    ? /[^\w]/.test(index.name)
                        ? `"${index.name.replace(/"/g, '\\"')}"`
                        : index.name
                    : `idx_${Math.random().toString(36).substring(2, 8)}`,
            })),
        };
    };

    const finalDiagramForExport: Diagram = deduplicateRelationships({
        ...cleanDiagram,
        tables: cleanDiagram.tables?.map(processTable) ?? [],
        relationships:
            cleanDiagram.relationships?.map((rel, index) => {
                const safeName = rel.name
                    ? rel.name.replace(/[^\w]/g, '_')
                    : Math.random().toString(36).substring(2, 8);
                return {
                    ...rel,
                    name: `fk_${index}_${safeName}`,
                };
            }) ?? [],
    } as Diagram);

    let standard = '';
    let inline = '';
    let baseScript = ''; // Define baseScript outside try

    // Use finalDiagramForExport.customTypes which should be DBCustomType[]
    const enumsDBML = generateEnumsDBML(finalDiagramForExport.customTypes);

    let errorMsg: string | undefined = undefined;

    try {
        baseScript = exportBaseSQL({
            diagram: finalDiagramForExport, // Use final diagram
            targetDatabaseType: diagram.databaseType,
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
            fixTableBracketSyntax(
                importer.import(
                    baseScript,
                    databaseTypeToImportFormat(diagram.databaseType)
                )
            )
        );

        // Restore schema information that may have been stripped by DBML importer
        standard = restoreTableSchemas(standard, diagram);

        // Prepend Enum DBML to the standard output
        if (enumsDBML) {
            standard = enumsDBML + '\n\n' + standard;
        }

        inline = normalizeCharTypeFormat(convertToInlineRefs(standard));

        // Clean up excessive empty lines in both outputs
        standard = standard.replace(/\n\s*\n\s*\n/g, '\n\n');
        inline = inline.replace(/\n\s*\n\s*\n/g, '\n\n');
    } catch (error: unknown) {
        console.error(
            'Error during DBML generation process:',
            error,
            'Input SQL was:',
            baseScript // Log the SQL that caused the error
        );

        errorMsg = error instanceof Error ? error.message : 'Unknown error';
        const errorMessage = `// Error generating DBML: ${errorMsg}`;
        standard = errorMessage;
        inline = errorMessage;

        // If an error occurred, still prepend enums if they exist, or they'll be lost.
        // The error message will then follow.
        if (standard.startsWith('// Error generating DBML:') && enumsDBML) {
            standard = enumsDBML + '\n\n' + standard;
        }
        if (inline.startsWith('// Error generating DBML:') && enumsDBML) {
            inline = enumsDBML + '\n\n' + inline;
        }
    }

    return { standardDbml: standard, inlineDbml: inline, error: errorMsg };
}
