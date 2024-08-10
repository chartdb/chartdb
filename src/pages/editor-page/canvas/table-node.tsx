import React from 'react';
import { randomHSLA } from '@/lib/utils';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Button } from '@/components/button/button';
import { Ellipsis, Trash2 } from 'lucide-react';

export type TableNodeProps = Node<Record<string, never>, 'table'>;

export const TableNode: React.FC<NodeProps<TableNodeProps>> = ({
    selected,
    dragging,
}) => {
    const tableColor = randomHSLA();
    const focused = selected && !dragging;

    const renderColumn = () => (
        <div className="flex relative items-center h-8 text-sm px-3 border-t justify-between hover:bg-primary-foreground group last:rounded-b-lg">
            {focused ? (
                <Handle
                    className="!h-3 !w-3 !bg-slate-400"
                    type="target"
                    position={Position.Left}
                    isConnectable={true}
                />
            ) : null}
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
            {renderColumn()}
            {renderColumn()}
        </div>
    );
};
