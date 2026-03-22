import {
    type CanonicalColumn,
    type CanonicalForeignKey,
    type CanonicalSchema,
    type CanonicalTable,
} from '@chartdb/schema-sync-core';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram, DBIndex, DBRelationship, DBTable } from '@/lib/domain';
import {
    adjustTablePositions,
    getTableIndexesWithPrimaryKey,
} from '@/lib/domain';
import {
    findDataTypeDataById,
    getPreferredSynonym,
    type DataType,
} from '@/lib/data/data-types/data-types';
import { defaultSchemas } from '@/lib/data/default-schemas';
import { generateDBFieldSuffix } from '@/lib/domain/db-field';
import { generateDiagramId, generateId } from '@/lib/utils';

const normalizeDataType = (typeName: string): DataType => {
    const normalized = typeName.replace(/\[\]$/, '').trim().toLowerCase();
    const preferred = getPreferredSynonym(normalized, DatabaseType.POSTGRESQL);
    const dataType = preferred ??
        findDataTypeDataById(normalized, DatabaseType.POSTGRESQL) ?? {
            id: normalized.replace(/\s+/g, '_'),
            name: typeName,
        };

    return {
        id: dataType.id,
        name: dataType.name,
    };
};

const relationshipFromForeignKey = ({
    foreignKey,
    localTable,
    tablesByKey,
}: {
    foreignKey: CanonicalForeignKey;
    localTable: DBTable;
    tablesByKey: Map<string, DBTable>;
}): DBRelationship | null => {
    const targetTable = tablesByKey.get(
        `${foreignKey.referencedSchemaName}.${foreignKey.referencedTableName}`
    );
    const localFieldKey = foreignKey.columnIds[0];
    const localFieldName = localFieldKey.includes('.')
        ? localFieldKey.slice(localFieldKey.lastIndexOf('.') + 1)
        : localFieldKey;
    const targetFieldName = foreignKey.referencedColumnNames[0];
    const localField = localTable.fields.find(
        (field) => field.name === localFieldName
    );
    const targetField = targetTable?.fields.find(
        (field) => field.name === targetFieldName
    );

    if (!targetTable || !localField || !targetField) {
        return null;
    }

    return {
        id: generateId(),
        name: foreignKey.name,
        sourceSchema: localTable.schema,
        sourceTableId: localTable.id,
        targetSchema: targetTable.schema,
        targetTableId: targetTable.id,
        sourceFieldId: localField.id,
        targetFieldId: targetField.id,
        sourceCardinality: 'many',
        targetCardinality: 'one',
        createdAt: Date.now(),
        syncMetadata: {
            sourceId: foreignKey.sync?.sourceId ?? foreignKey.id,
            sourceName: foreignKey.name,
        },
    };
};

