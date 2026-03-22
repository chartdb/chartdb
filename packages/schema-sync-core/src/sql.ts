import type { CanonicalColumn, CanonicalTable, SchemaChange } from './types.js';

const quoteIdent = (value: string) => `"${value.replace(/"/g, '""')}"`;
const columnNameFromKey = (value: string) =>
    value.includes('.') ? value.slice(value.lastIndexOf('.') + 1) : value;
const qualify = (schemaName: string, tableName: string) =>
    `${quoteIdent(schemaName)}.${quoteIdent(tableName)}`;

const renderType = (column: CanonicalColumn) => {
    const base = column.dataTypeDisplay ?? column.dataType;
    if (column.isArray) {
        return `${base}[]`;
    }
    return base;
};

const renderColumnDefinition = (column: CanonicalColumn) => {
    const parts = [`${quoteIdent(column.name)} ${renderType(column)}`];
    if (!column.nullable) {
        parts.push('NOT NULL');
    }
    if (column.defaultValue) {
        parts.push(`DEFAULT ${column.defaultValue}`);
    }
    if (column.isIdentity) {
        parts.push(
            `GENERATED ${column.identityGeneration ?? 'BY DEFAULT'} AS IDENTITY`
        );
    }
    return parts.join(' ');
};

const renderCreateTable = (table: CanonicalTable) => {
    const lines = table.columns.map(renderColumnDefinition);

    if (table.primaryKey?.columnIds.length) {
        const columnNames = table.primaryKey.columnIds
            .map((columnId) =>
                table.columns.find((column) => column.id === columnId)
            )
            .filter(Boolean)
            .map((column) => quoteIdent(column!.name));
        lines.push(`PRIMARY KEY (${columnNames.join(', ')})`);
    }

    for (const constraint of table.uniqueConstraints) {
        const columnNames = constraint.columnIds
            .map((columnId) =>
                table.columns.find((column) => column.id === columnId)
            )
            .filter(Boolean)
            .map((column) => quoteIdent(column!.name));
        lines.push(
            `CONSTRAINT ${quoteIdent(constraint.name)} UNIQUE (${columnNames.join(', ')})`
        );
    }

    for (const constraint of table.checkConstraints) {
        lines.push(
            `CONSTRAINT ${quoteIdent(constraint.name ?? constraint.id)} CHECK (${constraint.expression})`
        );
    }

    return `CREATE TABLE ${qualify(table.schemaName, table.name)} (\n  ${lines.join(',\n  ')}\n);`;
};

