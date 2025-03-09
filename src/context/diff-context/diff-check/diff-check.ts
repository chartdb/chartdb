import type { Diagram } from '@/lib/domain/diagram';
import type {
    ChartDBDiff,
    DiffMap,
    DiffObject,
    FieldDiffAttribute,
} from '../types';
import type { DBField } from '@/lib/domain/db-field';
import type { DBIndex } from '@/lib/domain/db-index';

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
}): DiffMap {
    const newDiffs = new Map<string, ChartDBDiff>();

    // Compare tables
    compareTables({ diagram, newDiagram, diffMap: newDiffs });

    // Compare fields and indexes for matching tables
    compareTableContents({ diagram, newDiagram, diffMap: newDiffs });

    // Compare relationships
    compareRelationships({ diagram, newDiagram, diffMap: newDiffs });

    return newDiffs;
}

// Compare tables between diagrams
function compareTables({
    diagram,
    newDiagram,
    diffMap,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
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
                    tableId: newTable.id,
                }
            );
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
        }
    }

    // Check for table name and comments changes
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
                    attributes: 'name',
                    newValue: newTable.name,
                    oldValue: oldTable.name,
                }
            );
        }

        if (oldTable.comments !== newTable.comments) {
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
                    attributes: 'comments',
                    newValue: newTable.comments,
                    oldValue: oldTable.comments,
                }
            );
        }
    }
}

// Compare fields and indexes for matching tables
function compareTableContents({
    diagram,
    newDiagram,
    diffMap,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
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
        });

        // Compare indexes
        compareIndexes({
            tableId: oldTable.id,
            oldIndexes: oldTable.indexes,
            newIndexes: newTable.indexes,
            diffMap,
        });
    }
}

// Compare fields between tables
function compareFields({
    tableId,
    oldFields,
    newFields,
    diffMap,
}: {
    tableId: string;
    oldFields: DBField[];
    newFields: DBField[];
    diffMap: DiffMap;
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
                    fieldId: newField.id,
                    tableId,
                }
            );
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
        }
    }

    // Check for field changes
    for (const oldField of oldFields) {
        const newField = newFields.find((f) => f.id === oldField.id);
        if (!newField) continue;

        // Compare basic field properties
        compareFieldProperties({ tableId, oldField, newField, diffMap });
    }
}

// Compare field properties
function compareFieldProperties({
    tableId,
    oldField,
    newField,
    diffMap,
}: {
    tableId: string;
    oldField: DBField;
    newField: DBField;
    diffMap: DiffMap;
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

    if (oldField.comments !== newField.comments) {
        changedAttributes.push('comments');
    }

    if (changedAttributes.length > 0) {
        for (const attribute of changedAttributes) {
            diffMap.set(
                getDiffMapKey({
                    diffObject: 'field',
                    objectId: oldField.id,
                    attribute: attribute,
                }),
                {
                    object: 'field',
                    type: 'changed',
                    fieldId: oldField.id,
                    tableId,
                    attributes: attribute,
                    oldValue: oldField[attribute],
                    newValue: newField[attribute],
                }
            );
        }
    }
}

// Compare indexes between tables
function compareIndexes({
    tableId,
    oldIndexes,
    newIndexes,
    diffMap,
}: {
    tableId: string;
    oldIndexes: DBIndex[];
    newIndexes: DBIndex[];
    diffMap: DiffMap;
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
                    indexId: newIndex.id,
                    tableId,
                }
            );
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
                    relationshipId: newRelationship.id,
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
