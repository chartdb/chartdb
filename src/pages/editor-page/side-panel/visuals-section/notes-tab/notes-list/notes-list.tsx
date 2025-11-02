import React, { useCallback, useMemo } from 'react';
import { NoteListItem } from './note-list-item/note-list-item';
import type { Note } from '@/lib/domain/note';
import { useLayout } from '@/hooks/use-layout';
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useChartDB } from '@/hooks/use-chartdb.ts';

export interface NotesListProps {
    notes: Note[];
}

export const NotesList: React.FC<NotesListProps> = ({ notes }) => {
    const { updateNote } = useChartDB();

    const { openedNoteInSidebar } = useLayout();
    const lastSelectedNote = React.useRef<string | null>(null);
    const refs = useMemo(
        () =>
            notes.reduce(
                (acc, note) => {
                    acc[note.id] = React.createRef();
                    return acc;
                },
                {} as Record<string, React.RefObject<HTMLDivElement>>
            ),
        [notes]
    );

    const scrollToNote = useCallback(
        (id: string) =>
            refs[id]?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            }),
        [refs]
    );

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active?.id !== over?.id && !!over && !!active) {
            const oldIndex = notes.findIndex((note) => note.id === active.id);
            const newIndex = notes.findIndex((note) => note.id === over.id);

            const newNotesOrder = arrayMove<Note>(notes, oldIndex, newIndex);

            newNotesOrder.forEach((note, index) => {
                updateNote(note.id, { order: index });
            });
        }
    };

    const handleScrollToNote = useCallback(() => {
        if (
            openedNoteInSidebar &&
            lastSelectedNote.current !== openedNoteInSidebar
        ) {
            lastSelectedNote.current = openedNoteInSidebar;
            scrollToNote(openedNoteInSidebar);
        }
    }, [scrollToNote, openedNoteInSidebar]);

    React.useEffect(() => {
        handleScrollToNote();
    }, [openedNoteInSidebar, handleScrollToNote]);

    return (
        <div className="flex w-full flex-col gap-1">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={notes}
                    strategy={verticalListSortingStrategy}
                >
                    {notes
                        .sort((note1: Note, note2: Note) => {
                            if (note1.order && note2.order === undefined) {
                                return -1;
                            }

                            if (note1.order === undefined && note2.order) {
                                return 1;
                            }

                            if (
                                note1.order !== undefined &&
                                note2.order !== undefined
                            ) {
                                return note1.order - note2.order;
                            }

                            // if both notes don't have order, sort by content
                            return note1.content.localeCompare(note2.content);
                        })
                        .map((note) => (
                            <NoteListItem
                                key={note.id}
                                note={note}
                                ref={refs[note.id]}
                            />
                        ))}
                </SortableContext>
            </DndContext>
        </div>
    );
};