const alterColumnType = (
    change: Extract<SchemaChange, { kind: 'alter_column_type' }>
) =>
    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ALTER COLUMN ${quoteIdent(change.columnName)} TYPE ${change.toType} USING ${quoteIdent(change.columnName)}::${change.toType};`;

const orderRank = (change: SchemaChange): number => {
    switch (change.kind) {
        case 'create_schema':
            return 0;
        case 'create_table':
            return 10;
        case 'move_table':
        case 'rename_table':
            return 20;
        case 'add_column':
            return 30;
        case 'alter_column_type':
        case 'alter_column_default':
        case 'alter_column_nullability':
        case 'rename_column':
            return 40;
        case 'add_primary_key':
        case 'add_unique_constraint':
        case 'add_check_constraint':
            return 50;
        case 'add_index':
            return 60;
        case 'add_foreign_key':
            return 70;
        case 'drop_foreign_key':
        case 'drop_index':
        case 'drop_unique_constraint':
        case 'drop_check_constraint':
        case 'drop_primary_key':
            return 80;
        case 'drop_column':
            return 90;
        case 'drop_table':
            return 100;
    }
};

export const generateMigrationSql = (changes: SchemaChange[]): string[] => {
    const sql: string[] = [];

    for (const change of [...changes].sort(
        (left, right) => orderRank(left) - orderRank(right)
    )) {
        switch (change.kind) {
            case 'create_schema':
                sql.push(
                    `CREATE SCHEMA IF NOT EXISTS ${quoteIdent(change.schemaName)};`
                );
                break;
            case 'create_table':
                sql.push(renderCreateTable(change.table));
                break;
            case 'move_table':
                sql.push(
                    `ALTER TABLE ${qualify(change.fromSchema, change.tableName)} SET SCHEMA ${quoteIdent(change.toSchema)};`
                );
                break;
            case 'rename_table':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.fromName)} RENAME TO ${quoteIdent(change.toName)};`
                );
                break;
            case 'add_column':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ADD COLUMN ${renderColumnDefinition(change.column)};`
                );
                break;
            case 'drop_column':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} DROP COLUMN ${quoteIdent(change.column.name)};`
                );
                break;
            case 'rename_column':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} RENAME COLUMN ${quoteIdent(change.fromName)} TO ${quoteIdent(change.toName)};`
                );
                break;
            case 'alter_column_type':
                sql.push(alterColumnType(change));
                break;
            case 'alter_column_nullability':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ALTER COLUMN ${quoteIdent(change.columnName)} ${change.toNullable ? 'DROP NOT NULL' : 'SET NOT NULL'};`
                );
                break;
            case 'alter_column_default':
                sql.push(
                    change.toDefault
                        ? `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ALTER COLUMN ${quoteIdent(change.columnName)} SET DEFAULT ${change.toDefault};`
                        : `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ALTER COLUMN ${quoteIdent(change.columnName)} DROP DEFAULT;`
                );
                break;
            case 'add_primary_key': {
                const columnNames = change.primaryKey.columnIds
                    .map(columnNameFromKey)
                    .map(quoteIdent)
                    .join(', ');
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ADD PRIMARY KEY (${columnNames});`
                );
                break;
            }
            case 'drop_primary_key':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} DROP CONSTRAINT IF EXISTS ${quoteIdent(change.primaryKey.name ?? `${change.tableName}_pkey`)};`
                );
                break;
            case 'add_unique_constraint': {
                const columnNames = change.constraint.columnIds
                    .map(columnNameFromKey)
                    .map(quoteIdent)
                    .join(', ');
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ADD CONSTRAINT ${quoteIdent(change.constraint.name)} UNIQUE (${columnNames});`
                );
                break;
            }
            case 'drop_unique_constraint':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} DROP CONSTRAINT IF EXISTS ${quoteIdent(change.constraint.name)};`
                );
                break;
            case 'add_index': {
                const columnNames = change.index.columnIds
                    .map(columnNameFromKey)
                    .map(quoteIdent)
                    .join(', ');
                sql.push(
                    `CREATE ${change.index.unique ? 'UNIQUE ' : ''}INDEX ${quoteIdent(change.index.name)} ON ${qualify(change.schemaName, change.tableName)}${change.index.type ? ` USING ${change.index.type}` : ''} (${columnNames});`
                );
                break;
            }
            case 'drop_index':
                sql.push(
                    `DROP INDEX IF EXISTS ${quoteIdent(change.index.name)};`
                );
                break;
            case 'add_foreign_key': {
                const localColumns = change.foreignKey.columnIds
                    .map(columnNameFromKey)
                    .map(quoteIdent)
                    .join(', ');
                const referenceColumns = change.foreignKey.referencedColumnNames
                    .map(quoteIdent)
                    .join(', ');
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ADD CONSTRAINT ${quoteIdent(change.foreignKey.name)} FOREIGN KEY (${localColumns}) REFERENCES ${qualify(change.foreignKey.referencedSchemaName, change.foreignKey.referencedTableName)} (${referenceColumns})${change.foreignKey.onDelete ? ` ON DELETE ${change.foreignKey.onDelete}` : ''}${change.foreignKey.onUpdate ? ` ON UPDATE ${change.foreignKey.onUpdate}` : ''};`
                );
                break;
            }
            case 'drop_foreign_key':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} DROP CONSTRAINT IF EXISTS ${quoteIdent(change.foreignKey.name)};`
                );
                break;
            case 'add_check_constraint':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ADD CONSTRAINT ${quoteIdent(change.constraint.name ?? change.constraint.id)} CHECK (${change.constraint.expression});`
                );
                break;
            case 'drop_check_constraint':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} DROP CONSTRAINT IF EXISTS ${quoteIdent(change.constraint.name ?? change.constraint.id)};`
                );
                break;
            case 'drop_table':
                sql.push(
                    `DROP TABLE ${qualify(change.table.schemaName, change.table.name)};`
                );
                break;
        }
    }

    return sql;
};
