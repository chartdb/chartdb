/**
 * DBML Validator with Auto-fix Support
 * Provides validation and automatic fixes for common DBML syntax issues
 */

export interface DBMLValidationResult {
    isValid: boolean;
    errors: DBMLValidationError[];
    warnings: DBMLValidationWarning[];
    fixedDBML?: string;
    tableNotes?: Map<string, string>; // Map of table name to note content
}

export interface DBMLValidationError {
    line?: number;
    column?: number;
    message: string;
    type: 'syntax' | 'unsupported' | 'parser';
    suggestion?: string;
}

export interface DBMLValidationWarning {
    message: string;
    type: 'compatibility' | 'data_loss' | 'performance';
}

/**
 * Auto-fix common DBML syntax issues
 * Returns both the fixed DBML and extracted table notes
 */
export function autoFixDBML(dbml: string): {
    fixed: string;
    tableNotes: Map<string, string>;
} {
    let fixed = dbml;

    // Fix 1: Join split attributes (e.g., [pk\n] -> [pk])
    fixed = fixed.replace(/\[\s*([^[\]]*?)\s*\]/gs, (_match, content) => {
        // Remove excessive whitespace and newlines within brackets
        const cleanedContent = content.replace(/\s+/g, ' ').trim();
        return `[${cleanedContent}]`;
    });

    // Fix 2: Join split numeric types (e.g., numeric(10,\n2) -> numeric(10,2))
    fixed = fixed.replace(
        /(\w+)\s*\(\s*([^)]*?)\s*\)/gs,
        (_match, type, params) => {
            // Remove newlines and excessive spaces in type parameters
            const cleanedParams = params
                .replace(/\s*\n\s*/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            return `${type}(${cleanedParams})`;
        }
    );

    // Fix 3: Extract and remove table-level Note: declarations
    // DBML doesn't support table-level notes with Note: syntax
    const lines = fixed.split('\n');
    const fixedLines: string[] = [];
    const tableNotes = new Map<string, string>();
    let insideTable = false;
    let currentTableName = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Detect table start
        const tableMatch = trimmedLine.match(/^Table\s+(\w+)\s*{/);
        if (tableMatch) {
            insideTable = true;
            currentTableName = tableMatch[1];
            fixedLines.push(line);
            continue;
        }

        // Detect table end
        if (insideTable && trimmedLine === '}') {
            insideTable = false;
            currentTableName = '';
            fixedLines.push(line);
            continue;
        }

        // Extract table-level Note: and remove from DBML
        if (insideTable && trimmedLine.startsWith('Note:')) {
            // Extract the note content
            const noteMatch = trimmedLine.match(/Note:\s*['"](.*)['"]$/);
            if (noteMatch) {
                tableNotes.set(currentTableName, noteMatch[1]);
            } else {
                // Try without quotes
                const noteContent = trimmedLine.replace(/^Note:\s*/, '').trim();
                if (noteContent) {
                    tableNotes.set(currentTableName, noteContent);
                }
            }
            // Skip this line (remove it from the output)
            continue;
        }

        fixedLines.push(line);
    }

    fixed = fixedLines.join('\n');

    // Fix 4: Ensure proper spacing around references
    fixed = fixed.replace(/\[ref:\s*([<>-]+)\s*([^,\]]+)/g, '[ref: $1 $2');

    // Fix 5: Fix indexes block formatting
    fixed = fixed.replace(/indexes\s*{/gi, 'Indexes {');

    // Fix 6: Remove header block if present (not standard DBML)
    fixed = fixed.replace(/^{[^}]*database_type:[^}]*}/m, '');

    // Fix 7: Clean up extra whitespace
    fixed = fixed.replace(/\n{3,}/g, '\n\n');

    // Fix 8: Ensure enums have proper formatting
    fixed = fixed.replace(
        /Enum\s+(\w+)\s*{([^}]*)}/gs,
        (_match, enumName, content) => {
            const values = content
                .split('\n')
                .map((line: string) => line.trim())
                .filter((line: string) => line && !line.startsWith('//'))
                .map((value: string) => '  ' + value)
                .join('\n');
            return `Enum ${enumName} {\n${values}\n}`;
        }
    );

    // Fix 9: Fix malformed index declarations in Indexes blocks
    // This handles cases like: managing_organization_id(internal_code, managing_organization_id)
    // Should become: managing_organization_id (internal_code, managing_organization_id)
    const indexBlockRegex = /Indexes\s*{([^}]*)}/gis;
    fixed = fixed.replace(indexBlockRegex, (_match, indexContent) => {
        // Only fix within index blocks - add space after identifier before parenthesis
        // But handle nested functions properly
        const lines = indexContent.split('\n');
        const fixedLines = lines.map((line: string) => {
            // Skip if line already has proper spacing or is just whitespace
            if (!line.trim() || line.includes(' (')) {
                return line;
            }
            // Only fix at the beginning of index declarations
            return line.replace(/^(\s*)(\w+)(\()/, '$1$2 $3');
        });
        return `Indexes {${fixedLines.join('\n')}}`;
    });

    return { fixed: fixed.trim(), tableNotes };
}

