import React, { useEffect } from 'react';
import {
    Handle,
    Position,
    useConnection,
    useUpdateNodeInternals,
} from '@xyflow/react';
import { Button } from '@/components/button/button';
import { KeyRound, Trash2 } from 'lucide-react';

import { DBField } from '@/lib/domain/db-field';
import { useChartDB } from '@/hooks/use-chartdb';

export const LEFT_HANDLE_ID_PREFIX = 'left_';
export const RIGHT_HANDLE_ID_PREFIX = 'right_';
export const TARGET_ID_PREFIX = 'target_';

export interface TableNodeFieldProps {
    tableNodeId: string;
    field: DBField;
    focused: boolean;
    highlighted: boolean;
}

export const TableNodeField: React.FC<TableNodeFieldProps> = ({
    field,
    focused,
    tableNodeId,
    highlighted,
}) => {
    const { removeField, relationships } = useChartDB();
    const updateNodeInternals = useUpdateNodeInternals();
    const connection = useConnection();
    const isTarget =
        connection.inProgress && connection.fromNode.id !== tableNodeId;
    const numberOfEdgesToField = relationships.filter(
        (relationship) =>
            relationship.targetTableId === tableNodeId &&
            relationship.targetFieldId === field.id
    ).length;

    useEffect(() => {
        updateNodeInternals(tableNodeId);
    }, [tableNodeId, updateNodeInternals, numberOfEdgesToField]);

    return (
        <div
            className={`group relative flex h-8 items-center justify-between border-t px-3 text-sm last:rounded-b-[6px] hover:bg-slate-100 dark:hover:bg-slate-800 ${highlighted ? 'bg-pink-100 dark:bg-pink-900' : ''} transition-colors`}
        >
            {!connection.inProgress && (
                <>
                    <Handle
                        id={`${RIGHT_HANDLE_ID_PREFIX}${field.id}`}
                        className={`!h-4 !w-4 !border-2 !bg-pink-600 ${!focused ? '!invisible' : ''}`}
                        position={Position.Right}
                        type="source"
                    />
                    <Handle
                        id={`${LEFT_HANDLE_ID_PREFIX}${field.id}`}
                        className={`!h-4 !w-4 !border-2 !bg-pink-600 ${!focused ? '!invisible' : ''}`}
                        position={Position.Left}
                        type="source"
                    />
                </>
            )}
            {(!connection.inProgress || isTarget) && (
                <>
                    {Array.from(
                        { length: numberOfEdgesToField },
                        (_, index) => index
                    ).map((index) => (
                        <Handle
                            id={`${TARGET_ID_PREFIX}${index}_${field.id}`}
                            key={`${TARGET_ID_PREFIX}${index}_${field.id}`}
                            className={`!invisible`}
                            position={Position.Left}
                            type="target"
                        />
                    ))}
                    <Handle
                        id={`${TARGET_ID_PREFIX}${numberOfEdgesToField}_${field.id}`}
                        className={
                            isTarget
                                ? '!absolute !left-0 !top-0 !h-full !w-full !transform-none !rounded-none !border-none !opacity-0'
                                : `!invisible`
                        }
                        position={Position.Left}
                        type="target"
                    />
                </>
            )}
            <div className="block w-2/3 truncate text-left">{field.name}</div>
            <div className="flex w-2/3 justify-end gap-2">
                {field.primaryKey ? (
                    <div className="text-muted-foreground group-hover:hidden">
                        <KeyRound size={14} />
                    </div>
                ) : null}

                <div className="content-center truncate text-right text-xs text-muted-foreground group-hover:hidden">
                    {field.type.name}
                </div>
                <div className="hidden flex-row group-hover:flex">
                    <Button
                        variant="ghost"
                        className="size-6 p-0 hover:bg-primary-foreground"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeField(tableNodeId, field.id);
                        }}
                    >
                        <Trash2 className="size-3.5 text-red-700" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
