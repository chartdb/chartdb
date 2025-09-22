import type { Diagram } from '@/lib/domain/diagram';
import type { DBField } from '@/lib/domain/db-field';
import type { DBIndex } from '@/lib/domain/db-index';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { Area } from '@/lib/domain/area';
import type { ChartDBDiff, DiffMap, DiffObject } from '@/lib/domain/diff/diff';
import type {
    FieldDiff,
    FieldDiffAttribute,
} from '@/lib/domain/diff/field-diff';
import type { TableDiff, TableDiffAttribute } from '../table-diff';
import type { AreaDiff, AreaDiffAttribute } from '../area-diff';
import type { IndexDiff } from '../index-diff';
import type { RelationshipDiff } from '../relationship-diff';

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

export interface GenerateDiffOptions {
    includeTables?: boolean;
    includeFields?: boolean;
    includeIndexes?: boolean;
    includeRelationships?: boolean;
    includeAreas?: boolean;
    attributes?: {
        tables?: TableDiffAttribute[];
        fields?: FieldDiffAttribute[];
        areas?: AreaDiffAttribute[];
    };
    changeTypes?: {
        tables?: TableDiff['type'][];
        fields?: FieldDiff['type'][];
        indexes?: IndexDiff['type'][];
        relationships?: RelationshipDiff['type'][];
        areas?: AreaDiff['type'][];
    };
    matchers?: {
        table?: (table: DBTable, tables: DBTable[]) => DBTable | undefined;
        field?: (field: DBField, fields: DBField[]) => DBField | undefined;
        index?: (index: DBIndex, indexes: DBIndex[]) => DBIndex | undefined;
        relationship?: (
            relationship: DBRelationship,
            relationships: DBRelationship[]
        ) => DBRelationship | undefined;
        area?: (area: Area, areas: Area[]) => Area | undefined;
    };
}

export function generateDiff({
    diagram,
    newDiagram,
    options = {},
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    options?: GenerateDiffOptions;
}): {
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    changedFields: Map<string, boolean>;
    changedAreas: Map<string, boolean>;
} {
    // Merge with default options
    const mergedOptions: GenerateDiffOptions = {
        includeTables: options.includeTables ?? true,
        includeFields: options.includeFields ?? true,
        includeIndexes: options.includeIndexes ?? true,
        includeRelationships: options.includeRelationships ?? true,
        includeAreas: options.includeAreas ?? false,
        attributes: options.attributes ?? {},
        changeTypes: options.changeTypes ?? {},
        matchers: options.matchers ?? {},
    };

    const newDiffs = new Map<string, ChartDBDiff>();
    const changedTables = new Map<string, boolean>();
    const changedFields = new Map<string, boolean>();
    const changedAreas = new Map<string, boolean>();

    // Use provided matchers or default ones
    const tableMatcher = mergedOptions.matchers?.table ?? defaultTableMatcher;
    const fieldMatcher = mergedOptions.matchers?.field ?? defaultFieldMatcher;
    const indexMatcher = mergedOptions.matchers?.index ?? defaultIndexMatcher;
    const relationshipMatcher =
        mergedOptions.matchers?.relationship ?? defaultRelationshipMatcher;
    const areaMatcher = mergedOptions.matchers?.area ?? defaultAreaMatcher;

    // Compare tables
    if (mergedOptions.includeTables) {
        compareTables({
            diagram,
            newDiagram,
            diffMap: newDiffs,
            changedTables,
            attributes: mergedOptions.attributes?.tables,
            changeTypes: mergedOptions.changeTypes?.tables,
            tableMatcher,
        });
    }

    // Compare fields and indexes for matching tables
    compareTableContents({
        diagram,
        newDiagram,
        diffMap: newDiffs,
        changedTables,
        changedFields,
        options: mergedOptions,
        tableMatcher,
        fieldMatcher,
        indexMatcher,
    });

    // Compare relationships
    if (mergedOptions.includeRelationships) {
        compareRelationships({
            diagram,
            newDiagram,
            diffMap: newDiffs,
            changeTypes: mergedOptions.changeTypes?.relationships,
            relationshipMatcher,
        });
    }

    // Compare areas if enabled
    if (mergedOptions.includeAreas) {
        compareAreas({
            diagram,
            newDiagram,
            diffMap: newDiffs,
            changedAreas,
            attributes: mergedOptions.attributes?.areas,
            changeTypes: mergedOptions.changeTypes?.areas,
            areaMatcher,
        });
    }

    return { diffMap: newDiffs, changedTables, changedFields, changedAreas };
}

