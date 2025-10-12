import React from 'react';
import type { Edge, EdgeProps } from '@xyflow/react';
import { getSmoothStepPath, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';

export const TEMP_FLOATING_EDGE_ID = '__temp_programmatic_edge__';

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
            });

            return (
                <g>
                    <path
                        id={id}
                        className={cn([
                            'react-flow__edge-path',
                            `!stroke-2 !stroke-slate-400`,
                        ])}
                        d={edgePath}
                        strokeWidth={2}
                        stroke="#6366f1"
                        strokeDasharray="5,5"
                        opacity={1}
                        fill="none"
                        style={{
                            pointerEvents: 'none',
                        }}
                    />
                </g>
            );
        }
    );

TempFloatingEdge.displayName = 'TempFloatingEdge';
