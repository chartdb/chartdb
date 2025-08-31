import { useChartDB } from '@/hooks/use-chartdb';
import type { DBTable } from '@/lib/domain/db-table';
import {
    Handle,
    Position,
    useConnection,
    useUpdateNodeInternals,
} from '@xyflow/react';
import React, { useEffect, useMemo, useRef } from 'react';
import {
    LEFT_HANDLE_ID_PREFIX,
    RIGHT_HANDLE_ID_PREFIX,
} from './table-node-field';

export const TOP_SOURCE_HANDLE_ID_PREFIX = 'top_dep_';
export const BOTTOM_SOURCE_HANDLE_ID_PREFIX = 'bottom_dep_';
export const TARGET_DEP_PREFIX = 'target_dep_';

export interface TableNodeDependencyIndicatorProps {
    table: DBTable;
    focused: boolean;
}

export const TableNodeDependencyIndicator: React.FC<TableNodeDependencyIndicatorProps> =
    React.memo(({ table, focused }) => {
        const { dependencies } = useChartDB();
        const updateNodeInternals = useUpdateNodeInternals();
        const connection = useConnection();

        const isTarget = useMemo(
            () =>
                connection.inProgress &&
                connection.fromNode.id !== table.id &&
                (connection.fromHandle.id?.startsWith(
                    TOP_SOURCE_HANDLE_ID_PREFIX
                ) ||
                    connection.fromHandle.id?.startsWith(
                        BOTTOM_SOURCE_HANDLE_ID_PREFIX
                    )),
            [connection, table.id]
        );

        const isTargetFromTable = useMemo(
            () =>
                connection.inProgress &&
                connection.fromNode.id !== table.id &&
                (connection.fromHandle.id?.startsWith(RIGHT_HANDLE_ID_PREFIX) ||
                    connection.fromHandle.id?.startsWith(
                        LEFT_HANDLE_ID_PREFIX
                    )),
            [
                connection.inProgress,
                connection.fromNode?.id,
                connection.fromHandle?.id,
                table.id,
            ]
        );

        const numberOfEdgesToTable = useMemo(
            () =>
                dependencies.filter(
                    (dependency) => dependency.tableId === table.id
                ).length,
            [dependencies, table.id]
        );

        const previousNumberOfEdgesToTableRef = useRef(numberOfEdgesToTable);

        useEffect(() => {
            if (
                previousNumberOfEdgesToTableRef.current !== numberOfEdgesToTable
            ) {
                updateNodeInternals(table.id);
                previousNumberOfEdgesToTableRef.current = numberOfEdgesToTable;
            }
        }, [table.id, updateNodeInternals, numberOfEdgesToTable]);

        return (
            <>
                {table.isView || table.isMaterializedView ? (
                    <>
                        <Handle
                            id={`${TOP_SOURCE_HANDLE_ID_PREFIX}${table.id}`}
                            className={`!h-4 !w-4 !border-2 !bg-pink-600 ${!focused || isTargetFromTable ? '!invisible' : ''}`}
                            position={Position.Top}
                            type="source"
                        />
                        <Handle
                            id={`${BOTTOM_SOURCE_HANDLE_ID_PREFIX}${table.id}`}
                            className={`!z-10 !h-4 !w-4 !border-2 !bg-pink-600 ${!focused || isTargetFromTable ? '!invisible' : ''}`}
                            position={Position.Bottom}
                            type="source"
                        />
                    </>
                ) : null}
                {Array.from(
                    { length: numberOfEdgesToTable },
                    (_, index) => index
                ).map((index) => (
                    <Handle
                        id={`${TARGET_DEP_PREFIX}${index}_${table.id}`}
                        key={`${TARGET_DEP_PREFIX}${index}_${table.id}`}
                        className={`!invisible`}
                        position={Position.Top}
                        type="target"
                    />
                ))}
                {isTarget ? (
                    <Handle
                        id={`${TARGET_DEP_PREFIX}${numberOfEdgesToTable}_${table.id}`}
                        className={
                            isTarget
                                ? '!absolute !inset-0 !z-10 !h-full !w-full !transform-none !rounded-none !border-none !opacity-0'
                                : `!invisible`
                        }
                        position={Position.Top}
                        type="target"
                    />
                ) : null}
            </>
        );
    });

TableNodeDependencyIndicator.displayName = 'TableNodeDependencyIndicator';
