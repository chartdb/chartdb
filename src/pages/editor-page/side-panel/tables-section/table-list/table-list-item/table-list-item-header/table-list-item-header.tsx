import React, { useCallback } from 'react';
import {
    CircleDotDashed,
    GripVertical,
    Pencil,
    EllipsisVertical,
    Trash2,
    FileType2,
    FileKey2,
    Check,
    Group,
    Copy,
} from 'lucide-react';
import { ListItemHeaderButton } from '@/pages/editor-page/side-panel/list-item-header-button/list-item-header-button';
import type { DBTable } from '@/lib/domain/db-table';
import { Input } from '@/components/input/input';
import { useChartDB } from '@/hooks/use-chartdb';
import { useClickAway, useKeyPressEvent } from 'react-use';
// import { useSortable } from '@dnd-kit/sortable';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { useReactFlow } from '@xyflow/react';
import { useLayout } from '@/hooks/use-layout';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTranslation } from 'react-i18next';
import { useDialog } from '@/hooks/use-dialog';
// import {
//     Tooltip,
//     TooltipContent,
//     TooltipTrigger,
// } from '@/components/tooltip/tooltip';
import { cloneTable } from '@/lib/clone';
import { HighlightText } from '@/components/highlight-text/highlight-text';

export interface TableListItemHeaderProps {
    table: DBTable;
    searchText?: string;
    searchOptions?: {
        searchInFields: boolean;
        searchInTypes: boolean;
        searchInComments: boolean;
        caseSensitive: boolean;
    };
}

export const TableListItemHeader: React.FC<TableListItemHeaderProps> = ({
    table,
    searchText,
    searchOptions,
    ...props
}) => {
    const {
        updateTable,
        removeTable,
        createIndex,
        createField,
        createTable,
        schemas,
        filteredSchemas,
    } = useChartDB();
    const { openTableSchemaDialog } = useDialog();
    const { t } = useTranslation();
    const { fitView, setNodes } = useReactFlow();
    const { hideSidePanel } = useLayout();
    const [editMode, setEditMode] = React.useState(false);
    const [tableName, setTableName] = React.useState(table.name);
    const { isMd: isDesktop } = useBreakpoint('md');
    const inputRef = React.useRef<HTMLInputElement>(null);
    // const { listeners } = useSortable({ id: table.id });

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

    const enterEditMode = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditMode(true);
    };

    const focusOnTable = useCallback(
        (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            event.stopPropagation();
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id == table.id
                        ? {
                              ...node,
                              selected: true,
                          }
                        : {
                              ...node,
                              selected: false,
                          }
                )
            );
            fitView({
                duration: 500,
                maxZoom: 1,
                minZoom: 1,
                nodes: [
                    {
                        id: table.id,
                    },
                ],
            });

            if (!isDesktop) {
                hideSidePanel();
            }
        },
        [fitView, table.id, setNodes, hideSidePanel, isDesktop]
    );

    const deleteTableHandler = useCallback(() => {
        removeTable(table.id);
    }, [table.id, removeTable]);

    const updateTableSchema = useCallback(
        (schema: string) => {
            updateTable(table.id, { schema });
        },
        [table.id, updateTable]
    );

    const changeSchema = useCallback(() => {
        openTableSchemaDialog({
            table,
            schemas,
            onConfirm: updateTableSchema,
        });
    }, [openTableSchemaDialog, table, schemas, updateTableSchema]);

    const duplicateTableHandler = useCallback(
        (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            e.stopPropagation();
            const clonedTable = cloneTable(table);

            clonedTable.name = `${clonedTable.name}_copy`;
            clonedTable.x += 30;
            clonedTable.y += 50;

            createTable(clonedTable);
        },
        [createTable, table]
    );

    const renderDropDownMenu = useCallback(
        () => (
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <ListItemHeaderButton>
                        <EllipsisVertical />
                    </ListItemHeaderButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-fit min-w-40">
                    <DropdownMenuLabel>
                        {t(
                            'side_panel.tables_section.table.table_actions.title'
                        )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {schemas.length > 0 ? (
                        <>
                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    className="flex justify-between gap-4"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        changeSchema();
                                    }}
                                >
                                    {t(
                                        'side_panel.tables_section.table.table_actions.change_schema'
                                    )}
                                    <Group className="size-3.5" />
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                        </>
                    ) : null}
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            className="flex justify-between gap-4"
                            onClick={(e) => {
                                e.stopPropagation();
                                createField(table.id);
                            }}
                        >
                            {t(
                                'side_panel.tables_section.table.table_actions.add_field'
                            )}
                            <FileType2 className="size-3.5" />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="flex justify-between gap-4"
                            onClick={(e) => {
                                e.stopPropagation();
                                createIndex(table.id);
                            }}
                        >
                            {t(
                                'side_panel.tables_section.table.table_actions.add_index'
                            )}
                            <FileKey2 className="size-3.5" />
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={duplicateTableHandler}
                            className="flex justify-between"
                        >
                            {t(
                                'side_panel.tables_section.table.table_actions.duplicate_table'
                            )}
                            <Copy className="size-3.5" />
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={deleteTableHandler}
                            className="flex justify-between !text-red-700"
                        >
                            {t(
                                'side_panel.tables_section.table.table_actions.delete_table'
                            )}
                            <Trash2 className="size-3.5 text-red-700" />
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        [
            table.id,
            createField,
            createIndex,
            deleteTableHandler,
            duplicateTableHandler,
            t,
            changeSchema,
            schemas.length,
        ]
    );

    let schemaToDisplay;

    if (schemas.length > 1 && !!filteredSchemas && filteredSchemas.length > 1) {
        schemaToDisplay = table.schema;
    }

    return (
        <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <div
                    className="flex w-4 shrink-0 cursor-move items-center justify-center"
                    {...props}
                >
                    <GripVertical className="size-3.5 text-muted-foreground" />
                </div>
                {editMode ? (
                    <Input
                        ref={inputRef}
                        type="text"
                        className="h-8 w-full focus-visible:ring-0"
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div className="flex items-center gap-1">
                        <HighlightText
                            text={table.name}
                            highlight={searchText || ''}
                            caseSensitive={searchOptions?.caseSensitive}
                        />
                        {schemaToDisplay && (
                            <>
                                <span className="text-muted-foreground">.</span>
                                <HighlightText
                                    text={schemaToDisplay}
                                    highlight={searchText || ''}
                                    caseSensitive={searchOptions?.caseSensitive}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-1">
                {!editMode ? (
                    <>
                        <div>{renderDropDownMenu()}</div>
                        <div className="flex flex-row-reverse md:hidden md:group-hover:flex">
                            <ListItemHeaderButton onClick={enterEditMode}>
                                <Pencil />
                            </ListItemHeaderButton>
                            <ListItemHeaderButton onClick={focusOnTable}>
                                <CircleDotDashed />
                            </ListItemHeaderButton>
                        </div>
                    </>
                ) : (
                    <ListItemHeaderButton onClick={editTableName}>
                        <Check />
                    </ListItemHeaderButton>
                )}
            </div>
        </div>
    );
};
