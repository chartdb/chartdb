import { importer } from '@dbml/core';
import { exportBaseSQL } from '@/lib/data/sql-export/export-sql-script';
import type { Diagram } from '@/lib/domain/diagram';
import { DatabaseType } from '@/lib/domain/database-type';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import { DBCustomTypeKind } from '@/lib/domain/db-custom-type';

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

    // Comment out invalid self-referencing foreign keys where the same field references itself
    // Example: ALTER TABLE table ADD CONSTRAINT ... FOREIGN KEY (field_a) REFERENCES table (field_a);
    // But keep valid self-references like: FOREIGN KEY (field_a) REFERENCES table (field_b);
    const lines = sanitized.split('\n');
    const processedLines = lines.map((line) => {
        // Match pattern: ALTER TABLE [schema.]table ADD CONSTRAINT ... FOREIGN KEY(field) REFERENCES [schema.]table(field)
        // Capture the table name, source field, and target field
        const selfRefFKPattern =
            /ALTER\s+TABLE\s+(?:["[]?(\S+?)[\]"]?\.)?["[]?(\S+?)[\]"]?\s+ADD\s+CONSTRAINT\s+\S+\s+FOREIGN\s+KEY\s*\(["[]?([^)"]+)[\]"]?\)\s+REFERENCES\s+(?:["[]?\S+?[\]"]?\.)?"?[[]?\2[\]]?"?\s*\(["[]?([^)"]+)[\]"]?\)\s*;/i;
        const match = selfRefFKPattern.exec(line);

        if (match) {
            const sourceField = match[3].trim();
            const targetField = match[4].trim();

            // Only comment out if source and target fields are the same
            if (sourceField === targetField) {
                return `-- ${line}`; // Comment out invalid self-reference
            }
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

// Find the matching closing bracket, properly handling quoted strings within brackets
const findClosingBracket = (str: string, openBracketIndex: number): number => {
    let i = openBracketIndex + 1;
    const len = str.length;

    while (i < len) {
        const char = str[i];

        if (char === ']') return i;

        // Skip quoted strings (triple, single, or double)
        if (char === "'" || char === '"') {
            const isTriple =
                char === "'" && str[i + 1] === "'" && str[i + 2] === "'";
            const quote = isTriple ? "'''" : char;
            const quoteLen = quote.length;
            i += quoteLen;

            while (i < len) {
                if (str[i] === '\\') {
                    i += 2; // Skip escaped char
                } else if (str.startsWith(quote, i)) {
                    i += quoteLen;
                    break;
                } else {
                    i++;
                }
            }
            continue;
        }
        i++;
    }
    return -1;
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

    // Use a more sophisticated approach to handle nested braces
    let currentPos = 0;
    while (currentPos < dbml.length) {
        // Find the next table definition
        const tableStartPattern =
            /Table\s+(?:"([^"]+)"(?:\."([^"]+)")?|(\[?[^\s[]+\]?\.\[?[^\s\]]+\]?)|(\[?[^\s[{]+\]?))\s*{/g;
        tableStartPattern.lastIndex = currentPos;
        const tableStartMatch = tableStartPattern.exec(dbml);

        if (!tableStartMatch) break;

        // Extract table name
        let tableName;
        if (tableStartMatch[1] && tableStartMatch[2]) {
            tableName = `${tableStartMatch[1]}.${tableStartMatch[2]}`;
        } else if (tableStartMatch[1]) {
            tableName = tableStartMatch[1];
        } else {
            tableName = tableStartMatch[3] || tableStartMatch[4];
        }

        // Clean up any bracket syntax from table names
        const cleanTableName = tableName.replace(/\[([^\]]+)\]/g, '$1');

        // Find the matching closing brace by counting nested braces
        const openBracePos =
            tableStartMatch.index + tableStartMatch[0].length - 1;
        let braceCount = 1;
        const contentStart = openBracePos + 1;
        let contentEnd = contentStart;

        for (let i = contentStart; i < dbml.length && braceCount > 0; i++) {
            if (dbml[i] === '{') braceCount++;
            else if (dbml[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    contentEnd = i;
                }
            }
        }

        if (braceCount === 0) {
            const content = dbml.substring(contentStart, contentEnd);
            const fullMatch = dbml.substring(
                tableStartMatch.index,
                contentEnd + 1
            );

            tables[cleanTableName] = {
                start: tableStartMatch.index,
                end: contentEnd + 1,
                content: content,
                fullMatch: fullMatch,
            };

            currentPos = contentEnd + 1;
        } else {
            // Malformed DBML, skip this table
            currentPos = tableStartMatch.index + tableStartMatch[0].length;
        }
    }

    if (refs.length === 0 || Object.keys(tables).length === 0) {
        return dbml; // Return original if parsing failed
    }

    // Create a map for faster table lookup
    const tableMap = new Map(Object.entries(tables));

    // 1. First, collect all refs per field
    const fieldRefs = new Map<
        string,
        { table: string; refs: string[]; relatedTables: string[] }
    >();

    refs.forEach((ref) => {
        let targetTableName, fieldNameToModify, inlineRefSyntax, relatedTable;

        if (ref.direction === '<') {
            targetTableName = ref.targetSchema
                ? `${ref.targetSchema}.${ref.targetTable}`
                : ref.targetTable;
            fieldNameToModify = ref.targetField;
            const sourceRef = ref.sourceSchema
                ? `"${ref.sourceSchema}"."${ref.sourceTable}"."${ref.sourceField}"`
                : `"${ref.sourceTable}"."${ref.sourceField}"`;
            inlineRefSyntax = `ref: < ${sourceRef}`;
            relatedTable = ref.sourceTable;
        } else {
            targetTableName = ref.sourceSchema
                ? `${ref.sourceSchema}.${ref.sourceTable}`
                : ref.sourceTable;
            fieldNameToModify = ref.sourceField;
            const targetRef = ref.targetSchema
                ? `"${ref.targetSchema}"."${ref.targetTable}"."${ref.targetField}"`
                : `"${ref.targetTable}"."${ref.targetField}"`;
            inlineRefSyntax = `ref: > ${targetRef}`;
            relatedTable = ref.targetTable;
        }

        const fieldKey = `${targetTableName}.${fieldNameToModify}`;
        const existing = fieldRefs.get(fieldKey) || {
            table: targetTableName,
            refs: [],
            relatedTables: [],
        };
        existing.refs.push(inlineRefSyntax);
        existing.relatedTables.push(relatedTable);
        fieldRefs.set(fieldKey, existing);
    });

    // 2. Apply all refs to fields
    fieldRefs.forEach((fieldData, fieldKey) => {
        const lastDotIndex = fieldKey.lastIndexOf('.');
        const tableName = fieldKey.substring(0, lastDotIndex);
        const fieldName = fieldKey.substring(lastDotIndex + 1);
        const tableData = tableMap.get(tableName);

        if (!tableData) return;

        const fieldStartPattern = new RegExp(`^([ \\t]*)"${fieldName}"\\s+`);
        const lines = tableData.content.split('\n');
        let modified = false;

        const newLines = lines.map((line) => {
            const match = fieldStartPattern.exec(line);
            if (!match) return line;

            modified = true;
            const leadingSpaces = match[1];
            const bracketStart = line.indexOf('[');

            // Extract field definition (before bracket) and existing attributes
            const fieldDef =
                bracketStart !== -1
                    ? line.substring(0, bracketStart).trim()
                    : line.trim();

            const existingContent =
                bracketStart !== -1
                    ? line.substring(
                          bracketStart + 1,
                          findClosingBracket(line, bracketStart)
                      )
                    : null;

            const attributes = existingContent
                ? [existingContent.trim(), ...fieldData.refs]
                : fieldData.refs;

            return `${leadingSpaces}${fieldDef} [${attributes.join(', ')}]`;
        });

        if (modified) {
            tableData.content = newLines.join('\n');
            tableMap.set(tableName, tableData);
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
        let formattedContent = tableData.content;

        // Clean up content formatting:
        // 1. Split into lines to handle each line individually
        const lines = formattedContent.split('\n');

        // 2. Process lines to ensure proper formatting
        const processedLines = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trimEnd();

            // Skip empty lines at the end if followed by a closing brace
            if (trimmedLine === '' && i === lines.length - 1) {
                continue;
            }

            // Skip empty lines before a closing brace
            if (
                trimmedLine === '' &&
                i < lines.length - 1 &&
                lines[i + 1].trim().startsWith('}')
            ) {
                continue;
            }

            processedLines.push(line);
        }

        formattedContent = processedLines.join('\n');

        // Ensure content ends with a newline before the table's closing brace
        if (!formattedContent.endsWith('\n')) {
            formattedContent = formattedContent + '\n';
        }

        // Since we properly extracted content with nested braces, we need to rebuild the table definition
        const tableHeader = originalTableDef.substring(
            0,
            originalTableDef.indexOf('{') + 1
        );
        const updatedTableDef = `${tableHeader}${formattedContent}}`;
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
    // But ensure there's at least one blank line between tables
    const cleanedDbml = finalDbml
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/}\n(?=Table)/g, '}\n\n');

    return cleanedDbml;
};

// Function to remove duplicate relationships from the diagram
const deduplicateRelationships = (diagram: Diagram): Diagram => {
    if (!diagram.relationships) return diagram;

    const seenRelationships = new Set<string>();
    const seenBidirectional = new Set<string>();
    const uniqueRelationships = diagram.relationships.filter((rel) => {
        // Create a unique key based on the relationship endpoints
        const relationshipKey = `${rel.sourceTableId}-${rel.sourceFieldId}->${rel.targetTableId}-${rel.targetFieldId}`;

        // Create a normalized key that's the same for both directions
        const normalizedKey = [
            `${rel.sourceTableId}-${rel.sourceFieldId}`,
            `${rel.targetTableId}-${rel.targetFieldId}`,
        ]
            .sort()
            .join('<->');

        if (seenRelationships.has(relationshipKey)) {
            return false; // Skip exact duplicate
        }

        if (seenBidirectional.has(normalizedKey)) {
            // This is a bidirectional relationship, skip the second one
            return false;
        }

        seenRelationships.add(relationshipKey);
        seenBidirectional.add(normalizedKey);
        return true; // Keep unique relationship
    });

    return {
        ...diagram,
        relationships: uniqueRelationships,
    };
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

// Fix array types that are incorrectly quoted by DBML importer
const fixArrayTypes = (dbml: string): string => {
    // Remove quotes around array types like "text[]" -> text[]
    // Matches patterns like: "fieldname" "type[]" and replaces with "fieldname" type[]
    return dbml.replace(/(\s+"[^"]+"\s+)"([^"\s]+\[\])"/g, '$1$2');
};

// Fix table definitions with incorrect bracket syntax
const fixTableBracketSyntax = (dbml: string): string => {
    // Fix patterns like Table [schema].[table] to Table "schema"."table"
    return dbml.replace(
        /Table\s+\[([^\]]+)\]\.\[([^\]]+)\]/g,
        'Table "$1"."$2"'
    );
};

// Fix table names that have been broken across multiple lines
const fixMultilineTableNames = (dbml: string): string => {
    // Match Table declarations that might have line breaks in the table name
    // This regex captures:
    // - Table keyword
    // - Optional quoted schema with dot
    // - Table name that might be broken across lines (until the opening brace)
    return dbml.replace(
        /Table\s+((?:"[^"]*"\.)?"[^"]*(?:\n[^"]*)*")\s*\{/g,
        (_, tableName) => {
            // Remove line breaks within the table name
            const fixedTableName = tableName.replace(/\n\s*/g, '');
            return `Table ${fixedTableName} {`;
        }
    );
};

// Restore increment attribute for auto-incrementing fields
const restoreIncrementAttribute = (dbml: string, tables: DBTable[]): string => {
    if (!tables || tables.length === 0) return dbml;

    let result = dbml;

    tables.forEach((table) => {
        // Find fields with increment=true
        const incrementFields = table.fields.filter((f) => f.increment);

        incrementFields.forEach((field) => {
            // Build the table identifier pattern
            const tableIdentifier = table.schema
                ? `"${table.schema.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\."${table.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`
                : `"${table.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`;

            // Escape field name for regex
            const escapedFieldName = field.name.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            );

            // Pattern to match the field line with existing attributes in brackets
            // Matches: "field_name" type [existing, attributes]
            const fieldPattern = new RegExp(
                `(Table ${tableIdentifier} \\{[^}]*?^\\s*"${escapedFieldName}"[^\\[\\n]+)(\\[[^\\]]*\\])`,
                'gms'
            );

            result = result.replace(
                fieldPattern,
                (match, fieldPart, brackets) => {
                    // Check if increment already exists
                    if (brackets.includes('increment')) {
                        return match;
                    }

                    // Add increment to the attributes
                    const newBrackets = brackets.replace(']', ', increment]');
                    return fieldPart + newBrackets;
                }
            );
        });
    });

    return result;
};

// Restore table and field notes/comments that may have been lost during DBML export
// This handles databases where @dbml/core doesn't recognize the comment syntax
// (e.g., MySQL's inline COMMENT syntax). For databases like PostgreSQL where
// notes are already preserved, this function detects existing notes and skips them.
const restoreNotes = (dbml: string, tables: DBTable[]): string => {
    if (!tables || tables.length === 0) return dbml;

    let result = dbml;

    // Helper function to escape comments for DBML
    const escapeComment = (comment: string): string => {
        return comment
            .replace(/\r?\n/g, ' ') // Replace newlines with spaces
            .replace(/\s+/g, ' ') // Normalize multiple spaces
            .trim() // Remove leading/trailing whitespace
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"');
    };

    tables.forEach((table) => {
        // Build the table identifier pattern once for this table
        const tableIdentifier = table.schema
            ? `"${table.schema.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\."${table.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`
            : `"${table.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`;

        // Restore table-level notes
        if (table.comments) {
            const escapedComment = escapeComment(table.comments);

            // Pattern to match the entire table block
            const tableBlockPattern = new RegExp(
                `(Table ${tableIdentifier} \\{)([\\s\\S]*?)(^\\})`,
                'gm'
            );

            result = result.replace(
                tableBlockPattern,
                (match, tableStart, tableContent, tableEnd) => {
                    // Check if a Note already exists ANYWHERE in this table
                    if (/^\s*Note:\s*'/m.test(tableContent)) {
                        // Note already exists, don't add another one
                        return match;
                    }

                    // Add the Note at the end, before the closing brace (like PostgreSQL)
                    return `${tableStart}${tableContent}\n  Note: '${escapedComment}'\n${tableEnd}`;
                }
            );
        }

        // Restore field-level notes
        const fieldsWithComments = table.fields.filter((f) => f.comments);

        fieldsWithComments.forEach((field) => {
            // Escape field name for regex
            const escapedFieldName = field.name.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            );

            // Escape the comment text for use in the replacement
            const escapedComment = escapeComment(field.comments!);

            // Pattern to match the field line
            // We need to match the complete field definition including array types
            // Format: "field_name" type_with_size_and_arrays [attributes]
            // Examples: "id" bigint [pk], "items" text[] [not null], "name" varchar(100) [unique]
            const fieldPattern = new RegExp(
                `(Table ${tableIdentifier} \\{[^}]*?^\\s*"${escapedFieldName}"\\s+\\S+(?:\\([^)]*\\))?(?:\\[\\])?)(\\s*\\[[^\\]]*\\])?`,
                'gms'
            );

            result = result.replace(
                fieldPattern,
                (match, fieldPart, brackets) => {
                    // Check if note already exists
                    if (brackets && brackets.includes('note:')) {
                        return match;
                    }

                    // Add note to the attributes
                    if (brackets) {
                        // If brackets exist, add note to them
                        const newBrackets = brackets.replace(
                            ']',
                            `, note: '${escapedComment}']`
                        );
                        return fieldPart + newBrackets;
                    } else {
                        // If no brackets, create new ones with note
                        return fieldPart + ` [note: '${escapedComment}']`;
                    }
                }
            );
        });
    });

    return result;
};

// Restore composite primary key names in the DBML
const restoreCompositePKNames = (dbml: string, tables: DBTable[]): string => {
    if (!tables || tables.length === 0) return dbml;

    let result = dbml;

    tables.forEach((table) => {
        // Check if this table has a PK index with a name
        const pkIndex = table.indexes.find((idx) => idx.isPrimaryKey);
        if (pkIndex?.name) {
            const primaryKeyFields = table.fields.filter((f) => f.primaryKey);
            if (primaryKeyFields.length >= 1) {
                // Build the column list for the composite PK
                const columnList = primaryKeyFields
                    .map((f) => f.name)
                    .join(', ');

                // Build the table identifier pattern
                const tableIdentifier = table.schema
                    ? `"${table.schema.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\."${table.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`
                    : `"${table.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`;

                // Pattern to match the composite PK index line
                // Match patterns like: (col1, col2, col3) [pk]
                const pkPattern = new RegExp(
                    `(Table ${tableIdentifier} \\{[^}]*?Indexes \\{[^}]*?)(\\(${columnList.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\) \\[pk\\])`,
                    'gs'
                );

                // Replace with the named version
                const replacement = `$1(${columnList}) [pk, name: "${pkIndex.name}"]`;
                result = result.replace(pkPattern, replacement);
            }
        }
    });

    return result;
};

// Restore schema information that may have been stripped by the DBML importer
const restoreTableSchemas = (dbml: string, tables: DBTable[]): string => {
    if (!tables || tables.length === 0) return dbml;

    // Group tables by name to handle duplicates
    const tablesByName = new Map<
        string,
        Array<{ table: DBTable; index: number }>
    >();
    tables.forEach((table, index) => {
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
                const escapedTableName = table.name.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    '\\$&'
                );
                const escapedSchema = table.schema.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    '\\$&'
                );

                // Check if the schema is already present in the table definition
                const schemaAlreadyPresent = new RegExp(
                    `Table\\s+"${escapedSchema}"\\."${escapedTableName}"\\s*{`,
                    'g'
                ).test(result);

                // Only add schema if it's not already present
                if (!schemaAlreadyPresent) {
                    // Match table definition without schema (e.g., Table "users" {)
                    const tablePattern = new RegExp(
                        `Table\\s+"${escapedTableName}"\\s*{`,
                        'g'
                    );
                    const schemaTableName = `Table "${table.schema}"."${table.name}" {`;
                    result = result.replace(tablePattern, schemaTableName);

                    // Update references in Ref statements
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
            }
        } else {
            // Multiple tables with the same name - need to be more careful
            // Find all table definitions for this name
            const escapedTableName = tableName.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            );

            // Get tables that need schema restoration (those without schema in DBML)
            const tablesNeedingSchema = tablesGroup.filter(({ table }) => {
                // Check if this table's schema is already in the DBML
                const schemaPattern = new RegExp(
                    `Table\\s+"${table.schema}"\\.\\s*"${escapedTableName}"\\s*{`,
                    'g'
                );
                return !result.match(schemaPattern);
            });

            // Then handle tables without schema in DBML
            const noSchemaTablePattern = new RegExp(
                `Table\\s+"${escapedTableName}"\\s*{`,
                'g'
            );

            let noSchemaMatchIndex = 0;
            result = result.replace(noSchemaTablePattern, (match) => {
                // We need to match based on the order in the DBML output
                // For PostgreSQL DBML, the @dbml/core sorts tables by:
                // 1. Tables with schemas (alphabetically)
                // 2. Tables without schemas
                // Since both our tables have schemas, they should appear in order

                // Only process tables that need schema restoration
                if (noSchemaMatchIndex >= tablesNeedingSchema.length) {
                    return match;
                }

                const correspondingTable =
                    tablesNeedingSchema[noSchemaMatchIndex];
                noSchemaMatchIndex++;

                if (correspondingTable && correspondingTable.table.schema) {
                    return `Table "${correspondingTable.table.schema}"."${tableName}" {`;
                }
                // If the table doesn't have a schema, keep it as is
                return match;
            });
        }
    });

    return result;
};

