import type { Diagram } from '@/lib/domain/diagram';
import type { DBField } from '@/lib/domain/db-field';
import {
    defaultIndexTypeForDatabase,
    type DBIndex,
} from '@/lib/domain/db-index';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { Area } from '@/lib/domain/area';
import type { Note } from '@/lib/domain/note';
import type { ChartDBDiff, DiffMap, DiffObject } from '@/lib/domain/diff/diff';
import type {
    FieldDiff,
    FieldDiffAttribute,
} from '@/lib/domain/diff/field-diff';
import type { TableDiff, TableDiffAttribute } from '../table-diff';
import type { AreaDiff, AreaDiffAttribute } from '../area-diff';
import type { NoteDiff, NoteDiffAttribute } from '../note-diff';
import type { IndexDiff, IndexDiffAttribute } from '../index-diff';
import type {
    RelationshipDiff,
    RelationshipDiffAttribute,
} from '../relationship-diff';
import { areBooleansEqual } from '@/lib/utils';
import type { DatabaseType } from '../../database-type';

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

const isOneOfDefined = (
    ...values: (string | number | boolean | undefined | null)[]
): boolean => {
    return values.some((value) => value !== undefined && value !== null);
};

const normalizeBoolean = (value: boolean | undefined | null): boolean => {
    return value === true;
};

/**
 * Normalizes a comment/content string for comparison purposes.
 * This handles cases where the same content differs only in whitespace formatting,
 * such as newlines vs spaces, multiple spaces, or different line break styles.
 *
 * Examples that will be considered equal:
 * - "| A | B" vs "| A\n| B"
 * - "hello  world" vs "hello world"
 * - "line1\r\nline2" vs "line1\nline2"
 */
const normalizeComment = (
    value: string | undefined | null
): string | undefined => {
    if (value === undefined || value === null) {
        return undefined;
    }
    // Replace all whitespace sequences (newlines, tabs, multiple spaces) with a single space
    // Then trim leading/trailing whitespace
    return value.replace(/\s+/g, ' ').trim();
};

/**
 * Compares two comment/content strings in a whitespace-insensitive manner.
 * Returns true if the comments are semantically different (i.e., a real change).
 */
const areCommentsDifferent = (
    oldComment: string | undefined | null,
    newComment: string | undefined | null
): boolean => {
    const normalizedOld = normalizeComment(oldComment);
    const normalizedNew = normalizeComment(newComment);

    // Both undefined/empty means equal
    if (!normalizedOld && !normalizedNew) {
        return false;
    }

    // One defined, one not means different
    if (!normalizedOld || !normalizedNew) {
        return true;
    }

    // Compare normalized versions
    return normalizedOld !== normalizedNew;
};

// Helper to determine if an attribute change should add to the changed map
// - undefined: always add (current behavior)
// - empty array: never add
// - array with values: only add if attribute is in the array
const shouldAddToChangedMap = <T>(
    attribute: T,
    changedAttributes?: T[]
): boolean => {
    if (changedAttributes === undefined) {
        return true;
    }
    if (changedAttributes.length === 0) {
        return false;
    }
    return changedAttributes.includes(attribute);
};

