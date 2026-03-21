import {
    canonicalIndexSchema,
    canonicalPrimaryKeySchema,
    type CanonicalCheckConstraint,
    type CanonicalColumn,
    type CanonicalForeignKey,
    type CanonicalIndex,
    type CanonicalSchema,
    type CanonicalTable,
    type CanonicalUniqueConstraint,
    type ChangePlan,
    type RiskWarning,
    type SchemaChange,
    type SchemaChangeSummary,
} from './types.js';
import { analyzePlanRisks } from './risk.js';
import { generateMigrationSql } from './sql.js';
import { hashCanonicalSchema } from './hash.js';

const qualifyTable = (schemaName: string, tableName: string) =>
    `${schemaName}.${tableName}`;

const normalizeName = (value: string) => value.trim().toLowerCase();

const mapBy = <T>(items: T[], keyFn: (item: T) => string): Map<string, T> =>
    items.reduce((map, item) => {
        map.set(keyFn(item), item);
        return map;
    }, new Map<string, T>());

const getTableMatchKey = (table: CanonicalTable): string =>
    table.sync?.sourceId ?? qualifyTable(table.schemaName, table.name);

const getColumnMatchKey = (column: CanonicalColumn): string =>
    column.sync?.sourceId ?? normalizeName(column.name);

const getConstraintKey = <
    T extends {
        id: string;
        name?: string | null;
        sync?: { sourceId?: string };
    },
>(
    item: T
) => item.sync?.sourceId ?? normalizeName(item.name ?? item.id);

