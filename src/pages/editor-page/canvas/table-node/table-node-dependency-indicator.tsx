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

        const dependencyStats = useMemo(() => {
            const counts = dependencies.reduce((acc, dep) => {
                if (dep.tableId === table.id) {
                    acc.incoming++;
                }
                if (dep.dependentTableId === table.id) {
                    acc.outgoing++;
                }
                return acc;
            }, { incoming: 0, outgoing: 0 });

            return {
                total: counts.incoming + counts.outgoing,
                hasIncoming: counts.incoming > 0,
                hasOutgoing: counts.outgoing > 0
            };
        }, [dependencies, table.id]);

        const previousNumberOfEdgesToTableRef = useRef(dependencyStats.total);

        useEffect(() => {
            if (dependencyStats.total !== previousNumberOfEdgesToTableRef.current) {
                const timeoutId = setTimeout(() => {
                    updateNodeInternals(table.id);
                    previousNumberOfEdgesToTableRef.current = dependencyStats.total;
                }, 0);
                return () => clearTimeout(timeoutId);
            }
        }, [dependencyStats.total, table.id, updateNodeInternals]);

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
                    { length: dependencyStats.total },
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
                        id={`${TARGET_DEP_PREFIX}${dependencyStats.total}_${table.id}`}
                        className={
                            isTarget
                                ? '!absolute !left-0 !top-0 !h-full !w-full !transform-none !rounded-none !border-none !opacity-0'
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
