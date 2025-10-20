import React, {
    useCallback,
    useState,
    useMemo,
    useRef,
    useEffect,
} from 'react';
import type { NodeProps, Node } from '@xyflow/react';
import {
    NodeResizer,
    useConnection,
    useStore,
    Handle,
    Position,
} from '@xyflow/react';
import { Button } from '@/components/button/button';
import {
    ChevronsLeftRight,
    ChevronsRightLeft,
    Table2,
    ChevronDown,
    ChevronUp,
    CircleDotDashed,
    SquareDot,
    SquarePlus,
    SquareMinus,
} from 'lucide-react';
import { Label } from '@/components/label/label';
import {
    MAX_TABLE_SIZE,
    MID_TABLE_SIZE,
    MIN_TABLE_SIZE,
    TABLE_MINIMIZED_FIELDS,
    type DBTable,
} from '@/lib/domain/db-table';
import { TableNodeField } from './table-node-field';
import { useLayout } from '@/hooks/use-layout';
import { useChartDB } from '@/hooks/use-chartdb';
import type { RelationshipEdgeType } from '../relationship-edge/relationship-edge';
import type { DBField } from '@/lib/domain/db-field';
import { useTranslation } from 'react-i18next';
import { TableNodeContextMenu } from './table-node-context-menu';
import { cn } from '@/lib/utils';
import { TableNodeDependencyIndicator } from './table-node-dependency-indicator';
import type { EdgeType } from '../canvas';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useDiff } from '@/context/diff-context/use-diff';
import { TableNodeStatus } from './table-node-status/table-node-status';
import { TableEditMode } from './table-edit-mode/table-edit-mode';
import { useCanvas } from '@/hooks/use-canvas';

export const TABLE_RELATIONSHIP_SOURCE_HANDLE_ID_PREFIX = 'table_rel_source_';
export const TABLE_RELATIONSHIP_TARGET_HANDLE_ID_PREFIX = 'table_rel_target_';

export type TableNodeType = Node<
    {
        table: DBTable;
        isOverlapping: boolean;
        highlightOverlappingTables?: boolean;
        hasHighlightedCustomType?: boolean;
        highlightTable?: boolean;
        isRelationshipCreatingTarget?: boolean;
    },
    'table'
>;

