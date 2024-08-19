import React, { useEffect } from 'react';
import {
    Handle,
    Position,
    useConnection,
    useUpdateNodeInternals,
} from '@xyflow/react';
import { Button } from '@/components/button/button';
import { Trash2 } from 'lucide-react';

import { DBField } from '@/lib/domain/db-field';
import { useChartDB } from '@/hooks/use-chartdb';

export const LEFT_HANDLE_ID_PREFIX = 'left_';
export const RIGHT_HANDLE_ID_PREFIX = 'right_';
export const TARGET_ID_PREFIX = 'target_';

export interface TableNodeFieldProps {
    tableNodeId: string;
    field: DBField;
    focused: boolean;
}

export const TableNodeField: React.FC<TableNodeFieldProps> = ({
    field,
    focused,
    tableNodeId,
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
        <div className="flex relative items-center h-8 text-sm px-3 border-t justify-between hover:bg-primary-foreground group last:rounded-b-lg">
            {!connection.inProgress && (
                <>
                    <Handle
                        id={`${RIGHT_HANDLE_ID_PREFIX}${field.id}`}
                        className={`!h-3 !w-3 !bg-slate-400 ${!focused ? '!invisible' : ''}`}
                        position={Position.Right}
                        type="source"
                    />
                    <Handle
                        id={`${LEFT_HANDLE_ID_PREFIX}${field.id}`}
                        className={`!h-3 !w-3 !bg-slate-400 ${!focused ? '!invisible' : ''}`}
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
                                ? '!w-full !h-full !absolute !top-0 !left-0 !rounded-none !border-none !transform-none !opacity-0'
                                : `!invisible`
                        }
                        position={Position.Left}
                        type="target"
                    />
                </>
            )}
            <div className="flex">{field.name}</div>
            <div className="flex">
                <div className="text-muted-foreground flex group-hover:hidden">
                    {field.type}
                </div>
                <div className="flex-row hidden group-hover:flex">
                    <Button
                        variant="ghost"
                        className="hover:bg-primary-foreground p-0 w-6 h-6"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeField(tableNodeId, field.id);
                        }}
                    >
                        <Trash2 className="h-3.5 w-3.5 text-red-700" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
