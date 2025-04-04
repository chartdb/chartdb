import type { Diagram } from '@/lib/domain/diagram';
import type { DBField } from '@/lib/domain/db-field';
import type { DBIndex } from '@/lib/domain/db-index';
import type { ChartDBDiff, DiffMap, DiffObject } from '@/lib/domain/diff/diff';
import type { FieldDiffAttribute } from '@/lib/domain/diff/field-diff';

export function getDiffMapKey({
    diffObject,
    objectId,
    attribute,
}: {
    diffObject: DiffObject;
    objectId: string;
    attribute?: string;
}): string {
    return attribute
        ? `${diffObject}-${attribute}-${objectId}`
        : `${diffObject}-${objectId}`;
}

export function generateDiff({
    diagram,
    newDiagram,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
}): {
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    changedFields: Map<string, boolean>;
} {
    const newDiffs = new Map<string, ChartDBDiff>();
    const changedTables = new Map<string, boolean>();
    const changedFields = new Map<string, boolean>();

    // Compare tables
    compareTables({ diagram, newDiagram, diffMap: newDiffs, changedTables });

    // Compare fields and indexes for matching tables
    compareTableContents({
        diagram,
        newDiagram,
        diffMap: newDiffs,
        changedTables,
        changedFields,
    });

    // Compare relationships
    compareRelationships({ diagram, newDiagram, diffMap: newDiffs });

    return { diffMap: newDiffs, changedTables, changedFields };
}

// Compare tables between diagrams
function compareTables({
    diagram,
    newDiagram,
    diffMap,
    changedTables,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
}) {
    const oldTables = diagram.tables || [];
    const newTables = newDiagram.tables || [];

    // Check for added tables
    for (const newTable of newTables) {
        if (!oldTables.find((t) => t.id === newTable.id)) {
            diffMap.set(
                getDiffMapKey({ diffObject: 'table', objectId: newTable.id }),
                {
                    object: 'table',
                    type: 'added',
                    tableAdded: newTable,
                }
            );
            changedTables.set(newTable.id, true);
        }
    }

    // Check for removed tables
    for (const oldTable of oldTables) {
        if (!newTables.find((t) => t.id === oldTable.id)) {
            diffMap.set(
                getDiffMapKey({ diffObject: 'table', objectId: oldTable.id }),
                {
                    object: 'table',
                    type: 'removed',
                    tableId: oldTable.id,
                }
            );
            changedTables.set(oldTable.id, true);
        }
    }

    // Check for table name, comments and color changes
    for (const oldTable of oldTables) {
        const newTable = newTables.find((t) => t.id === oldTable.id);

        if (!newTable) continue;

        if (oldTable.name !== newTable.name) {
            diffMap.set(
                getDiffMapKey({
                    diffObject: 'table',
                    objectId: oldTable.id,
                    attribute: 'name',
                }),
                {
                    object: 'table',
                    type: 'changed',
                    tableId: oldTable.id,
                    attribute: 'name',
                    newValue: newTable.name,
                    oldValue: oldTable.name,
                }
            );

            changedTables.set(oldTable.id, true);
        }

        if (
            (oldTable.comments || newTable.comments) &&
            oldTable.comments !== newTable.comments
        ) {
            diffMap.set(
                getDiffMapKey({
                    diffObject: 'table',
                    objectId: oldTable.id,
                    attribute: 'comments',
                }),
                {
                    object: 'table',
                    type: 'changed',
                    tableId: oldTable.id,
                    attribute: 'comments',
                    newValue: newTable.comments,
                    oldValue: oldTable.comments,
                }
            );

            changedTables.set(oldTable.id, true);
        }

        if (oldTable.color !== newTable.color) {
            diffMap.set(
                getDiffMapKey({
                    diffObject: 'table',
                    objectId: oldTable.id,
                    attribute: 'color',
                }),
                {
                    object: 'table',
                    type: 'changed',
                    tableId: oldTable.id,
                    attribute: 'color',
                    newValue: newTable.color,
                    oldValue: oldTable.color,
                }
            );

            changedTables.set(oldTable.id, true);
        }
    }
}

// Compare fields and indexes for matching tables
function compareTableContents({
    diagram,
    newDiagram,
    diffMap,
    changedTables,
    changedFields,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    changedFields: Map<string, boolean>;
}) {
    const oldTables = diagram.tables || [];
    const newTables = newDiagram.tables || [];

    // For each table that exists in both diagrams
    for (const oldTable of oldTables) {
        const newTable = newTables.find((t) => t.id === oldTable.id);
        if (!newTable) continue;

        // Compare fields
        compareFields({
            tableId: oldTable.id,
            oldFields: oldTable.fields,
            newFields: newTable.fields,
            diffMap,
            changedTables,
            changedFields,
        });

        // Compare indexes
        compareIndexes({
            tableId: oldTable.id,
            oldIndexes: oldTable.indexes,
            newIndexes: newTable.indexes,
            diffMap,
            changedTables,
        });
    }
}

