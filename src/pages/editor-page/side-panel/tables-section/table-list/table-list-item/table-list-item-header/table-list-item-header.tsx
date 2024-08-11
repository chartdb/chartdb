import React from 'react';
import { CircleDotDashed, Pencil, EllipsisVertical } from 'lucide-react';
import { ListItemHeaderButton } from '@/pages/editor-page/side-panel/list-item-header-button/relationship-list-item-header-button';
import { DBTable } from '@/lib/domain/db-table';

export interface TableListItemHeaderProps {
    table: DBTable;
}

export const TableListItemHeader: React.FC<TableListItemHeaderProps> = ({
    table,
}) => {
    return (
        <div className="h-11 flex items-center justify-between flex-1 group">
            <div>{table.name}</div>
            <div className="flex flex-row-reverse">
                <div>
                    <ListItemHeaderButton>
                        <EllipsisVertical />
                    </ListItemHeaderButton>
                </div>
                <div className="hidden group-hover:flex flex-row-reverse">
                    <ListItemHeaderButton>
                        <Pencil />
                    </ListItemHeaderButton>
                    <ListItemHeaderButton>
                        <CircleDotDashed />
                    </ListItemHeaderButton>
                </div>
            </div>
        </div>
    );
};
