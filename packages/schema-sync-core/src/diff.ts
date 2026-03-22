import {
    canonicalIndexSchema,
    canonicalPrimaryKeySchema,
    type CanonicalCheckConstraint,
    type CanonicalColumn,
    type CanonicalCustomType,
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

const BUILTIN_POSTGRES_TYPES = new Set([
    'bigint',
    'bigserial',
    'bit',
    'bit varying',
    'bool',
    'boolean',
    'box',
    'bytea',
    'char',
    'character',
    'character varying',
    'cidr',
    'circle',
    'date',
    'decimal',
    'double precision',
    'float4',
    'float8',
    'inet',
    'int',
    'int2',
    'int4',
    'int8',
    'integer',
    'interval',
    'json',
    'jsonb',
    'line',
    'lseg',
    'macaddr',
    'money',
    'numeric',
    'path',
    'pg_lsn',
    'point',
    'polygon',
    'real',
    'serial2',
    'serial4',
    'serial8',
    'smallint',
    'smallserial',
    'serial',
    'text',
    'time',
    'time with time zone',
    'time without time zone',
    'timestamp',
    'timestamp with time zone',
    'timestamp without time zone',
    'timetz',
    'timestamptz',
    'tsquery',
    'tsvector',
    'txid_snapshot',
    'uuid',
    'varbit',
    'varchar',
    'xml',
]);

const normalizeTypeName = (value: string) =>
    value
        .trim()
        .replace(/\[\]$/, '')
        .replace(/\s*\(.*\)\s*$/, '')
        .replace(/"/g, '')
        .replace(/^pg_catalog\./i, '')
        .toLowerCase();

const isBuiltinPostgresType = (value: string) =>
    BUILTIN_POSTGRES_TYPES.has(normalizeTypeName(value));

const getCustomTypeMatchKey = (customType: CanonicalCustomType): string =>
    customType.sync?.sourceId?.toLowerCase() ??
    `${customType.schemaName}.${customType.name}`.toLowerCase();

const findReferencedCustomType = ({
    customTypeId,
    typeName,
    customTypes,
    contextSchema,
    defaultSchema,
}: {
    customTypeId?: string | null;
    typeName: string;
    customTypes: CanonicalCustomType[];
    contextSchema: string;
    defaultSchema: string;
}) => {
    if (customTypeId) {
        const byId = customTypes.find(
            (customType) =>
                customType.id === customTypeId ||
                customType.sync?.sourceId === customTypeId
        );
        if (byId) {
            return byId;
        }
    }

    const normalized = normalizeTypeName(typeName);
    if (!normalized) {
        return undefined;
    }

    if (normalized.includes('.')) {
        return customTypes.find(
            (customType) => getCustomTypeMatchKey(customType) === normalized
        );
    }

    return (
        customTypes.find(
            (customType) =>
                getCustomTypeMatchKey(customType) ===
                `${contextSchema}.${normalized}`.toLowerCase()
        ) ??
        customTypes.find(
            (customType) =>
                getCustomTypeMatchKey(customType) ===
                `${defaultSchema}.${normalized}`.toLowerCase()
        ) ??
        customTypes.find(
            (customType) => customType.name.toLowerCase() === normalized
        )
    );
};

const valuesEqual = (left: string[], right: string[]) =>
    left.length === right.length &&
    left.every((value, index) => value === right[index]);

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

const resolveColumnName = (
    table: CanonicalTable,
    columnKeyOrName: string
): string | null => {
    const normalized = normalizeName(columnKeyOrName);
    const directName = columnKeyOrName.includes('.')
        ? columnKeyOrName.slice(columnKeyOrName.lastIndexOf('.') + 1)
        : columnKeyOrName;

    const directMatch = table.columns.find(
        (column) => normalizeName(column.name) === normalizeName(directName)
    );
    if (directMatch) {
        return directMatch.name;
    }

    const byReference = table.columns.find(
        (column) =>
            normalizeName(column.id) === normalized ||
            normalizeName(column.sync?.sourceId ?? '') === normalized
    );

    return byReference?.name ?? null;
};

const resolveColumnNames = (
    table: CanonicalTable,
    columnKeysOrNames: string[]
): string[] | null => {
    const resolved = columnKeysOrNames.map((value) =>
        resolveColumnName(table, value)
    );

    return resolved.every(Boolean) ? (resolved as string[]) : null;
};

const hasMatchingUniqueReference = (
    table: CanonicalTable,
    referencedColumnNames: string[]
): boolean => {
    const normalizedReference = referencedColumnNames.map(normalizeName);
    const primaryKeyColumns = table.primaryKey
        ? resolveColumnNames(table, table.primaryKey.columnIds)
        : null;

    if (
        primaryKeyColumns &&
        valuesEqual(primaryKeyColumns.map(normalizeName), normalizedReference)
    ) {
        return true;
    }

    return table.uniqueConstraints.some((constraint) => {
        const constraintColumns = resolveColumnNames(
            table,
            constraint.columnIds
        );
        return (
            !!constraintColumns &&
            valuesEqual(
                constraintColumns.map(normalizeName),
                normalizedReference
            )
        );
    });
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
    const allKnownCustomTypes = [
        ...baseline.customTypes,
        ...target.customTypes,
    ];
    const baselineKnownTypes = new Set([
        ...baseline.tables.flatMap((table) =>
            table.columns.flatMap((column) => [
                normalizeTypeName(column.dataType),
                normalizeTypeName(column.dataType).split('.').at(-1) ?? '',
            ])
        ),
        ...baseline.customTypes.flatMap((customType) => [
            getCustomTypeMatchKey(customType),
            customType.name.toLowerCase(),
        ]),
    ]);

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

    const baselineCustomTypes = mapBy(
        baseline.customTypes,
        getCustomTypeMatchKey
    );
    const targetCustomTypes = mapBy(target.customTypes, getCustomTypeMatchKey);

    for (const [key, baselineCustomType] of baselineCustomTypes) {
        const targetCustomType = targetCustomTypes.get(key);
        if (!targetCustomType) {
            warnings.push({
                code: 'drop_custom_type_not_supported',
                level: 'blocked',
                title: 'Dropping custom PostgreSQL types is not supported',
                message: `Custom type ${baselineCustomType.schemaName}.${baselineCustomType.name} exists in the baseline schema but is missing from the target schema. Automatic DROP TYPE is not supported in v1.`,
                changeIds: [],
            });
            continue;
        }

        if (baselineCustomType.kind !== targetCustomType.kind) {
            warnings.push({
                code: 'custom_type_kind_change_not_supported',
                level: 'blocked',
                title: 'Changing custom type kind is not supported',
                message: `Custom type ${baselineCustomType.schemaName}.${baselineCustomType.name} changed kind from ${baselineCustomType.kind} to ${targetCustomType.kind}, which requires a manual migration.`,
                changeIds: [],
            });
            continue;
        }

        if (
            baselineCustomType.kind === 'enum' &&
            targetCustomType.kind === 'enum' &&
            !valuesEqual(baselineCustomType.values, targetCustomType.values)
        ) {
            const baselinePrefixMatches = baselineCustomType.values.every(
                (value, index) => targetCustomType.values[index] === value
            );

            if (
                baselinePrefixMatches &&
                targetCustomType.values.length >
                    baselineCustomType.values.length
            ) {
                for (const value of targetCustomType.values.slice(
                    baselineCustomType.values.length
                )) {
                    changes.push({
                        id: `add-enum-value:${targetCustomType.id}:${value}`,
                        kind: 'add_enum_value',
                        typeId: targetCustomType.id,
                        schemaName: targetCustomType.schemaName,
                        typeName: targetCustomType.name,
                        value,
                    });
                }

                warnings.push({
                    code: 'enum_value_append',
                    level: 'warning',
                    title: 'Enum label addition',
                    message: `Enum ${targetCustomType.schemaName}.${targetCustomType.name} adds new value(s). PostgreSQL may execute enum label additions before the main transaction depending on server capabilities.`,
                    changeIds: changes
                        .filter(
                            (
                                change
                            ): change is Extract<
                                SchemaChange,
                                { kind: 'add_enum_value' }
                            > =>
                                change.kind === 'add_enum_value' &&
                                change.typeId === targetCustomType.id
                        )
                        .map((change) => change.id),
                });
            } else {
                warnings.push({
                    code: 'unsupported_enum_modification',
                    level: 'blocked',
                    title: 'Unsupported enum modification',
                    message: `Enum ${targetCustomType.schemaName}.${targetCustomType.name} changes existing labels by reordering or removing values. v1 supports only additive enum changes at the end of the label list.`,
                    changeIds: [],
                });
            }
        }
    }

    for (const [key, targetCustomType] of targetCustomTypes) {
        if (baselineCustomTypes.has(key)) {
            continue;
        }

        if (targetCustomType.kind === 'enum') {
            changes.push({
                id: `create-enum-type:${targetCustomType.id}`,
                kind: 'create_enum_type',
                customType: targetCustomType,
            });
            warnings.push({
                code: 'create_enum_type',
                level: 'safe',
                title: 'Enum type will be created automatically',
                message: `Detected new PostgreSQL enum type ${targetCustomType.schemaName}.${targetCustomType.name}. It will be created before dependent schema changes.`,
                changeIds: [`create-enum-type:${targetCustomType.id}`],
            });
            continue;
        }

        warnings.push({
            code: 'unsupported_custom_type_kind',
            level: 'blocked',
            title: 'Unsupported custom PostgreSQL type',
            message: `Custom type ${targetCustomType.schemaName}.${targetCustomType.name} is a ${targetCustomType.kind} type. v1 currently automates PostgreSQL enum types only.`,
            changeIds: [],
        });
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
                    customTypeId: targetColumn.customTypeId ?? null,
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

    const ensureSupportedType = (
        typeName: string,
        customTypeId: string | null | undefined,
        contextSchema: string,
        changeId: string,
        contextLabel: string
    ) => {
        const normalized = normalizeTypeName(typeName);
        const referencedCustomType = findReferencedCustomType({
            customTypeId,
            typeName,
            customTypes: allKnownCustomTypes,
            contextSchema,
            defaultSchema: target.defaultSchemaName,
        });

        if (referencedCustomType?.kind === 'enum') {
            return;
        }

        if (referencedCustomType?.kind) {
            analyzedWarnings.push({
                code: 'unsupported_custom_type_kind',
                level: 'blocked',
                title: 'Unsupported custom PostgreSQL type',
                message: `${contextLabel} uses custom type "${referencedCustomType.schemaName}.${referencedCustomType.name}", but v1 only automates PostgreSQL enum types.`,
                changeIds: [changeId],
            });
            return;
        }

        const unqualified = normalized.split('.').at(-1) ?? normalized;
        if (
            !normalized ||
            isBuiltinPostgresType(typeName) ||
            baselineKnownTypes.has(normalized) ||
            baselineKnownTypes.has(unqualified)
        ) {
            return;
        }

        analyzedWarnings.push({
            code: 'unsupported_custom_type',
            level: 'blocked',
            title: 'Unsupported custom PostgreSQL type',
            message: `Type "${typeName}" is referenced by ${contextLabel}, but no enum definition is available in the target schema or imported baseline.`,
            changeIds: [changeId],
        });
    };

    for (const change of changes) {
        switch (change.kind) {
            case 'create_table':
                for (const column of change.table.columns) {
                    ensureSupportedType(
                        column.dataType,
                        column.customTypeId,
                        change.table.schemaName,
                        change.id,
                        `${change.table.schemaName}.${change.table.name}.${column.name}`
                    );
                }
                break;
            case 'add_column':
                ensureSupportedType(
                    change.column.dataType,
                    change.column.customTypeId,
                    change.schemaName,
                    change.id,
                    `${change.schemaName}.${change.tableName}.${change.column.name}`
                );
                break;
            case 'alter_column_type':
                ensureSupportedType(
                    change.toType,
                    change.customTypeId,
                    change.schemaName,
                    change.id,
                    `${change.schemaName}.${change.tableName}.${change.columnName}`
                );
                break;
            case 'add_foreign_key': {
                const referencedTable = target.tables.find(
                    (table) =>
                        normalizeName(table.schemaName) ===
                            normalizeName(
                                change.foreignKey.referencedSchemaName
                            ) &&
                        normalizeName(table.name) ===
                            normalizeName(change.foreignKey.referencedTableName)
                );

                if (!referencedTable) {
                    analyzedWarnings.push({
                        code: 'foreign_key_reference_table_missing',
                        level: 'blocked',
                        title: 'Foreign key target table not found',
                        message: `Foreign key ${change.foreignKey.name} references ${change.foreignKey.referencedSchemaName}.${change.foreignKey.referencedTableName}, but that table does not exist in the target schema.`,
                        changeIds: [change.id],
                    });
                    break;
                }

                if (
                    !hasMatchingUniqueReference(
                        referencedTable,
                        change.foreignKey.referencedColumnNames
                    )
                ) {
                    analyzedWarnings.push({
                        code: 'foreign_key_reference_not_unique',
                        level: 'blocked',
                        title: 'Foreign key target must be unique',
                        message: `Foreign key ${change.foreignKey.name} references ${change.foreignKey.referencedSchemaName}.${change.foreignKey.referencedTableName}(${change.foreignKey.referencedColumnNames.join(', ')}), but PostgreSQL requires the referenced column set to be a PRIMARY KEY or UNIQUE constraint.`,
                        changeIds: [change.id],
                    });
                }
                break;
            }
        }
    }

    const summary = summarize(changes, analyzedWarnings);
    const sqlStatements = generateMigrationSql(changes, target);
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
        baselineFingerprint: hashCanonicalSchema(baseline),
        targetFingerprint: hashCanonicalSchema(target),
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