// Compare fields between tables
function compareFields({
    tableId,
    oldFields,
    newFields,
    diffMap,
    changedTables,
    changedFields,
}: {
    tableId: string;
    oldFields: DBField[];
    newFields: DBField[];
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    changedFields: Map<string, boolean>;
}) {
    // Check for added fields
    for (const newField of newFields) {
        if (!oldFields.find((f) => f.id === newField.id)) {
            diffMap.set(
                getDiffMapKey({
                    diffObject: 'field',
                    objectId: newField.id,
                }),
                {
                    object: 'field',
                    type: 'added',
                    newField,
                    tableId,
                }
            );
            changedTables.set(tableId, true);
            changedFields.set(newField.id, true);
        }
    }

    // Check for removed fields
    for (const oldField of oldFields) {
        if (!newFields.find((f) => f.id === oldField.id)) {
            diffMap.set(
                getDiffMapKey({
                    diffObject: 'field',
                    objectId: oldField.id,
                }),
                {
                    object: 'field',
                    type: 'removed',
                    fieldId: oldField.id,
                    tableId,
                }
            );

            changedTables.set(tableId, true);
            changedFields.set(oldField.id, true);
        }
    }

    // Check for field changes
    for (const oldField of oldFields) {
        const newField = newFields.find((f) => f.id === oldField.id);
        if (!newField) continue;

        // Compare basic field properties
        compareFieldProperties({
            tableId,
            oldField,
            newField,
            diffMap,
            changedTables,
            changedFields,
        });
    }
}

// Compare field properties
function compareFieldProperties({
    tableId,
    oldField,
    newField,
    diffMap,
    changedTables,
    changedFields,
}: {
    tableId: string;
    oldField: DBField;
    newField: DBField;
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    changedFields: Map<string, boolean>;
}) {
    const changedAttributes: FieldDiffAttribute[] = [];

    if (oldField.name !== newField.name) {
        changedAttributes.push('name');
    }

    if (oldField.type.id !== newField.type.id) {
        changedAttributes.push('type');
    }

    if (oldField.primaryKey !== newField.primaryKey) {
        changedAttributes.push('primaryKey');
    }

    if (oldField.unique !== newField.unique) {
        changedAttributes.push('unique');
    }

    if (oldField.nullable !== newField.nullable) {
        changedAttributes.push('nullable');
    }

    if (
        (newField.comments || oldField.comments) &&
        oldField.comments !== newField.comments
    ) {
        changedAttributes.push('comments');
    }

    if (changedAttributes.length > 0) {
        for (const attribute of changedAttributes) {
            diffMap.set(
                getDiffMapKey({
                    diffObject: 'field',
                    objectId: oldField.id,
                    attribute,
                }),
                {
                    object: 'field',
                    type: 'changed',
                    fieldId: oldField.id,
                    tableId,
                    attribute,
                    oldValue: oldField[attribute] ?? '',
                    newValue: newField[attribute] ?? '',
                }
            );
        }
        changedTables.set(tableId, true);
        changedFields.set(oldField.id, true);
    }
}

// Compare indexes between tables
function compareIndexes({
    tableId,
    oldIndexes,
    newIndexes,
    diffMap,
    changedTables,
}: {
    tableId: string;
    oldIndexes: DBIndex[];
    newIndexes: DBIndex[];
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
}) {
    // Check for added indexes
    for (const newIndex of newIndexes) {
        if (!oldIndexes.find((i) => i.id === newIndex.id)) {
            diffMap.set(
                getDiffMapKey({
                    diffObject: 'index',
                    objectId: newIndex.id,
                }),
                {
                    object: 'index',
                    type: 'added',
                    newIndex,
                    tableId,
                }
            );
            changedTables.set(tableId, true);
        }
    }

    // Check for removed indexes
    for (const oldIndex of oldIndexes) {
        if (!newIndexes.find((i) => i.id === oldIndex.id)) {
            diffMap.set(
                getDiffMapKey({
                    diffObject: 'index',
                    objectId: oldIndex.id,
                }),
                {
                    object: 'index',
                    type: 'removed',
                    indexId: oldIndex.id,
                    tableId,
                }
            );
            changedTables.set(tableId, true);
        }
    }
}

// Compare relationships between diagrams
function compareRelationships({
    diagram,
    newDiagram,
    diffMap,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
}) {
    const oldRelationships = diagram.relationships || [];
    const newRelationships = newDiagram.relationships || [];

    // Check for added relationships
    for (const newRelationship of newRelationships) {
        if (!oldRelationships.find((r) => r.id === newRelationship.id)) {
            diffMap.set(
                getDiffMapKey({
                    diffObject: 'relationship',
                    objectId: newRelationship.id,
                }),
                {
                    object: 'relationship',
                    type: 'added',
                    newRelationship,
                }
            );
        }
    }

    // Check for removed relationships
    for (const oldRelationship of oldRelationships) {
        if (!newRelationships.find((r) => r.id === oldRelationship.id)) {
            diffMap.set(
                getDiffMapKey({
                    diffObject: 'relationship',
                    objectId: oldRelationship.id,
                }),
                {
                    object: 'relationship',
                    type: 'removed',
                    relationshipId: oldRelationship.id,
                }
            );
        }
    }
}
