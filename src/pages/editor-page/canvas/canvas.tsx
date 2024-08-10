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
    Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TableNode } from './table-node';
import { TableEdge } from './table-edge';

export interface CanvasProps {}

const initialNodes = [
    {
        id: '3',
        type: 'table',
        position: { x: 200, y: 200 },
        data: { label: '3' },
    },
    {
        id: '1',
        type: 'table',
        position: { x: 400, y: 400 },
        data: { label: '1' },
    },
    {
        id: '2',
        type: 'table',
        position: { x: 0, y: 0 },
        data: { label: '2' },
    },
    // { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
    // { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
];
// const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];
const initialEdges: Edge[] = [];

export const Canvas: React.FC<CanvasProps> = () => {
    const nodeTypes = useMemo(() => ({ table: TableNode }), []);
    const edgeTypes = useMemo(() => ({ 'table-edge': TableEdge }), []);

    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Parameters<typeof addEdge>[0]) =>
            setEdges((eds) => addEdge({ ...params, type: 'table-edge' }, eds)),
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
                edgeTypes={edgeTypes}
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