export const canonicalSchemaToDiagram = ({
    canonicalSchema,
    diagramId = generateDiagramId(),
    diagramName,
    schemaSync,
}: {
    canonicalSchema: CanonicalSchema;
    diagramId?: string;
    diagramName?: string;
    schemaSync?: Diagram['schemaSync'];
}): Diagram => {
    const tables = canonicalSchema.tables.map<DBTable>((table) => {
        const pkColumnIds = new Set(table.primaryKey?.columnIds ?? []);
        const singleColumnUniqueIds = new Set(
            table.uniqueConstraints
                .filter((constraint) => constraint.columnIds.length === 1)
                .map((constraint) => constraint.columnIds[0])
        );

        const fields = table.columns.map((column) => {
            const columnKey = column.sync?.sourceId ?? column.id;
            const fieldType = normalizeDataType(
                column.dataTypeDisplay ?? column.dataType
            );

            return {
                id: generateId(),
                name: column.name,
                type: fieldType,
                primaryKey:
                    pkColumnIds.has(column.id) || pkColumnIds.has(columnKey),
                unique:
                    singleColumnUniqueIds.has(column.id) ||
                    singleColumnUniqueIds.has(columnKey),
                nullable: column.nullable,
                increment: column.isIdentity ?? false,
                isArray: column.isArray ?? false,
                createdAt: Date.now(),
                characterMaximumLength: column.characterMaximumLength
                    ? String(column.characterMaximumLength)
                    : null,
                precision: column.precision ?? null,
                scale: column.scale ?? null,
                default: column.defaultValue ?? null,
                comments: column.comment ?? null,
                syncMetadata: {
                    sourceId: column.sync?.sourceId ?? column.id,
                    sourceName: column.name,
                },
            };
        });

        const fieldByName = new Map(fields.map((field) => [field.name, field]));
        const regularIndexes = table.indexes.map<DBIndex>((index) => ({
            id: generateId(),
            name: index.name,
            unique: index.unique,
            fieldIds: index.columnIds
                .map(
                    (columnKey) =>
                        fieldByName.get(
                            columnKey.includes('.')
                                ? columnKey.slice(
                                      columnKey.lastIndexOf('.') + 1
                                  )
                                : columnKey
                        )?.id
                )
                .filter(Boolean) as string[],
            createdAt: Date.now(),
            type:
                index.type === null || index.type === undefined
                    ? null
                    : (index.type as DBIndex['type']),
            syncMetadata: {
                sourceId: index.sync?.sourceId ?? index.id,
                sourceName: index.name,
            },
        }));

        const uniqueIndexes = table.uniqueConstraints.map<DBIndex>(
            (constraint) => ({
                id: generateId(),
                name: constraint.name,
                unique: true,
                fieldIds: constraint.columnIds
                    .map(
                        (columnKey) =>
                            fieldByName.get(
                                columnKey.includes('.')
                                    ? columnKey.slice(
                                          columnKey.lastIndexOf('.') + 1
                                      )
                                    : columnKey
                            )?.id
                    )
                    .filter(Boolean) as string[],
                createdAt: Date.now(),
                syncMetadata: {
                    sourceId: constraint.sync?.sourceId ?? constraint.id,
                    sourceName: constraint.name,
                },
            })
        );

        return {
            id: generateId(),
            name: table.name,
            schema: table.schemaName,
            x: 0,
            y: 0,
            fields,
            indexes: getTableIndexesWithPrimaryKey({
                table: {
                    id: generateId(),
                    name: table.name,
                    schema: table.schemaName,
                    x: 0,
                    y: 0,
                    fields,
                    indexes: [...uniqueIndexes, ...regularIndexes],
                    color: '#84cc16',
                    isView: table.kind === 'view',
                    createdAt: Date.now(),
                },
            }),
            checkConstraints: table.checkConstraints.map((constraint) => ({
                id: generateId(),
                expression: constraint.expression,
                createdAt: Date.now(),
                syncMetadata: {
                    sourceId: constraint.sync?.sourceId ?? constraint.id,
                    sourceName: constraint.name ?? constraint.id,
                },
            })),
            color: table.kind === 'view' ? '#64748b' : '#84cc16',
            isView: table.kind === 'view',
            createdAt: Date.now(),
            syncMetadata: {
                sourceId: table.sync?.sourceId ?? table.id,
                sourceName: table.name,
            },
        };
    });

    const tablesByKey = new Map(
        tables.map((table) => [`${table.schema}.${table.name}`, table])
    );
    const relationships = canonicalSchema.tables.flatMap((table) => {
        const localTable = tablesByKey.get(`${table.schemaName}.${table.name}`);
        if (!localTable) {
            return [];
        }

        return table.foreignKeys
            .map((foreignKey) =>
                relationshipFromForeignKey({
                    foreignKey,
                    localTable,
                    tablesByKey,
                })
            )
            .filter(Boolean) as DBRelationship[];
    });

    const adjustedTables = adjustTablePositions({
        tables,
        relationships,
        mode: 'perSchema',
    });

    return {
        id: diagramId,
        name: diagramName ?? canonicalSchema.databaseName,
        databaseType: DatabaseType.POSTGRESQL,
        tables: adjustedTables,
        relationships,
        dependencies: [],
        areas: [],
        customTypes: [],
        notes: [],
        schemaSync,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};

const renderFieldType = (column: DBTable['fields'][number]) =>
    `${column.type.name}${generateDBFieldSuffix(column, {
        databaseType: DatabaseType.POSTGRESQL,
        forceExtended: true,
        typeId: column.type.id,
    })}`;

export const diagramToCanonicalSchema = (diagram: Diagram): CanonicalSchema => {
    const schemaNames = [
        ...new Set(
            (diagram.tables ?? [])
                .map(
                    (table) =>
                        table.schema ?? defaultSchemas[DatabaseType.POSTGRESQL]
                )
                .filter(Boolean) as string[]
        ),
    ];
    const tablesById = new Map(
        (diagram.tables ?? []).map((table) => [table.id, table])
    );
    const relationshipsBySource = new Map<string, DBRelationship[]>();
    for (const relationship of diagram.relationships ?? []) {
        const current =
            relationshipsBySource.get(relationship.sourceTableId) ?? [];
        current.push(relationship);
        relationshipsBySource.set(relationship.sourceTableId, current);
    }

    const tables = (diagram.tables ?? []).map<CanonicalTable>((table) => {
        const columnLookup = new Map(
            table.fields.map((field) => [field.id, field.name])
        );
        const columns: CanonicalColumn[] = table.fields.map((field) => ({
            id:
                field.syncMetadata?.sourceId ??
                `${table.schema ?? 'public'}.${table.name}.${field.name}`,
            name: field.name,
            dataType: renderFieldType(field),
            dataTypeDisplay: renderFieldType(field),
            nullable: field.nullable,
            defaultValue: field.default ?? null,
            isPrimaryKey: field.primaryKey,
            isUnique: field.unique,
            isIdentity: field.increment ?? false,
            isArray: field.isArray ?? false,
            characterMaximumLength: field.characterMaximumLength
                ? Number(field.characterMaximumLength)
                : null,
            precision: field.precision ?? null,
            scale: field.scale ?? null,
            comment: field.comments ?? null,
            sync: {
                sourceId: field.syncMetadata?.sourceId,
                sourceName: field.syncMetadata?.sourceName ?? field.name,
            },
        }));
        const primaryKeyColumns = table.fields
            .filter((field) => field.primaryKey)
            .map(
                (field) =>
                    field.syncMetadata?.sourceId ??
                    `${table.schema ?? 'public'}.${table.name}.${field.name}`
            );
        const nonPrimaryIndexes = table.indexes.filter(
            (index) => !index.isPrimaryKey
        );

        const uniqueConstraints = nonPrimaryIndexes
            .filter((index) => index.unique)
            .map((index) => ({
                id:
                    index.syncMetadata?.sourceId ??
                    `${table.schema ?? 'public'}.${table.name}.${index.name}`,
                name:
                    index.name ||
                    `${table.name}_${index.fieldIds
                        .map((fieldId) => columnLookup.get(fieldId))
                        .filter(Boolean)
                        .join('_')}_key`,
                columnIds: index.fieldIds
                    .map((fieldId) => {
                        const fieldName = columnLookup.get(fieldId);
                        return fieldName
                            ? `${table.schema ?? 'public'}.${table.name}.${fieldName}`
                            : undefined;
                    })
                    .filter(Boolean) as string[],
                sync: {
                    sourceId: index.syncMetadata?.sourceId,
                    sourceName: index.syncMetadata?.sourceName ?? index.name,
                },
            }));

        const indexes = nonPrimaryIndexes
            .filter((index) => !index.unique)
            .map((index) => ({
                id:
                    index.syncMetadata?.sourceId ??
                    `${table.schema ?? 'public'}.${table.name}.${index.name}`,
                name:
                    index.name ||
                    `${table.name}_${index.fieldIds
                        .map((fieldId) => columnLookup.get(fieldId))
                        .filter(Boolean)
                        .join('_')}_idx`,
                columnIds: index.fieldIds
                    .map((fieldId) => {
                        const fieldName = columnLookup.get(fieldId);
                        return fieldName
                            ? `${table.schema ?? 'public'}.${table.name}.${fieldName}`
                            : undefined;
                    })
                    .filter(Boolean) as string[],
                unique: false,
                type: index.type ?? null,
                sync: {
                    sourceId: index.syncMetadata?.sourceId,
                    sourceName: index.syncMetadata?.sourceName ?? index.name,
                },
            }));

        const foreignKeys = (relationshipsBySource.get(table.id) ?? []).flatMap(
            (relationship) => {
                const targetTable = tablesById.get(relationship.targetTableId);
                const sourceField = table.fields.find(
                    (field) => field.id === relationship.sourceFieldId
                );
                const targetField = targetTable?.fields.find(
                    (field) => field.id === relationship.targetFieldId
                );

                if (!targetTable || !sourceField || !targetField) {
                    return [];
                }

                return [
                    {
                        id:
                            relationship.syncMetadata?.sourceId ??
                            `${table.schema ?? 'public'}.${table.name}.${relationship.name}`,
                        name:
                            relationship.name ||
                            `${table.name}_${sourceField.name}_fkey`,
                        columnIds: [
                            sourceField.syncMetadata?.sourceId ??
                                `${table.schema ?? 'public'}.${table.name}.${sourceField.name}`,
                        ],
                        referencedSchemaName:
                            targetTable.schema ??
                            defaultSchemas[DatabaseType.POSTGRESQL] ??
                            'public',
                        referencedTableName: targetTable.name,
                        referencedColumnNames: [targetField.name],
                        sync: {
                            sourceId: relationship.syncMetadata?.sourceId,
                            sourceName:
                                relationship.syncMetadata?.sourceName ??
                                relationship.name,
                        },
                    },
                ];
            }
        );

        return {
            id:
                table.syncMetadata?.sourceId ??
                `${table.schema ?? 'public'}.${table.name}`,
            schemaName:
                table.schema ??
                defaultSchemas[DatabaseType.POSTGRESQL] ??
                'public',
            name: table.name,
            kind: table.isView ? 'view' : 'table',
            columns,
            primaryKey:
                primaryKeyColumns.length > 0
                    ? {
                          id:
                              table.syncMetadata?.sourceId ??
                              `${table.schema ?? 'public'}.${table.name}.pkey`,
                          name: `${table.name}_pkey`,
                          columnIds: primaryKeyColumns,
                      }
                    : null,
            uniqueConstraints,
            indexes,
            foreignKeys,
            checkConstraints: (table.checkConstraints ?? []).map(
                (constraint) => ({
                    id:
                        constraint.syncMetadata?.sourceId ??
                        `${table.schema ?? 'public'}.${table.name}.${constraint.id}`,
                    name: constraint.syncMetadata?.sourceName ?? constraint.id,
                    expression: constraint.expression,
                    sync: {
                        sourceId: constraint.syncMetadata?.sourceId,
                        sourceName: constraint.syncMetadata?.sourceName,
                    },
                })
            ),
            sync: {
                sourceId: table.syncMetadata?.sourceId,
                sourceName: table.syncMetadata?.sourceName ?? table.name,
            },
        };
    });

    const canonical: CanonicalSchema = {
        engine: 'postgresql',
        databaseName: diagram.name,
        defaultSchemaName: defaultSchemas[DatabaseType.POSTGRESQL] ?? 'public',
        schemaNames: schemaNames.length > 0 ? schemaNames : ['public'],
        tables,
    };

    return canonical;
};
