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
