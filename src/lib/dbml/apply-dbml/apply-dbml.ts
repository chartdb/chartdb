import { defaultSchemas } from '@/lib/data/default-schemas';
import type { Area } from '../../domain/area';
import {
    DBCustomTypeKind,
    type DBCustomType,
} from '../../domain/db-custom-type';
import type { DBDependency } from '../../domain/db-dependency';
import type { DBField } from '../../domain/db-field';
import type { DBIndex } from '../../domain/db-index';
import type { DBRelationship } from '../../domain/db-relationship';
import type { DBTable } from '../../domain/db-table';
import type { Diagram } from '../../domain/diagram';

type SourceIdToDataMap = Record<
    string,
    { schema?: string | null; name: string; color?: string }
>;

type IdMappings = {
    tables: Record<string, string>;
    fields: Record<string, string>;
};

// Key generation functions remain the same for consistency
const createObjectKey = ({
    type,
    schema,
    otherSchema,
    parentName,
    otherParentName,
    name,
    otherName,
}: {
    type:
        | 'table'
        | 'field'
        | 'index'
        | 'relationship'
        | 'customType'
        | 'dependency'
        | 'area';
    schema?: string | null;
    otherSchema?: string | null;
    parentName?: string | null;
    otherParentName?: string | null;
    name: string;
    otherName?: string | null;
}) =>
    `${type}-${schema ? `${schema}.` : ''}${otherSchema ? `${otherSchema}.` : ''}${parentName ? `${parentName}.` : ''}${otherParentName ? `${otherParentName}.` : ''}${name}${otherName ? `.${otherName}` : ''}`;

const createObjectKeyFromTable = (table: DBTable) =>
    createObjectKey({
        type: 'table',
        schema: table.schema,
        name: table.name,
    });

const createObjectKeyFromField = (table: DBTable, field: DBField) =>
    createObjectKey({
        type: 'field',
        schema: table.schema,
        parentName: table.name,
        name: field.name,
    });

const createObjectKeyFromIndex = (table: DBTable, index: DBIndex) =>
    createObjectKey({
        type: 'index',
        schema: table.schema,
        parentName: table.name,
        name: index.name,
    });

const createObjectKeyFromRelationship = (
    relationship: DBRelationship,
    sourceIdToNameMap: SourceIdToDataMap
) => {
    const sourceTable = sourceIdToNameMap[relationship.sourceTableId];
    const targetTable = sourceIdToNameMap[relationship.targetTableId];
    const sourceField = sourceIdToNameMap[relationship.sourceFieldId];
    const targetField = sourceIdToNameMap[relationship.targetFieldId];

    if (!sourceTable || !targetTable || !sourceField || !targetField) {
        return null;
    }

    return createObjectKey({
        type: 'relationship',
        schema: sourceTable.schema,
        otherSchema: targetTable.schema,
        parentName: sourceTable.name,
        otherParentName: targetTable.name,
        name: sourceField.name,
        otherName: targetField.name,
    });
};

const createObjectKeyFromCustomType = (customType: DBCustomType) =>
    createObjectKey({
        type: 'customType',
        schema: customType.schema,
        name: customType.name,
    });

const createObjectKeyFromDependency = (
    dependency: DBDependency,
    sourceIdToNameMap: SourceIdToDataMap
) => {
    const dependentTable = sourceIdToNameMap[dependency.dependentTableId];
    const table = sourceIdToNameMap[dependency.tableId];

    if (!dependentTable || !table) {
        return null;
    }

    return createObjectKey({
        type: 'dependency',
        schema: dependentTable.schema,
        otherSchema: table.schema,
        name: dependentTable.name,
        otherName: table.name,
    });
};

const createObjectKeyFromArea = (area: Area) =>
    createObjectKey({
        type: 'area',
        name: area.name,
    });

