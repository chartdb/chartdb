import React, { useCallback } from 'react';
import type { DiffContext } from './diff-context';
import { diffContext } from './diff-context';
import type { ChartDBDiff, DiffMap } from './types';
import { generateDiff } from './diff-check/diff-check';

export const DiffProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [diffMap, setDiffMap] = React.useState<DiffMap>(
        new Map<string, ChartDBDiff>()
    );
    const [tablesChanged, setTablesChanged] = React.useState<
        Map<string, boolean>
    >(new Map<string, boolean>());

    const calculateDiff: DiffContext['calculateDiff'] = useCallback(
        ({ diagram, newDiagram }) => {
            const { diffMap: newDiffs, changedTables: newChangedTables } =
                generateDiff({ diagram, newDiagram });

            setDiffMap(newDiffs);
            setTablesChanged(newChangedTables);
        },
        [setDiffMap]
    );

    return (
        <diffContext.Provider
            value={{
                diffMap,
                calculateDiff,
                hasDiff: diffMap.size > 0,
                tablesChanged,
            }}
        >
            {children}
        </diffContext.Provider>
    );
};