export const TableNode: React.FC<NodeProps<TableNodeType>> = React.memo(
    ({
        selected,
        dragging,
        id,
        data: {
            table,
            isOverlapping,
            highlightOverlappingTables,
            hasHighlightedCustomType,
            highlightTable,
            isRelationshipCreatingTarget,
        },
    }) => {
        const { updateTable, relationships, readonly } = useChartDB();
        const edges = useStore((store) => store.edges) as EdgeType[];
        const {
            openTableFromSidebar,
            selectSidebarSection,
            closeAllTablesInSidebar,
        } = useLayout();
        const [expanded, setExpanded] = useState(table.expanded ?? false);
        const { t } = useTranslation();
        const [isHovering, setIsHovering] = useState(false);
        const {
            setEditTableModeTable,
            editTableModeTable,
            setHoveringTableId,
            showCreateRelationshipNode,
            tempFloatingEdge,
        } = useCanvas();

        // Get edit mode state directly from context
        const editTableMode = useMemo(
            () => editTableModeTable?.tableId === table.id,
            [editTableModeTable, table.id]
        );
        const editTableModeFieldId = useMemo(
            () => (editTableMode ? editTableModeTable?.fieldId : null),
            [editTableMode, editTableModeTable]
        );

        // Store the initial field count when entering edit mode to keep table height fixed
        const [editModeInitialFieldCount, setEditModeInitialFieldCount] =
            useState<number | null>(null);

        const connection = useConnection();

        const isTarget = useMemo(() => {
            if (!isHovering) return false;

            return connection.inProgress && connection.fromNode.id !== table.id;
        }, [connection, table.id, isHovering]);

        const {
            getTableNewName,
            getTableNewColor,
            checkIfTableHasChange,
            checkIfNewTable,
            checkIfTableRemoved,
            isSummaryOnly,
        } = useDiff();

        const fields = useMemo(() => table.fields, [table.fields]);

        // Effect to manage field count when entering/exiting edit mode
        useEffect(() => {
            if (editTableMode && editModeInitialFieldCount === null) {
                // Entering edit mode - capture current field count
                setEditModeInitialFieldCount(fields.length);
            } else if (!editTableMode && editModeInitialFieldCount !== null) {
                // Exiting edit mode - reset
                setEditModeInitialFieldCount(null);
            }
        }, [editTableMode, fields.length, editModeInitialFieldCount]);

        const tableChangedName = useMemo(
            () => getTableNewName({ tableId: table.id }),
            [getTableNewName, table.id]
        );

        const tableChangedColor = useMemo(
            () => getTableNewColor({ tableId: table.id }),
            [getTableNewColor, table.id]
        );
        const tableColor = useMemo(() => {
            if (tableChangedColor) {
                return tableChangedColor.new;
            }

            return table.color;
        }, [tableChangedColor, table.color]);

        const [diffState, setDiffState] = useState<{
            isDiffTableChanged: boolean;
            isDiffNewTable: boolean;
            isDiffTableRemoved: boolean;
        }>({
            isDiffTableChanged: false,
            isDiffNewTable: false,
            isDiffTableRemoved: false,
        });

        const hasMountedRef = useRef(false);

        useEffect(() => {
            // Skip on initial mount to improve performance
            const calculateDiff = () => {
                setDiffState({
                    isDiffTableChanged: checkIfTableHasChange({
                        tableId: table.id,
                    }),
                    isDiffNewTable: checkIfNewTable({ tableId: table.id }),
                    isDiffTableRemoved: checkIfTableRemoved({
                        tableId: table.id,
                    }),
                });
            };

            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                // Defer diff calculation
                requestAnimationFrame(calculateDiff);
            } else {
                calculateDiff();
            }
        }, [
            checkIfTableHasChange,
            checkIfNewTable,
            checkIfTableRemoved,
            table.id,
        ]);

        const { isDiffTableChanged, isDiffNewTable, isDiffTableRemoved } =
            diffState;

        const selectedRelEdges: RelationshipEdgeType[] = useMemo(() => {
            if (edges.length === 0) return [];

            const relEdges: RelationshipEdgeType[] = [];
            for (const edge of edges) {
                if (
                    edge.type === 'relationship-edge' &&
                    (edge.source === id || edge.target === id) &&
                    (edge.selected || edge.data?.highlighted)
                ) {
                    relEdges.push(edge as RelationshipEdgeType);
                }
            }
            return relEdges;
        }, [edges, id]);

        const highlightedFieldIds = useMemo(() => {
            const fieldIds = new Set<string>();
            selectedRelEdges.forEach((edge) => {
                if (edge.data?.relationship.sourceFieldId) {
                    fieldIds.add(edge.data.relationship.sourceFieldId);
                }

                if (edge.data?.relationship.targetFieldId) {
                    fieldIds.add(edge.data.relationship.targetFieldId);
                }
            });

            return fieldIds;
        }, [selectedRelEdges]);

        const focused = useMemo(
            () => (!!selected && !dragging) || isHovering,
            [selected, dragging, isHovering]
        );

        const openTableInEditor = useCallback(() => {
            selectSidebarSection('tables');
            openTableFromSidebar(table.id);
        }, [selectSidebarSection, openTableFromSidebar, table.id]);

        const expandTable = useCallback(() => {
            updateTable(table.id, {
                width:
                    (table.width ?? MIN_TABLE_SIZE) < MID_TABLE_SIZE
                        ? MID_TABLE_SIZE
                        : MAX_TABLE_SIZE,
            });
        }, [table.id, table.width, updateTable]);

        const shrinkTable = useCallback(() => {
            updateTable(table.id, {
                width: MIN_TABLE_SIZE,
            });
        }, [table.id, updateTable]);

        const toggleExpand = useCallback(() => {
            setExpanded((prev) => {
                const value = !prev;
                updateTable(table.id, { expanded: value });
                return value;
            });
        }, [table.id, updateTable]);

        const relatedFieldIds = useMemo(() => {
            const fieldIds = new Set<string>();
            relationships.forEach((rel) => {
                if (rel.sourceFieldId) fieldIds.add(rel.sourceFieldId);
                if (rel.targetFieldId) fieldIds.add(rel.targetFieldId);
            });
            return fieldIds;
        }, [relationships]);

        const visibleFields = useMemo(() => {
            // If in edit mode, use the initial field count to keep consistent height
            const fieldsToConsider =
                editTableMode && editModeInitialFieldCount !== null
                    ? fields.slice(0, editModeInitialFieldCount)
                    : fields;

            if (expanded || fieldsToConsider.length <= TABLE_MINIMIZED_FIELDS) {
                return fieldsToConsider;
            }

            const mustDisplayedFields: DBField[] = [];
            const nonMustDisplayedFields: DBField[] = [];

            for (const field of fieldsToConsider) {
                if (relatedFieldIds.has(field.id) || field.primaryKey) {
                    mustDisplayedFields.push(field);
                } else {
                    nonMustDisplayedFields.push(field);
                }
            }

            // Take required fields up to limit
            const visibleMustDisplayedFields = mustDisplayedFields.slice(
                0,
                TABLE_MINIMIZED_FIELDS
            );
            const remainingSlots =
                TABLE_MINIMIZED_FIELDS - visibleMustDisplayedFields.length;

            // Fill remaining slots with non-required fields
            const visibleNonMustDisplayedFields =
                remainingSlots > 0
                    ? nonMustDisplayedFields.slice(0, remainingSlots)
                    : [];

            // Combine and maintain original order
            const visibleFieldsSet = new Set([
                ...visibleMustDisplayedFields,
                ...visibleNonMustDisplayedFields,
            ]);
            const result = fieldsToConsider.filter((field) =>
                visibleFieldsSet.has(field)
            );

            return result;
        }, [
            expanded,
            fields,
            relatedFieldIds,
            editTableMode,
            editModeInitialFieldCount,
        ]);

        const isPartOfCreatingRelationship = useMemo(
            () =>
                tempFloatingEdge?.sourceNodeId === id ||
                (isRelationshipCreatingTarget &&
                    tempFloatingEdge?.targetNodeId === id) ||
                isHovering,
            [tempFloatingEdge, id, isRelationshipCreatingTarget, isHovering]
        );

        const tableClassName = useMemo(
            () =>
                cn(
                    'flex w-full flex-col border-2 bg-slate-50 dark:bg-slate-950 rounded-lg shadow-sm transition-transform duration-300',
                    selected || isTarget || isPartOfCreatingRelationship
                        ? 'border-pink-600'
                        : 'border-slate-500 dark:border-slate-700',
                    isOverlapping
                        ? 'ring-2 ring-offset-slate-50 dark:ring-offset-slate-900 ring-blue-500 ring-offset-2'
                        : '',
                    !highlightOverlappingTables && isOverlapping
                        ? 'animate-scale'
                        : '',
                    highlightOverlappingTables && isOverlapping
                        ? 'animate-scale-2'
                        : '',
                    hasHighlightedCustomType
                        ? 'ring-2 ring-offset-slate-50 dark:ring-offset-slate-900 ring-yellow-500 ring-offset-2 animate-scale'
                        : '',
                    highlightTable
                        ? 'ring-2 ring-offset-slate-50 dark:ring-offset-slate-900 ring-blue-500 ring-offset-2 animate-scale-2'
                        : '',
                    isDiffTableChanged &&
                        !isSummaryOnly &&
                        !isDiffNewTable &&
                        !isDiffTableRemoved
                        ? 'outline outline-[3px] outline-sky-500 dark:outline-sky-900 outline-offset-[5px]'
                        : '',
                    isDiffNewTable
                        ? 'outline outline-[3px] outline-green-500 dark:outline-green-900 outline-offset-[5px]'
                        : '',
                    isDiffTableRemoved
                        ? 'outline outline-[3px] outline-red-500 dark:outline-red-900 outline-offset-[5px]'
                        : editTableMode
                          ? 'invisible'
                          : ''
                ),
            [
                selected,
                isOverlapping,
                highlightOverlappingTables,
                hasHighlightedCustomType,
                highlightTable,
                isSummaryOnly,
                isDiffTableChanged,
                isDiffNewTable,
                isDiffTableRemoved,
                isTarget,
                editTableMode,
                isPartOfCreatingRelationship,
            ]
        );

        const enterEditTableMode = useCallback(() => {
            if (readonly) {
                return;
            }

            closeAllTablesInSidebar();
            setEditTableModeTable({ tableId: table.id });
        }, [
            table.id,
            setEditTableModeTable,
            closeAllTablesInSidebar,
            readonly,
        ]);

        const exitEditTableMode = useCallback(() => {
            setEditTableModeTable(null);
        }, [setEditTableModeTable]);

        return (
            <TableNodeContextMenu table={table}>
                {editTableMode ? (
                    <TableEditMode
                        table={table}
                        color={tableColor}
                        focusFieldId={editTableModeFieldId ?? undefined}
                        onClose={() => {
                            exitEditTableMode();
                        }}
                    />
                ) : null}
                <div
                    className={tableClassName}
                    onClick={(e) => {
                        if (e.detail === 2 && !readonly) {
                            e.stopPropagation();
                            enterEditTableMode();
                        } else if (e.detail === 1 && !readonly) {
                            // Handle single click
                            if (
                                isRelationshipCreatingTarget &&
                                tempFloatingEdge
                            ) {
                                e.stopPropagation();
                                showCreateRelationshipNode({
                                    sourceTableId:
                                        tempFloatingEdge.sourceNodeId,
                                    targetTableId: table.id,
                                    x: e.clientX,
                                    y: e.clientY,
                                });
                            }
                        }
                    }}
                    onMouseEnter={() => {
                        setIsHovering(true);
                        setHoveringTableId(table.id);
                    }}
                    onMouseLeave={() => {
                        setIsHovering(false);
                        setHoveringTableId(null);
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
                    {/* Center handle for floating edge creation */}
                    {!readonly ? (
                        <Handle
                            id={`${TABLE_RELATIONSHIP_SOURCE_HANDLE_ID_PREFIX}${table.id}`}
                            type="source"
                            position={Position.Top}
                            className="!invisible !left-1/2 !top-1/2 !h-1 !w-1 !-translate-x-1/2 !-translate-y-1/2 !transform"
                        />
                    ) : null}
                    {/* Target handle covering entire table for floating edge creation */}
                    {!readonly ? (
                        <Handle
                            id={`${TABLE_RELATIONSHIP_TARGET_HANDLE_ID_PREFIX}${table.id}`}
                            type="target"
                            position={Position.Top}
                            className="!absolute !left-0 !top-0 !h-full !w-full !transform-none !rounded-none !border-none !opacity-0"
                            isConnectable={isRelationshipCreatingTarget}
                        />
                    ) : null}
                    <TableNodeDependencyIndicator
                        table={table}
                        focused={focused}
                    />
                    <TableNodeStatus
                        status={
                            isDiffNewTable
                                ? 'new'
                                : isDiffTableRemoved
                                  ? 'removed'
                                  : isDiffTableChanged && !isSummaryOnly
                                    ? 'changed'
                                    : 'none'
                        }
                    />
                    <div
                        className="h-2 rounded-t-[6px]"
                        style={{ backgroundColor: tableColor }}
                    ></div>
                    <div className="group flex h-9 items-center justify-between bg-slate-200 px-2 dark:bg-slate-900">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            {isDiffNewTable ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <SquarePlus
                                            className="size-3.5 shrink-0 text-green-600"
                                            strokeWidth={2.5}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>New Table</TooltipContent>
                                </Tooltip>
                            ) : isDiffTableRemoved ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <SquareMinus
                                            className="size-3.5 shrink-0 text-red-600"
                                            strokeWidth={2.5}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Table Removed
                                    </TooltipContent>
                                </Tooltip>
                            ) : isDiffTableChanged && !isSummaryOnly ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <SquareDot
                                            className="size-3.5 shrink-0 text-sky-600"
                                            strokeWidth={2.5}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Table Changed
                                    </TooltipContent>
                                </Tooltip>
                            ) : (
                                <Table2 className="size-3.5 shrink-0 text-gray-600 dark:text-primary" />
                            )}

                            {tableChangedName ? (
                                <Label className="flex h-5 items-center justify-center truncate rounded-sm bg-sky-200 px-2 py-0.5 text-sm font-normal text-sky-900 dark:bg-sky-800 dark:text-sky-200">
                                    <span className="truncate">
                                        {tableChangedName.old}
                                    </span>
                                    <span className="mx-1 font-semibold">
                                        →
                                    </span>
                                    <span className="truncate">
                                        {tableChangedName.new}
                                    </span>
                                </Label>
                            ) : isDiffNewTable ? (
                                <Label className="flex h-5 flex-col justify-center truncate rounded-sm bg-green-200 px-2 py-0.5 text-sm font-normal text-green-900 dark:bg-green-800 dark:text-green-200">
                                    {table.name}
                                </Label>
                            ) : isDiffTableRemoved ? (
                                <Label className="flex h-5 flex-col justify-center truncate rounded-sm bg-red-200 px-2 py-0.5 text-sm font-normal text-red-900 dark:bg-red-800 dark:text-red-200">
                                    {table.name}
                                </Label>
                            ) : isDiffTableChanged && !isSummaryOnly ? (
                                <Label className="flex h-5 flex-col justify-center truncate rounded-sm bg-sky-200 px-2 py-0.5 text-sm font-normal text-sky-900 dark:bg-sky-800 dark:text-sky-200">
                                    {table.name}
                                </Label>
                            ) : (
                                <Label className="truncate px-2 py-0.5 text-sm font-bold">
                                    {table.name}
                                </Label>
                            )}
                        </div>
                        <div className="hidden shrink-0 flex-row group-hover:flex">
                            {readonly ? null : (
                                <Button
                                    variant="ghost"
                                    className="size-6 p-0 text-slate-500 hover:bg-primary-foreground hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    onClick={openTableInEditor}
                                >
                                    <CircleDotDashed className="size-4" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                className="size-6 p-0 text-slate-500 hover:bg-primary-foreground hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
                    <div
                        className="transition-[max-height] duration-200 ease-in-out"
                        style={{
                            maxHeight: expanded
                                ? `${(editTableMode && editModeInitialFieldCount !== null ? editModeInitialFieldCount : fields.length) * 2}rem` // h-8 per field
                                : `${TABLE_MINIMIZED_FIELDS * 2}rem`, // h-8 per field
                        }}
                    >
                        {visibleFields.map((field: DBField) => (
                            <TableNodeField
                                key={field.id}
                                focused={focused}
                                tableNodeId={id}
                                field={field}
                                highlighted={highlightedFieldIds.has(field.id)}
                                visible={true}
                                isConnectable={!table.isView}
                            />
                        ))}
                    </div>
                    {(editTableMode && editModeInitialFieldCount !== null
                        ? editModeInitialFieldCount
                        : fields.length) > TABLE_MINIMIZED_FIELDS && (
                        <div
                            className="z-10 flex h-8 cursor-pointer items-center justify-center rounded-b-md border-t text-xs text-muted-foreground transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={toggleExpand}
                        >
                            {expanded ? (
                                <>
                                    <ChevronUp className="mr-1 size-3.5" />
                                    {t('show_less')}
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="mr-1 size-3.5" />
                                    {t('show_more')}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </TableNodeContextMenu>
        );
    }
);

TableNode.displayName = 'TableNode';
