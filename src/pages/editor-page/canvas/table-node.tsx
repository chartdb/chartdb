import React, { useEffect } from 'react';
import { randomHSLA } from '@/lib/utils';
import {
    Handle,
    Position,
    NodeProps,
    Node,
    useConnection,
    useReactFlow,
    useUpdateNodeInternals,
} from '@xyflow/react';
import { Button } from '@/components/button/button';
import { Ellipsis, Trash2 } from 'lucide-react';

export const LEFT_HANDLE_ID_PREFIX = 'left-handle';
export const RIGHT_HANDLE_ID_PREFIX = 'right-handle';
export const TARGET_ID_PREFIX = 'target-';

export type TableNodeProps = Node<Record<string, never>, 'table'>;

export const TableNode: React.FC<NodeProps<TableNodeProps>> = ({
    selected,
    dragging,
    id,
}) => {
    const { getEdges } = useReactFlow();
    const updateNodeInternals = useUpdateNodeInternals();
    const connection = useConnection();
    const tableColor = randomHSLA();
    const focused = selected && !dragging;
    const isTarget = connection.inProgress && connection.fromNode.id !== id;
    const edges = getEdges();
    const numberOfEdges = edges.filter((edge) => edge.target === id).length;

    useEffect(() => {
        updateNodeInternals(id);
    }, [id, updateNodeInternals, numberOfEdges]);

    const renderColumn = () => (
        <div className="flex relative items-center h-8 text-sm px-3 border-t justify-between hover:bg-primary-foreground group last:rounded-b-lg">
            {!connection.inProgress && (
                <>
                    <Handle
                        id={RIGHT_HANDLE_ID_PREFIX}
                        className={`!h-3 !w-3 !bg-slate-400 ${!focused ? '!invisible' : ''}`}
                        position={Position.Right}
                        type="source"
                    />
                    <Handle
                        id={LEFT_HANDLE_ID_PREFIX}
                        className={`!h-3 !w-3 !bg-slate-400 ${!focused ? '!invisible' : ''}`}
                        position={Position.Left}
                        type="source"
                    />
                </>
            )}
            {(!connection.inProgress || isTarget) && (
                <>
                    {Array.from(
                        { length: numberOfEdges + 1 },
                        (_, index) => index
                    ).map((index) => (
                        <Handle
                            id={`${TARGET_ID_PREFIX}${index}`}
                            key={`${TARGET_ID_PREFIX}${index}`}
                            className={`!invisible`}
                            position={Position.Left}
                            type="target"
                        />
                    ))}
                    <Handle
                        id={`${TARGET_ID_PREFIX}${numberOfEdges}`}
                        className={
                            isTarget
                                ? '!w-full !h-full !absolute !top-0 !left-0 !rounded-none !border-none !transform-none !opacity-0'
                                : `!invisible`
                        }
                        position={Position.Left}
                        type="target"
                    />
                </>
            )}
            <div className="flex">id</div>
            <div className="flex">
                <div className="text-muted-foreground flex group-hover:hidden">
                    bigint
                </div>
                <div className="flex-row hidden group-hover:flex">
                    <Button
                        variant="ghost"
                        className="hover:bg-primary-foreground p-0 w-6 h-6"
                    >
                        <Trash2 className="h-3.5 w-3.5 text-red-700" />
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div
            className={`flex flex-col w-48 bg-background border ${selected ? 'border-slate-400' : ''} rounded-lg shadow-sm`}
        >
            <div
                className="h-2 rounded-t-lg"
                style={{ backgroundColor: tableColor }}
            ></div>
            <div className="flex items-center h-9 bg-secondary px-2 justify-between group">
                <div className="flex text-sm font-bold">table_1</div>
                <div className="flex-row hidden group-hover:flex">
                    <Button
                        variant="ghost"
                        className="hover:bg-primary-foreground p-0 w-6 h-6 text-slate-500 hover:text-slate-700"
                    >
                        <Ellipsis className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            {renderColumn()}
        </div>
    );
};
