import React, { useCallback } from 'react';
import type {
    DiffCalculatedData,
    DiffContext,
    DiffEvent,
} from './diff-context';
import { diffContext } from './diff-context';

import {
    generateDiff,
    getDiffMapKey,
} from '@/lib/domain/diff/diff-check/diff-check';
import type { Diagram } from '@/lib/domain/diagram';
import { useEventEmitter } from 'ahooks';
import type { DBField } from '@/lib/domain/db-field';
import type { DataType } from '@/lib/data/data-types/data-types';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { Area } from '@/lib/domain/area';
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
    const [isSummaryOnly, setIsSummaryOnly] = React.useState<boolean>(false);

    const events = useEventEmitter<DiffEvent>();

    const generateFieldsToAddMap = useCallback(
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

    const findRelationshipsToAdd = useCallback(
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

    const findAreasToAdd = useCallback(
        ({
            diffMap,
            newDiagram,
        }: {
            diffMap: DiffMap;
            newDiagram: Diagram;
        }) => {
            const areas: Area[] = [];
            diffMap.forEach((diff) => {
                if (diff.object === 'area' && diff.type === 'added') {
                    const area = newDiagram?.areas?.find(
                        (a) => a.id === diff.areaAdded.id
                    );

                    if (area) {
                        areas.push(area);
                    }
                }
            });

            return areas;
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
                tablesToAdd:
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

                fieldsToAdd: generateFieldsToAddMap({
                    diffMap: diffMap,
                    newDiagram: newDiagram,
                }),
                relationshipsToAdd: findRelationshipsToAdd({
                    diffMap: diffMap,
                    newDiagram: newDiagram,
                }),
                areasToAdd: findAreasToAdd({
                    diffMap: diffMap,
                    newDiagram: newDiagram,
                }),
            };
        },
        [findRelationshipsToAdd, generateFieldsToAddMap, findAreasToAdd]
    );

    const calculateDiff: DiffContext['calculateDiff'] = useCallback(
        ({ diagram, newDiagram: newDiagramArg, options }) => {
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
            setIsSummaryOnly(options?.summaryOnly ?? false);

            events.emit({
                action: 'diff_calculated',
                data: generateDiffCalculatedData({
                    diffMap: newDiffs,
                    newDiagram: newDiagramArg,
                }),
            });

            return { foundDiff: !!newDiffs.size };
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
                    return {
                        new: diff.newValue as string,
                        old: diff.oldValue as string,
                    };
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
                    return {
                        new: diff.newValue as string,
                        old: diff.oldValue as string,
                    };
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
                    return {
                        old: diff.oldValue as string,
                        new: diff.newValue as string,
                    };
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
                    return {
                        old: diff.oldValue as DataType,
                        new: diff.newValue as DataType,
                    };
                }
            }

            return null;
        },
        [diffMap]
    );

    const getFieldNewPrimaryKey = useCallback<
        DiffContext['getFieldNewPrimaryKey']
    >(
        ({ fieldId }) => {
            const fieldKey = getDiffMapKey({
                diffObject: 'field',
                objectId: fieldId,
                attribute: 'primaryKey',
            });

            if (diffMap.has(fieldKey)) {
                const diff = diffMap.get(fieldKey);

                if (diff?.type === 'changed') {
                    return {
                        old: diff.oldValue as boolean,
                        new: diff.newValue as boolean,
                    };
                }
            }

            return null;
        },
        [diffMap]
    );

    const getFieldNewNullable = useCallback<DiffContext['getFieldNewNullable']>(
        ({ fieldId }) => {
            const fieldKey = getDiffMapKey({
                diffObject: 'field',
                objectId: fieldId,
                attribute: 'nullable',
            });

            if (diffMap.has(fieldKey)) {
                const diff = diffMap.get(fieldKey);

                if (diff?.type === 'changed') {
                    return {
                        old: diff.oldValue as boolean,
                        new: diff.newValue as boolean,
                    };
                }
            }

            return null;
        },
        [diffMap]
    );

    const getFieldNewCharacterMaximumLength = useCallback<
        DiffContext['getFieldNewCharacterMaximumLength']
    >(
        ({ fieldId }) => {
            const fieldKey = getDiffMapKey({
                diffObject: 'field',
                objectId: fieldId,
                attribute: 'characterMaximumLength',
            });

            if (diffMap.has(fieldKey)) {
                const diff = diffMap.get(fieldKey);

                if (diff?.type === 'changed') {
                    return {
                        old: diff.oldValue as string,
                        new: diff.newValue as string,
                    };
                }
            }

            return null;
        },
        [diffMap]
    );

    const getFieldNewScale = useCallback<DiffContext['getFieldNewScale']>(
        ({ fieldId }) => {
            const fieldKey = getDiffMapKey({
                diffObject: 'field',
                objectId: fieldId,
                attribute: 'scale',
            });

            if (diffMap.has(fieldKey)) {
                const diff = diffMap.get(fieldKey);

                if (diff?.type === 'changed') {
                    return {
                        old: diff.oldValue as number,
                        new: diff.newValue as number,
                    };
                }
            }

            return null;
        },
        [diffMap]
    );

    const getFieldNewPrecision = useCallback<
        DiffContext['getFieldNewPrecision']
    >(
        ({ fieldId }) => {
            const fieldKey = getDiffMapKey({
                diffObject: 'field',
                objectId: fieldId,
                attribute: 'precision',
            });

            if (diffMap.has(fieldKey)) {
                const diff = diffMap.get(fieldKey);

                if (diff?.type === 'changed') {
                    return {
                        old: diff.oldValue as number,
                        new: diff.newValue as number,
                    };
                }
            }

            return null;
        },
        [diffMap]
    );

    const getFieldNewIsArray = useCallback<DiffContext['getFieldNewIsArray']>(
        ({ fieldId }) => {
            const fieldKey = getDiffMapKey({
                diffObject: 'field',
                objectId: fieldId,
                attribute: 'isArray',
            });

            if (diffMap.has(fieldKey)) {
                const diff = diffMap.get(fieldKey);

                if (diff?.type === 'changed') {
                    return {
                        old: diff.oldValue as boolean,
                        new: diff.newValue as boolean,
                    };
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

    const checkIfNewArea = useCallback<DiffContext['checkIfNewArea']>(
        ({ areaId }) => {
            const areaKey = getDiffMapKey({
                diffObject: 'area',
                objectId: areaId,
            });

            return (
                diffMap.has(areaKey) && diffMap.get(areaKey)?.type === 'added'
            );
        },
        [diffMap]
    );

    const checkIfAreaRemoved = useCallback<DiffContext['checkIfAreaRemoved']>(
        ({ areaId }) => {
            const areaKey = getDiffMapKey({
                diffObject: 'area',
                objectId: areaId,
            });

            return (
                diffMap.has(areaKey) && diffMap.get(areaKey)?.type === 'removed'
            );
        },
        [diffMap]
    );

    const resetDiff = useCallback<DiffContext['resetDiff']>(() => {
        setDiffMap(new Map<string, ChartDBDiff>());
        setTablesChanged(new Map<string, boolean>());
        setFieldsChanged(new Map<string, boolean>());
        setNewDiagram(null);
        setOriginalDiagram(null);
        setIsSummaryOnly(false);
    }, []);

    return (
        <diffContext.Provider
            value={{
                newDiagram,
                originalDiagram,
                diffMap,
                hasDiff: diffMap.size > 0,
                isSummaryOnly,

                calculateDiff,
                resetDiff,

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
                getFieldNewPrimaryKey,
                getFieldNewNullable,
                getFieldNewCharacterMaximumLength,
                getFieldNewScale,
                getFieldNewPrecision,
                getFieldNewIsArray,

                // relationship diff
                checkIfNewRelationship,
                checkIfRelationshipRemoved,

                // area diff
                checkIfNewArea,
                checkIfAreaRemoved,

                events,
            }}
        >
            {children}
        </diffContext.Provider>
    );
};