export interface GenerateDiffOptions {
    includeTables?: boolean;
    includeFields?: boolean;
    includeIndexes?: boolean;
    includeRelationships?: boolean;
    includeAreas?: boolean;
    includeNotes?: boolean;
    attributes?: {
        tables?: TableDiffAttribute[];
        fields?: FieldDiffAttribute[];
        indexes?: IndexDiffAttribute[];
        relationships?: RelationshipDiffAttribute[];
        areas?: AreaDiffAttribute[];
        notes?: NoteDiffAttribute[];
    };
    changedMaps?: {
        changedTablesAttributes?: TableDiffAttribute[];
        changedFieldsAttributes?: FieldDiffAttribute[];
        changedIndexesAttributes?: IndexDiffAttribute[];
        changedRelationshipsAttributes?: RelationshipDiffAttribute[];
        changedAreasAttributes?: AreaDiffAttribute[];
        changedNotesAttributes?: NoteDiffAttribute[];
    };
    changeTypes?: {
        tables?: TableDiff['type'][];
        fields?: FieldDiff['type'][];
        indexes?: IndexDiff['type'][];
        relationships?: RelationshipDiff['type'][];
        areas?: AreaDiff['type'][];
        notes?: NoteDiff['type'][];
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
        note?: (note: Note, notes: Note[]) => Note | undefined;
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
    changedIndexes: Map<string, boolean>;
    changedRelationships: Map<string, boolean>;
    changedAreas: Map<string, boolean>;
    changedNotes: Map<string, boolean>;
    relationshipIdMap: Map<string, string>;
} {
    // Merge with default options
    const mergedOptions: GenerateDiffOptions = {
        includeTables: options.includeTables ?? true,
        includeFields: options.includeFields ?? true,
        includeIndexes: options.includeIndexes ?? true,
        includeRelationships: options.includeRelationships ?? true,
        includeAreas: options.includeAreas ?? false,
        includeNotes: options.includeNotes ?? false,
        attributes: options.attributes ?? {},
        changedMaps: options.changedMaps,
        changeTypes: options.changeTypes ?? {},
        matchers: options.matchers ?? {},
    };

    const newDiffs = new Map<string, ChartDBDiff>();
    const changedTables = new Map<string, boolean>();
    const changedFields = new Map<string, boolean>();
    const changedIndexes = new Map<string, boolean>();
    const changedRelationships = new Map<string, boolean>();
    const changedAreas = new Map<string, boolean>();
    const changedNotes = new Map<string, boolean>();
    const relationshipIdMap = new Map<string, string>();

    // Use provided matchers or default ones
    const tableMatcher = mergedOptions.matchers?.table ?? defaultTableMatcher;
    const fieldMatcher = mergedOptions.matchers?.field ?? defaultFieldMatcher;
    const indexMatcher = mergedOptions.matchers?.index ?? defaultIndexMatcher;
    const relationshipMatcher =
        mergedOptions.matchers?.relationship ?? defaultRelationshipMatcher;
    const areaMatcher = mergedOptions.matchers?.area ?? defaultAreaMatcher;
    const noteMatcher = mergedOptions.matchers?.note ?? defaultNoteMatcher;

    // Compare tables
    if (mergedOptions.includeTables) {
        compareTables({
            diagram,
            newDiagram,
            diffMap: newDiffs,
            changedTables,
            attributes: mergedOptions.attributes?.tables,
            changedTablesAttributes:
                mergedOptions.changedMaps?.changedTablesAttributes,
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
        changedIndexes,
        options: mergedOptions,
        changedTablesAttributes:
            mergedOptions.changedMaps?.changedTablesAttributes,
        changedFieldsAttributes:
            mergedOptions.changedMaps?.changedFieldsAttributes,
        changedIndexesAttributes:
            mergedOptions.changedMaps?.changedIndexesAttributes,
        tableMatcher,
        fieldMatcher,
        indexMatcher,
        databaseType: diagram.databaseType,
    });

    // Compare relationships
    if (mergedOptions.includeRelationships) {
        compareRelationships({
            diagram,
            newDiagram,
            diffMap: newDiffs,
            changedRelationships,
            relationshipIdMap,
            attributes: mergedOptions.attributes?.relationships,
            changedRelationshipsAttributes:
                mergedOptions.changedMaps?.changedRelationshipsAttributes,
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
            changedAreasAttributes:
                mergedOptions.changedMaps?.changedAreasAttributes,
            changeTypes: mergedOptions.changeTypes?.areas,
            areaMatcher,
        });
    }

    // Compare notes if enabled
    if (mergedOptions.includeNotes) {
        compareNotes({
            diagram,
            newDiagram,
            diffMap: newDiffs,
            changedNotes,
            attributes: mergedOptions.attributes?.notes,
            changedNotesAttributes:
                mergedOptions.changedMaps?.changedNotesAttributes,
            changeTypes: mergedOptions.changeTypes?.notes,
            noteMatcher,
        });
    }

    return {
        diffMap: newDiffs,
        changedTables,
        changedFields,
        changedIndexes,
        changedRelationships,
        changedAreas,
        changedNotes,
        relationshipIdMap,
    };
}

// Compare tables between diagrams
function compareTables({
    diagram,
    newDiagram,
    diffMap,
    changedTables,
    attributes,
    changedTablesAttributes,
    changeTypes,
    tableMatcher,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    attributes?: TableDiffAttribute[];
    changedTablesAttributes?: TableDiffAttribute[];
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
                        newTableId: newTable.id,
                        attribute: 'name',
                        newValue: newTable.name,
                        oldValue: oldTable.name,
                    }
                );

                if (shouldAddToChangedMap('name', changedTablesAttributes)) {
                    changedTables.set(oldTable.id, true);
                }
            }

