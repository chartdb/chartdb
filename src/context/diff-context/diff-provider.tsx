import React, { useCallback } from 'react';
import type {
    DiffCalculatedData,
    DiffContext,
    DiffEvent,
} from './diff-context';
import { diffContext } from './diff-context';

import { generateDiff, getDiffMapKey } from './diff-check/diff-check';
import type { Diagram } from '@/lib/domain/diagram';
import { useEventEmitter } from 'ahooks';
import type { DBField } from '@/lib/domain/db-field';
import type { DataType } from '@/lib/data/data-types/data-types';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { ChartDBDiff, DiffMap } from '@/lib/domain/diff/diff';

export const DiffProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [newDiagram, setNewDiagram] = React.useState<Diagram | null>(null);
    const [originalDiagram, setOriginalDiagram] =
        React.useState<Diagram | null>(null);
    const [diffMap, setDiffMap] = React.useState<DiffMap>(
        new Map<string, ChartDBDiff>()
    );
    const [tablesChanged, setTablesChanged] = React.useState<
        Map<string, boolean>
    >(new Map<string, boolean>());
    const [fieldsChanged, setFieldsChanged] = React.useState<
        Map<string, boolean>
    >(new Map<string, boolean>());

    const events = useEventEmitter<DiffEvent>();

    const generateNewFieldsMap = useCallback(
        ({
            diffMap,
            newDiagram,
        }: {
            diffMap: DiffMap;
            newDiagram: Diagram;
        }) => {
            const newFieldsMap = new Map<string, DBField[]>();

            diffMap.forEach((diff) => {
                if (diff.object === 'field' && diff.type === 'added') {
                    const field = newDiagram?.tables
                        ?.find((table) => table.id === diff.tableId)
                        ?.fields.find((f) => f.id === diff.newField.id);

                    if (field) {
                        newFieldsMap.set(diff.tableId, [
                            ...(newFieldsMap.get(diff.tableId) ?? []),
                            field,
                        ]);
                    }
                }
            });

            return newFieldsMap;
        },
        []
    );

    const findNewRelationships = useCallback(
        ({
            diffMap,
            newDiagram,
        }: {
            diffMap: DiffMap;
            newDiagram: Diagram;
        }) => {
            const relationships: DBRelationship[] = [];
            diffMap.forEach((diff) => {
                if (diff.object === 'relationship' && diff.type === 'added') {
                    const relationship = newDiagram?.relationships?.find(
                        (rel) => rel.id === diff.newRelationship.id
                    );

                    if (relationship) {
                        relationships.push(relationship);
                    }
                }
            });

            return relationships;
        },
        []
    );

    const generateDiffCalculatedData = useCallback(
        ({
            newDiagram,
            diffMap,
        }: {
            newDiagram: Diagram;
            diffMap: DiffMap;
        }): DiffCalculatedData => {
            return {
                tablesAdded:
                    newDiagram?.tables?.filter((table) => {
                        const tableKey = getDiffMapKey({
                            diffObject: 'table',
                            objectId: table.id,
                        });

                        return (
                            diffMap.has(tableKey) &&
                            diffMap.get(tableKey)?.type === 'added'
                        );
                    }) ?? [],

                fieldsAdded: generateNewFieldsMap({
                    diffMap: diffMap,
                    newDiagram: newDiagram,
                }),
                relationshipsAdded: findNewRelationships({
                    diffMap: diffMap,
                    newDiagram: newDiagram,
                }),
            };
        },
        [findNewRelationships, generateNewFieldsMap]
    );

    const calculateDiff: DiffContext['calculateDiff'] = useCallback(
        ({ diagram, newDiagram: newDiagramArg }) => {
            const {
                diffMap: newDiffs,
                changedTables: newChangedTables,
                changedFields: newChangedFields,
            } = generateDiff({ diagram, newDiagram: newDiagramArg });

            setDiffMap(newDiffs);
            setTablesChanged(newChangedTables);
            setFieldsChanged(newChangedFields);
            setNewDiagram(newDiagramArg);
            setOriginalDiagram(diagram);

            events.emit({
                action: 'diff_calculated',
                data: generateDiffCalculatedData({
                    diffMap: newDiffs,
                    newDiagram: newDiagramArg,
                }),
            });
        },
        [setDiffMap, events, generateDiffCalculatedData]
    );

    const getTableNewName = useCallback<DiffContext['getTableNewName']>(
        ({ tableId }) => {
            const tableNameKey = getDiffMapKey({
                diffObject: 'table',
                objectId: tableId,
                attribute: 'name',
            });

            if (diffMap.has(tableNameKey)) {
                const diff = diffMap.get(tableNameKey);

                if (diff?.type === 'changed') {
                    return diff.newValue as string;
                }
            }

            return null;
        },
        [diffMap]
    );

    const getTableNewColor = useCallback<DiffContext['getTableNewColor']>(
        ({ tableId }) => {
            const tableColorKey = getDiffMapKey({
                diffObject: 'table',
                objectId: tableId,
                attribute: 'color',
            });

            if (diffMap.has(tableColorKey)) {
                const diff = diffMap.get(tableColorKey);

                if (diff?.type === 'changed') {
                    return diff.newValue as string;
                }
            }
            return null;
        },
        [diffMap]
    );

    const checkIfTableHasChange = useCallback<
        DiffContext['checkIfTableHasChange']
    >(({ tableId }) => tablesChanged.get(tableId) ?? false, [tablesChanged]);

    const checkIfNewTable = useCallback<DiffContext['checkIfNewTable']>(
        ({ tableId }) => {
            const tableKey = getDiffMapKey({
                diffObject: 'table',
                objectId: tableId,
            });

            return (
                diffMap.has(tableKey) && diffMap.get(tableKey)?.type === 'added'
            );
        },
        [diffMap]
    );

    const checkIfTableRemoved = useCallback<DiffContext['checkIfTableRemoved']>(
        ({ tableId }) => {
            const tableKey = getDiffMapKey({
                diffObject: 'table',
                objectId: tableId,
            });

            return (
                diffMap.has(tableKey) &&
                diffMap.get(tableKey)?.type === 'removed'
            );
        },
        [diffMap]
    );

    const checkIfFieldHasChange = useCallback<
        DiffContext['checkIfFieldHasChange']
    >(
        ({ fieldId }) => {
            return fieldsChanged.get(fieldId) ?? false;
        },
        [fieldsChanged]
    );

    const checkIfFieldRemoved = useCallback<DiffContext['checkIfFieldRemoved']>(
        ({ fieldId }) => {
            const fieldKey = getDiffMapKey({
                diffObject: 'field',
                objectId: fieldId,
            });

            return (
                diffMap.has(fieldKey) &&
                diffMap.get(fieldKey)?.type === 'removed'
            );
        },
        [diffMap]
    );

    const checkIfNewField = useCallback<DiffContext['checkIfNewField']>(
        ({ fieldId }) => {
            const fieldKey = getDiffMapKey({
                diffObject: 'field',
                objectId: fieldId,
            });

            return (
                diffMap.has(fieldKey) && diffMap.get(fieldKey)?.type === 'added'
            );
        },
        [diffMap]
    );

    const getFieldNewName = useCallback<DiffContext['getFieldNewName']>(
        ({ fieldId }) => {
            const fieldKey = getDiffMapKey({
                diffObject: 'field',
                objectId: fieldId,
                attribute: 'name',
            });

            if (diffMap.has(fieldKey)) {
                const diff = diffMap.get(fieldKey);

                if (diff?.type === 'changed') {
                    return diff.newValue as string;
                }
            }

            return null;
        },
        [diffMap]
    );

    const getFieldNewType = useCallback<DiffContext['getFieldNewType']>(
        ({ fieldId }) => {
            const fieldKey = getDiffMapKey({
                diffObject: 'field',
                objectId: fieldId,
                attribute: 'type',
            });

            if (diffMap.has(fieldKey)) {
                const diff = diffMap.get(fieldKey);

                if (diff?.type === 'changed') {
                    return diff.newValue as DataType;
                }
            }

            return null;
        },
        [diffMap]
    );

    const checkIfNewRelationship = useCallback<
        DiffContext['checkIfNewRelationship']
    >(
        ({ relationshipId }) => {
            const relationshipKey = getDiffMapKey({
                diffObject: 'relationship',
                objectId: relationshipId,
            });

            return (
                diffMap.has(relationshipKey) &&
                diffMap.get(relationshipKey)?.type === 'added'
            );
        },
        [diffMap]
    );

    const checkIfRelationshipRemoved = useCallback<
        DiffContext['checkIfRelationshipRemoved']
    >(
        ({ relationshipId }) => {
            const relationshipKey = getDiffMapKey({
                diffObject: 'relationship',
                objectId: relationshipId,
            });

            return (
                diffMap.has(relationshipKey) &&
                diffMap.get(relationshipKey)?.type === 'removed'
            );
        },
        [diffMap]
    );

    return (
        <diffContext.Provider
            value={{
                newDiagram,
                originalDiagram,
                diffMap,
                hasDiff: diffMap.size > 0,

                calculateDiff,

                // table diff
                getTableNewName,
                checkIfNewTable,
                checkIfTableRemoved,
                checkIfTableHasChange,
                getTableNewColor,

                // field diff
                checkIfFieldHasChange,
                checkIfFieldRemoved,
                checkIfNewField,
                getFieldNewName,
                getFieldNewType,

                // relationship diff
                checkIfNewRelationship,
                checkIfRelationshipRemoved,

                events,
            }}
        >
            {children}
        </diffContext.Provider>
    );
};
