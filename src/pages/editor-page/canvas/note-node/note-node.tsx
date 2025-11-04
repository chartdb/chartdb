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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export interface NoteNodeProps extends NodeProps {
    data: {
        note: Note;
    };
}

export type NoteNodeType = Node<{ note: Note }, 'note'>;

export const NoteNode: React.FC<NoteNodeProps> = ({
    data,
    selected,
    dragging,
}) => {
    const { note } = data;
    const { updateNote, removeNote, readonly } = useChartDB();
    const [editMode, setEditMode] = useState(false);
    const [content, setContent] = useState(note.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { events } = useCanvas();
    const { effectiveTheme } = useTheme();

    const focused = !!selected && !dragging;

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
                'flex h-full flex-col overflow-hidden rounded-[6px] border',
                selected
                    ? 'border-pink-600'
                    : 'border-slate-500 dark:border-slate-600'
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

            {focused && !readonly ? (
                <NodeResizer
                    minWidth={200}
                    minHeight={150}
                    isVisible={selected}
                    lineClassName="!border-pink-500"
                    handleClassName="!h-3 !w-3 !bg-pink-500 !rounded-full"
                />
            ) : null}

            {/* Note body */}
            <div className="group/note relative flex-1 overflow-hidden p-2">
                {/* Corner fold (bottom-right) */}
                <div className="absolute bottom-0 right-0 border-b-[30px] border-l-[30px] border-r-0 border-t-0 border-b-black/10 border-l-transparent opacity-50 dark:border-b-white/10" />

                {/* Content area */}
                {editMode ? (
                    <textarea
                        ref={textareaRef}
                        className="nodrag size-full resize-none overflow-auto border-none bg-transparent p-0 text-sm leading-relaxed text-gray-700 outline-none dark:text-gray-300"
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
                    <div className="h-full overflow-auto break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {note.content ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                    h1: (props) => (
                                        <h1
                                            className="mb-1.5 mt-2 text-base font-bold first:mt-0"
                                            {...props}
                                        />
                                    ),
                                    h2: (props) => (
                                        <h2
                                            className="mb-1 mt-2 text-[15px] font-bold first:mt-0"
                                            {...props}
                                        />
                                    ),
                                    h3: (props) => (
                                        <h3
                                            className="mb-1 mt-1.5 text-sm font-bold first:mt-0"
                                            {...props}
                                        />
                                    ),
                                    h4: (props) => (
                                        <h4
                                            className="mb-0.5 mt-1.5 text-sm font-semibold first:mt-0"
                                            {...props}
                                        />
                                    ),
                                    h5: (props) => (
                                        <h5
                                            className="mb-0.5 mt-1.5 text-sm font-semibold first:mt-0"
                                            {...props}
                                        />
                                    ),
                                    h6: (props) => (
                                        <h6
                                            className="mb-0.5 mt-1.5 text-sm font-medium first:mt-0"
                                            {...props}
                                        />
                                    ),
                                    pre: (props) => (
                                        <pre
                                            className="my-1.5 overflow-auto rounded bg-black/5 p-1.5 first:mt-0 dark:bg-white/10"
                                            {...props}
                                        />
                                    ),
                                    code: (props) => {
                                        const { className } = props;
                                        const isInline = !className;
                                        return isInline ? (
                                            <code
                                                className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs dark:bg-white/15"
                                                {...props}
                                            />
                                        ) : (
                                            <code
                                                className="font-mono text-xs"
                                                {...props}
                                            />
                                        );
                                    },
                                    a: (props) => (
                                        <a
                                            className="font-medium text-blue-600 underline decoration-blue-600/50 hover:decoration-blue-600 dark:text-blue-400 dark:decoration-blue-400/50 dark:hover:decoration-blue-400"
                                            {...props}
                                        />
                                    ),
                                    ul: (props) => (
                                        <ul
                                            className="my-1 list-disc space-y-0.5 pl-5 first:mt-0"
                                            {...props}
                                        />
                                    ),
                                    ol: (props) => (
                                        <ol
                                            className="my-1 list-decimal space-y-0.5 pl-5 first:mt-0"
                                            {...props}
                                        />
                                    ),
                                    li: (props) => (
                                        <li className="pl-0.5" {...props} />
                                    ),
                                    p: (props) => (
                                        <p
                                            className="my-1 first:mt-0"
                                            {...props}
                                        />
                                    ),
                                    blockquote: (props) => (
                                        <blockquote
                                            className="my-1.5 border-l-2 border-gray-400 pl-2 italic text-gray-600 first:mt-0 dark:border-gray-500 dark:text-gray-400"
                                            {...props}
                                        />
                                    ),
                                    hr: (props) => (
                                        <hr
                                            className="my-2 border-gray-300 first:mt-0 dark:border-gray-600"
                                            {...props}
                                        />
                                    ),
                                    table: (props) => (
                                        <div className="my-1.5 overflow-auto first:mt-0">
                                            <table
                                                className="min-w-full border-collapse text-xs"
                                                {...props}
                                            />
                                        </div>
                                    ),
                                    thead: (props) => (
                                        <thead
                                            className="bg-black/5 dark:bg-white/5"
                                            {...props}
                                        />
                                    ),
                                    th: (props) => (
                                        <th
                                            className="border border-gray-300 px-2 py-1 text-left font-semibold dark:border-gray-600"
                                            {...props}
                                        />
                                    ),
                                    td: (props) => (
                                        <td
                                            className="border border-gray-300 px-2 py-1 dark:border-gray-600"
                                            {...props}
                                        />
                                    ),
                                    strong: (props) => (
                                        <strong
                                            className="font-semibold"
                                            {...props}
                                        />
                                    ),
                                    em: (props) => (
                                        <em className="italic" {...props} />
                                    ),
                                }}
                            >
                                {note.content}
                            </ReactMarkdown>
                        ) : (
                            <div className="italic text-gray-500 dark:text-gray-400">
                                Double-click to write (Markdown format)
                            </div>
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
