import React from 'react';
import { CircleDotDashed, Pencil, EllipsisVertical } from 'lucide-react';
import { TableListItemHeaderButton } from './table-list-item-header-button/table-list-item-header-button';

export interface TableListItemHeaderProps {}

export const TableListItemHeader: React.FC<TableListItemHeaderProps> = () => {
    return (
        <div className="h-[44px] flex items-center justify-between flex-1 group">
            <div>table_1</div>
            <div className="flex flex-row-reverse">
                <div>
                    <TableListItemHeaderButton>
                        <EllipsisVertical />
                    </TableListItemHeaderButton>
                </div>
                <div className="hidden group-hover:flex flex-row-reverse">
                    <TableListItemHeaderButton>
                        <Pencil />
                    </TableListItemHeaderButton>
                    <TableListItemHeaderButton>
                        <CircleDotDashed />
                    </TableListItemHeaderButton>
                </div>
            </div>
        </div>
    );
};