            if (
                attributesToCheck.includes('comments') &&
                areCommentsDifferent(oldTable.comments, newTable.comments)
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
                        newTableId: newTable.id,
                        attribute: 'comments',
                        newValue: newTable.comments,
                        oldValue: oldTable.comments,
                    }
                );

                if (
                    shouldAddToChangedMap('comments', changedTablesAttributes)
                ) {
                    changedTables.set(oldTable.id, true);
                }
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
                        newTableId: newTable.id,
                        attribute: 'color',
                        newValue: newTable.color,
                        oldValue: oldTable.color,
                    }
                );

                if (shouldAddToChangedMap('color', changedTablesAttributes)) {
                    changedTables.set(oldTable.id, true);
                }
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
                        newTableId: newTable.id,
                        attribute: 'x',
                        newValue: newTable.x,
                        oldValue: oldTable.x,
                    }
                );

                if (shouldAddToChangedMap('x', changedTablesAttributes)) {
                    changedTables.set(oldTable.id, true);
                }
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
                        newTableId: newTable.id,
                        attribute: 'y',
                        newValue: newTable.y,
                        oldValue: oldTable.y,
                    }
                );

                if (shouldAddToChangedMap('y', changedTablesAttributes)) {
                    changedTables.set(oldTable.id, true);
                }
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
                        newTableId: newTable.id,
                        attribute: 'width',
                        newValue: newTable.width,
                        oldValue: oldTable.width,
                    }
                );

                if (shouldAddToChangedMap('width', changedTablesAttributes)) {
                    changedTables.set(oldTable.id, true);
                }
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
    changedIndexes,
    options,
    changedTablesAttributes,
    changedFieldsAttributes,
    changedIndexesAttributes,
    tableMatcher,
    fieldMatcher,
    indexMatcher,
    databaseType,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    changedFields: Map<string, boolean>;
    changedIndexes: Map<string, boolean>;
    options?: GenerateDiffOptions;
    changedTablesAttributes?: TableDiffAttribute[];
    changedFieldsAttributes?: FieldDiffAttribute[];
    changedIndexesAttributes?: IndexDiffAttribute[];
    tableMatcher: (table: DBTable, tables: DBTable[]) => DBTable | undefined;
    fieldMatcher: (field: DBField, fields: DBField[]) => DBField | undefined;
    indexMatcher: (index: DBIndex, indexes: DBIndex[]) => DBIndex | undefined;
    databaseType: DatabaseType;
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
                changedTablesAttributes,
                changedFieldsAttributes,
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
                changedIndexes,
                attributes: options?.attributes?.indexes,
                changedTablesAttributes,
                changedIndexesAttributes,
                changeTypes: options?.changeTypes?.indexes,
                indexMatcher,
                databaseType,
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
    changedTablesAttributes,
    changedFieldsAttributes,
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
    changedTablesAttributes?: TableDiffAttribute[];
    changedFieldsAttributes?: FieldDiffAttribute[];
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
                changedTablesAttributes,
                changedFieldsAttributes,
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
    changedTablesAttributes,
    changedFieldsAttributes,
}: {
    tableId: string;
    oldField: DBField;
    newField: DBField;
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    changedFields: Map<string, boolean>;
    attributes?: FieldDiffAttribute[];
    changedTablesAttributes?: TableDiffAttribute[];
    changedFieldsAttributes?: FieldDiffAttribute[];
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
        'increment',
        'isArray',
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
        areCommentsDifferent(oldField.comments, newField.comments)
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

    if (
        attributesToCheck.includes('increment') &&
        isOneOfDefined(newField.increment, oldField.increment) &&
        normalizeBoolean(oldField.increment) !==
            normalizeBoolean(newField.increment)
    ) {
        changedAttributes.push('increment');
    }

    if (
        attributesToCheck.includes('isArray') &&
        isOneOfDefined(newField.isArray, oldField.isArray) &&
        normalizeBoolean(oldField.isArray) !==
            normalizeBoolean(newField.isArray)
    ) {
        changedAttributes.push('isArray');
    }

    if (changedAttributes.length > 0) {
        // Track which attributes should trigger adding to changed maps
        const attributesThatTriggerChange = changedAttributes.filter((attr) =>
            shouldAddToChangedMap(attr, changedFieldsAttributes)
        );

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
                    newFieldId: newField.id,
                    tableId,
                    attribute,
                    oldValue: oldField[attribute] ?? '',
                    newValue: newField[attribute] ?? '',
                }
            );
        }

        // Only add to changed maps if at least one attribute should trigger a change
        if (attributesThatTriggerChange.length > 0) {
            // For changedTables, we need to check changedTablesAttributes
            // undefined = always add, empty = never add, array = check if any field attribute qualifies
            if (changedTablesAttributes === undefined) {
                changedTables.set(tableId, true);
            } else if (changedTablesAttributes.length > 0) {
                // If changedTablesAttributes has values, we only add if explicitly configured
                // Since these are field changes, we keep current behavior of adding to changedTables
                changedTables.set(tableId, true);
            }
            // If changedTablesAttributes is empty array, don't add to changedTables

            changedFields.set(oldField.id, true);
        }
    }
}