// Function to extract only Ref statements from DBML
const extractRelationshipsDbml = (dbml: string): string => {
    const lines = dbml.split('\n');
    const refLines = lines.filter((line) => line.trim().startsWith('Ref '));
    return refLines.join('\n').trim();
};

export interface DBMLExportResult {
    standardDbml: string;
    inlineDbml: string;
    relationshipsDbml: string;
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

    // Filter out empty tables and duplicates in a single pass for performance
    const seenTableIdentifiers = new Set<string>();
    const tablesWithFields = sanitizedTables.filter((table) => {
        // Skip tables with no fields (empty tables cause DBML export to fail)
        if (table.fields.length === 0) {
            return false;
        }

        // Create a unique identifier combining schema and table name
        const tableIdentifier = table.schema
            ? `${table.schema}.${table.name}`
            : table.name;

        // Skip duplicate tables
        if (seenTableIdentifiers.has(tableIdentifier)) {
            return false;
        }
        seenTableIdentifiers.add(tableIdentifier);
        return true; // Keep unique, non-empty table
    });

    // Create the base filtered diagram structure
    const filteredDiagram: Diagram = {
        ...diagram,
        tables: tablesWithFields,
        relationships:
            diagram.relationships?.filter((rel) => {
                const sourceTable = tablesWithFields.find(
                    (t) => t.id === rel.sourceTableId
                );
                const targetTable = tablesWithFields.find(
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

    // Simplified processing - just handle duplicate field names
    const processTable = (table: DBTable) => {
        const fieldNameCounts = new Map<string, number>();
        const processedFields = table.fields.map((field) => {
            // Handle duplicate field names
            const count = fieldNameCounts.get(field.name) || 0;
            if (count > 0) {
                const newName = `${field.name}_${count + 1}`;
                return {
                    ...field,
                    name: newName,
                };
            }
            fieldNameCounts.set(field.name, count + 1);
            return field;
        });

        return {
            ...table,
            fields: processedFields,
            indexes: (table.indexes || [])
                .filter((index) => !index.isPrimaryKey) // Filter out PK indexes as they're handled separately
                .map((index) => ({
                    ...index,
                    name:
                        index.name ||
                        `idx_${Math.random().toString(36).substring(2, 8)}`,
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

        standard = fixArrayTypes(
            normalizeCharTypeFormat(
                fixMultilineTableNames(
                    fixTableBracketSyntax(
                        importer.import(
                            baseScript,
                            databaseTypeToImportFormat(diagram.databaseType)
                        )
                    )
                )
            )
        );

        // Restore schema information that may have been stripped by DBML importer
        standard = restoreTableSchemas(standard, tablesWithFields);

        // Restore composite primary key names
        standard = restoreCompositePKNames(standard, tablesWithFields);

        // Restore increment attribute for auto-incrementing fields
        standard = restoreIncrementAttribute(standard, tablesWithFields);

        // Restore table and field notes/comments that may have been lost during DBML export
        standard = restoreNotes(standard, tablesWithFields);

        // Prepend Enum DBML to the standard output
        if (enumsDBML) {
            standard = enumsDBML + '\n\n' + standard;
        }

        inline = fixArrayTypes(
            normalizeCharTypeFormat(convertToInlineRefs(standard))
        );

        // Clean up excessive empty lines in both outputs
        standard = standard.replace(/\n\s*\n\s*\n/g, '\n\n');
        inline = inline.replace(/\n\s*\n\s*\n/g, '\n\n');

        // Ensure proper formatting with newline at end
        if (!standard.endsWith('\n')) {
            standard += '\n';
        }
        if (!inline.endsWith('\n')) {
            inline += '\n';
        }
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

    // Extract relationships DBML from standard output
    const relationshipsDbml = extractRelationshipsDbml(standard);

    return {
        standardDbml: standard,
        inlineDbml: inline,
        relationshipsDbml,
        error: errorMsg,
    };
}
