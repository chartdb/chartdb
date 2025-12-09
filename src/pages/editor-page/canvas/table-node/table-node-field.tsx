import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Handle,
    Position,
    useConnection,
    useUpdateNodeInternals,
} from '@xyflow/react';
import { Button } from '@/components/button/button';
import {
    KeyRound,
    MessageCircleMore,
    SquareDot,
    SquareMinus,
    SquarePlus,
    Pencil,
} from 'lucide-react';
import { generateDBFieldSuffix, type DBField } from '@/lib/domain/db-field';
import { useChartDB } from '@/hooks/use-chartdb';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useDiff } from '@/context/diff-context/use-diff';
import { useLocalConfig } from '@/hooks/use-local-config';
import {
    BOTTOM_SOURCE_HANDLE_ID_PREFIX,
    TOP_SOURCE_HANDLE_ID_PREFIX,
} from './table-node-dependency-indicator';
import { useCanvas } from '@/hooks/use-canvas';
import { useLayout } from '@/hooks/use-layout';

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

const arePropsEqual = (
    prevProps: TableNodeFieldProps,
    nextProps: TableNodeFieldProps
) => {
    return (
        prevProps.field.id === nextProps.field.id &&
        prevProps.field.name === nextProps.field.name &&
        prevProps.field.primaryKey === nextProps.field.primaryKey &&
        prevProps.field.nullable === nextProps.field.nullable &&
        prevProps.field.comments === nextProps.field.comments &&
        prevProps.field.unique === nextProps.field.unique &&
        prevProps.field.type.id === nextProps.field.type.id &&
        prevProps.field.type.name === nextProps.field.type.name &&
        prevProps.field.characterMaximumLength ===
            nextProps.field.characterMaximumLength &&
        prevProps.field.precision === nextProps.field.precision &&
        prevProps.field.scale === nextProps.field.scale &&
        prevProps.field.isArray === nextProps.field.isArray &&
        prevProps.focused === nextProps.focused &&
        prevProps.highlighted === nextProps.highlighted &&
        prevProps.visible === nextProps.visible &&
        prevProps.isConnectable === nextProps.isConnectable &&
        prevProps.tableNodeId === nextProps.tableNodeId
    );
};

