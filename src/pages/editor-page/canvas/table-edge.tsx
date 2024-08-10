import React, { useMemo } from 'react';
import {
    BaseEdge,
    EdgeProps,
    getSmoothStepPath,
    Position,
    useReactFlow,
} from '@xyflow/react';
import { RIGHT_HANDLE_ID } from './table-node';

export const TableEdge: React.FC<EdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    source,
    target,
}) => {
    const { getInternalNode, getEdge } = useReactFlow();

    const sourceNode = getInternalNode(source);
    const targetNode = getInternalNode(target);
    const edge = getEdge(id);

    const sourceHandle: 'left' | 'right' =
        edge?.sourceHandle === RIGHT_HANDLE_ID ? 'right' : 'left';

    const sourceWidth = sourceNode?.measured.width ?? 0;
    const sourceLeftX =
        sourceHandle === 'left' ? sourceX : sourceX - sourceWidth + 10;
    const sourceRightX =
        sourceHandle === 'left' ? sourceX + sourceWidth + 10 : sourceX;

    const targetWidth = targetNode?.measured.width ?? 0;
    const targetLeftX = targetX;
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
                offset: 20,
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
        ]
    );

    return <BaseEdge id={id} path={edgePath} className="!stroke-2" />;
};
