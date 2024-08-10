import React from 'react';
import { randomHSLA } from '@/lib/utils';
import {
    Handle,
    Position,
    NodeProps,
    Node,
    useConnection,
} from '@xyflow/react';
import { Button } from '@/components/button/button';
import { Ellipsis, Trash2 } from 'lucide-react';

export const LEFT_HANDLE_ID = 'left-handle';
export const RIGHT_HANDLE_ID = 'right-handle';

export type TableNodeProps = Node<Record<string, never>, 'table'>;

export const TableNode: React.FC<NodeProps<TableNodeProps>> = ({
    selected,
    dragging,
    id,
}) => {
    // const { getEdges } = useReactFlow();
    const connection = useConnection();
    const tableColor = randomHSLA();
    const focused = selected && !dragging;
    const isTarget = connection.inProgress && connection.fromNode.id !== id;
    // const edges = getEdges();
    // const numberOfEdges = edges.filter((edge) => edge.target === id).length;
    // console.log(numberOfEdges)

    const renderColumn = () => (
        <div className="flex relative items-center h-8 text-sm px-3 border-t justify-between hover:bg-primary-foreground group last:rounded-b-lg">
            {/* If handles are conditionally rendered and not present initially, you need to update the node internals https://reactflow.dev/docs/api/hooks/use-update-node-internals/ */}
            {/* In this case we don't need to use useUpdateNodeInternals, since !isConnecting is true at the beginning and all handles are rendered initially. */}
            {!connection.inProgress && (
                <>
                    <Handle
                        // className="customHandle"
                        id={RIGHT_HANDLE_ID}
                        className={`!h-3 !w-3 !bg-slate-400 ${!focused ? '!invisible' : ''}`}
                        position={Position.Right}
                        type="source"
                    />
                    <Handle
                        // className="customHandle"
                        id={LEFT_HANDLE_ID}
                        className={`!h-3 !w-3 !bg-slate-400 ${!focused ? '!invisible' : ''}`}
                        position={Position.Left}
                        type="source"
                    />
                </>
            )}
            {/* We want to disable the target handle, if the connection was started from this node */}
            {(!connection.inProgress || isTarget) && (
                <Handle
                    className={
                        isTarget
                            ? '!w-full !h-full !absolute !top-0 !left-0 !rounded-none !border-none !transform-none !opacity-0'
                            : `!h-3 !w-3 !bg-slate-400 ${!focused ? '!invisible' : ''}`
                    }
                    // style={
                    //     isTarget
                    //         ? {
                    //               width: '100%',
                    //               height: '100%',
                    //             //   background: 'blue',
                    //               position: 'absolute',
                    //               top: 0,
                    //               left: 0,
                    //               borderRadius: 0,
                    //               transform: 'none',
                    //               border: 'none',
                    //               // opacity: 0,
                    //           }
                    //         : {}
                    // }
                    // className="customHandle"
                    position={Position.Left}
                    type="target"
                    isConnectableStart={false}
                />
            )}

            {/* <Handle
                id="1"
                className={`!h-3 !w-3 !bg-slate-400 ${!focused ? '!invisible' : ''}`}
                type="target"
                isConnectableEnd={true}
                isConnectableStart={true}
                position={Position.Left}
                isConnectable={true}
            /> */}
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
            {/* <Handle
                id="2"
                className={`!h-3 !w-3 !bg-slate-400 ${!focused ? '!invisible' : ''}`}
                type="source"
                position={Position.Right}
                isConnectable={true}
                isConnectableEnd={true}
                isConnectableStart={true}
            /> */}
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
