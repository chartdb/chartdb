import React, { useMemo } from 'react';
import type { Edge, EdgeProps } from '@xyflow/react';
import { getSmoothStepPath } from '@xyflow/react';
import { useChartDB } from '@/hooks/use-chartdb';
import { cn } from '@/lib/utils';
import type { DBDependency } from '@/lib/domain/db-dependency';

export type DependencyEdgeType = Edge<
    {
        dependency: DBDependency;
        highlighted?: boolean;
    },
    'dependency-edge'
>;

export const DependencyEdge: React.FC<EdgeProps<DependencyEdgeType>> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    source,
    target,
    selected,
    // data,
}) => {
    const { dependencies } = useChartDB();

    // const dependency = data?.dependency;

    const edgeNumber = useMemo(
        () =>
            dependencies
                .filter(
                    (dep) =>
                        (dep.tableId === target &&
                            dep.dependentTableId === source) ||
                        (dep.tableId === source &&
                            dep.dependentTableId === target)
                )
                .findIndex((dep) => dep.id === id),
        [dependencies, id, source, target]
    );

    const [edgePath] = useMemo(
        () =>
            getSmoothStepPath({
                sourceX,
                sourceY,
                targetX,
                targetY,
                borderRadius: 14,
                sourcePosition,
                targetPosition,
                offset: (edgeNumber + 1) * 14,
            }),
        [
            sourceX,
            sourcePosition,
            targetPosition,
            sourceY,
            targetY,
            targetX,
            edgeNumber,
        ]
    );

    return (
        <>
            <path
                id={id}
                d={edgePath}
                fill="none"
                className={cn([
                    'react-flow__edge-path',
                    `!stroke-2 ${selected ? '!stroke-pink-600' : '!stroke-blue-300'}`,
                ])}
            />
            <path
                d={edgePath}
                fill="none"
                strokeOpacity={0}
                strokeWidth={20}
                // eslint-disable-next-line tailwindcss/no-custom-classname
                className="react-flow__edge-interaction"
            />
        </>
        // <BaseEdge
        //     id={id}
        //     path={edgePath}
        //     markerStart="url(#cardinality_one)"
        //     markerEnd="url(#cardinality_one)"
        //     className={`!stroke-2 ${selected ? '!stroke-slate-500' : '!stroke-slate-300'}`}
        // />
    );
};