const uniqueBy = <T>(items: T[], keyFn: (item: T) => string): T[] => {
    const seen = new Set<string>();
    return items.filter((item) => {
        const key = keyFn(item);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};

const similarity = (
    leftColumns: CanonicalColumn[],
    rightColumns: CanonicalColumn[]
): number => {
    const left = new Set(
        leftColumns.map((column) => normalizeName(column.name))
    );
    const right = new Set(
        rightColumns.map((column) => normalizeName(column.name))
    );
    const shared = [...left].filter((value) => right.has(value)).length;
    const total = new Set([...left, ...right]).size;
    return total === 0 ? 0 : shared / total;
};

const comparePrimaryKeys = (
    baselineTable: CanonicalTable,
    targetTable: CanonicalTable,
    changes: SchemaChange[]
) => {
    const baselinePk = baselineTable.primaryKey ?? null;
    const targetPk = targetTable.primaryKey ?? null;

    if (!baselinePk && targetPk) {
        changes.push({
            id: `add-primary-key:${targetTable.id}`,
            kind: 'add_primary_key',
            tableId: targetTable.id,
            schemaName: targetTable.schemaName,
            tableName: targetTable.name,
            primaryKey: canonicalPrimaryKeySchema.parse(targetPk),
        });
        return;
    }

    if (baselinePk && !targetPk) {
        changes.push({
            id: `drop-primary-key:${baselineTable.id}`,
            kind: 'drop_primary_key',
            tableId: baselineTable.id,
            schemaName: baselineTable.schemaName,
            tableName: baselineTable.name,
            primaryKey: canonicalPrimaryKeySchema.parse(baselinePk),
        });
        return;
    }

    if (
        baselinePk &&
        targetPk &&
        JSON.stringify(baselinePk.columnIds) !==
            JSON.stringify(targetPk.columnIds)
    ) {
        changes.push({
            id: `drop-primary-key:${baselineTable.id}`,
            kind: 'drop_primary_key',
            tableId: baselineTable.id,
            schemaName: baselineTable.schemaName,
            tableName: baselineTable.name,
            primaryKey: canonicalPrimaryKeySchema.parse(baselinePk),
        });
        changes.push({
            id: `add-primary-key:${targetTable.id}`,
            kind: 'add_primary_key',
            tableId: targetTable.id,
            schemaName: targetTable.schemaName,
            tableName: targetTable.name,
            primaryKey: canonicalPrimaryKeySchema.parse(targetPk),
        });
    }
};

const diffNamedCollection = <
    T extends
        | CanonicalUniqueConstraint
        | CanonicalIndex
        | CanonicalForeignKey
        | CanonicalCheckConstraint,
>(
    baselineItems: T[],
    targetItems: T[],
    addChange: (item: T) => SchemaChange,
    dropChange: (item: T) => SchemaChange
) => {
    const changes: SchemaChange[] = [];
    const baselineMap = mapBy(baselineItems, getConstraintKey);
    const targetMap = mapBy(targetItems, getConstraintKey);

    for (const [key, baselineItem] of baselineMap) {
        if (!targetMap.has(key)) {
            changes.push(dropChange(baselineItem));
        }
    }

    for (const [key, targetItem] of targetMap) {
        if (!baselineMap.has(key)) {
            changes.push(addChange(targetItem));
        }
    }

    return changes;
};

const summarize = (
    changes: SchemaChange[],
    warnings: RiskWarning[]
): SchemaChangeSummary => {
    const changeRisk = new Map<string, RiskWarning['level']>();
    for (const warning of warnings) {
        for (const changeId of warning.changeIds) {
            changeRisk.set(changeId, warning.level);
        }
    }

    return changes.reduce<SchemaChangeSummary>(
        (summary, change) => {
            summary.totalChanges += 1;
            const risk = changeRisk.get(change.id) ?? 'safe';
            if (risk === 'safe') summary.safeChanges += 1;
            if (risk === 'warning') summary.warningChanges += 1;
            if (risk === 'destructive') summary.destructiveChanges += 1;
            if (risk === 'blocked') summary.blockedChanges += 1;
            return summary;
        },
        {
            totalChanges: 0,
            safeChanges: 0,
            warningChanges: 0,
            destructiveChanges: 0,
            blockedChanges: 0,
        }
    );
};

export const createChangePlan = ({
    id,
    baselineSnapshotId,
    connectionId,
    baseline,
    target,
    additionalWarnings = [],
}: {
    id: string;
    baselineSnapshotId: string;
    connectionId: string;
    baseline: CanonicalSchema;
    target: CanonicalSchema;
    additionalWarnings?: RiskWarning[];
}): ChangePlan => {
    const changes: SchemaChange[] = [];
    const warnings = [...additionalWarnings];

    const baselineSchemas = new Set(baseline.schemaNames);
    for (const schemaName of uniqueBy(target.schemaNames, (schema) => schema)) {
        if (!baselineSchemas.has(schemaName)) {
            changes.push({
                id: `create-schema:${schemaName}`,
                kind: 'create_schema',
                schemaName,
            });
        }
    }

    const baselineTables = mapBy(baseline.tables, getTableMatchKey);
    const targetTables = mapBy(target.tables, getTableMatchKey);

    for (const [key, baselineTable] of baselineTables) {
        const targetTable = targetTables.get(key);
        if (!targetTable) {
            changes.push({
                id: `drop-table:${baselineTable.id}`,
                kind: 'drop_table',
                table: baselineTable,
            });
            continue;
        }

        if (baselineTable.schemaName !== targetTable.schemaName) {
            changes.push({
                id: `move-table:${targetTable.id}`,
                kind: 'move_table',
                tableId: targetTable.id,
                tableName: targetTable.name,
                fromSchema: baselineTable.schemaName,
                toSchema: targetTable.schemaName,
            });
        }

        if (baselineTable.name !== targetTable.name) {
            changes.push({
                id: `rename-table:${targetTable.id}`,
                kind: 'rename_table',
                tableId: targetTable.id,
                schemaName: targetTable.schemaName,
                fromName: baselineTable.name,
                toName: targetTable.name,
            });
        }

        const baselineColumns = mapBy(baselineTable.columns, getColumnMatchKey);
        const targetColumns = mapBy(targetTable.columns, getColumnMatchKey);

        for (const [columnKey, baselineColumn] of baselineColumns) {
            const targetColumn = targetColumns.get(columnKey);
            if (!targetColumn) {
                changes.push({
                    id: `drop-column:${baselineTable.id}:${baselineColumn.id}`,
                    kind: 'drop_column',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    column: baselineColumn,
                });
                continue;
            }

            if (baselineColumn.name !== targetColumn.name) {
                changes.push({
                    id: `rename-column:${targetTable.id}:${targetColumn.id}`,
                    kind: 'rename_column',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    columnId: targetColumn.id,
                    fromName: baselineColumn.name,
                    toName: targetColumn.name,
                });
            }

            if (baselineColumn.dataType !== targetColumn.dataType) {
                changes.push({
                    id: `alter-column-type:${targetTable.id}:${targetColumn.id}`,
                    kind: 'alter_column_type',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    columnId: targetColumn.id,
                    columnName: targetColumn.name,
                    fromType: baselineColumn.dataType,
                    toType: targetColumn.dataType,
                });
            }

            if (baselineColumn.nullable !== targetColumn.nullable) {
                changes.push({
                    id: `alter-column-nullability:${targetTable.id}:${targetColumn.id}`,
                    kind: 'alter_column_nullability',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    columnId: targetColumn.id,
                    columnName: targetColumn.name,
                    fromNullable: baselineColumn.nullable,
                    toNullable: targetColumn.nullable,
                });
            }

            const baselineDefault = baselineColumn.defaultValue ?? null;
            const targetDefault = targetColumn.defaultValue ?? null;
            if (baselineDefault !== targetDefault) {
                changes.push({
                    id: `alter-column-default:${targetTable.id}:${targetColumn.id}`,
                    kind: 'alter_column_default',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    columnId: targetColumn.id,
                    columnName: targetColumn.name,
                    fromDefault: baselineDefault,
                    toDefault: targetDefault,
                });
            }
        }

        for (const [columnKey, targetColumn] of targetColumns) {
            if (!baselineColumns.has(columnKey)) {
                changes.push({
                    id: `add-column:${targetTable.id}:${targetColumn.id}`,
                    kind: 'add_column',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    column: targetColumn,
                });
            }
        }

        comparePrimaryKeys(baselineTable, targetTable, changes);

        changes.push(
            ...diffNamedCollection(
                baselineTable.uniqueConstraints,
                targetTable.uniqueConstraints,
                (constraint) => ({
                    id: `add-unique:${targetTable.id}:${constraint.id}`,
                    kind: 'add_unique_constraint',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    constraint,
                }),
                (constraint) => ({
                    id: `drop-unique:${targetTable.id}:${constraint.id}`,
                    kind: 'drop_unique_constraint',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    constraint,
                })
            )
        );

        changes.push(
            ...diffNamedCollection(
                baselineTable.indexes,
                targetTable.indexes,
                (index) => ({
                    id: `add-index:${targetTable.id}:${index.id}`,
                    kind: 'add_index',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    index: canonicalIndexSchema.parse(index),
                }),
                (index) => ({
                    id: `drop-index:${targetTable.id}:${index.id}`,
                    kind: 'drop_index',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    index: canonicalIndexSchema.parse(index),
                })
            )
        );

        changes.push(
            ...diffNamedCollection(
                baselineTable.foreignKeys,
                targetTable.foreignKeys,
                (foreignKey) => ({
                    id: `add-fk:${targetTable.id}:${foreignKey.id}`,
                    kind: 'add_foreign_key',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    foreignKey,
                }),
                (foreignKey) => ({
                    id: `drop-fk:${targetTable.id}:${foreignKey.id}`,
                    kind: 'drop_foreign_key',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    foreignKey,
                })
            )
        );

        changes.push(
            ...diffNamedCollection(
                baselineTable.checkConstraints,
                targetTable.checkConstraints,
                (constraint) => ({
                    id: `add-check:${targetTable.id}:${constraint.id}`,
                    kind: 'add_check_constraint',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    constraint,
                }),
                (constraint) => ({
                    id: `drop-check:${targetTable.id}:${constraint.id}`,
                    kind: 'drop_check_constraint',
                    tableId: targetTable.id,
                    schemaName: targetTable.schemaName,
                    tableName: targetTable.name,
                    constraint,
                })
            )
        );
    }

    for (const [key, targetTable] of targetTables) {
        if (!baselineTables.has(key)) {
            changes.push({
                id: `create-table:${targetTable.id}`,
                kind: 'create_table',
                table: targetTable,
            });
        }
    }

    const droppedTables = changes.filter(
        (change): change is Extract<SchemaChange, { kind: 'drop_table' }> =>
            change.kind === 'drop_table'
    );
    const createdTables = changes.filter(
        (change): change is Extract<SchemaChange, { kind: 'create_table' }> =>
            change.kind === 'create_table'
    );

    for (const dropped of droppedTables) {
        const candidate = createdTables.find(
            (created) =>
                created.table.schemaName === dropped.table.schemaName &&
                similarity(dropped.table.columns, created.table.columns) >= 0.5
        );

        if (candidate) {
            warnings.push({
                code: 'possible_table_rename',
                level: 'warning',
                title: 'Possible table rename',
                message: `${dropped.table.schemaName}.${dropped.table.name} looks similar to ${candidate.table.schemaName}.${candidate.table.name}. Confirm whether this should be treated as a rename.`,
                changeIds: [dropped.id, candidate.id],
            });
        }
    }

    const droppedColumns = changes.filter(
        (change): change is Extract<SchemaChange, { kind: 'drop_column' }> =>
            change.kind === 'drop_column'
    );
    const addedColumns = changes.filter(
        (change): change is Extract<SchemaChange, { kind: 'add_column' }> =>
            change.kind === 'add_column'
    );

    for (const dropped of droppedColumns) {
        const candidate = addedColumns.find(
            (added) =>
                added.tableId === dropped.tableId &&
                normalizeName(added.column.dataType) ===
                    normalizeName(dropped.column.dataType)
        );

        if (candidate) {
            warnings.push({
                code: 'possible_column_rename',
                level: 'warning',
                title: 'Possible column rename',
                message: `${dropped.tableName}.${dropped.column.name} looks similar to ${candidate.tableName}.${candidate.column.name}. Confirm whether this should be treated as a rename.`,
                changeIds: [dropped.id, candidate.id],
            });
        }
    }

    const { warnings: analyzedWarnings } = analyzePlanRisks(changes, warnings);

    const summary = summarize(changes, analyzedWarnings);
    const sqlStatements = generateMigrationSql(changes);
    const requiresConfirmation = analyzedWarnings.some(
        (warning) => warning.level === 'destructive'
    );
    const blocked = analyzedWarnings.some(
        (warning) => warning.level === 'blocked'
    );

    return {
        id,
        baselineSnapshotId,
        connectionId,
        engine: target.engine,
        baselineFingerprint:
            baseline.fingerprint ?? hashCanonicalSchema(baseline),
        targetFingerprint: target.fingerprint ?? hashCanonicalSchema(target),
        changes,
        warnings: analyzedWarnings,
        sqlStatements,
        summary: {
            ...summary,
            safeChanges:
                summary.totalChanges -
                summary.warningChanges -
                summary.destructiveChanges -
                summary.blockedChanges,
        },
        requiresConfirmation,
        blocked,
        createdAt: new Date().toISOString(),
    };
};