// Compare indexes between tables
function compareIndexes({
    tableId,
    oldIndexes,
    newIndexes,
    diffMap,
    changedTables,
    changedIndexes,
    attributes,
    changedTablesAttributes,
    changedIndexesAttributes,
    changeTypes,
    indexMatcher,
    databaseType,
}: {
    tableId: string;
    oldIndexes: DBIndex[];
    newIndexes: DBIndex[];
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    changedIndexes: Map<string, boolean>;
    attributes?: IndexDiffAttribute[];
    changedTablesAttributes?: TableDiffAttribute[];
    changedIndexesAttributes?: IndexDiffAttribute[];
    changeTypes?: IndexDiff['type'][];
    indexMatcher: (index: DBIndex, indexes: DBIndex[]) => DBIndex | undefined;
    databaseType: DatabaseType;
}) {
    // If changeTypes is empty array, don't check any changes
    if (changeTypes && changeTypes.length === 0) {
        return;
    }

    // If changeTypes is undefined, check all types
    const typesToCheck = changeTypes ?? ['added', 'removed', 'changed'];

    // For structural changes (added/removed indexes), add to changedTables unless
    // changedTablesAttributes is explicitly set to empty array
    const shouldAddToChangedTables =
        changedTablesAttributes === undefined ||
        changedTablesAttributes.length > 0;

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
                if (shouldAddToChangedTables) {
                    changedTables.set(tableId, true);
                }
                changedIndexes.set(newIndex.id, true);
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
                if (shouldAddToChangedTables) {
                    changedTables.set(tableId, true);
                }
                changedIndexes.set(oldIndex.id, true);
            }
        }
    }

    // Check for index changes
    if (typesToCheck.includes('changed')) {
        for (const oldIndex of oldIndexes) {
            const newIndex = indexMatcher(oldIndex, newIndexes);
            if (!newIndex) continue;

            compareIndexProperties({
                tableId,
                oldIndex,
                newIndex,
                diffMap,
                changedTables,
                changedIndexes,
                attributes,
                changedTablesAttributes,
                changedIndexesAttributes,
                databaseType,
            });
        }
    }
}

// Helper to compare fieldIds arrays
const areFieldIdsEqual = (
    oldFieldIds: string[],
    newFieldIds: string[]
): boolean => {
    if (oldFieldIds.length !== newFieldIds.length) {
        return false;
    }
    for (let i = 0; i < oldFieldIds.length; i++) {
        if (oldFieldIds[i] !== newFieldIds[i]) {
            return false;
        }
    }
    return true;
};

