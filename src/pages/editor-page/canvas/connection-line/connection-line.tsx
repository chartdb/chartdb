import React from 'react';
import type { ConnectionLineComponentProps } from '@xyflow/react';
import { getSmoothStepPath, Position } from '@xyflow/react';
import type { NodeType } from '../canvas';

export const ConnectionLine: React.FC<
    ConnectionLineComponentProps<NodeType>
> = ({ fromX, fromY, toX, toY, fromPosition, toPosition }) => {
    const [edgePath] = getSmoothStepPath({
        sourceX: fromX,
        sourceY: fromY,
        sourcePosition: fromPosition ?? Position.Right,
        targetX: toX,
        targetY: toY,
        targetPosition: toPosition ?? Position.Left,
        borderRadius: 14,
    });

    return (
        <g>
            <path
                fill="none"
                stroke="#ec4899"
                strokeWidth={2}
                strokeDasharray="5,5"
                d={edgePath}
            />
            <circle
                cx={toX}
                cy={toY}
                fill="#fff"
                r={3}
                stroke="#ec4899"
                strokeWidth={1.5}
            />
        </g>
    );
};
