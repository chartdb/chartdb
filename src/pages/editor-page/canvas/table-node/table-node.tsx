import React, {
    useCallback,
    useState,
    useMemo,
    useRef,
    useEffect,
} from 'react';
import type { NodeProps, Node } from '@xyflow/react';
import { NodeResizer, useStore } from '@xyflow/react';
import { Button } from '@/components/button/button';
import {
    ChevronsLeftRight,
    ChevronsRightLeft,
    Table2,
    ChevronDown,
    ChevronUp,
    Check,
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
import { Input } from '@/components/input/input';
import { useClickAway, useKeyPressEvent } from 'react-use';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useDiff } from '@/context/diff-context/use-diff';
import { TableNodeStatus } from './table-node-status/table-node-status';

export type TableNodeType = Node<
    {
        table: DBTable;
        isOverlapping: boolean;
        highlightOverlappingTables?: boolean;
    },
    'table'
>;

export const TableNode: React.FC<NodeProps<TableNodeType>> = React.memo(
    ({
        selected,
        dragging,
        id,
        data: { table, isOverlapping, highlightOverlappingTables },
    }) => {
        const { updateTable, relationships, readonly } = useChartDB();
        const edges = useStore((store) => store.edges) as EdgeType[];
        const { openTableFromSidebar, selectSidebarSection } = useLayout();
        const [expanded, setExpanded] = useState(table.expanded ?? false);
        const { t } = useTranslation();
        const [editMode, setEditMode] = useState(false);
        const [tableName, setTableName] = useState(table.name);
        const inputRef = React.useRef<HTMLInputElement>(null);
        const [isHovering, setIsHovering] = useState(false);

        const {
            getTableNewName,
            getTableNewColor,
            checkIfTableHasChange,
            checkIfNewTable,
            checkIfTableRemoved,
        } = useDiff();

        const fields = useMemo(() => table.fields, [table.fields]);

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
                return tableChangedColor;
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
            if (expanded || fields.length <= TABLE_MINIMIZED_FIELDS) {
                return fields;
            }

            const mustDisplayedFields: DBField[] = [];
            const nonMustDisplayedFields: DBField[] = [];

            for (const field of fields) {
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
            const result = fields.filter((field) =>
                visibleFieldsSet.has(field)
            );

            return result;
        }, [expanded, fields, relatedFieldIds]);

        const editTableName = useCallback(() => {
            if (!editMode) return;
            if (tableName.trim()) {
                updateTable(table.id, { name: tableName.trim() });
            }
            setEditMode(false);
        }, [tableName, table.id, updateTable, editMode]);

        const abortEdit = useCallback(() => {
            setEditMode(false);
            setTableName(table.name);
        }, [table.name]);

        useClickAway(inputRef, editTableName);
        useKeyPressEvent('Enter', editTableName);
        useKeyPressEvent('Escape', abortEdit);

        const enterEditMode = useCallback((e: React.MouseEvent) => {
            e.stopPropagation();
            setEditMode(true);
        }, []);

        React.useEffect(() => {
            if (table.name.trim()) {
                setTableName(table.name.trim());
            }
        }, [table.name]);

        const tableClassName = useMemo(
            () =>
                cn(
                    'flex w-full flex-col border-2 bg-slate-50 dark:bg-slate-950 rounded-lg shadow-sm transition-transform duration-300',
                    selected
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
                    isDiffTableChanged && !isDiffNewTable && !isDiffTableRemoved
                        ? 'outline outline-[3px] outline-sky-500 dark:outline-sky-900 outline-offset-[5px]'
                        : '',
                    isDiffNewTable
                        ? 'outline outline-[3px] outline-green-500 dark:outline-green-900 outline-offset-[5px]'
                        : '',
                    isDiffTableRemoved
                        ? 'outline outline-[3px] outline-red-500 dark:outline-red-900 outline-offset-[5px]'
                        : ''
                ),
            [
                selected,
                isOverlapping,
                highlightOverlappingTables,
                isDiffTableChanged,
                isDiffNewTable,
                isDiffTableRemoved,
            ]
        );

        return (
            <TableNodeContextMenu table={table}>
                <div
                    className={tableClassName}
                    onClick={(e) => {
                        if (e.detail === 2) {
                            openTableInEditor();
                        }
                    }}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    <NodeResizer
                        isVisible={focused}
                        lineClassName="!border-none !w-2"
                        minWidth={MIN_TABLE_SIZE}
                        maxWidth={MAX_TABLE_SIZE}
                        shouldResize={(event) => event.dy === 0}
                        handleClassName="!hidden"
                    />
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
                                  : isDiffTableChanged
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
                            ) : isDiffTableChanged ? (
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
                                        {table.name}
                                    </span>
                                    <span className="mx-1 font-semibold">
                                        →
                                    </span>
                                    <span className="truncate">
                                        {tableChangedName}
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
                            ) : isDiffTableChanged ? (
                                <Label className="flex h-5 flex-col justify-center truncate rounded-sm bg-sky-200 px-2 py-0.5 text-sm font-normal text-sky-900 dark:bg-sky-800 dark:text-sky-200">
                                    {table.name}
                                </Label>
                            ) : editMode && !readonly ? (
                                <>
                                    <Input
                                        ref={inputRef}
                                        onBlur={editTableName}
                                        placeholder={table.name}
                                        autoFocus
                                        type="text"
                                        value={tableName}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) =>
                                            setTableName(e.target.value)
                                        }
                                        className="h-6 w-full border-[0.5px] border-blue-400 bg-slate-100 focus-visible:ring-0 dark:bg-slate-900"
                                    />
                                    <Button
                                        variant="ghost"
                                        className="size-6 p-0 text-slate-500 hover:bg-primary-foreground hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                        onClick={editTableName}
                                    >
                                        <Check className="size-4" />
                                    </Button>
                                </>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Label
                                            className="text-editable truncate px-2 py-0.5 text-sm font-bold"
                                            onDoubleClick={enterEditMode}
                                        >
                                            {table.name}
                                        </Label>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {t('tool_tips.double_click_to_edit')}
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                        <div className="hidden shrink-0 flex-row group-hover:flex">
                            {readonly || editMode ? null : (
                                <Button
                                    variant="ghost"
                                    className="size-6 p-0 text-slate-500 hover:bg-primary-foreground hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    onClick={openTableInEditor}
                                >
                                    <CircleDotDashed className="size-4" />
                                </Button>
                            )}
                            {editMode ? null : (
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
                            )}
                        </div>
                    </div>
                    <div
                        className="transition-[max-height] duration-200 ease-in-out"
                        style={{
                            maxHeight: expanded
                                ? `${fields.length * 2}rem` // h-8 per field
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
                    {fields.length > TABLE_MINIMIZED_FIELDS && (
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