// Compare index properties
function compareIndexProperties({
    tableId,
    oldIndex,
    newIndex,
    diffMap,
    changedTables,
    changedIndexes,
    attributes,
    changedTablesAttributes,
    changedIndexesAttributes,
    databaseType,
}: {
    tableId: string;
    oldIndex: DBIndex;
    newIndex: DBIndex;
    diffMap: DiffMap;
    changedTables: Map<string, boolean>;
    changedIndexes: Map<string, boolean>;
    attributes?: IndexDiffAttribute[];
    changedTablesAttributes?: TableDiffAttribute[];
    changedIndexesAttributes?: IndexDiffAttribute[];
    databaseType: DatabaseType;
}) {
    // If attributes are specified, only check those attributes
    const attributesToCheck: IndexDiffAttribute[] = attributes ?? [
        'name',
        'unique',
        'fieldIds',
        'type',
    ];

    const changedAttributes: IndexDiffAttribute[] = [];

    if (attributesToCheck.includes('name') && oldIndex.name !== newIndex.name) {
        changedAttributes.push('name');
    }

    if (
        attributesToCheck.includes('unique') &&
        oldIndex.unique !== newIndex.unique
    ) {
        changedAttributes.push('unique');
    }

    if (
        attributesToCheck.includes('fieldIds') &&
        !areFieldIdsEqual(oldIndex.fieldIds, newIndex.fieldIds)
    ) {
        changedAttributes.push('fieldIds');
    }

    if (attributesToCheck.includes('type')) {
        const oldType =
            oldIndex.type ?? defaultIndexTypeForDatabase[databaseType];
        const newType =
            newIndex.type ?? defaultIndexTypeForDatabase[databaseType];

        // if both null/undefined, consider equal
        if (oldType !== newType) {
            changedAttributes.push('type');
        }
    }

    if (changedAttributes.length > 0) {
        // Track which attributes should trigger adding to changed maps
        const attributesThatTriggerChange = changedAttributes.filter((attr) =>
            shouldAddToChangedMap(attr, changedIndexesAttributes)
        );

        for (const attribute of changedAttributes) {
            diffMap.set(
                getDiffMapKey({
                    diffObject: 'index',
                    objectId: oldIndex.id,
                    attribute,
                }),
                {
                    object: 'index',
                    type: 'changed',
                    indexId: oldIndex.id,
                    newIndexId: newIndex.id,
                    tableId,
                    attribute,
                    oldValue: oldIndex[attribute],
                    newValue: newIndex[attribute],
                }
            );
        }

        // Only add to changed maps if at least one attribute should trigger a change
        if (attributesThatTriggerChange.length > 0) {
            // For changedTables, we need to check changedTablesAttributes
            if (changedTablesAttributes === undefined) {
                changedTables.set(tableId, true);
            } else if (changedTablesAttributes.length > 0) {
                changedTables.set(tableId, true);
            }

            changedIndexes.set(oldIndex.id, true);
        }
    }
}

// Compare relationships between diagrams
function compareRelationships({
    diagram,
    newDiagram,
    diffMap,
    changedRelationships,
    relationshipIdMap,
    attributes,
    changedRelationshipsAttributes,
    changeTypes,
    relationshipMatcher,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
    changedRelationships: Map<string, boolean>;
    relationshipIdMap: Map<string, string>;
    attributes?: RelationshipDiffAttribute[];
    changedRelationshipsAttributes?: RelationshipDiffAttribute[];
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
    const typesToCheck = changeTypes ?? ['added', 'removed', 'changed'];
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
                changedRelationships.set(newRelationship.id, true);
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
                changedRelationships.set(oldRelationship.id, true);
            }
        }
    }

    // Check for relationship changes
    if (typesToCheck.includes('changed')) {
        for (const oldRelationship of oldRelationships) {
            const newRelationship = relationshipMatcher(
                oldRelationship,
                newRelationships
            );
            if (!newRelationship) continue;

            compareRelationshipProperties({
                oldRelationship,
                newRelationship,
                diffMap,
                changedRelationships,
                relationshipIdMap,
                attributes,
                changedRelationshipsAttributes,
            });
        }
    }
}