export const TableNodeField: React.FC<TableNodeFieldProps> = React.memo(
    ({ field, focused, tableNodeId, highlighted, visible, isConnectable }) => {
        const { relationships, readonly, highlightedCustomType, databaseType } =
            useChartDB();

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
            [
                connection.inProgress,
                connection.fromNode?.id,
                connection.fromHandle?.id,
                tableNodeId,
            ]
        );
        const isTargetFromView = useMemo(
            () =>
                connection.inProgress &&
                connection.fromNode.id !== tableNodeId &&
                (connection.fromHandle.id?.startsWith(
                    TOP_SOURCE_HANDLE_ID_PREFIX
                ) ||
                    connection.fromHandle.id?.startsWith(
                        BOTTOM_SOURCE_HANDLE_ID_PREFIX
                    )),
            [
                connection.inProgress,
                connection.fromNode?.id,
                connection.fromHandle?.id,
                tableNodeId,
            ]
        );

        const numberOfEdgesToField = useMemo(() => {
            let count = 0;
            for (const rel of relationships) {
                if (
                    rel.targetTableId === tableNodeId &&
                    rel.targetFieldId === field.id
                ) {
                    count++;
                }
            }
            return count;
        }, [relationships, tableNodeId, field.id]);

        const isForeignKey = useMemo(() => {
            return relationships.some(
                (rel) =>
                    rel.targetTableId === tableNodeId &&
                    rel.targetFieldId === field.id
            );
        }, [relationships, tableNodeId, field.id]);

        const previousNumberOfEdgesToFieldRef = useRef(numberOfEdgesToField);

        useEffect(() => {
            if (
                previousNumberOfEdgesToFieldRef.current !== numberOfEdgesToField
            ) {
                const timer = setTimeout(() => {
                    updateNodeInternals(tableNodeId);
                    previousNumberOfEdgesToFieldRef.current =
                        numberOfEdgesToField;
                }, 100);
                return () => clearTimeout(timer);
            }
        }, [tableNodeId, updateNodeInternals, numberOfEdgesToField]);

        const {
            checkIfFieldRemoved,
            checkIfNewField,
            getFieldNewName,
            getFieldNewType,
            getFieldNewNullable,
            getFieldNewPrimaryKey,
            getFieldNewCharacterMaximumLength,
            getFieldNewPrecision,
            getFieldNewScale,
            getFieldNewIsArray,
            checkIfFieldHasChange,
            isSummaryOnly,
        } = useDiff();

        const [diffState, setDiffState] = useState<{
            isDiffFieldRemoved: boolean;
            isDiffNewField: boolean;
            fieldDiffChangedName: ReturnType<typeof getFieldNewName>;
            fieldDiffChangedType: ReturnType<typeof getFieldNewType>;
            fieldDiffChangedNullable: ReturnType<typeof getFieldNewNullable>;
            fieldDiffChangedCharacterMaximumLength: ReturnType<
                typeof getFieldNewCharacterMaximumLength
            >;
            fieldDiffChangedScale: ReturnType<typeof getFieldNewScale>;
            fieldDiffChangedPrecision: ReturnType<typeof getFieldNewPrecision>;
            fieldDiffChangedPrimaryKey: ReturnType<
                typeof getFieldNewPrimaryKey
            >;
            fieldDiffChangedIsArray: ReturnType<typeof getFieldNewIsArray>;
            isDiffFieldChanged: boolean;
        }>({
            isDiffFieldRemoved: false,
            isDiffNewField: false,
            fieldDiffChangedName: null,
            fieldDiffChangedType: null,
            fieldDiffChangedNullable: null,
            fieldDiffChangedCharacterMaximumLength: null,
            fieldDiffChangedScale: null,
            fieldDiffChangedPrecision: null,
            fieldDiffChangedPrimaryKey: null,
            fieldDiffChangedIsArray: null,
            isDiffFieldChanged: false,
        });

        useEffect(() => {
            // Calculate diff state asynchronously
            const timer = requestAnimationFrame(() => {
                setDiffState({
                    isDiffFieldRemoved: checkIfFieldRemoved({
                        fieldId: field.id,
                    }),
                    isDiffNewField: checkIfNewField({ fieldId: field.id }),
                    fieldDiffChangedName: getFieldNewName({
                        fieldId: field.id,
                    }),
                    fieldDiffChangedType: getFieldNewType({
                        fieldId: field.id,
                    }),
                    fieldDiffChangedNullable: getFieldNewNullable({
                        fieldId: field.id,
                    }),
                    fieldDiffChangedPrimaryKey: getFieldNewPrimaryKey({
                        fieldId: field.id,
                    }),
                    fieldDiffChangedCharacterMaximumLength:
                        getFieldNewCharacterMaximumLength({
                            fieldId: field.id,
                        }),
                    fieldDiffChangedScale: getFieldNewScale({
                        fieldId: field.id,
                    }),
                    fieldDiffChangedPrecision: getFieldNewPrecision({
                        fieldId: field.id,
                    }),
                    fieldDiffChangedIsArray: getFieldNewIsArray({
                        fieldId: field.id,
                    }),
                    isDiffFieldChanged: checkIfFieldHasChange({
                        fieldId: field.id,
                        tableId: tableNodeId,
                    }),
                });
            });
            return () => cancelAnimationFrame(timer);
        }, [
            checkIfFieldRemoved,
            checkIfNewField,
            getFieldNewName,
            getFieldNewType,
            getFieldNewPrimaryKey,
            getFieldNewNullable,
            checkIfFieldHasChange,
            getFieldNewCharacterMaximumLength,
            getFieldNewPrecision,
            getFieldNewScale,
            getFieldNewIsArray,
            field.id,
            tableNodeId,
        ]);

        const {
            isDiffFieldRemoved,
            isDiffNewField,
            fieldDiffChangedName,
            fieldDiffChangedType,
            isDiffFieldChanged,
            fieldDiffChangedNullable,
            fieldDiffChangedPrimaryKey,
            fieldDiffChangedCharacterMaximumLength,
            fieldDiffChangedScale,
            fieldDiffChangedPrecision,
            fieldDiffChangedIsArray,
        } = diffState;

        const isFieldAttributeChanged = useMemo(() => {
            return (
                fieldDiffChangedCharacterMaximumLength ||
                fieldDiffChangedScale ||
                fieldDiffChangedPrecision ||
                fieldDiffChangedIsArray
            );
        }, [
            fieldDiffChangedCharacterMaximumLength,
            fieldDiffChangedScale,
            fieldDiffChangedPrecision,
            fieldDiffChangedIsArray,
        ]);

        const isCustomTypeHighlighted = useMemo(() => {
            if (!highlightedCustomType) return false;
            return field.type.name === highlightedCustomType.name;
        }, [highlightedCustomType, field.type.name]);
        const { showFieldAttributes } = useLocalConfig();

        const { closeAllTablesInSidebar } = useLayout();
        const { setEditTableModeTable } = useCanvas();
        const openEditTableOnField = useCallback(() => {
            if (readonly) {
                return;
            }

            closeAllTablesInSidebar();
            setEditTableModeTable({
                tableId: tableNodeId,
                fieldId: field.id,
            });
        }, [
            setEditTableModeTable,
            closeAllTablesInSidebar,
            tableNodeId,
            field.id,
            readonly,
        ]);

        return (
            <div
                className={cn(
                    'group relative flex h-8 items-center justify-between gap-1 border-t px-3 text-sm last:rounded-b-[6px] hover:bg-slate-100 dark:hover:bg-slate-800',
                    'transition-all duration-200 ease-in-out',
                    {
                        'bg-pink-100 dark:bg-pink-900':
                            highlighted && !isCustomTypeHighlighted,
                        'bg-yellow-100 dark:bg-yellow-900':
                            isCustomTypeHighlighted,
                        'max-h-8 opacity-100': visible,
                        'z-0 max-h-0 overflow-hidden opacity-0': !visible,
                        'bg-sky-200 dark:bg-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900 border-sky-300 dark:border-sky-700':
                            isDiffFieldChanged &&
                            !isSummaryOnly &&
                            !isDiffFieldRemoved &&
                            !isDiffNewField,
                        'bg-red-200 dark:bg-red-800 hover:bg-red-100 dark:hover:bg-red-900 border-red-300 dark:border-red-700':
                            isDiffFieldRemoved,
                        'bg-green-200 dark:bg-green-800 hover:bg-green-100 dark:hover:bg-green-900 border-green-300 dark:border-green-700':
                            isDiffNewField,
                    }
                )}
            >
                {isConnectable ? (
                    <>
                        <Handle
                            id={`${RIGHT_HANDLE_ID_PREFIX}${field.id}`}
                            className={`!h-4 !w-4 !border-2 !bg-pink-600 ${!focused || readonly || isTargetFromView ? '!invisible' : ''}`}
                            position={Position.Right}
                            type="source"
                        />
                        <Handle
                            id={`${LEFT_HANDLE_ID_PREFIX}${field.id}`}
                            className={`!h-4 !w-4 !border-2 !bg-pink-600 ${!focused || readonly || isTargetFromView ? '!invisible' : ''}`}
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
                <div
                    className={cn('flex items-center gap-1 min-w-0 text-left', {
                        'font-semibold': field.primaryKey || field.unique,
                    })}
                >
                    {isDiffFieldRemoved ? (
                        <SquareMinus className="size-3.5 shrink-0 text-red-800 dark:text-red-200" />
                    ) : isDiffNewField ? (
                        <SquarePlus className="size-3.5 shrink-0 text-green-800 dark:text-green-200" />
                    ) : isDiffFieldChanged && !isSummaryOnly ? (
                        <SquareDot className="size-3.5 shrink-0 text-sky-800 dark:text-sky-200" />
                    ) : null}

                    <span
                        className={cn('truncate min-w-0', {
                            'text-red-800 font-normal dark:text-red-200':
                                isDiffFieldRemoved,
                            'text-green-800 font-normal dark:text-green-200':
                                isDiffNewField,
                            'text-sky-800 font-normal dark:text-sky-200':
                                isDiffFieldChanged &&
                                !isSummaryOnly &&
                                !isDiffFieldRemoved &&
                                !isDiffNewField,
                            'text-blue-600 dark:text-blue-400':
                                isForeignKey &&
                                !isDiffFieldRemoved &&
                                !isDiffNewField &&
                                !isDiffFieldChanged,
                        })}
                    >
                        {fieldDiffChangedName ? (
                            <>
                                {fieldDiffChangedName.old}{' '}
                                <span className="font-medium">→</span>{' '}
                                {fieldDiffChangedName.new}
                            </>
                        ) : (
                            field.name
                        )}
                    </span>
                    {field.comments ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="shrink-0 cursor-pointer text-muted-foreground">
                                    <MessageCircleMore size={14} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs whitespace-pre-wrap break-words">
                                {field.comments}
                            </TooltipContent>
                        </Tooltip>
                    ) : null}
                </div>

                <div
                    className={cn(
                        'ml-auto flex shrink-0 items-center gap-1 min-w-0',
                        !readonly ? 'group-hover:hidden' : ''
                    )}
                >
                    {(field.primaryKey && !fieldDiffChangedPrimaryKey?.old) ||
                    fieldDiffChangedPrimaryKey?.new ? (
                        <div
                            className={cn(
                                'text-muted-foreground shrink-0',
                                isDiffFieldRemoved
                                    ? 'text-red-800 dark:text-red-200'
                                    : '',
                                isDiffNewField
                                    ? 'text-green-800 dark:text-green-200'
                                    : '',
                                isDiffFieldChanged &&
                                    !isSummaryOnly &&
                                    !isDiffFieldRemoved &&
                                    !isDiffNewField
                                    ? 'text-sky-800 dark:text-sky-200'
                                    : ''
                            )}
                        >
                            <KeyRound size={14} />
                        </div>
                    ) : null}
                    <div
                        className={cn(
                            'text-right text-xs text-muted-foreground overflow-hidden min-w-0',
                            isDiffFieldRemoved
                                ? 'text-red-800 dark:text-red-200'
                                : '',
                            isDiffNewField
                                ? 'text-green-800 dark:text-green-200'
                                : '',
                            isDiffFieldChanged &&
                                !isDiffFieldRemoved &&
                                !isSummaryOnly &&
                                !isDiffNewField
                                ? 'text-sky-800 dark:text-sky-200'
                                : '',
                            isForeignKey &&
                                !isDiffFieldRemoved &&
                                !isDiffNewField &&
                                !isDiffFieldChanged
                                ? 'text-blue-600 dark:text-blue-400'
                                : ''
                        )}
                    >
                        <span className="block truncate">
                            {isFieldAttributeChanged || fieldDiffChangedType ? (
                                <>
                                    <span className="line-through">
                                        {
                                            (
                                                fieldDiffChangedType?.old
                                                    ?.name ?? field.type.name
                                            ).split(' ')[0]
                                        }
                                        {showFieldAttributes
                                            ? generateDBFieldSuffix(
                                                  {
                                                      ...field,
                                                      ...{
                                                          precision:
                                                              fieldDiffChangedPrecision?.old ??
                                                              field.precision,
                                                          scale:
                                                              fieldDiffChangedScale?.old ??
                                                              field.scale,
                                                          characterMaximumLength:
                                                              fieldDiffChangedCharacterMaximumLength?.old ??
                                                              field.characterMaximumLength,
                                                          isArray:
                                                              fieldDiffChangedIsArray?.old ??
                                                              field.isArray,
                                                      },
                                                  },
                                                  {
                                                      databaseType,
                                                  }
                                              )
                                            : field.isArray
                                              ? '[]'
                                              : ''}
                                    </span>{' '}
                                    {
                                        (
                                            fieldDiffChangedType?.new?.name ??
                                            field.type.name
                                        ).split(' ')[0]
                                    }
                                    {showFieldAttributes
                                        ? generateDBFieldSuffix(
                                              {
                                                  ...field,
                                                  ...{
                                                      precision:
                                                          fieldDiffChangedPrecision?.new ??
                                                          field.precision,
                                                      scale:
                                                          fieldDiffChangedScale?.new ??
                                                          field.scale,
                                                      characterMaximumLength:
                                                          fieldDiffChangedCharacterMaximumLength?.new ??
                                                          field.characterMaximumLength,
                                                      isArray:
                                                          fieldDiffChangedIsArray?.new ??
                                                          field.isArray,
                                                  },
                                              },
                                              {
                                                  databaseType,
                                              }
                                          )
                                        : (fieldDiffChangedIsArray?.new ??
                                            field.isArray)
                                          ? '[]'
                                          : ''}
                                </>
                            ) : (
                                `${field.type.name.split(' ')[0]}${
                                    showFieldAttributes
                                        ? generateDBFieldSuffix(field, {
                                              databaseType,
                                          })
                                        : field.isArray
                                          ? '[]'
                                          : ''
                                }`
                            )}
                            {fieldDiffChangedNullable ? (
                                fieldDiffChangedNullable.new ? (
                                    <span className="font-semibold">?</span>
                                ) : (
                                    <span className="line-through">?</span>
                                )
                            ) : field.nullable ? (
                                '?'
                            ) : (
                                ''
                            )}
                        </span>
                    </div>
                </div>
                {readonly ? null : (
                    <div className="ml-2 hidden shrink-0 flex-row group-hover:flex">
                        <Button
                            variant="ghost"
                            className="size-6 p-0 hover:bg-primary-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                openEditTableOnField();
                            }}
                        >
                            <Pencil className="!size-3.5 text-pink-600" />
                        </Button>
                    </div>
                )}
            </div>
        );
    },
    arePropsEqual
);

TableNodeField.displayName = 'TableNodeField';