// Helper function to build source mappings
const buildSourceMappings = (sourceDiagram: Diagram) => {
    const objectKeysToIdsMap: Record<string, string> = {};
    const sourceIdToDataMap: SourceIdToDataMap = {};

    // Map tables and their fields/indexes
    sourceDiagram.tables?.forEach((table) => {
        const tableKey = createObjectKeyFromTable(table);
        objectKeysToIdsMap[tableKey] = table.id;
        sourceIdToDataMap[table.id] = {
            schema: table.schema,
            name: table.name,
            color: table.color,
        };

        table.fields?.forEach((field) => {
            const fieldKey = createObjectKeyFromField(table, field);
            objectKeysToIdsMap[fieldKey] = field.id;
            sourceIdToDataMap[field.id] = {
                schema: table.schema,
                name: field.name,
            };
        });

        table.indexes?.forEach((index) => {
            const indexKey = createObjectKeyFromIndex(table, index);
            objectKeysToIdsMap[indexKey] = index.id;
        });
    });

    // Map relationships
    sourceDiagram.relationships?.forEach((relationship) => {
        const key = createObjectKeyFromRelationship(
            relationship,
            sourceIdToDataMap
        );
        if (key) {
            objectKeysToIdsMap[key] = relationship.id;
        }
    });

    // Map custom types
    sourceDiagram.customTypes?.forEach((customType) => {
        const key = createObjectKeyFromCustomType(customType);
        objectKeysToIdsMap[key] = customType.id;
    });

    // Map dependencies
    sourceDiagram.dependencies?.forEach((dependency) => {
        const key = createObjectKeyFromDependency(
            dependency,
            sourceIdToDataMap
        );
        if (key) {
            objectKeysToIdsMap[key] = dependency.id;
        }
    });

    // Map areas
    sourceDiagram.areas?.forEach((area) => {
        const key = createObjectKeyFromArea(area);
        objectKeysToIdsMap[key] = area.id;
    });

    return { objectKeysToIdsMap, sourceIdToDataMap };
};