// Compare relationship properties
function compareRelationshipProperties({
    oldRelationship,
    newRelationship,
    diffMap,
    changedRelationships,
    relationshipIdMap,
    attributes,
    changedRelationshipsAttributes,
}: {
    oldRelationship: DBRelationship;
    newRelationship: DBRelationship;
    diffMap: DiffMap;
    changedRelationships: Map<string, boolean>;
    relationshipIdMap: Map<string, string>;
    attributes?: RelationshipDiffAttribute[];
    changedRelationshipsAttributes?: RelationshipDiffAttribute[];
}) {
    // If attributes are specified, only check those attributes
    const attributesToCheck: RelationshipDiffAttribute[] = attributes ?? [
        'name',
        'sourceSchema',
        'sourceTableId',
        'targetSchema',
        'targetTableId',
        'sourceFieldId',
        'targetFieldId',
        'sourceCardinality',
        'targetCardinality',
    ];

    const changedAttributes: RelationshipDiffAttribute[] = [];

    if (
        attributesToCheck.includes('name') &&
        oldRelationship.name !== newRelationship.name
    ) {
        changedAttributes.push('name');
    }

    if (
        attributesToCheck.includes('sourceSchema') &&
        oldRelationship.sourceSchema !== newRelationship.sourceSchema
    ) {
        changedAttributes.push('sourceSchema');
    }

    if (
        attributesToCheck.includes('sourceTableId') &&
        oldRelationship.sourceTableId !== newRelationship.sourceTableId
    ) {
        changedAttributes.push('sourceTableId');
    }

    if (
        attributesToCheck.includes('targetSchema') &&
        oldRelationship.targetSchema !== newRelationship.targetSchema
    ) {
        changedAttributes.push('targetSchema');
    }

    if (
        attributesToCheck.includes('targetTableId') &&
        oldRelationship.targetTableId !== newRelationship.targetTableId
    ) {
        changedAttributes.push('targetTableId');
    }

    if (
        attributesToCheck.includes('sourceFieldId') &&
        oldRelationship.sourceFieldId !== newRelationship.sourceFieldId
    ) {
        changedAttributes.push('sourceFieldId');
    }

    if (
        attributesToCheck.includes('targetFieldId') &&
        oldRelationship.targetFieldId !== newRelationship.targetFieldId
    ) {
        changedAttributes.push('targetFieldId');
    }

    if (
        attributesToCheck.includes('sourceCardinality') &&
        oldRelationship.sourceCardinality !== newRelationship.sourceCardinality
    ) {
        changedAttributes.push('sourceCardinality');
    }

    if (
        attributesToCheck.includes('targetCardinality') &&
        oldRelationship.targetCardinality !== newRelationship.targetCardinality
    ) {
        changedAttributes.push('targetCardinality');
    }

    if (changedAttributes.length > 0) {
        // Track which attributes should trigger adding to changed maps
        const attributesThatTriggerChange = changedAttributes.filter((attr) =>
            shouldAddToChangedMap(attr, changedRelationshipsAttributes)
        );

        for (const attribute of changedAttributes) {
            diffMap.set(
                getDiffMapKey({
                    diffObject: 'relationship',
                    objectId: oldRelationship.id,
                    attribute,
                }),
                {
                    object: 'relationship',
                    type: 'changed',
                    relationshipId: oldRelationship.id,
                    newRelationshipId: newRelationship.id,
                    attribute,
                    oldValue: oldRelationship[attribute],
                    newValue: newRelationship[attribute],
                }
            );
        }

        // Only add to changed maps if at least one attribute should trigger a change
        if (attributesThatTriggerChange.length > 0) {
            changedRelationships.set(oldRelationship.id, true);
            changedRelationships.set(newRelationship.id, true);

            // Store bidirectional mapping between old and new IDs
            relationshipIdMap.set(oldRelationship.id, newRelationship.id);
            relationshipIdMap.set(newRelationship.id, oldRelationship.id);
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
    changedAreasAttributes,
    changeTypes,
    areaMatcher,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
    changedAreas: Map<string, boolean>;
    attributes?: AreaDiffAttribute[];
    changedAreasAttributes?: AreaDiffAttribute[];
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
                        newAreaId: newArea.id,
                        attribute: 'name',
                        newValue: newArea.name,
                        oldValue: oldArea.name,
                    }
                );
                if (shouldAddToChangedMap('name', changedAreasAttributes)) {
                    changedAreas.set(oldArea.id, true);
                }
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
                        newAreaId: newArea.id,
                        attribute: 'color',
                        newValue: newArea.color,
                        oldValue: oldArea.color,
                    }
                );
                if (shouldAddToChangedMap('color', changedAreasAttributes)) {
                    changedAreas.set(oldArea.id, true);
                }
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
                        newAreaId: newArea.id,
                        attribute: 'x',
                        newValue: newArea.x,
                        oldValue: oldArea.x,
                    }
                );
                if (shouldAddToChangedMap('x', changedAreasAttributes)) {
                    changedAreas.set(oldArea.id, true);
                }
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
                        newAreaId: newArea.id,
                        attribute: 'y',
                        newValue: newArea.y,
                        oldValue: oldArea.y,
                    }
                );
                if (shouldAddToChangedMap('y', changedAreasAttributes)) {
                    changedAreas.set(oldArea.id, true);
                }
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
                        newAreaId: newArea.id,
                        attribute: 'width',
                        newValue: newArea.width,
                        oldValue: oldArea.width,
                    }
                );
                if (shouldAddToChangedMap('width', changedAreasAttributes)) {
                    changedAreas.set(oldArea.id, true);
                }
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
                        newAreaId: newArea.id,
                        attribute: 'height',
                        newValue: newArea.height,
                        oldValue: oldArea.height,
                    }
                );
                if (shouldAddToChangedMap('height', changedAreasAttributes)) {
                    changedAreas.set(oldArea.id, true);
                }
            }
        }
    }
}

