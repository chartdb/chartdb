import React from 'react';
import { type NodeProps, type Node, Handle, Position } from '@xyflow/react';

export const TEMP_CURSOR_NODE_ID = '__temp_cursor_node__';
export const TEMP_CURSOR_HANDLE_ID = '__temp-cursor-target__';

export type TempCursorNodeType = Node<
    {
        // Empty data object - this is just a cursor position marker
    },
    'temp-cursor'
>;

export const TempCursorNode: React.FC<NodeProps<TempCursorNodeType>> =
    React.memo(() => {
        // Invisible node that just serves as a connection point
        return (
            <div
                style={{
                    width: 1,
                    height: 1,
                    opacity: 0,
                    pointerEvents: 'none',
                }}
            >
                <Handle
                    id={TEMP_CURSOR_HANDLE_ID}
                    className="!invisible"
                    position={Position.Right}
                    type="target"
                />
            </div>
        );
    });

TempCursorNode.displayName = 'TempCursorNode';
