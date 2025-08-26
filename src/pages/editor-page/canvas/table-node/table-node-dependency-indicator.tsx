import { useChartDB } from '@/hooks/use-chartdb';
import type { DBTable } from '@/lib/domain/db-table';
import {
    Handle,
    Position,
    useConnection,
    useUpdateNodeInternals,
} from '@xyflow/react';
import React, { useEffect, useMemo, useRef } from 'react';

export const TOP_SOURCE_HANDLE_ID_PREFIX = 'top_dep_';
export const BOTTOM_SOURCE_HANDLE_ID_PREFIX = 'bottom_dep_';
export const TARGET_DEP_PREFIX = 'target_dep_';
export const TARGET_TOP_DEP_PREFIX = 'target_top_dep_';
export const TARGET_BOTTOM_DEP_PREFIX = 'target_bottom_dep_';

export interface TableNodeDependencyIndicatorProps {
    table: DBTable;
    focused: boolean;
}

export const TableNodeDependencyIndicator: React.FC<TableNodeDependencyIndicatorProps> =
    React.memo(({ table, focused }) => {
        const { dependencies } = useChartDB();
        const updateNodeInternals = useUpdateNodeInternals();
        const connection = useConnection();

        const isConnectionFromView = useMemo(
            () =>
                connection.inProgress &&
                (connection.fromHandle?.id?.startsWith(
                    TOP_SOURCE_HANDLE_ID_PREFIX
                ) ||
                    connection.fromHandle?.id?.startsWith(
                        BOTTOM_SOURCE_HANDLE_ID_PREFIX
                    )),
            [connection.inProgress, connection.fromHandle?.id]
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
                    <Handle
                        id={`${TOP_SOURCE_HANDLE_ID_PREFIX}${table.id}`}
                        className={`!h-4 !w-4 !border-2 !bg-pink-600 ${!focused ? '!invisible' : ''}`}
                        position={Position.Top}
                        type="source"
                    />
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
                {/* Show visible connection points at top and bottom when dragging from view */}
                {!table.isView &&
                !table.isMaterializedView &&
                isConnectionFromView ? (
                    <>
                        {/* Top connection point */}
                        <Handle
                            id={`${TARGET_TOP_DEP_PREFIX}${table.id}`}
                            className="!h-4 !w-4 !border-2 !bg-pink-600"
                            style={{
                                position: 'absolute',
                                top: '-8px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                            }}
                            position={Position.Top}
                            type="target"
                        />
                        {/* Bottom connection point */}
                        <Handle
                            id={`${TARGET_BOTTOM_DEP_PREFIX}${table.id}`}
                            className="!h-4 !w-4 !border-2 !bg-pink-600"
                            style={{
                                position: 'absolute',
                                bottom: '-8px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                            }}
                            position={Position.Bottom}
                            type="target"
                        />
                    </>
                ) : null}
            </>
        );
    });

TableNodeDependencyIndicator.displayName = 'TableNodeDependencyIndicator';