/**
 * Validate DBML and provide auto-fix suggestions
 */
export function validateDBML(dbml: string): DBMLValidationResult {
    const errors: DBMLValidationError[] = [];
    const warnings: DBMLValidationWarning[] = [];
    let tableNotes: Map<string, string> | undefined;

    // First, check if the DBML is empty
    if (!dbml || !dbml.trim()) {
        errors.push({
            line: 1,
            message: 'DBML content is empty',
            type: 'syntax',
            suggestion: 'Add table definitions to your DBML',
        });
        return {
            isValid: false,
            errors,
            warnings,
        };
    }

    const lines = dbml.split('\n');

    // Check for common syntax issues
    let hasFixableIssues = false;

    // Check for database_type header block
    if (dbml.match(/^{[^}]*database_type:[^}]*}/m)) {
        hasFixableIssues = true;
        warnings.push({
            message: 'Database type header block found (will be removed)',
            type: 'compatibility' as const,
        });
    }

    // Check for split attributes
    let inAttribute = false;
    let attributeStartLine = 0;

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();

        // Check for opening bracket without closing
        if (line.includes('[') && !line.includes(']')) {
            inAttribute = true;
            attributeStartLine = lineNum;
            hasFixableIssues = true;
        }

        // Check for closing bracket without opening (continuation)
        if (inAttribute && line.includes(']')) {
            inAttribute = false;
            warnings.push({
                message: `Attribute split across lines ${attributeStartLine}-${lineNum}`,
                type: 'compatibility' as const,
            });
        }

        // Check for split numeric types
        if (line.match(/\w+\s*\(\s*\d+\s*,?\s*$/)) {
            hasFixableIssues = true;
            warnings.push({
                message: `Numeric type declaration split at line ${lineNum}`,
                type: 'compatibility' as const,
            });
        }

        // Check for table-level Note: (not supported in DBML)
        if (trimmedLine.startsWith('Note:') && index > 0) {
            // Look backwards to see if we're inside a table
            let insideTable = false;
            for (let i = index - 1; i >= 0; i--) {
                if (lines[i].trim().match(/^Table\s+\w+\s*{/)) {
                    insideTable = true;
                    break;
                }
                if (lines[i].trim() === '}') {
                    break;
                }
            }
            if (insideTable) {
                hasFixableIssues = true;
                warnings.push({
                    message: `Table-level Note: at line ${lineNum} will be extracted as table comment`,
                    type: 'compatibility' as const,
                });
            }
        }

        // Check for malformed index declarations (missing space before parenthesis)
        // Only check within Indexes blocks, not in type declarations
        if (line.match(/^\s*\w+\(/)) {
            // Check if we're in an indexes block
            let inIndexesBlock = false;
            for (let i = index - 1; i >= 0; i--) {
                if (lines[i].trim().match(/^indexes\s*{/i)) {
                    inIndexesBlock = true;
                    break;
                }
                if (lines[i].trim() === '}') {
                    break;
                }
            }
            if (inIndexesBlock) {
                hasFixableIssues = true;
                warnings.push({
                    message: `Malformed index declaration at line ${lineNum} (missing space before parenthesis)`,
                    type: 'compatibility' as const,
                });
            }
        }
    });

    // If there are fixable issues, provide the fixed version
    let fixedDBML: string | undefined;
    if (hasFixableIssues) {
        const result = autoFixDBML(dbml);
        fixedDBML = result.fixed;
        tableNotes = result.tableNotes.size > 0 ? result.tableNotes : undefined;

        // Validate the fixed version doesn't have the same issues
        if (fixedDBML !== dbml) {
            warnings.push({
                message: 'Auto-fix available for formatting issues',
                type: 'compatibility' as const,
            });
        }
    }

    // Check for actual syntax errors that can't be auto-fixed
    if (inAttribute) {
        errors.push({
            line: attributeStartLine,
            message: 'Unclosed attribute bracket',
            type: 'syntax',
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        fixedDBML: fixedDBML !== dbml ? fixedDBML : undefined,
        tableNotes,
    };
}
