import React, { useCallback, useState, useRef } from 'react';
import { NodeResizer, type NodeProps, type Node } from '@xyflow/react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Note } from '@/lib/domain/note';
import { useChartDB } from '@/hooks/use-chartdb';
import { useClickAway, useKeyPressEvent } from 'react-use';
import { ColorPicker } from '@/components/color-picker/color-picker';
import { Button } from '@/components/button/button';
import { cn } from '@/lib/utils';
import { useCanvas } from '@/hooks/use-canvas';
import type { CanvasEvent } from '@/context/canvas-context/canvas-context';
import { useTheme } from '@/hooks/use-theme';

export interface NoteNodeProps extends NodeProps {
    data: {
        note: Note;
    };
}

export type NoteNodeType = Node<{ note: Note }, 'note'>;

export const NoteNode: React.FC<NoteNodeProps> = ({ data, selected }) => {
    const { note } = data;
    const { updateNote, removeNote, readonly } = useChartDB();
    const [editMode, setEditMode] = useState(false);
    const [content, setContent] = useState(note.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { events } = useCanvas();
    const { effectiveTheme } = useTheme();

    const saveContent = useCallback(() => {
        if (!editMode) return;
        updateNote(note.id, { content: content.trim() });
        setEditMode(false);
    }, [editMode, content, note.id, updateNote]);

    const abortEdit = useCallback(() => {
        setEditMode(false);
        setContent(note.content);
    }, [note.content]);

    const enterEditMode = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (readonly) return;
            setEditMode(true);
        },
        [readonly]
    );

    const handleDelete = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            removeNote(note.id);
        },
        [note.id, removeNote]
    );

    const handleColorChange = useCallback(
        (color: string) => {
            updateNote(note.id, { color });
        },
        [note.id, updateNote]
    );

    const handleDoubleClick = useCallback<
        React.MouseEventHandler<HTMLDivElement>
    >(
        (e) => {
            if (!readonly) {
                enterEditMode(e);
            }
        },
        [enterEditMode, readonly]
    );

    useClickAway(textareaRef, saveContent);
    useKeyPressEvent('Escape', abortEdit);

    const eventConsumer = useCallback(
        (event: CanvasEvent) => {
            if (!editMode) {
                return;
            }

            if (event.action === 'pan_click') {
                saveContent();
            }
        },
        [editMode, saveContent]
    );

    events.useSubscription(eventConsumer);

    // Focus textarea when entering edit mode
    React.useEffect(() => {
        if (textareaRef.current && editMode) {
            textareaRef.current.focus();
        }
    }, [editMode]);

    const getHeaderColor = (color: string) => {
        // Return the original color for header (full saturation)
        return color;
    };

    const getBodyColor = (color: string) => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        const isDark = effectiveTheme === 'dark';

        if (isDark) {
            // Dark mode: darken the color by mixing with dark gray (30% original + 70% dark)
            const darkR = Math.round(r * 0.3 + 0 * 0.7);
            const darkG = Math.round(g * 0.3 + 0 * 0.7);
            const darkB = Math.round(b * 0.3 + 0 * 0.7);
            return `rgb(${darkR}, ${darkG}, ${darkB})`;
        } else {
            // Light mode: lighten the color by mixing with white (30% original + 70% white)
            const lightR = Math.round(r * 0.3 + 255 * 0.7);
            const lightG = Math.round(g * 0.3 + 255 * 0.7);
            const lightB = Math.round(b * 0.3 + 255 * 0.7);
            return `rgb(${lightR}, ${lightG}, ${lightB})`;
        }
    };

    return (
        <div
            className={cn(
                'flex h-full flex-col overflow-hidden rounded border shadow-md',
                selected ? 'border-pink-600 border-2' : 'border-border'
            )}
            style={{
                background: getBodyColor(note.color),
            }}
            onDoubleClick={handleDoubleClick}
        >
            {/* Notepad header with binding */}
            <div
                className="relative flex h-2 shrink-0 items-center justify-center"
                style={{
                    background: getHeaderColor(note.color),
                }}
            />

            <NodeResizer
                minWidth={200}
                minHeight={150}
                isVisible={selected}
                lineClassName="!border-pink-500"
                handleClassName="!h-3 !w-3 !bg-pink-500 !rounded-full"
            />

            {/* Note body */}
            <div className="group/note relative flex-1 overflow-hidden p-2">
                {/* Corner fold (bottom-right) */}
                <div className="absolute bottom-0 right-0 border-b-[20px] border-l-[40px] border-r-0 border-t-0 border-b-black/10 border-l-transparent opacity-50 dark:border-b-white/10" />

                {/* Content area */}
                {editMode ? (
                    <textarea
                        ref={textareaRef}
                        className="size-full resize-none overflow-auto border-none bg-transparent p-0 text-sm leading-relaxed text-gray-700 outline-none dark:text-gray-300"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                saveContent();
                            }
                        }}
                        autoFocus
                        placeholder="Type your note here..."
                    />
                ) : (
                    <div className="h-full overflow-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {note.content || (
                            <span className="italic text-muted-foreground">
                                Double-click to add text...
                            </span>
                        )}
                    </div>
                )}

                {/* Quick actions on hover */}
                {!editMode && !readonly && (
                    <div className="absolute right-2 top-2 flex gap-1 rounded bg-white/90 p-1 opacity-0 shadow-md transition-opacity group-hover/note:opacity-100 dark:bg-slate-800/90">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="size-7 p-0"
                            onClick={enterEditMode}
                        >
                            <Pencil className="size-3.5" />
                        </Button>
                        <ColorPicker
                            color={note.color}
                            onChange={handleColorChange}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="size-7 p-0 text-red-500 hover:text-red-700"
                            onClick={handleDelete}
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

NoteNode.displayName = 'NoteNode';