// Functional helper to update tables and collect ID mappings
const updateTables = ({
    targetTables,
    sourceTables,
    defaultDatabaseSchema,
}: {
    targetTables: DBTable[] | undefined;
    sourceTables: DBTable[] | undefined;
    objectKeysToIdsMap: Record<string, string>;
    sourceIdToDataMap: SourceIdToDataMap;
    defaultDatabaseSchema?: string;
}): { tables: DBTable[]; idMappings: IdMappings } => {
    if (!targetTables)
        return { tables: [], idMappings: { tables: {}, fields: {} } };
    if (!sourceTables)
        return { tables: targetTables, idMappings: { tables: {}, fields: {} } };

    const idMappings: IdMappings = { tables: {}, fields: {} };

    // Create a map of source tables by schema + name
    const sourceTablesByKey = new Map<string, DBTable>();
    sourceTables.forEach((table) => {
        const key = createObjectKeyFromTable(table);
        sourceTablesByKey.set(key, table);
    });

    const updatedTables = targetTables.map((targetTable) => {
        // Try to find matching source table by schema + name
        const targetKey = createObjectKeyFromTable(targetTable);
        let sourceTable = sourceTablesByKey.get(targetKey);

        // If no match and target has a schema, try without schema
        if (!sourceTable && targetTable.schema) {
            const noSchemaKey = createObjectKeyFromTable({
                ...targetTable,
                schema: undefined,
            });
            sourceTable = sourceTablesByKey.get(noSchemaKey);
        }

        // If still no match, try with default schema
        if (!sourceTable && defaultDatabaseSchema) {
            if (!targetTable.schema) {
                // If target table has no schema, try matching with default schema
                const defaultKey = createObjectKeyFromTable({
                    ...targetTable,
                    schema: defaultDatabaseSchema,
                });
                sourceTable = sourceTablesByKey.get(defaultKey);
            } else if (targetTable.schema === defaultDatabaseSchema) {
                // Already tried without schema above
            }
        }

        if (!sourceTable) {
            // No matching source table found - keep target as-is
            return targetTable;
        }

        const sourceId = sourceTable.id;
        idMappings.tables[targetTable.id] = sourceId;

        // Update fields by matching on name within the table
        const sourceFieldsByName = new Map<string, DBField>();
        sourceTable.fields?.forEach((field) => {
            sourceFieldsByName.set(field.name, field);
        });

        const updatedFields = targetTable.fields?.map((targetField) => {
            const sourceField = sourceFieldsByName.get(targetField.name);
            if (sourceField) {
                idMappings.fields[targetField.id] = sourceField.id;

                // Use source field properties when there's a match
                return {
                    ...targetField,
                    id: sourceField.id,
                    createdAt: sourceField.createdAt,
                };
            }
            // For new fields not in source, keep target field as-is
            return targetField;
        });

        // Update indexes - match by name first, then by semantic structure
        // Build map of source indexes by name for quick lookup
        const sourceIndexesByName = new Map<string, DBIndex>();
        sourceTable.indexes?.forEach((index) => {
            sourceIndexesByName.set(index.name, index);
        });

        const updatedIndexes = targetTable.indexes?.map((targetIndex) => {
            // First try to match by name
            const sourceIndexByName = sourceIndexesByName.get(targetIndex.name);
            if (sourceIndexByName) {
                // Names match - preserve source's id, name, and createdAt
                return {
                    ...targetIndex,
                    id: sourceIndexByName.id,
                    name: sourceIndexByName.name,
                    createdAt: sourceIndexByName.createdAt,
                };
            }

            // No name match - try semantic match by field IDs, unique, and isPrimaryKey
            // Translate target field IDs to source field IDs for comparison
            const targetFieldIdsAsSourceIds = targetIndex.fieldIds.map(
                (fid) => idMappings.fields[fid] || fid
            );

            const sourceIndexBySemantic = sourceTable.indexes?.find(
                (srcIndex) => {
                    // Skip if this source index was already matched by name
                    if (
                        sourceIndexesByName.has(srcIndex.name) &&
                        targetTable.indexes?.some(
                            (ti) => ti.name === srcIndex.name
                        )
                    ) {
                        return false;
                    }

                    // Compare field IDs (order matters for indexes)
                    if (
                        srcIndex.fieldIds.length !==
                        targetFieldIdsAsSourceIds.length
                    ) {
                        return false;
                    }
                    const fieldsMatch = srcIndex.fieldIds.every(
                        (fid, i) => fid === targetFieldIdsAsSourceIds[i]
                    );
                    if (!fieldsMatch) return false;

                    // Match unique and isPrimaryKey status
                    return (
                        srcIndex.unique === targetIndex.unique &&
                        !!srcIndex.isPrimaryKey === !!targetIndex.isPrimaryKey
                    );
                }
            );

            if (sourceIndexBySemantic) {
                // Semantic match - keep target's id and createdAt, use source's name
                return {
                    ...targetIndex,
                    name: sourceIndexBySemantic.name,
                    id: sourceIndexBySemantic.id,
                    createdAt: sourceIndexBySemantic.createdAt,
                };
            }
            return targetIndex;
        });

        // Build the result table, preserving source structure
        const resultTable: DBTable = {
            ...sourceTable,
            fields: updatedFields,
            indexes: updatedIndexes,
            comments: targetTable.comments,
        };

        // Update nullable, unique, primaryKey from target fields
        if (targetTable.fields) {
            resultTable.fields = resultTable.fields?.map((field) => {
                const targetField = targetTable.fields?.find(
                    (f) => f.name === field.name
                );
                if (targetField) {
                    return {
                        ...field,
                        nullable: targetField.nullable,
                        unique: targetField.unique,
                        primaryKey: targetField.primaryKey,
                        type: targetField.type,
                    };
                }
                return field;
            });
        }

        return resultTable;
    });

    return { tables: updatedTables, idMappings };
};

// Functional helper to update custom types
const updateCustomTypes = (
    customTypes: DBCustomType[] | undefined,
    objectKeysToIdsMap: Record<string, string>
): DBCustomType[] => {
    if (!customTypes) return [];

    return customTypes.map((customType) => {
        const key = createObjectKeyFromCustomType(customType);
        const sourceId = objectKeysToIdsMap[key];

        if (sourceId) {
            return { ...customType, id: sourceId };
        }
        return customType;
    });
};

