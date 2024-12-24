import React, { useEffect, useMemo, useRef } from 'react';
import {
    Handle,
    Position,
    useConnection,
    useUpdateNodeInternals,
} from '@xyflow/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/tooltip/tooltip';
import { KeyRound, MessageCircleMore, Snowflake } from 'lucide-react';

import type { DBField } from '@/lib/domain/db-field';
import { useChartDB } from '@/hooks/use-chartdb';
import { cn } from '@/lib/utils';

export const LEFT_HANDLE_ID_PREFIX = 'left_rel_';
export const RIGHT_HANDLE_ID_PREFIX = 'right_rel_';
export const TARGET_ID_PREFIX = 'target_rel_';

export interface TableNodeFieldProps {
    tableNodeId: string;
    field: DBField;
    focused: boolean;
    highlighted: boolean;
    visible: boolean;
    isConnectable: boolean;
}

export const TableNodeField: React.FC<TableNodeFieldProps> = React.memo(
    ({ field, focused, tableNodeId, highlighted, visible, isConnectable }) => {
        const { relationships, readonly } = useChartDB();
        const updateNodeInternals = useUpdateNodeInternals();
        const connection = useConnection();
        const isTarget = useMemo(
            () =>
                connection.inProgress &&
                connection.fromNode.id !== tableNodeId &&
                (connection.fromHandle.id?.startsWith(RIGHT_HANDLE_ID_PREFIX) ||
                    connection.fromHandle.id?.startsWith(
                        LEFT_HANDLE_ID_PREFIX
                    )),
            [connection, tableNodeId]
        );
        const numberOfEdgesToField = useMemo(
            () =>
                relationships.filter(
                    (relationship) =>
                        relationship.targetTableId === tableNodeId &&
                        relationship.targetFieldId === field.id
                ).length,
            [relationships, tableNodeId, field.id]
        );

        const previousNumberOfEdgesToFieldRef = useRef(numberOfEdgesToField);

        useEffect(() => {
            if (
                previousNumberOfEdgesToFieldRef.current !== numberOfEdgesToField
            ) {
                updateNodeInternals(tableNodeId);
                previousNumberOfEdgesToFieldRef.current = numberOfEdgesToField;
            }
        }, [tableNodeId, updateNodeInternals, numberOfEdgesToField]);

        return (
            <div
                className={`group relative flex h-8 items-center justify-between gap-1 border-t px-2.5 text-sm last:rounded-b-[6px] hover:bg-slate-100 dark:hover:bg-slate-800 ${highlighted ? 'bg-pink-100 dark:bg-pink-900' : ''
                    } transition-all duration-200 ease-in-out ${visible
                        ? 'max-h-8 opacity-100'
                        : 'z-0 max-h-0 overflow-hidden opacity-0'
                    }`}
            >
                {isConnectable ? (
                    <>
                        <Handle
                            id={`${RIGHT_HANDLE_ID_PREFIX}${field.id}`}
                            className={`!h-4 !w-4 !border-2 !bg-pink-600 ${!focused || readonly ? '!invisible' : ''}`}
                            position={Position.Right}
                            type="source"
                        />
                        <Handle
                            id={`${LEFT_HANDLE_ID_PREFIX}${field.id}`}
                            className={`!h-4 !w-4 !border-2 !bg-pink-600 ${!focused || readonly ? '!invisible' : ''}`}
                            position={Position.Left}
                            type="source"
                        />
                    </>
                ) : null}
                {(!connection.inProgress || isTarget) && isConnectable && (
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

                <div className={`flex gap-1 items-center truncate text-left ${field.primaryKey || field.unique ? "font-bold" : "pl-4"}`}>
                    {field.primaryKey && (
                        <div className='text-muted-foreground'>
                            <KeyRound size={14} />
                        </div>
                    )}

                    {field.unique && !field.primaryKey && (
                        <div className='text-muted-foreground'>
                            <Snowflake size={14} />
                        </div>
                    )}

                    {field.name}
                </div>
                <div className="flex max-w-[50%] justify-end gap-2 truncate hover:shrink-0">
                    <div className="flex items-center gap-1">
                        {
                            field.comments && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className='text-muted-foreground cursor-pointer'>
                                            <MessageCircleMore size={14} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>{field.comments}</TooltipContent>
                                </Tooltip>
                            )
                        }
                    </div>

                    <div
                        className={cn(
                            'content-center truncate text-right text-xs text-muted-foreground'
                        )}
                    >
                        {field.type.name}
                        {field.nullable && '?'}
                    </div>
                </div>
            </div>
        );
    }
);

TableNodeField.displayName = 'TableNodeField';
