import React from 'react';
import { Pencil, EllipsisVertical } from 'lucide-react';
import { ListItemHeaderButton } from '../../../../list-item-header-button/relationship-list-item-header-button';

export interface RelationshipListItemHeaderProps {}

export const RelationshipListItemHeader: React.FC<
    RelationshipListItemHeaderProps
> = () => {
    return (
        <div className="h-11 flex items-center justify-between flex-1 group">
            <div>table_1_id_fk</div>
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
                </div>
            </div>
        </div>
    );
};
