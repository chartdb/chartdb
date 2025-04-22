import React, { useCallback, useMemo } from 'react';
import type { Edge, EdgeProps } from '@xyflow/react';
import { getSmoothStepPath, Position, useReactFlow } from '@xyflow/react';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import { RIGHT_HANDLE_ID_PREFIX } from '../table-node/table-node-field';
import { useChartDB } from '@/hooks/use-chartdb';
import { useLayout } from '@/hooks/use-layout';
import { cn } from '@/lib/utils';
import { getCardinalityMarkerId } from '../canvas-utils';
import { useDiff } from '@/context/diff-context/use-diff';

export type RelationshipEdgeType = Edge<
    {
        relationship: DBRelationship;
        highlighted?: boolean;
    },
    'relationship-edge'
>;

export const RelationshipEdge: React.FC<EdgeProps<RelationshipEdgeType>> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    source,
    target,
    selected,
    data,
}) => {
    const { getInternalNode, getEdge } = useReactFlow();
    const { openRelationshipFromSidebar, selectSidebarSection } = useLayout();
    const { checkIfRelationshipRemoved, checkIfNewRelationship } = useDiff();

    const { relationships } = useChartDB();

    const relationship = data?.relationship;

    const openRelationshipInEditor = useCallback(() => {
        selectSidebarSection('relationships');
        openRelationshipFromSidebar(id);
    }, [id, openRelationshipFromSidebar, selectSidebarSection]);

    const edgeNumber = useMemo(
        () =>
            relationships
                .filter(
                    (relationship) =>
                        (relationship.targetTableId === target &&
                            relationship.sourceTableId === source) ||
                        (relationship.targetTableId === source &&
                            relationship.sourceTableId === target)
                )
                .findIndex((relationship) => relationship.id === id),
        [relationships, id, source, target]
    );

    const sourceNode = getInternalNode(source);
    const targetNode = getInternalNode(target);
    const edge = getEdge(id);

    const sourceHandle: 'left' | 'right' = edge?.sourceHandle?.startsWith?.(
        RIGHT_HANDLE_ID_PREFIX
    )
        ? 'right'
        : 'left';

    const sourceWidth = sourceNode?.measured.width ?? 0;
    const sourceLeftX =
        sourceHandle === 'left' ? sourceX + 3 : sourceX - sourceWidth - 10;
    const sourceRightX =
        sourceHandle === 'left' ? sourceX + sourceWidth + 9 : sourceX;

    const targetWidth = targetNode?.measured.width ?? 0;
    const targetLeftX = targetX - 1;
    const targetRightX = targetX + targetWidth + 10;

    const { sourceSide, targetSide } = useMemo(() => {
        const distances = {
            leftToLeft: Math.abs(sourceLeftX - targetLeftX),
            leftToRight: Math.abs(sourceLeftX - targetRightX),
            rightToLeft: Math.abs(sourceRightX - targetLeftX),
            rightToRight: Math.abs(sourceRightX - targetRightX),
        };

        const minDistance = Math.min(
            distances.leftToLeft,
            distances.leftToRight,
            distances.rightToLeft,
            distances.rightToRight
        );

        const minDistanceKey = Object.keys(distances).find(
            (key) => distances[key as keyof typeof distances] === minDistance
        ) as keyof typeof distances;

        switch (minDistanceKey) {
            case 'leftToRight':
                return { sourceSide: 'left', targetSide: 'right' };
            case 'rightToLeft':
                return { sourceSide: 'right', targetSide: 'left' };
            case 'rightToRight':
                return { sourceSide: 'right', targetSide: 'right' };
            default:
                return { sourceSide: 'left', targetSide: 'left' };
        }
    }, [sourceLeftX, sourceRightX, targetLeftX, targetRightX]);

    const [edgePath] = useMemo(
        () =>
            getSmoothStepPath({
                sourceX: sourceSide === 'left' ? sourceLeftX : sourceRightX,
                sourceY,
                targetX: targetSide === 'left' ? targetLeftX : targetRightX,
                targetY,
                borderRadius: 14,
                sourcePosition:
                    sourceSide === 'left' ? Position.Left : Position.Right,
                targetPosition:
                    targetSide === 'left' ? Position.Left : Position.Right,
                offset: (edgeNumber + 1) * 14,
            }),
        [
            sourceSide,
            targetSide,
            sourceLeftX,
            sourceRightX,
            targetLeftX,
            targetRightX,
            sourceY,
            targetY,
            edgeNumber,
        ]
    );

    const sourceMarker = useMemo(
        () =>
            getCardinalityMarkerId({
                cardinality: relationship?.sourceCardinality ?? 'one',
                selected: selected ?? false,
                side: sourceSide as 'left' | 'right',
            }),
        [relationship?.sourceCardinality, selected, sourceSide]
    );
    const targetMarker = useMemo(
        () =>
            getCardinalityMarkerId({
                cardinality: relationship?.targetCardinality ?? 'one',
                selected: selected ?? false,
                side: targetSide as 'left' | 'right',
            }),
        [relationship?.targetCardinality, selected, targetSide]
    );

    const isDiffNewRelationship = useMemo(
        () =>
            relationship?.id
                ? checkIfNewRelationship({ relationshipId: relationship.id })
                : false,
        [checkIfNewRelationship, relationship?.id]
    );

    const isDiffRelationshipRemoved = useMemo(
        () =>
            relationship?.id
                ? checkIfRelationshipRemoved({
                      relationshipId: relationship.id,
                  })
                : false,
        [checkIfRelationshipRemoved, relationship?.id]
    );

    return (
        <>
            <path
                id={id}
                d={edgePath}
                markerStart={`url(#${sourceMarker})`}
                markerEnd={`url(#${targetMarker})`}
                fill="none"
                className={cn([
                    'react-flow__edge-path',
                    `!stroke-2 ${selected ? '!stroke-pink-600' : '!stroke-slate-400'}`,
                    {
                        '!stroke-green-500 !stroke-[3px]':
                            isDiffNewRelationship,
                        '!stroke-red-500 !stroke-[3px]':
                            isDiffRelationshipRemoved,
                    },
                ])}
                onClick={(e) => {
                    if (e.detail === 2) {
                        openRelationshipInEditor();
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
                        openRelationshipInEditor();
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