// Compare tables between diagrams
function compareTables({
    diagram,
    newDiagram,
    diffMap,
    changedTables,
    attributes,
    changeTypes,
    tableMatcher,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    attributes?: TableDiffAttribute[];
    changeTypes?: TableDiff['type'][];
    tableMatcher: (table: DBTable, tables: DBTable[]) => DBTable | undefined;
}) {
    const oldTables = diagram.tables || [];
    const newTables = newDiagram.tables || [];

    // If changeTypes is empty array, don't check any changes
    if (changeTypes && changeTypes.length === 0) {
        return;
    }

    // If changeTypes is undefined, check all types
    const typesToCheck = changeTypes ?? ['added', 'removed', 'changed'];

    // Check for added tables
    if (typesToCheck.includes('added')) {
        for (const newTable of newTables) {
            if (!tableMatcher(newTable, oldTables)) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'table',
                        objectId: newTable.id,
                    }),
                    {
                        object: 'table',
                        type: 'added',
                        tableAdded: newTable,
                    }
                );
                changedTables.set(newTable.id, true);
            }
        }
    }

    // Check for removed tables
    if (typesToCheck.includes('removed')) {
        for (const oldTable of oldTables) {
            if (!tableMatcher(oldTable, newTables)) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'table',
                        objectId: oldTable.id,
                    }),
                    {
                        object: 'table',
                        type: 'removed',
                        tableId: oldTable.id,
                    }
                );
                changedTables.set(oldTable.id, true);
            }
        }
    }

    // Check for table name, comments and color changes
    if (typesToCheck.includes('changed')) {
        for (const oldTable of oldTables) {
            const newTable = tableMatcher(oldTable, newTables);

            if (!newTable) continue;

            // If attributes are specified, only check those attributes
            const attributesToCheck: TableDiffAttribute[] = attributes ?? [
                'name',
                'comments',
                'color',
            ];

            if (
                attributesToCheck.includes('name') &&
                oldTable.name !== newTable.name
            ) {
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
                attributesToCheck.includes('comments') &&
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

            if (
                attributesToCheck.includes('color') &&
                oldTable.color !== newTable.color
            ) {
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

            if (attributesToCheck.includes('x') && oldTable.x !== newTable.x) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'table',
                        objectId: oldTable.id,
                        attribute: 'x',
                    }),
                    {
                        object: 'table',
                        type: 'changed',
                        tableId: oldTable.id,
                        attribute: 'x',
                        newValue: newTable.x,
                        oldValue: oldTable.x,
                    }
                );

                changedTables.set(oldTable.id, true);
            }

            if (attributesToCheck.includes('y') && oldTable.y !== newTable.y) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'table',
                        objectId: oldTable.id,
                        attribute: 'y',
                    }),
                    {
                        object: 'table',
                        type: 'changed',
                        tableId: oldTable.id,
                        attribute: 'y',
                        newValue: newTable.y,
                        oldValue: oldTable.y,
                    }
                );

                changedTables.set(oldTable.id, true);
            }

            if (
                attributesToCheck.includes('width') &&
                oldTable.width !== newTable.width
            ) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'table',
                        objectId: oldTable.id,
                        attribute: 'width',
                    }),
                    {
                        object: 'table',
                        type: 'changed',
                        tableId: oldTable.id,
                        attribute: 'width',
                        newValue: newTable.width,
                        oldValue: oldTable.width,
                    }
                );

                changedTables.set(oldTable.id, true);
            }
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
    options,
    tableMatcher,
    fieldMatcher,
    indexMatcher,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    changedFields: Map<string, boolean>;
    options?: GenerateDiffOptions;
    tableMatcher: (table: DBTable, tables: DBTable[]) => DBTable | undefined;
    fieldMatcher: (field: DBField, fields: DBField[]) => DBField | undefined;
    indexMatcher: (index: DBIndex, indexes: DBIndex[]) => DBIndex | undefined;
}) {
    const oldTables = diagram.tables || [];
    const newTables = newDiagram.tables || [];

    // For each table that exists in both diagrams
    for (const oldTable of oldTables) {
        const newTable = tableMatcher(oldTable, newTables);
        if (!newTable) continue;

        // Compare fields
        if (options?.includeFields) {
            compareFields({
                tableId: oldTable.id,
                oldFields: oldTable.fields,
                newFields: newTable.fields,
                diffMap,
                changedTables,
                changedFields,
                attributes: options?.attributes?.fields,
                changeTypes: options?.changeTypes?.fields,
                fieldMatcher,
            });
        }

        // Compare indexes
        if (options?.includeIndexes) {
            compareIndexes({
                tableId: oldTable.id,
                oldIndexes: oldTable.indexes,
                newIndexes: newTable.indexes,
                diffMap,
                changedTables,
                changeTypes: options?.changeTypes?.indexes,
                indexMatcher,
            });
        }
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
    attributes,
    changeTypes,
    fieldMatcher,
}: {
    tableId: string;
    oldFields: DBField[];
    newFields: DBField[];
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    changedFields: Map<string, boolean>;
    attributes?: FieldDiffAttribute[];
    changeTypes?: FieldDiff['type'][];
    fieldMatcher: (field: DBField, fields: DBField[]) => DBField | undefined;
}) {
    // If changeTypes is empty array, don't check any changes
    if (changeTypes && changeTypes.length === 0) {
        return;
    }

    // If changeTypes is undefined, check all types
    const typesToCheck = changeTypes ?? ['added', 'removed', 'changed'];
    // Check for added fields
    if (typesToCheck.includes('added')) {
        for (const newField of newFields) {
            if (!fieldMatcher(newField, oldFields)) {
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
    }

    // Check for removed fields
    if (typesToCheck.includes('removed')) {
        for (const oldField of oldFields) {
            if (!fieldMatcher(oldField, newFields)) {
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
    }

    // Check for field changes
    if (typesToCheck.includes('changed')) {
        for (const oldField of oldFields) {
            const newField = fieldMatcher(oldField, newFields);
            if (!newField) continue;

            // Compare basic field properties
            compareFieldProperties({
                tableId,
                oldField,
                newField,
                diffMap,
                changedTables,
                changedFields,
                attributes,
            });
        }
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
    attributes,
}: {
    tableId: string;
    oldField: DBField;
    newField: DBField;
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    changedFields: Map<string, boolean>;
    attributes?: FieldDiffAttribute[];
}) {
    // If attributes are specified, only check those attributes
    const attributesToCheck: FieldDiffAttribute[] = attributes ?? [
        'name',
        'type',
        'primaryKey',
        'unique',
        'nullable',
        'comments',
        'characterMaximumLength',
        'scale',
        'precision',
    ];

    const changedAttributes: FieldDiffAttribute[] = [];

    if (attributesToCheck.includes('name') && oldField.name !== newField.name) {
        changedAttributes.push('name');
    }

    if (
        attributesToCheck.includes('type') &&
        oldField.type.id !== newField.type.id
    ) {
        changedAttributes.push('type');
    }

    if (
        attributesToCheck.includes('primaryKey') &&
        oldField.primaryKey !== newField.primaryKey
    ) {
        changedAttributes.push('primaryKey');
    }

    if (
        attributesToCheck.includes('unique') &&
        oldField.unique !== newField.unique
    ) {
        changedAttributes.push('unique');
    }

    if (
        attributesToCheck.includes('nullable') &&
        oldField.nullable !== newField.nullable
    ) {
        changedAttributes.push('nullable');
    }

    if (
        attributesToCheck.includes('comments') &&
        (newField.comments || oldField.comments) &&
        oldField.comments !== newField.comments
    ) {
        changedAttributes.push('comments');
    }

    if (
        attributesToCheck.includes('characterMaximumLength') &&
        (newField.characterMaximumLength || oldField.characterMaximumLength) &&
        oldField.characterMaximumLength !== newField.characterMaximumLength
    ) {
        changedAttributes.push('characterMaximumLength');
    }

    if (
        attributesToCheck.includes('scale') &&
        (newField.scale || oldField.scale) &&
        oldField.scale !== newField.scale
    ) {
        changedAttributes.push('scale');
    }

    if (
        attributesToCheck.includes('precision') &&
        (newField.precision || oldField.precision) &&
        oldField.precision !== newField.precision
    ) {
        changedAttributes.push('precision');
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
    changeTypes,
    indexMatcher,
}: {
    tableId: string;
    oldIndexes: DBIndex[];
    newIndexes: DBIndex[];
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    changeTypes?: IndexDiff['type'][];
    indexMatcher: (index: DBIndex, indexes: DBIndex[]) => DBIndex | undefined;
}) {
    // If changeTypes is empty array, don't check any changes
    if (changeTypes && changeTypes.length === 0) {
        return;
    }

    // If changeTypes is undefined, check all types
    const typesToCheck = changeTypes ?? ['added', 'removed'];
    // Check for added indexes
    if (typesToCheck.includes('added')) {
        for (const newIndex of newIndexes) {
            if (!indexMatcher(newIndex, oldIndexes)) {
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
    }

    // Check for removed indexes
    if (typesToCheck.includes('removed')) {
        for (const oldIndex of oldIndexes) {
            if (!indexMatcher(oldIndex, newIndexes)) {
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
}

// Compare relationships between diagrams
function compareRelationships({
    diagram,
    newDiagram,
    diffMap,
    changeTypes,
    relationshipMatcher,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
    changeTypes?: RelationshipDiff['type'][];
    relationshipMatcher: (
        relationship: DBRelationship,
        relationships: DBRelationship[]
    ) => DBRelationship | undefined;
}) {
    // If changeTypes is empty array, don't check any changes
    if (changeTypes && changeTypes.length === 0) {
        return;
    }

    // If changeTypes is undefined, check all types
    const typesToCheck = changeTypes ?? ['added', 'removed'];
    const oldRelationships = diagram.relationships || [];
    const newRelationships = newDiagram.relationships || [];

    // Check for added relationships
    if (typesToCheck.includes('added')) {
        for (const newRelationship of newRelationships) {
            if (!relationshipMatcher(newRelationship, oldRelationships)) {
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
    }

    // Check for removed relationships
    if (typesToCheck.includes('removed')) {
        for (const oldRelationship of oldRelationships) {
            if (!relationshipMatcher(oldRelationship, newRelationships)) {
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
}

// Compare areas between diagrams
function compareAreas({
    diagram,
    newDiagram,
    diffMap,
    changedAreas,
    attributes,
    changeTypes,
    areaMatcher,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
    changedAreas: Map<string, boolean>;
    attributes?: AreaDiffAttribute[];
    changeTypes?: AreaDiff['type'][];
    areaMatcher: (area: Area, areas: Area[]) => Area | undefined;
}) {
    const oldAreas = diagram.areas || [];
    const newAreas = newDiagram.areas || [];

    // If changeTypes is empty array, don't check any changes
    if (changeTypes && changeTypes.length === 0) {
        return;
    }

    // If changeTypes is undefined, check all types
    const typesToCheck = changeTypes ?? ['added', 'removed', 'changed'];

    // Check for added areas
    if (typesToCheck.includes('added')) {
        for (const newArea of newAreas) {
            if (!areaMatcher(newArea, oldAreas)) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'area',
                        objectId: newArea.id,
                    }),
                    {
                        object: 'area',
                        type: 'added',
                        areaAdded: newArea,
                    }
                );
                changedAreas.set(newArea.id, true);
            }
        }
    }

    // Check for removed areas
    if (typesToCheck.includes('removed')) {
        for (const oldArea of oldAreas) {
            if (!areaMatcher(oldArea, newAreas)) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'area',
                        objectId: oldArea.id,
                    }),
                    {
                        object: 'area',
                        type: 'removed',
                        areaId: oldArea.id,
                    }
                );
                changedAreas.set(oldArea.id, true);
            }
        }
    }

    // Check for area name and color changes
    if (typesToCheck.includes('changed')) {
        for (const oldArea of oldAreas) {
            const newArea = areaMatcher(oldArea, newAreas);

            if (!newArea) continue;

            // If attributes are specified, only check those attributes
            const attributesToCheck: AreaDiffAttribute[] = attributes ?? [
                'name',
                'color',
            ];

            if (
                attributesToCheck.includes('name') &&
                oldArea.name !== newArea.name
            ) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'area',
                        objectId: oldArea.id,
                        attribute: 'name',
                    }),
                    {
                        object: 'area',
                        type: 'changed',
                        areaId: oldArea.id,
                        attribute: 'name',
                        newValue: newArea.name,
                        oldValue: oldArea.name,
                    }
                );
                changedAreas.set(oldArea.id, true);
            }

            if (
                attributesToCheck.includes('color') &&
                oldArea.color !== newArea.color
            ) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'area',
                        objectId: oldArea.id,
                        attribute: 'color',
                    }),
                    {
                        object: 'area',
                        type: 'changed',
                        areaId: oldArea.id,
                        attribute: 'color',
                        newValue: newArea.color,
                        oldValue: oldArea.color,
                    }
                );
                changedAreas.set(oldArea.id, true);
            }

            if (attributesToCheck.includes('x') && oldArea.x !== newArea.x) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'area',
                        objectId: oldArea.id,
                        attribute: 'x',
                    }),
                    {
                        object: 'area',
                        type: 'changed',
                        areaId: oldArea.id,
                        attribute: 'x',
                        newValue: newArea.x,
                        oldValue: oldArea.x,
                    }
                );
                changedAreas.set(oldArea.id, true);
            }

            if (attributesToCheck.includes('y') && oldArea.y !== newArea.y) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'area',
                        objectId: oldArea.id,
                        attribute: 'y',
                    }),
                    {
                        object: 'area',
                        type: 'changed',
                        areaId: oldArea.id,
                        attribute: 'y',
                        newValue: newArea.y,
                        oldValue: oldArea.y,
                    }
                );
                changedAreas.set(oldArea.id, true);
            }

            if (
                attributesToCheck.includes('width') &&
                oldArea.width !== newArea.width
            ) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'area',
                        objectId: oldArea.id,
                        attribute: 'width',
                    }),
                    {
                        object: 'area',
                        type: 'changed',
                        areaId: oldArea.id,
                        attribute: 'width',
                        newValue: newArea.width,
                        oldValue: oldArea.width,
                    }
                );
                changedAreas.set(oldArea.id, true);
            }

            if (
                attributesToCheck.includes('height') &&
                oldArea.height !== newArea.height
            ) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'area',
                        objectId: oldArea.id,
                        attribute: 'height',
                    }),
                    {
                        object: 'area',
                        type: 'changed',
                        areaId: oldArea.id,
                        attribute: 'height',
                        newValue: newArea.height,
                        oldValue: oldArea.height,
                    }
                );
                changedAreas.set(oldArea.id, true);
            }
        }
    }
}

const defaultTableMatcher = (
    table: DBTable,
    tables: DBTable[]
): DBTable | undefined => {
    return tables.find((t) => t.id === table.id);
};

const defaultFieldMatcher = (
    field: DBField,
    fields: DBField[]
): DBField | undefined => {
    return fields.find((f) => f.id === field.id);
};

const defaultIndexMatcher = (
    index: DBIndex,
    indexes: DBIndex[]
): DBIndex | undefined => {
    return indexes.find((i) => i.id === index.id);
};

const defaultRelationshipMatcher = (
    relationship: DBRelationship,
    relationships: DBRelationship[]
): DBRelationship | undefined => {
    return relationships.find((r) => r.id === relationship.id);
};

const defaultAreaMatcher = (area: Area, areas: Area[]): Area | undefined => {
    return areas.find((a) => a.id === area.id);
};
