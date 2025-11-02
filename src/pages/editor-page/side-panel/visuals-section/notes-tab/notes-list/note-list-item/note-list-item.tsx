import React, { useCallback } from 'react';
import {
    GripVertical,
    Trash2,
    EllipsisVertical,
    CircleDotDashed,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Note } from '@/lib/domain/note';
import { useChartDB } from '@/hooks/use-chartdb';
import { useTranslation } from 'react-i18next';
import { ColorPicker } from '@/components/color-picker/color-picker';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { ListItemHeaderButton } from '@/pages/editor-page/side-panel/list-item-header-button/list-item-header-button';
import { useFocusOn } from '@/hooks/use-focus-on';
import { mergeRefs } from '@/lib/utils';

export interface NoteListItemProps {
    note: Note;
}

export const NoteListItem = React.forwardRef<HTMLDivElement, NoteListItemProps>(
    ({ note }, forwardedRef) => {
        const { updateNote, removeNote, readonly } = useChartDB();
        const { t } = useTranslation();
        const { focusOnNote } = useFocusOn();

        const { attributes, listeners, setNodeRef, transform, transition } =
            useSortable({
                id: note.id,
            });

        // Merge the forwarded ref with the sortable ref
        const combinedRef = mergeRefs<HTMLDivElement>(forwardedRef, setNodeRef);

        const style = {
            transform: CSS.Translate.toString(transform),
            transition,
        };

        const handleDelete = useCallback(() => {
            removeNote(note.id);
        }, [note.id, removeNote]);

        const handleColorChange = useCallback(
            (color: string) => {
                updateNote(note.id, { color });
            },
            [note.id, updateNote]
        );

        const handleFocusOnNote = useCallback(
            (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                event.stopPropagation();
                focusOnNote(note.id);
            },
            [focusOnNote, note.id]
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
                                'side_panel.notes_section.note.note_actions.title'
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onClick={handleDelete}
                                className="flex justify-between !text-red-700"
                            >
                                {t(
                                    'side_panel.notes_section.note.note_actions.delete_note'
                                )}
                                <Trash2 className="size-3.5 text-red-700" />
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            [handleDelete, t]
        );

        return (
            <div
                className="w-full rounded-md border border-border hover:bg-accent/5"
                ref={combinedRef}
                style={{
                    ...style,
                    borderLeftWidth: '6px',
                    borderLeftColor: note.color,
                }}
                {...attributes}
            >
                <div className="group flex min-h-11 items-center justify-between gap-1 overflow-hidden p-2">
                    {!readonly ? (
                        <div
                            className="flex cursor-move items-center justify-center"
                            {...listeners}
                        >
                            <GripVertical className="size-4 text-muted-foreground" />
                        </div>
                    ) : null}

                    <div className="flex min-w-0 flex-1">
                        <div className="truncate px-2 py-0.5 text-sm">
                            {note.content || (
                                <span className="italic text-muted-foreground">
                                    {t(
                                        'side_panel.notes_section.note.empty_note'
                                    )}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <div className="flex flex-row-reverse items-center gap-1">
                            {!readonly ? renderDropDownMenu() : null}
                            <ColorPicker
                                color={note.color}
                                onChange={handleColorChange}
                                disabled={readonly}
                            />
                            <div className="hidden md:group-hover:flex">
                                <ListItemHeaderButton
                                    onClick={handleFocusOnNote}
                                >
                                    <CircleDotDashed />
                                </ListItemHeaderButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

NoteListItem.displayName = 'NoteListItem';
