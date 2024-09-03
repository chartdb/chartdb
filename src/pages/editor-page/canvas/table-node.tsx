import React, { useCallback } from 'react';
import { NodeProps, Node, NodeResizer } from '@xyflow/react';
import { Button } from '@/components/button/button';
import {
    ChevronsLeftRight,
    ChevronsRightLeft,
    Pencil,
    Table2,
} from 'lucide-react';
import { Label } from '@/components/label/label';
import { DBTable } from '@/lib/domain/db-table';
import { TableNodeField } from './table-node-field';
import { useLayout } from '@/hooks/use-layout';
import { useChartDB } from '@/hooks/use-chartdb';

export type TableNodeType = Node<
    {
        table: DBTable;
    },
    'table'
>;

const MAX_TABLE_SIZE = 450;
const MID_TABLE_SIZE = 337;
const MIN_TABLE_SIZE = 224;

export const TableNode: React.FC<NodeProps<TableNodeType>> = ({
    selected,
    dragging,
    id,
    data: { table },
}) => {
    const { updateTable } = useChartDB();
    const { openTableFromSidebar, selectSidebarSection } = useLayout();
    const focused = !!selected && !dragging;

    const openTableInEditor = () => {
        selectSidebarSection('tables');
        openTableFromSidebar(table.id);
    };

    const expandTable = useCallback(() => {
        updateTable(table.id, {
            width:
                (table.width ?? 224) < MID_TABLE_SIZE
                    ? MID_TABLE_SIZE
                    : MAX_TABLE_SIZE,
        });
    }, [table.id, table.width, updateTable]);

    const shrinkTable = useCallback(() => {
        updateTable(table.id, {
            width: MIN_TABLE_SIZE,
        });
    }, [table.id, updateTable]);

    return (
        <div
            className={`flex w-full flex-col border-2 bg-slate-50 ${selected ? 'border-pink-600' : 'border-slate-500'} rounded-lg shadow-sm`}
            onClick={(e) => {
                if (e.detail === 2) {
                    openTableInEditor();
                }
            }}
        >
            <NodeResizer
                isVisible={focused}
                lineClassName="!border-none !w-2"
                minWidth={MIN_TABLE_SIZE}
                maxWidth={MAX_TABLE_SIZE}
                shouldResize={(event) => event.dy === 0}
                handleClassName="!hidden"
            />
            <div
                className="h-2 rounded-t-[6px]"
                style={{ backgroundColor: table.color }}
            ></div>
            <div className="group flex h-9 items-center justify-between bg-slate-200 px-2">
                <div className="flex min-w-0 flex-1 items-center gap-1">
                    <Table2 className="size-3.5 shrink-0 text-gray-600" />
                    <Label className="truncate text-sm font-bold">
                        {table.name}
                    </Label>
                </div>
                <div className="hidden shrink-0 flex-row group-hover:flex">
                    <Button
                        variant="ghost"
                        className="size-6 p-0 text-slate-500 hover:bg-primary-foreground hover:text-slate-700"
                        onClick={openTableInEditor}
                    >
                        <Pencil className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        className="size-6 p-0 text-slate-500 hover:bg-primary-foreground hover:text-slate-700"
                        onClick={
                            table.width !== MAX_TABLE_SIZE
                                ? expandTable
                                : shrinkTable
                        }
                    >
                        {table.width !== MAX_TABLE_SIZE ? (
                            <ChevronsLeftRight className="size-4" />
                        ) : (
                            <ChevronsRightLeft className="size-4" />
                        )}
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
