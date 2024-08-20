import React from 'react';
import { NodeProps, Node } from '@xyflow/react';
import { Button } from '@/components/button/button';
import { Ellipsis, Table2 } from 'lucide-react';
import { Label } from '@/components/label/label';
import { DBTable } from '@/lib/domain/db-table';
import { TableNodeField } from './table-node-field';

export type TableNodeType = Node<
    {
        table: DBTable;
    },
    'table'
>;

export const TableNode: React.FC<NodeProps<TableNodeType>> = ({
    selected,
    dragging,
    id,
    data: { table },
}) => {
    const focused = !!selected && !dragging;

    return (
        <div
            className={`flex flex-col w-56 bg-background border ${selected ? 'border-slate-400' : ''} rounded-lg shadow-sm`}
        >
            <div
                className="h-2 rounded-t-lg"
                style={{ backgroundColor: table.color }}
            ></div>
            <div className="flex items-center h-9 bg-secondary px-2 justify-between group">
                <div className="flex items-center gap-1">
                    <Table2 className="h-3.5 w-3.5 text-gray-600" />
                    <Label className="text-sm font-bold">{table.name}</Label>
                </div>
                <div className="flex-row hidden group-hover:flex">
                    <Button
                        variant="ghost"
                        className="hover:bg-primary-foreground p-0 w-6 h-6 text-slate-500 hover:text-slate-700"
                    >
                        <Ellipsis className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            {table.fields.map((field) => (
                <TableNodeField
                    key={field.id}
                    focused={focused}
                    tableNodeId={id}
                    field={field}
                />
            ))}
        </div>
    );
};
