import { z } from 'zod';
import type { Note } from '../note';

export type NoteDiffAttribute = keyof Pick<
    Note,
    'content' | 'color' | 'x' | 'y' | 'width' | 'height'
>;

const noteDiffAttributeSchema: z.ZodType<NoteDiffAttribute> = z.union([
    z.literal('content'),
    z.literal('color'),
    z.literal('x'),
    z.literal('y'),
    z.literal('width'),
    z.literal('height'),
]);

export interface NoteDiffChanged {
    object: 'note';
    type: 'changed';
    noteId: string;
    attribute: NoteDiffAttribute;
    oldValue?: string | number | null;
    newValue?: string | number | null;
}

export const NoteDiffChangedSchema: z.ZodType<NoteDiffChanged> = z.object({
    object: z.literal('note'),
    type: z.literal('changed'),
    noteId: z.string(),
    attribute: noteDiffAttributeSchema,
    oldValue: z.union([z.string(), z.number(), z.null()]).optional(),
    newValue: z.union([z.string(), z.number(), z.null()]).optional(),
});

export interface NoteDiffRemoved {
    object: 'note';
    type: 'removed';
    noteId: string;
}

export const NoteDiffRemovedSchema: z.ZodType<NoteDiffRemoved> = z.object({
    object: z.literal('note'),
    type: z.literal('removed'),
    noteId: z.string(),
});

export interface NoteDiffAdded<T = Note> {
    object: 'note';
    type: 'added';
    noteAdded: T;
}

export const createNoteDiffAddedSchema = <T = Note>(
    noteSchema: z.ZodType<T>
): z.ZodType<NoteDiffAdded<T>> => {
    return z.object({
        object: z.literal('note'),
        type: z.literal('added'),
        noteAdded: noteSchema,
    }) as z.ZodType<NoteDiffAdded<T>>;
};

export type NoteDiff<T = Note> =
    | NoteDiffChanged
    | NoteDiffRemoved
    | NoteDiffAdded<T>;

export const createNoteDiffSchema = <T = Note>(
    noteSchema: z.ZodType<T>
): z.ZodType<NoteDiff<T>> => {
    return z.union([
        NoteDiffChangedSchema,
        NoteDiffRemovedSchema,
        createNoteDiffAddedSchema(noteSchema),
    ]) as z.ZodType<NoteDiff<T>>;
};
