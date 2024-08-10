import React, { useCallback, useMemo } from 'react';
import {
    ReactFlow,
    useEdgesState,
    useNodesState,
    addEdge,
    Background,
    BackgroundVariant,
    MiniMap,
    Controls,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TableNode } from './table-node';

export interface CanvasProps {}

const initialNodes = [
    {
        id: '1111',
        type: 'table',
        position: { x: 400, y: 400 },
        data: { label: '1' },
    },
    { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
    { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

export const Canvas: React.FC<CanvasProps> = () => {
    const nodeTypes = useMemo(() => ({ table: TableNode }), []);

    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Parameters<typeof addEdge>[0]) =>
            setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="flex h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                proOptions={{
                    hideAttribution: true,
                }}
                fitView={false} // todo think about it
                nodeTypes={nodeTypes}
            >
                <Controls />
                <MiniMap
                    style={{
                        width: 100,
                        height: 100,
                    }}
                />
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={16}
                    size={1}
                    bgColor="#ffffff"
                />
            </ReactFlow>
        </div>
    );
};
