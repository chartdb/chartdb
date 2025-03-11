import React, { useCallback, useMemo } from 'react';
import type { DiffContext, DiffEvent } from './diff-context';
import { diffContext } from './diff-context';
import type { ChartDBDiff, DiffMap } from './types';
import { generateDiff, getDiffMapKey } from './diff-check/diff-check';
import type { Diagram } from '@/lib/domain/diagram';
import { useEventEmitter } from 'ahooks';

export const DiffProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [newDiagram, setNewDiagram] = React.useState<Diagram | null>(null);
    const [diffMap, setDiffMap] = React.useState<DiffMap>(
        new Map<string, ChartDBDiff>()
    );
    const [tablesChanged, setTablesChanged] = React.useState<
        Map<string, boolean>
    >(new Map<string, boolean>());

    const events = useEventEmitter<DiffEvent>();

    const calculateDiff: DiffContext['calculateDiff'] = useCallback(
        ({ diagram, newDiagram: newDiagramArg }) => {
            const { diffMap: newDiffs, changedTables: newChangedTables } =
                generateDiff({ diagram, newDiagram: newDiagramArg });

            setDiffMap(newDiffs);
            setTablesChanged(newChangedTables);
            setNewDiagram(newDiagramArg);

            events.emit({
                action: 'diff_calculated',
                data: {
                    tablesAdded:
                        newDiagramArg?.tables?.filter((table) => {
                            const tableKey = getDiffMapKey({
                                diffObject: 'table',
                                objectId: table.id,
                            });

                            return (
                                newDiffs.has(tableKey) &&
                                newDiffs.get(tableKey)?.type === 'added'
                            );
                        }) ?? [],
                },
            });
        },
        [setDiffMap, events]
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

    const checkIfTableHasChange = useCallback<
        DiffContext['checkIfTableHasChange']
    >(({ tableId }) => tablesChanged.get(tableId) ?? false, [tablesChanged]);

    const addedTables = useMemo(() => {
        return newDiagram?.tables?.filter((table) => {
            const tableKey = getDiffMapKey({
                diffObject: 'table',
                objectId: table.id,
            });

            return (
                diffMap.has(tableKey) && diffMap.get(tableKey)?.type === 'added'
            );
        });
    }, [newDiagram, diffMap]);

    return (
        <diffContext.Provider
            value={{
                events,
                diffMap,
                addedTables,
                calculateDiff,
                hasDiff: diffMap.size > 0,
                tablesChanged,
                getTableNewName,
                checkIfTableHasChange,
                newDiagram,
            }}
        >
            {children}
        </diffContext.Provider>
    );
};