// Functional helper to update relationships
const updateRelationships = (
    targetRelationships: DBRelationship[] | undefined,
    sourceRelationships: DBRelationship[] | undefined,
    idMappings: IdMappings
): DBRelationship[] => {
    // If target has no relationships, return empty array (relationships were removed)
    if (!targetRelationships || targetRelationships.length === 0) return [];

    // If source has no relationships, we need to add the target relationships with updated IDs
    if (!sourceRelationships || sourceRelationships.length === 0) {
        return targetRelationships.map((targetRel) => {
            // Find the source IDs by reversing the mapping lookup
            let sourceTableId = targetRel.sourceTableId;
            let targetTableId = targetRel.targetTableId;
            let sourceFieldId = targetRel.sourceFieldId;
            let targetFieldId = targetRel.targetFieldId;

            // Find source table/field IDs from the mappings
            for (const [targetId, srcId] of Object.entries(idMappings.tables)) {
                if (targetId === targetRel.sourceTableId) {
                    sourceTableId = srcId;
                }
                if (targetId === targetRel.targetTableId) {
                    targetTableId = srcId;
                }
            }

            for (const [targetId, srcId] of Object.entries(idMappings.fields)) {
                if (targetId === targetRel.sourceFieldId) {
                    sourceFieldId = srcId;
                }
                if (targetId === targetRel.targetFieldId) {
                    targetFieldId = srcId;
                }
            }

            return {
                ...targetRel,
                sourceTableId,
                targetTableId,
                sourceFieldId,
                targetFieldId,
            };
        });
    }

    // Map source relationships that have matches in target
    const resultRelationships: DBRelationship[] = [];
    const matchedTargetRelIds = new Set<string>();

    sourceRelationships.forEach((sourceRel) => {
        // Find matching target relationship by checking if the target has a relationship
        // between the same tables and fields (using the ID mappings)
        const targetRel = targetRelationships.find((tgtRel) => {
            const mappedSourceTableId = idMappings.tables[tgtRel.sourceTableId];
            const mappedTargetTableId = idMappings.tables[tgtRel.targetTableId];
            const mappedSourceFieldId = idMappings.fields[tgtRel.sourceFieldId];
            const mappedTargetFieldId = idMappings.fields[tgtRel.targetFieldId];

            // Check both directions since relationships can be defined in either direction
            const directMatch =
                sourceRel.sourceTableId === mappedSourceTableId &&
                sourceRel.targetTableId === mappedTargetTableId &&
                sourceRel.sourceFieldId === mappedSourceFieldId &&
                sourceRel.targetFieldId === mappedTargetFieldId;

            const reverseMatch =
                sourceRel.sourceTableId === mappedTargetTableId &&
                sourceRel.targetTableId === mappedSourceTableId &&
                sourceRel.sourceFieldId === mappedTargetFieldId &&
                sourceRel.targetFieldId === mappedSourceFieldId;

            return directMatch || reverseMatch;
        });

        if (targetRel) {
            matchedTargetRelIds.add(targetRel.id);
            // Preserve source relationship but update cardinalities from target
            const result: DBRelationship = {
                ...sourceRel,
                sourceCardinality: targetRel.sourceCardinality,
                targetCardinality: targetRel.targetCardinality,
            };

            // Only include schema fields if they exist in the source relationship
            if (!sourceRel.sourceSchema) {
                delete result.sourceSchema;
            }
            if (!sourceRel.targetSchema) {
                delete result.targetSchema;
            }

            resultRelationships.push(result);
        }
    });

    // Add any target relationships that weren't matched (new relationships)
    targetRelationships.forEach((targetRel) => {
        if (!matchedTargetRelIds.has(targetRel.id)) {
            // Find the source IDs by reversing the mapping lookup
            let sourceTableId = targetRel.sourceTableId;
            let targetTableId = targetRel.targetTableId;
            let sourceFieldId = targetRel.sourceFieldId;
            let targetFieldId = targetRel.targetFieldId;

            // Find source table/field IDs from the mappings
            for (const [targetId, srcId] of Object.entries(idMappings.tables)) {
                if (targetId === targetRel.sourceTableId) {
                    sourceTableId = srcId;
                }
                if (targetId === targetRel.targetTableId) {
                    targetTableId = srcId;
                }
            }

            for (const [targetId, srcId] of Object.entries(idMappings.fields)) {
                if (targetId === targetRel.sourceFieldId) {
                    sourceFieldId = srcId;
                }
                if (targetId === targetRel.targetFieldId) {
                    targetFieldId = srcId;
                }
            }

            resultRelationships.push({
                ...targetRel,
                sourceTableId,
                targetTableId,
                sourceFieldId,
                targetFieldId,
            });
        }
    });

    return resultRelationships;
};

