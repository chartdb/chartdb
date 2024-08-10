import React from 'react';
import { randomHSLA } from '@/lib/utils';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

export type TableNodeProps = Node<Record<string, never>, 'table'>;

export const TableNode: React.FC<NodeProps<TableNodeProps>> = ({
    selected,
    dragging,
}) => {
    const tableColor = randomHSLA();
    const focused = selected && !dragging;

    const renderColumn = () => (
        <div className="flex relative items-center h-8 text-sm px-3 border-t justify-between hover:bg-secondary">
            {focused ? (
                <Handle
                    className="!h-3 !w-3 !bg-slate-400"
                    type="target"
                    position={Position.Left}
                    isConnectable={true}
                />
            ) : null}
            <div>id</div>
            <div className="text-muted-foreground">bigint</div>
            {focused ? (
                <Handle
                    className="!h-3 !w-3 !bg-slate-400"
                    type="target"
                    position={Position.Right}
                    isConnectable={true}
                />
            ) : null}
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
            <div className="flex items-center h-9 text-sm font-bold bg-secondary px-2">
                table_1
            </div>
            {renderColumn()}
            {renderColumn()}
            {renderColumn()}
        </div>
    );
};
