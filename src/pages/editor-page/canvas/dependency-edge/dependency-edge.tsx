import React, { useCallback, useMemo } from 'react';
import type { Edge, EdgeProps } from '@xyflow/react';
import { getSmoothStepPath, Position, useReactFlow } from '@xyflow/react';
import { useChartDB } from '@/hooks/use-chartdb';
import { cn } from '@/lib/utils';
import type { DBDependency } from '@/lib/domain/db-dependency';
import { useLayout } from '@/hooks/use-layout';

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
    source,
    target,
    selected,
    // data,
}) => {
    const { getInternalNode } = useReactFlow();
    const { dependencies } = useChartDB();
    const { openDependencyFromSidebar, selectSidebarSection } = useLayout();

    const openDependencyInEditor = useCallback(() => {
        selectSidebarSection('refs');
        openDependencyFromSidebar(id);
    }, [id, openDependencyFromSidebar, selectSidebarSection]);

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

    const sourceNode = getInternalNode(source);
    const targetNode = getInternalNode(target);

    const { sourceTopY, sourceBottomY, targetTopY, targetBottomY } =
        useMemo(() => {
            const sourceHeight = sourceNode?.measured.height ?? 0;
            const sourceTopY = sourceY + 5;
            const sourceBottomY = sourceY + sourceHeight + 10;

            const targetHeight = targetNode?.measured.height ?? 0;
            const targetTopY = targetY + 1;
            const targetBottomY = targetY + targetHeight + 5;

            return { sourceTopY, sourceBottomY, targetTopY, targetBottomY };
        }, [
            sourceNode?.measured.height,
            sourceY,
            targetNode?.measured.height,
            targetY,
        ]);

    const { sourceSide, targetSide } = useMemo(() => {
        const distances = {
            topToTop: Math.abs(sourceTopY - targetTopY),
            topToBottom: Math.abs(sourceTopY - targetBottomY),
            bottomToTop: Math.abs(sourceBottomY - targetTopY),
            bottomToBottom: Math.abs(sourceBottomY - targetBottomY),
        };

        const minDistance = Math.min(
            distances.topToTop,
            distances.topToBottom,
            distances.bottomToTop,
            distances.bottomToBottom
        );

        const minDistanceKey = Object.keys(distances).find(
            (key) => distances[key as keyof typeof distances] === minDistance
        ) as keyof typeof distances;

        switch (minDistanceKey) {
            case 'topToBottom':
                return { sourceSide: 'top', targetSide: 'bottom' };
            case 'bottomToTop':
                return { sourceSide: 'bottom', targetSide: 'top' };
            case 'bottomToBottom':
                return { sourceSide: 'bottom', targetSide: 'bottom' };
            default:
                return { sourceSide: 'top', targetSide: 'top' };
        }
    }, [sourceTopY, sourceBottomY, targetTopY, targetBottomY]);

    const [edgePath] = useMemo(
        () =>
            getSmoothStepPath({
                sourceX,
                sourceY: sourceSide === 'top' ? sourceTopY : sourceBottomY,
                targetX,
                targetY: targetSide === 'top' ? targetTopY : targetBottomY,
                borderRadius: 14,
                sourcePosition:
                    sourceSide === 'top' ? Position.Top : Position.Bottom,
                targetPosition:
                    targetSide === 'top' ? Position.Top : Position.Bottom,
                offset: (edgeNumber + 1) * 14,
            }),
        [
            edgeNumber,
            sourceBottomY,
            sourceSide,
            sourceTopY,
            sourceX,
            targetBottomY,
            targetSide,
            targetTopY,
            targetX,
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
                    `!stroke-2 ${selected ? '!stroke-pink-600' : '!stroke-blue-400'}`,
                ])}
                onClick={(e) => {
                    if (e.detail === 2) {
                        openDependencyInEditor();
                    }
                }}
            />
            <path
                d={edgePath}
                fill="none"
                strokeOpacity={0}
                strokeWidth={20}
                // eslint-disable-next-line tailwindcss/no-custom-classname
                className="react-flow__edge-interaction"
                onClick={(e) => {
                    if (e.detail === 2) {
                        openDependencyInEditor();
                    }
                }}
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