// Compare notes between diagrams
function compareNotes({
    diagram,
    newDiagram,
    diffMap,
    changedNotes,
    attributes,
    changedNotesAttributes,
    changeTypes,
    noteMatcher,
}: {
    diagram: Diagram;
    newDiagram: Diagram;
    diffMap: DiffMap;
    changedNotes: Map<string, boolean>;
    attributes?: NoteDiffAttribute[];
    changedNotesAttributes?: NoteDiffAttribute[];
    changeTypes?: NoteDiff['type'][];
    noteMatcher: (note: Note, notes: Note[]) => Note | undefined;
}) {
    const oldNotes = diagram.notes || [];
    const newNotes = newDiagram.notes || [];

    // If changeTypes is empty array, don't check any changes
    if (changeTypes && changeTypes.length === 0) {
        return;
    }

    // If changeTypes is undefined, check all types
    const typesToCheck = changeTypes ?? ['added', 'removed', 'changed'];

    // Check for added notes
    if (typesToCheck.includes('added')) {
        for (const newNote of newNotes) {
            if (!noteMatcher(newNote, oldNotes)) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'note',
                        objectId: newNote.id,
                    }),
                    {
                        object: 'note',
                        type: 'added',
                        noteAdded: newNote,
                    }
                );
                changedNotes.set(newNote.id, true);
            }
        }
    }

    // Check for removed notes
    if (typesToCheck.includes('removed')) {
        for (const oldNote of oldNotes) {
            if (!noteMatcher(oldNote, newNotes)) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'note',
                        objectId: oldNote.id,
                    }),
                    {
                        object: 'note',
                        type: 'removed',
                        noteId: oldNote.id,
                    }
                );
                changedNotes.set(oldNote.id, true);
            }
        }
    }

    // Check for note content and color changes
    if (typesToCheck.includes('changed')) {
        for (const oldNote of oldNotes) {
            const newNote = noteMatcher(oldNote, newNotes);

            if (!newNote) continue;

            // If attributes are specified, only check those attributes
            const attributesToCheck: NoteDiffAttribute[] = attributes ?? [
                'content',
                'color',
            ];

            if (
                attributesToCheck.includes('content') &&
                areCommentsDifferent(oldNote.content, newNote.content)
            ) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'note',
                        objectId: oldNote.id,
                        attribute: 'content',
                    }),
                    {
                        object: 'note',
                        type: 'changed',
                        noteId: oldNote.id,
                        newNoteId: newNote.id,
                        attribute: 'content',
                        newValue: newNote.content,
                        oldValue: oldNote.content,
                    }
                );
                if (shouldAddToChangedMap('content', changedNotesAttributes)) {
                    changedNotes.set(oldNote.id, true);
                }
            }

            if (
                attributesToCheck.includes('color') &&
                oldNote.color !== newNote.color
            ) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'note',
                        objectId: oldNote.id,
                        attribute: 'color',
                    }),
                    {
                        object: 'note',
                        type: 'changed',
                        noteId: oldNote.id,
                        newNoteId: newNote.id,
                        attribute: 'color',
                        newValue: newNote.color,
                        oldValue: oldNote.color,
                    }
                );
                if (shouldAddToChangedMap('color', changedNotesAttributes)) {
                    changedNotes.set(oldNote.id, true);
                }
            }

            if (attributesToCheck.includes('x') && oldNote.x !== newNote.x) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'note',
                        objectId: oldNote.id,
                        attribute: 'x',
                    }),
                    {
                        object: 'note',
                        type: 'changed',
                        noteId: oldNote.id,
                        newNoteId: newNote.id,
                        attribute: 'x',
                        newValue: newNote.x,
                        oldValue: oldNote.x,
                    }
                );
                if (shouldAddToChangedMap('x', changedNotesAttributes)) {
                    changedNotes.set(oldNote.id, true);
                }
            }

            if (attributesToCheck.includes('y') && oldNote.y !== newNote.y) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'note',
                        objectId: oldNote.id,
                        attribute: 'y',
                    }),
                    {
                        object: 'note',
                        type: 'changed',
                        noteId: oldNote.id,
                        newNoteId: newNote.id,
                        attribute: 'y',
                        newValue: newNote.y,
                        oldValue: oldNote.y,
                    }
                );
                if (shouldAddToChangedMap('y', changedNotesAttributes)) {
                    changedNotes.set(oldNote.id, true);
                }
            }

            if (
                attributesToCheck.includes('width') &&
                oldNote.width !== newNote.width
            ) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'note',
                        objectId: oldNote.id,
                        attribute: 'width',
                    }),
                    {
                        object: 'note',
                        type: 'changed',
                        noteId: oldNote.id,
                        newNoteId: newNote.id,
                        attribute: 'width',
                        newValue: newNote.width,
                        oldValue: oldNote.width,
                    }
                );
                if (shouldAddToChangedMap('width', changedNotesAttributes)) {
                    changedNotes.set(oldNote.id, true);
                }
            }

            if (
                attributesToCheck.includes('height') &&
                oldNote.height !== newNote.height
            ) {
                diffMap.set(
                    getDiffMapKey({
                        diffObject: 'note',
                        objectId: oldNote.id,
                        attribute: 'height',
                    }),
                    {
                        object: 'note',
                        type: 'changed',
                        noteId: oldNote.id,
                        newNoteId: newNote.id,
                        attribute: 'height',
                        newValue: newNote.height,
                        oldValue: oldNote.height,
                    }
                );
                if (shouldAddToChangedMap('height', changedNotesAttributes)) {
                    changedNotes.set(oldNote.id, true);
                }
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
    // Priority 1: Match by ID
    const byId = indexes.find((i) => i.id === index.id);
    if (byId) {
        return byId;
    }

    // Priority 2: Match by name (only if unique match)
    if (index.name) {
        const byName = indexes.filter(
            (i) =>
                i.name === index.name &&
                areBooleansEqual(i.isPrimaryKey, index.isPrimaryKey)
        );
        if (byName.length === 1) {
            return byName[0];
        }
    }

    // Priority 3: Match by fieldIds (only if unique match)
    const byFieldIds = indexes.filter(
        (i) =>
            areFieldIdsEqual(i.fieldIds, index.fieldIds) &&
            areBooleansEqual(i.isPrimaryKey, index.isPrimaryKey)
    );
    if (byFieldIds.length === 1) {
        return byFieldIds[0];
    }

    return undefined;
};

const defaultRelationshipMatcher = (
    relationship: DBRelationship,
    relationships: DBRelationship[]
): DBRelationship | undefined => {
    // Priority 1: Match by ID
    const byId = relationships.find((r) => r.id === relationship.id);
    if (byId) {
        return byId;
    }

    // Priority 2: Match by name (only if unique match)
    if (relationship.name) {
        const byName = relationships.filter(
            (r) => r.name === relationship.name
        );
        if (byName.length === 1) {
            return byName[0];
        }
    }

    // Priority 3: Match by structural identity (source/target table and field IDs)
    const byStructure = relationships.filter(
        (r) =>
            r.sourceTableId === relationship.sourceTableId &&
            r.targetTableId === relationship.targetTableId &&
            r.sourceFieldId === relationship.sourceFieldId &&
            r.targetFieldId === relationship.targetFieldId
    );
    if (byStructure.length === 1) {
        return byStructure[0];
    }

    return undefined;
};

const defaultAreaMatcher = (area: Area, areas: Area[]): Area | undefined => {
    return areas.find((a) => a.id === area.id);
};

const defaultNoteMatcher = (note: Note, notes: Note[]): Note | undefined => {
    return notes.find((n) => n.id === note.id);
};
