import React, { useCallback, useMemo } from 'react';
import { Button } from '@/components/button/button';
import { StickyNote, X } from 'lucide-react';
import { Input } from '@/components/input/input';
import type { Note } from '@/lib/domain/note';
import { useChartDB } from '@/hooks/use-chartdb';
import { useLayout } from '@/hooks/use-layout';
import { EmptyState } from '@/components/empty-state/empty-state';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useTranslation } from 'react-i18next';
import { useViewport } from '@xyflow/react';
import { NotesList } from './notes-list/notes-list';

export interface NotesTabProps {}

export const NotesTab: React.FC<NotesTabProps> = () => {
    const { createNote, notes, readonly } = useChartDB();
    const viewport = useViewport();
    const { t } = useTranslation();
    const { openNoteFromSidebar } = useLayout();
    const [filterText, setFilterText] = React.useState('');
    const filterInputRef = React.useRef<HTMLInputElement>(null);

    const filteredNotes = useMemo(() => {
        const filterNoteContent: (note: Note) => boolean = (note) =>
            !filterText?.trim?.() ||
            note.content.toLowerCase().includes(filterText.toLowerCase());

        return notes.filter(filterNoteContent);
    }, [notes, filterText]);

    const createNoteWithLocation = useCallback(async () => {
        const padding = 80;
        const centerX = -viewport.x / viewport.zoom + padding / viewport.zoom;
        const centerY = -viewport.y / viewport.zoom + padding / viewport.zoom;
        const note = await createNote({
            x: centerX,
            y: centerY,
        });
        if (openNoteFromSidebar) {
            openNoteFromSidebar(note.id);
        }
    }, [
        createNote,
        openNoteFromSidebar,
        viewport.x,
        viewport.y,
        viewport.zoom,
    ]);

    const handleCreateNote = useCallback(async () => {
        setFilterText('');
        createNoteWithLocation();
    }, [createNoteWithLocation, setFilterText]);

    const handleClearFilter = useCallback(() => {
        setFilterText('');
    }, []);

    return (
        <div className="flex flex-1 flex-col overflow-hidden px-2">
            <div className="flex items-center justify-between gap-4 pb-1">
                <div className="flex-1">
                    <Input
                        ref={filterInputRef}
                        type="text"
                        placeholder={t('side_panel.notes_section.filter')}
                        className="h-8 w-full focus-visible:ring-0"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
                {!readonly ? (
                    <Button
                        variant="secondary"
                        className="h-8 p-2 text-xs"
                        onClick={handleCreateNote}
                    >
                        <StickyNote className="h-4" />
                        {t('side_panel.notes_section.add_note')}
                    </Button>
                ) : null}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <ScrollArea className="h-full">
                    {notes.length === 0 ? (
                        <EmptyState
                            title={t(
                                'side_panel.notes_section.empty_state.title'
                            )}
                            description={t(
                                'side_panel.notes_section.empty_state.description'
                            )}
                            className="mt-20"
                            secondaryAction={
                                !readonly
                                    ? {
                                          label: t(
                                              'side_panel.notes_section.add_note'
                                          ),
                                          onClick: handleCreateNote,
                                      }
                                    : undefined
                            }
                        />
                    ) : filterText && filteredNotes.length === 0 ? (
                        <div className="mt-10 flex flex-col items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                                {t('side_panel.notes_section.no_results')}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearFilter}
                                className="gap-1"
                            >
                                <X className="size-3.5" />
                                {t('side_panel.notes_section.clear')}
                            </Button>
                        </div>
                    ) : (
                        <NotesList notes={filteredNotes} />
                    )}
                </ScrollArea>
            </div>
        </div>
    );
};
