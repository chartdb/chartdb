import React, { useCallback } from 'react';
import {
    CircleDotDashed,
    Pencil,
    EllipsisVertical,
    Trash2,
    FileType2,
    FileKey2,
} from 'lucide-react';
import { ListItemHeaderButton } from '@/pages/editor-page/side-panel/list-item-header-button/relationship-list-item-header-button';
import { DBTable } from '@/lib/domain/db-table';
import { Input } from '@/components/input/input';
import { useChartDB } from '@/hooks/use-chartdb';
import { useClickAway, useKeyPressEvent } from 'react-use';
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

export interface TableListItemHeaderProps {
    table: DBTable;
}

export const TableListItemHeader: React.FC<TableListItemHeaderProps> = ({
    table,
}) => {
    const { fitView } = useReactFlow();
    const [editMode, setEditMode] = React.useState(false);
    const [tableName, setTableName] = React.useState(table.name);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { updateTable, removeTable, createIndex, createField } = useChartDB();

    const editTableName = useCallback(() => {
        if (!editMode) return;
        if (tableName.trim()) {
            updateTable(table.id, { name: tableName });
        }

        setEditMode(false);
    }, [tableName, table.id, updateTable, editMode]);

    useClickAway(inputRef, editTableName);
    useKeyPressEvent('Enter', editTableName);

    const enterEditMode = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        event.stopPropagation();
        setEditMode(true);
    };

    const focusOnTable = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        event.stopPropagation();
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
    };

    const deleteTableHandler = () => {
        removeTable(table.id);
    };

    const renderDropDownMenu = () => (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <ListItemHeaderButton>
                    <EllipsisVertical />
                </ListItemHeaderButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40">
                <DropdownMenuLabel>Table Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        className="flex justify-between"
                        onClick={(e) => {
                            e.stopPropagation();
                            createField(table.id);
                        }}
                    >
                        Add field
                        <FileType2 className="w-3.5 h-3.5" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="flex justify-between"
                        onClick={(e) => {
                            e.stopPropagation();
                            createIndex(table.id);
                        }}
                    >
                        Add index
                        <FileKey2 className="w-3.5 h-3.5" />
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={deleteTableHandler}
                        className="flex justify-between !text-red-700"
                    >
                        Delete table
                        <Trash2 className="text-red-700 w-3.5 h-3.5" />
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="h-11 flex items-center justify-between flex-1 group">
            <div>
                {editMode ? (
                    <Input
                        ref={inputRef}
                        autoFocus
                        type="text"
                        placeholder={table.name}
                        value={tableName}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setTableName(e.target.value)}
                        className="h-7 focus-visible:ring-0 w-full"
                    />
                ) : (
                    table.name
                )}
            </div>
            <div className="flex flex-row-reverse">
                {!editMode && (
                    <>
                        <div>{renderDropDownMenu()}</div>
                        <div className="hidden group-hover:flex flex-row-reverse">
                            <ListItemHeaderButton onClick={enterEditMode}>
                                <Pencil />
                            </ListItemHeaderButton>
                            <ListItemHeaderButton onClick={focusOnTable}>
                                <CircleDotDashed />
                            </ListItemHeaderButton>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
