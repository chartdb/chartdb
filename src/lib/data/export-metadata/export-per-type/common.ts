import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';

export function isFunction(value: string): boolean {
    // Common SQL functions
    const functionPatterns = [
        /^CURRENT_TIMESTAMP$/i,
        /^NOW\(\)$/i,
        /^GETDATE\(\)$/i,
        /^CURRENT_DATE$/i,
        /^CURRENT_TIME$/i,
        /^UUID\(\)$/i,
        /^NEWID\(\)$/i,
        /^NEXT VALUE FOR/i,
        /^IDENTITY\s*\(\d+,\s*\d+\)$/i,
    ];
    return functionPatterns.some((pattern) => pattern.test(value.trim()));
}

export function isKeyword(value: string): boolean {
    // Common SQL keywords that can be used as default values
    const keywords = [
        'NULL',
        'TRUE',
        'FALSE',
        'CURRENT_TIMESTAMP',
        'CURRENT_DATE',
        'CURRENT_TIME',
        'CURRENT_USER',
        'SESSION_USER',
        'SYSTEM_USER',
    ];
    return keywords.includes(value.trim().toUpperCase());
}

export function strHasQuotes(value: string): boolean {
    return /^['"].*['"]$/.test(value.trim());
}

export function exportFieldComment(comment: string): string {
    if (!comment) {
        return '';
    }

    return comment
        .split('\n')
        .map((commentLine) => `    -- ${commentLine}\n`)
        .join('');
}

export function escapeSQLComment(comment: string): string {
    if (!comment) {
        return '';
    }

    // Escape single quotes by doubling them
    let escaped = comment.replace(/'/g, "''");

    // Replace newlines with spaces to prevent breaking SQL syntax
    // Some databases support multi-line comments with specific syntax,
    // but for maximum compatibility, we'll replace newlines with spaces
    escaped = escaped.replace(/[\r\n]+/g, ' ');

    // Trim any excessive whitespace
    escaped = escaped.replace(/\s+/g, ' ').trim();

    return escaped;
}

export function formatTableComment(comment: string): string {
    if (!comment) {
        return '';
    }

    // Split by newlines and add -- to each line
    return (
        comment
            .split('\n')
            .map((line) => `-- ${line}`)
            .join('\n') + '\n'
    );
}

export function formatMSSQLTableComment(comment: string): string {
    if (!comment) {
        return '';
    }

    // For MSSQL, we use multi-line comment syntax
    // Escape */ to prevent breaking the comment block
    const escaped = comment.replace(/\*\//g, '* /');
    return `/**\n${escaped}\n*/\n`;
}

export function getInlineFK(table: DBTable, diagram: Diagram): string {
    if (!diagram.relationships) {
        return '';
    }

    const fks = diagram.relationships
        .filter((r) => r.sourceTableId === table.id)
        .map((r) => {
            const targetTable = diagram.tables?.find(
                (t) => t.id === r.targetTableId
            );
            const sourceField = table.fields.find(
                (f) => f.id === r.sourceFieldId
            );
            const targetField = targetTable?.fields.find(
                (f) => f.id === r.targetFieldId
            );

            if (!targetTable || !sourceField || !targetField) {
                return '';
            }

            const targetTableName = targetTable.schema
                ? `"${targetTable.schema}"."${targetTable.name}"`
                : `"${targetTable.name}"`;

            return `    FOREIGN KEY ("${sourceField.name}") REFERENCES ${targetTableName}("${targetField.name}")`;
        })
        .filter(Boolean);

    return fks.join(',\n');
}
