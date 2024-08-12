import React, { useCallback } from 'react';
import { CircleDotDashed, Pencil, EllipsisVertical } from 'lucide-react';
import { ListItemHeaderButton } from '@/pages/editor-page/side-panel/list-item-header-button/relationship-list-item-header-button';
import { DBTable } from '@/lib/domain/db-table';
import { Input } from '@/components/input/input';
import { useChartDB } from '@/hooks/use-chartdb';
import { useClickAway, useKeyPressEvent } from 'react-use';

export interface TableListItemHeaderProps {
    table: DBTable;
}

export const TableListItemHeader: React.FC<TableListItemHeaderProps> = ({
    table,
}) => {
    const [editMode, setEditMode] = React.useState(false);
    const [tableName, setTableName] = React.useState(table.name);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { updateTable } = useChartDB();

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
                        <div>
                            <ListItemHeaderButton>
                                <EllipsisVertical />
                            </ListItemHeaderButton>
                        </div>
                        <div className="hidden group-hover:flex flex-row-reverse">
                            <ListItemHeaderButton onClick={enterEditMode}>
                                <Pencil />
                            </ListItemHeaderButton>
                            <ListItemHeaderButton>
                                <CircleDotDashed />
                            </ListItemHeaderButton>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
