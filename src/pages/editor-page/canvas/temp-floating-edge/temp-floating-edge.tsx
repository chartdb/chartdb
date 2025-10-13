import React from 'react';
import type { Edge, EdgeProps } from '@xyflow/react';
import { getSmoothStepPath, Position } from '@xyflow/react';

export const TEMP_FLOATING_EDGE_ID = '__temp_floating_edge__';

export type TempFloatingEdgeType = Edge<
    {
        // No relationship data - this is a temporary visual edge
    },
    'temp-floating-edge'
>;

export const TempFloatingEdge: React.FC<EdgeProps<TempFloatingEdgeType>> =
    React.memo(
        ({
            id,
            sourceX,
            sourceY,
            targetX,
            targetY,
            sourcePosition = Position.Right,
            targetPosition = Position.Left,
        }) => {
            const [edgePath] = getSmoothStepPath({
                sourceX,
                sourceY,
                sourcePosition,
                targetX,
                targetY,
                targetPosition,
                borderRadius: 14,
            });

            return (
                <g>
                    <path
                        id={id}
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth={2}
                        strokeDasharray="5,5"
                        d={edgePath}
                        style={{
                            pointerEvents: 'none',
                        }}
                    />
                    <circle
                        cx={targetX}
                        cy={targetY}
                        fill="#fff"
                        r={3}
                        stroke="#ec4899"
                        strokeWidth={1.5}
                        style={{
                            pointerEvents: 'none',
                        }}
                    />
                </g>
            );
        }
    );

TempFloatingEdge.displayName = 'TempFloatingEdge';