// Functional helper to update dependencies
const updateDependencies = (
    targetDependencies: DBDependency[] | undefined,
    sourceDependencies: DBDependency[] | undefined,
    idMappings: IdMappings
): DBDependency[] => {
    if (!targetDependencies) return [];
    if (!sourceDependencies) return targetDependencies;

    return targetDependencies.map((targetDep) => {
        // Find matching source dependency
        const sourceDep = sourceDependencies.find((srcDep) => {
            const srcTableId = idMappings.tables[targetDep.tableId];
            const srcDependentTableId =
                idMappings.tables[targetDep.dependentTableId];

            return (
                srcDep.tableId === srcTableId &&
                srcDep.dependentTableId === srcDependentTableId
            );
        });

        if (sourceDep) {
            return {
                ...targetDep,
                id: sourceDep.id,
                tableId:
                    idMappings.tables[targetDep.tableId] || targetDep.tableId,
                dependentTableId:
                    idMappings.tables[targetDep.dependentTableId] ||
                    targetDep.dependentTableId,
            };
        }

        // If no match found, just update the table references
        return {
            ...targetDep,
            tableId: idMappings.tables[targetDep.tableId] || targetDep.tableId,
            dependentTableId:
                idMappings.tables[targetDep.dependentTableId] ||
                targetDep.dependentTableId,
        };
    });
};

// Functional helper to update index field references
const updateIndexFieldReferences = (
    tables: DBTable[] | undefined,
    idMappings: IdMappings
): DBTable[] => {
    if (!tables) return [];

    return tables.map((table) => ({
        ...table,
        indexes: table.indexes?.map((index) => ({
            ...index,
            fieldIds: index.fieldIds.map(
                (fieldId) => idMappings.fields[fieldId] || fieldId
            ),
        })),
    }));
};

export const applyDBMLChanges = ({
    sourceDiagram,
    targetDiagram,
}: {
    sourceDiagram: Diagram;
    targetDiagram: Diagram;
}): Diagram => {
    // Step 1: Build mappings from source diagram
    const { objectKeysToIdsMap, sourceIdToDataMap } =
        buildSourceMappings(sourceDiagram);

    // Step 2: Update tables and collect ID mappings
    const { tables: updatedTables, idMappings } = updateTables({
        targetTables: targetDiagram.tables,
        sourceTables: sourceDiagram.tables,
        objectKeysToIdsMap,
        sourceIdToDataMap,
        defaultDatabaseSchema: defaultSchemas[sourceDiagram.databaseType],
    });

    // Step 3: Update all other entities functionally
    const newCustomTypes = updateCustomTypes(
        targetDiagram.customTypes,
        objectKeysToIdsMap
    );

    const updatedCustomTypes = [
        ...(sourceDiagram.customTypes?.filter(
            (ct) => ct.kind === DBCustomTypeKind.composite
        ) ?? []),
        ...newCustomTypes,
    ];

    const updatedRelationships = updateRelationships(
        targetDiagram.relationships,
        sourceDiagram.relationships,
        idMappings
    );

    const updatedDependencies = updateDependencies(
        targetDiagram.dependencies,
        sourceDiagram.dependencies,
        idMappings
    );

    // Step 4: Update index field references
    const finalTables = updateIndexFieldReferences(updatedTables, idMappings);

    // Sort relationships to match source order
    const sortedRelationships = [...updatedRelationships].sort((a, b) => {
        // Find source relationships to get their order
        const sourceRelA = sourceDiagram.relationships?.find(
            (r) => r.id === a.id
        );
        const sourceRelB = sourceDiagram.relationships?.find(
            (r) => r.id === b.id
        );

        if (!sourceRelA || !sourceRelB) return 0;

        const indexA = sourceDiagram.relationships?.indexOf(sourceRelA) ?? 0;
        const indexB = sourceDiagram.relationships?.indexOf(sourceRelB) ?? 0;

        return indexA - indexB;
    });

    // Return a new diagram object with tables sorted by order
    const result: Diagram = {
        ...sourceDiagram,
        tables: finalTables.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        areas: targetDiagram.areas,
        notes: targetDiagram.notes,
        relationships: sortedRelationships,
        dependencies: updatedDependencies,
        customTypes: updatedCustomTypes,
    };

    return result;
};
