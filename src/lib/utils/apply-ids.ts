import { defaultSchemas } from '../data/default-schemas';
import type { DBCustomType, DBTable, Diagram } from '../domain';

const createTableKey = ({
    table,
    defaultSchema,
}: {
    table: DBTable;
    defaultSchema?: string;
}) => {
    return `${table.schema ?? defaultSchema ?? ''}::${table.name}`;
};

const createFieldKey = ({
    table,
    fieldName,
    defaultSchema,
}: {
    table: DBTable;
    fieldName: string;
    defaultSchema?: string;
}) => {
    return `${table.schema ?? defaultSchema ?? ''}::${table.name}::${fieldName}`;
};

const createIndexKey = ({
    table,
    indexName,
    defaultSchema,
}: {
    table: DBTable;
    indexName: string;
    defaultSchema?: string;
}) => {
    return `${table.schema ?? defaultSchema ?? ''}::${table.name}::${indexName}`;
};

const createRelationshipKey = ({
    relationshipName,
    defaultSchema,
}: {
    relationshipName: string;
    defaultSchema?: string;
}) => {
    return `${defaultSchema ?? ''}::${relationshipName}`;
};

const createDependencyKey = ({
    table,
    dependentTable,
    defaultSchema,
}: {
    table: DBTable;
    dependentTable: DBTable;
    defaultSchema?: string;
}) => {
    return `${table.schema ?? defaultSchema ?? ''}::${table.name}::${dependentTable.schema ?? defaultSchema ?? ''}::${dependentTable.name}`;
};

const createCustomTypeKey = ({
    customType,
    defaultSchema,
}: {
    customType: DBCustomType;
    defaultSchema?: string;
}) => {
    return `${customType.schema ?? defaultSchema ?? ''}::${customType.name}`;
};

