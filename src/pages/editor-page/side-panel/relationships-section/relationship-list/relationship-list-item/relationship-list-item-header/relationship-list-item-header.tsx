import React, { useCallback } from 'react';
import {
    Pencil,
    EllipsisVertical,
    CircleDotDashed,
    Trash2,
    Check,
} from 'lucide-react';
import { ListItemHeaderButton } from '../../../../list-item-header-button/list-item-header-button';
import { DBRelationship } from '@/lib/domain/db-relationship';
import { useReactFlow } from '@xyflow/react';
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
import { Input } from '@/components/input/input';
import { useLayout } from '@/hooks/use-layout';
import { useBreakpoint } from '@/hooks/use-breakpoint';

export interface RelationshipListItemHeaderProps {
    relationship: DBRelationship;
}

export const RelationshipListItemHeader: React.FC<
    RelationshipListItemHeaderProps
> = ({ relationship }) => {
    const { updateRelationship, removeRelationship } = useChartDB();
    const { fitView, deleteElements, setEdges } = useReactFlow();
    const { hideSidePanel } = useLayout();
    const [editMode, setEditMode] = React.useState(false);
    const { isMd: isDesktop } = useBreakpoint('md');
    const [relationshipName, setRelationshipName] = React.useState(
        relationship.name
    );
    const inputRef = React.useRef<HTMLInputElement>(null);

    const editRelationshipName = useCallback(() => {
        if (!editMode) return;
        if (relationshipName.trim()) {
            updateRelationship(relationship.id, {
                name: relationshipName.trim(),
            });
        }

        setEditMode(false);
    }, [relationshipName, relationship.id, updateRelationship, editMode]);

    useClickAway(inputRef, editRelationshipName);
    useKeyPressEvent('Enter', editRelationshipName);

    const enterEditMode = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        event.stopPropagation();
        setEditMode(true);
    };

    const focusOnRelationship = useCallback(
        (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            event.stopPropagation();
            setEdges((edges) =>
                edges.map((edge) =>
                    edge.id == relationship.id
                        ? {
                              ...edge,
                              selected: true,
                              animated: true,
                          }
                        : {
                              ...edge,
                              selected: false,
                              animated: false,
                          }
                )
            );
            fitView({
                duration: 500,
                maxZoom: 1,
                minZoom: 1,
                nodes: [
                    {
                        id: relationship.sourceTableId,
                    },
                    {
                        id: relationship.targetTableId,
                    },
                ],
            });

            if (!isDesktop) {
                hideSidePanel();
            }
        },
        [
            fitView,
            relationship.sourceTableId,
            relationship.targetTableId,
            setEdges,
            relationship.id,
            isDesktop,
            hideSidePanel,
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
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={deleteRelationshipHandler}
                            className="flex justify-between !text-red-700"
                        >
                            Delete
                            <Trash2 className="text-red-700 w-3.5 h-3.5" />
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        [deleteRelationshipHandler]
    );

    return (
        <div className="h-11 flex items-center justify-between flex-1 group overflow-hidden">
            <div className="flex flex-1 min-w-0">
                {editMode ? (
                    <Input
                        ref={inputRef}
                        autoFocus
                        type="text"
                        placeholder={relationship.name}
                        value={relationshipName}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setRelationshipName(e.target.value)}
                        className="h-7 focus-visible:ring-0 w-full"
                    />
                ) : (
                    <div className="truncate">{relationship.name}</div>
                )}
            </div>
            <div className="flex flex-row-reverse">
                {!editMode ? (
                    <>
                        <div>{renderDropDownMenu()}</div>
                        <div className="flex md:hidden md:group-hover:flex flex-row-reverse">
                            <ListItemHeaderButton onClick={enterEditMode}>
                                <Pencil />
                            </ListItemHeaderButton>
                            <ListItemHeaderButton onClick={focusOnRelationship}>
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
