import React, { useCallback } from 'react';
import { useEditClickOutside } from '@/hooks/use-click-outside';
import {
    Pencil,
    EllipsisVertical,
    CircleDotDashed,
    Trash2,
    Check,
} from 'lucide-react';
import { ListItemHeaderButton } from '../../../../list-item-header-button/list-item-header-button';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import { useReactFlow } from '@xyflow/react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useFocusOn } from '@/hooks/use-focus-on';
import { useKeyPressEvent } from 'react-use';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { Input } from '@/components/input/input';
import { useTranslation } from 'react-i18next';

export interface RelationshipListItemHeaderProps {
    relationship: DBRelationship;
}

export const RelationshipListItemHeader: React.FC<
    RelationshipListItemHeaderProps
> = ({ relationship }) => {
    const { updateRelationship, removeRelationship, readonly } = useChartDB();
    const { deleteElements } = useReactFlow();
    const { t } = useTranslation();
    const { focusOnRelationship } = useFocusOn();
    const [editMode, setEditMode] = React.useState(false);
    const [relationshipName, setRelationshipName] = React.useState(
        relationship.name
    );
    const inputRef = React.useRef<HTMLInputElement>(null);

    const editRelationshipName = useCallback(() => {
        if (relationshipName.trim() && relationshipName !== relationship.name) {
            updateRelationship(relationship.id, {
                name: relationshipName.trim(),
            });
        }
        setEditMode(false);
    }, [
        relationshipName,
        relationship.id,
        updateRelationship,
        relationship.name,
    ]);

    const abortEdit = useCallback(() => {
        setEditMode(false);
        setRelationshipName(relationship.name);
    }, [relationship.name]);

    // Handle click outside to save and exit edit mode
    useEditClickOutside(inputRef, editMode, editRelationshipName);
    useKeyPressEvent('Enter', editRelationshipName);
    useKeyPressEvent('Escape', abortEdit);

    const enterEditMode = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        event.stopPropagation();
        setRelationshipName(relationship.name); // Reset to current name
        setEditMode(true);
    };

    const handleFocusOnRelationship = useCallback(
        (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            event.stopPropagation();
            focusOnRelationship(
                relationship.id,
                relationship.sourceTableId,
                relationship.targetTableId
            );
        },
        [
            focusOnRelationship,
            relationship.id,
            relationship.sourceTableId,
            relationship.targetTableId,
        ]
    );

    const deleteRelationshipHandler = useCallback(() => {
        removeRelationship(relationship.id);
        deleteElements({
            edges: [{ id: relationship.id }],
        });
    }, [relationship.id, removeRelationship, deleteElements]);

    const renderDropDownMenu = useCallback(
        () => (
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <ListItemHeaderButton>
                        <EllipsisVertical />
                    </ListItemHeaderButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                    <DropdownMenuLabel>
                        {t(
                            'side_panel.refs_section.relationship.relationship_actions.title'
                        )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={deleteRelationshipHandler}
                            className="flex justify-between !text-red-700"
                        >
                            {t(
                                'side_panel.refs_section.relationship.relationship_actions.delete_relationship'
                            )}
                            <Trash2 className="size-3.5 text-red-700" />
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        [deleteRelationshipHandler, t]
    );

    return (
        <div className="group flex h-11 flex-1 items-center justify-between gap-1 overflow-hidden">
            <div className="flex min-w-0 flex-1">
                {editMode ? (
                    <Input
                        ref={inputRef}
                        autoFocus
                        type="text"
                        placeholder={relationship.name}
                        value={relationshipName}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setRelationshipName(e.target.value)}
                        className="h-7 w-full focus-visible:ring-0"
                    />
                ) : (
                    <div className="truncate">{relationship.name}</div>
                )}
            </div>
            <div className="flex flex-row-reverse items-center">
                {!editMode ? (
                    <>
                        {!readonly ? <div>{renderDropDownMenu()}</div> : null}
                        <div className="flex flex-row-reverse md:hidden md:group-hover:flex">
                            {!readonly ? (
                                <ListItemHeaderButton onClick={enterEditMode}>
                                    <Pencil />
                                </ListItemHeaderButton>
                            ) : null}
                            <ListItemHeaderButton
                                onClick={handleFocusOnRelationship}
                            >
                                <CircleDotDashed />
                            </ListItemHeaderButton>
                        </div>
                    </>
                ) : (
                    <ListItemHeaderButton onClick={editRelationshipName}>
                        <Check />
                    </ListItemHeaderButton>
                )}
            </div>
        </div>
    );
};