export const applyIds = ({
    sourceDiagram,
    targetDiagram,
}: {
    sourceDiagram: Diagram;
    targetDiagram: Diagram;
}): Diagram => {
    // Create a mapping of old IDs to new IDs
    const tablesIdMapping = new Map<string, string>();
    const fieldsIdMapping = new Map<string, string>();
    const indexesIdMapping = new Map<string, string>();
    const relationshipsIdMapping = new Map<string, string>();
    const dependenciesIdMapping = new Map<string, string>();
    const customTypesIdMapping = new Map<string, string>();

    const sourceDefaultSchema = defaultSchemas[sourceDiagram.databaseType];
    const targetDefaultSchema = defaultSchemas[targetDiagram.databaseType];

    // build idMapping
    sourceDiagram?.tables?.forEach((sourceTable) => {
        const sourceKey = createTableKey({
            table: sourceTable,
            defaultSchema: sourceDefaultSchema,
        });
        tablesIdMapping.set(sourceKey, sourceTable.id);

        sourceTable.fields.forEach((field) => {
            const fieldKey = createFieldKey({
                table: sourceTable,
                fieldName: field.name,
                defaultSchema: sourceDefaultSchema,
            });
            fieldsIdMapping.set(fieldKey, field.id);
        });

        sourceTable.indexes.forEach((index) => {
            const indexKey = createIndexKey({
                table: sourceTable,
                indexName: index.name,
                defaultSchema: sourceDefaultSchema,
            });
            indexesIdMapping.set(indexKey, index.id);
        });
    });

    sourceDiagram.relationships?.forEach((relationship) => {
        const relationshipKey = createRelationshipKey({
            relationshipName: relationship.name,
            defaultSchema: sourceDefaultSchema,
        });
        relationshipsIdMapping.set(relationshipKey, relationship.id);
    });

    sourceDiagram.dependencies?.forEach((dependency) => {
        const table = sourceDiagram.tables?.find(
            (t) => t.id === dependency.tableId
        );
        const dependentTable = sourceDiagram.tables?.find(
            (t) => t.id === dependency.dependentTableId
        );

        if (!table || !dependentTable) return;

        const dependencyKey = createDependencyKey({
            table,
            dependentTable,
            defaultSchema: sourceDefaultSchema,
        });

        dependenciesIdMapping.set(dependencyKey, dependency.id);
    });

    sourceDiagram.customTypes?.forEach((customType) => {
        const customTypeKey = createCustomTypeKey({
            customType,
            defaultSchema: sourceDefaultSchema,
        });
        customTypesIdMapping.set(customTypeKey, customType.id);
    });

    // Map current ID -> new ID for target diagram entities
    const targetTableIdMapping = new Map<string, string>();
    const targetFieldIdMapping = new Map<string, string>();
    const targetIndexIdMapping = new Map<string, string>();
    const targetRelationshipIdMapping = new Map<string, string>();
    const targetDependencyIdMapping = new Map<string, string>();
    const targetCustomTypeIdMapping = new Map<string, string>();

    targetDiagram?.tables?.forEach((targetTable) => {
        const targetKey = createTableKey({
            table: targetTable,
            defaultSchema: targetDefaultSchema,
        });
        const newId = tablesIdMapping.get(targetKey);
        if (newId) {
            targetTableIdMapping.set(targetTable.id, newId);
        }

        targetTable.fields.forEach((field) => {
            const fieldKey = createFieldKey({
                table: targetTable,
                fieldName: field.name,
                defaultSchema: targetDefaultSchema,
            });
            const newFieldId = fieldsIdMapping.get(fieldKey);
            if (newFieldId) {
                targetFieldIdMapping.set(field.id, newFieldId);
            }
        });

        targetTable.indexes.forEach((index) => {
            const indexKey = createIndexKey({
                table: targetTable,
                indexName: index.name,
                defaultSchema: targetDefaultSchema,
            });
            const newIndexId = indexesIdMapping.get(indexKey);
            if (newIndexId) {
                targetIndexIdMapping.set(index.id, newIndexId);
            }
        });
    });

    targetDiagram.relationships?.forEach((relationship) => {
        const relationshipKey = createRelationshipKey({
            relationshipName: relationship.name,
            defaultSchema: targetDefaultSchema,
        });
        const newId = relationshipsIdMapping.get(relationshipKey);
        if (newId) {
            targetRelationshipIdMapping.set(relationship.id, newId);
        }
    });

    targetDiagram.dependencies?.forEach((dependency) => {
        const table = targetDiagram.tables?.find(
            (t) => t.id === dependency.tableId
        );
        const dependentTable = targetDiagram.tables?.find(
            (t) => t.id === dependency.dependentTableId
        );

        if (!table || !dependentTable) return;

        const dependencyKey = createDependencyKey({
            table,
            dependentTable,
            defaultSchema: targetDefaultSchema,
        });

        const newId = dependenciesIdMapping.get(dependencyKey);
        if (newId) {
            targetDependencyIdMapping.set(dependency.id, newId);
        }
    });

    targetDiagram.customTypes?.forEach((customType) => {
        const customTypeKey = createCustomTypeKey({
            customType,
            defaultSchema: targetDefaultSchema,
        });
        const newId = customTypesIdMapping.get(customTypeKey);
        if (newId) {
            targetCustomTypeIdMapping.set(customType.id, newId);
        }
    });

    // Apply the ID mappings to create the final diagram
    const result: Diagram = {
        ...targetDiagram,
        tables: targetDiagram.tables?.map((table) => {
            const newTableId = targetTableIdMapping.get(table.id) ?? table.id;

            return {
                ...table,
                id: newTableId,
                fields: table.fields.map((field) => {
                    const newFieldId =
                        targetFieldIdMapping.get(field.id) ?? field.id;
                    return {
                        ...field,
                        id: newFieldId,
                    };
                }),
                indexes: table.indexes.map((index) => {
                    const newIndexId =
                        targetIndexIdMapping.get(index.id) ?? index.id;

                    // Update field IDs in index
                    const updatedFieldIds = index.fieldIds.map((fieldId) => {
                        return targetFieldIdMapping.get(fieldId) ?? fieldId;
                    });

                    return {
                        ...index,
                        id: newIndexId,
                        fieldIds: updatedFieldIds,
                    };
                }),
            };
        }),
        relationships: targetDiagram.relationships?.map((relationship) => {
            const newRelationshipId =
                targetRelationshipIdMapping.get(relationship.id) ??
                relationship.id;

            // Update table and field IDs in relationships
            const newSourceTableId =
                targetTableIdMapping.get(relationship.sourceTableId) ??
                relationship.sourceTableId;
            const newTargetTableId =
                targetTableIdMapping.get(relationship.targetTableId) ??
                relationship.targetTableId;
            const newSourceFieldId =
                targetFieldIdMapping.get(relationship.sourceFieldId) ??
                relationship.sourceFieldId;
            const newTargetFieldId =
                targetFieldIdMapping.get(relationship.targetFieldId) ??
                relationship.targetFieldId;

            return {
                ...relationship,
                id: newRelationshipId,
                sourceTableId: newSourceTableId,
                targetTableId: newTargetTableId,
                sourceFieldId: newSourceFieldId,
                targetFieldId: newTargetFieldId,
            };
        }),
        dependencies: targetDiagram.dependencies?.map((dependency) => {
            const newDependencyId =
                targetDependencyIdMapping.get(dependency.id) ?? dependency.id;
            const newTableId =
                targetTableIdMapping.get(dependency.tableId) ??
                dependency.tableId;
            const newDependentTableId =
                targetTableIdMapping.get(dependency.dependentTableId) ??
                dependency.dependentTableId;

            return {
                ...dependency,
                id: newDependencyId,
                tableId: newTableId,
                dependentTableId: newDependentTableId,
            };
        }),
        customTypes: targetDiagram.customTypes?.map((customType) => {
            const newCustomTypeId =
                targetCustomTypeIdMapping.get(customType.id) ?? customType.id;

            return {
                ...customType,
                id: newCustomTypeId,
            };
        }),
    };

    return result;
};
