import { z } from 'zod';
import type { DBIndex } from '../db-index';

export interface IndexDiffAdded<T = DBIndex> {
    object: 'index';
    type: 'added';
    tableId: string;
    newIndex: T;
}

export const createIndexDiffAddedSchema = <T = DBIndex>(
    indexSchema: z.ZodType<T>
): z.ZodType<IndexDiffAdded<T>> => {
    return z.object({
        object: z.literal('index'),
        type: z.literal('added'),
        tableId: z.string(),
        newIndex: indexSchema,
    }) as z.ZodType<IndexDiffAdded<T>>;
};

export interface IndexDiffRemoved {
    object: 'index';
    type: 'removed';
    indexId: string;
    tableId: string;
}

export const indexDiffRemovedSchema: z.ZodType<IndexDiffRemoved> = z.object({
    object: z.literal('index'),
    type: z.literal('removed'),
    indexId: z.string(),
    tableId: z.string(),
});

export type IndexDiff<T = DBIndex> = IndexDiffAdded<T> | IndexDiffRemoved;

export const createIndexDiffSchema = <T = DBIndex>(
    indexSchema: z.ZodType<T>
): z.ZodType<IndexDiff<T>> => {
    return z.union([
        createIndexDiffAddedSchema(indexSchema),
        indexDiffRemovedSchema,
    ]) as z.ZodType<IndexDiff<T>>;
};
