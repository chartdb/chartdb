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
        const { getTable, dependencies } = useChartDB();
        const updateNodeInternals = useUpdateNodeInternals();
        const connection = useConnection();
        const isTarget = useMemo(() => {
            if (!connection.inProgress) {
                return false;
            }

            const sourceTable = connection.fromNode?.id
                ? getTable(connection.fromNode.id)
                : null;

            if (!sourceTable) {
                return false;
            }

            const isSourceTableView =
                sourceTable.isView || sourceTable.isMaterializedView;
            const isTableView = table.isView || table.isMaterializedView;
            return (
                ((isSourceTableView && !isTableView) ||
                    (!isSourceTableView && isTableView)) &&
                connection.fromNode.id !== table.id &&
                (connection.fromHandle.id?.startsWith(
                    TOP_SOURCE_HANDLE_ID_PREFIX
                ) ||
                    connection.fromHandle.id?.startsWith(
                        BOTTOM_SOURCE_HANDLE_ID_PREFIX
                    ))
            );
        }, [
            connection,
            table.id,
            getTable,
            table.isMaterializedView,
            table.isView,
        ]);

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
                <Handle
                    id={`${TOP_SOURCE_HANDLE_ID_PREFIX}${table.id}`}
                    className={`!h-4 !w-4 !border-2 !bg-pink-600 ${!focused ? '!invisible' : ''}`}
                    position={Position.Top}
                    type="source"
                />
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
