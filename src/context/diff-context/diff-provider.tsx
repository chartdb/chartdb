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

    const calculateDiff: DiffContext['calculateDiff'] = useCallback(
        ({ diagram, newDiagram }) => {
            const newDiffs = generateDiff({ diagram, newDiagram });

            setDiffMap(newDiffs);
        },
        [setDiffMap]
    );

    return (
        <diffContext.Provider
            value={{
                diffMap,
                calculateDiff,
            }}
        >
            {children}
        </diffContext.Provider>
    );
};
